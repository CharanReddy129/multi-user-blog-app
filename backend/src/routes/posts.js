const express = require('express');
const { pool } = require('../lib/db');
const { authGuard } = require('../middleware/auth');

const router = express.Router();

// Slugify title helper
function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' + Date.now();
}

// GET /api/posts — list published posts
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    // Base query conditions
    let countQuery = 'SELECT COUNT(*) FROM "Post" WHERE published = true';
    let postsQuery = `
        SELECT p.*,
               json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar) as author,
               (SELECT COUNT(*) FROM "Comment" c WHERE c."postId" = p.id)::int as "_count_comments"
        FROM "Post" p
        JOIN "User" u ON p."authorId" = u.id
        WHERE p.published = true
    `;
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        const searchCondition = ` AND (p.title ILIKE $1 OR p.content ILIKE $1)`;
        countQuery += searchCondition.replace('p.', ''); // For simple count 
        postsQuery += searchCondition;
    }

    postsQuery += ` ORDER BY p."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    // Execute queries
    const [countResult, postsResult] = await Promise.all([
        pool.query(countQuery, params),
        pool.query(postsQuery, [...params, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const posts = postsResult.rows.map(post => ({
        ...post,
        _count: { comments: post._count_comments },
        _count_comments: undefined // clean up
    }));

    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) || 1 });
});

// GET /api/posts/:slug — single post with comments
router.get('/:slug', async (req, res) => {
    const { rows: postRows } = await pool.query(`
        SELECT p.*,
               json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar) as author
        FROM "Post" p
        JOIN "User" u ON p."authorId" = u.id
        WHERE p.slug = $1
    `, [req.params.slug]);

    if (postRows.length === 0) return res.status(404).json({ message: 'Post not found' });
    const post = postRows[0];

    const { rows: comments } = await pool.query(`
        SELECT c.*,
               json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar) as author
        FROM "Comment" c
        JOIN "User" u ON c."authorId" = u.id
        WHERE c."postId" = $1
        ORDER BY c."createdAt" ASC
    `, [post.id]);

    post.comments = comments;
    res.json(post);
});

// POST /api/posts — create post
router.post('/', authGuard, async (req, res) => {
    const { title, content, coverImage, published } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content required' });
    }
    const slug = slugify(title);

    const { rows } = await pool.query(`
        INSERT INTO "Post" (title, slug, content, "coverImage", published, "authorId", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
    `, [title, slug, content, coverImage || null, published || false, req.user.id]);

    const post = rows[0];

    // Get author details
    const { rows: userRows } = await pool.query('SELECT id, name FROM "User" WHERE id = $1', [req.user.id]);
    post.author = userRows[0];

    res.status(201).json(post);
});

// PUT /api/posts/:id — update post (author only)
router.put('/:id', authGuard, async (req, res) => {
    const id = parseInt(req.params.id);

    const { rows: postRows } = await pool.query('SELECT "authorId" FROM "Post" WHERE id = $1', [id]);
    if (postRows.length === 0) return res.status(404).json({ message: 'Post not found' });

    const post = postRows[0];
    if (post.authorId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, content, coverImage, published } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let queryArgsCount = 1;

    if (title) { updates.push(`title = $${queryArgsCount++}`); values.push(title); }
    if (content) { updates.push(`content = $${queryArgsCount++}`); values.push(content); }
    if (coverImage !== undefined) { updates.push(`"coverImage" = $${queryArgsCount++}`); values.push(coverImage); }
    if (published !== undefined) { updates.push(`published = $${queryArgsCount++}`); values.push(published); }

    if (updates.length === 0) {
        return res.json({ message: 'No changes provided' });
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(id); // push ID as the last parameter

    const updateQuery = `
        UPDATE "Post" SET ${updates.join(', ')} 
        WHERE id = $${queryArgsCount} 
        RETURNING *
    `;

    const { rows: updatedRows } = await pool.query(updateQuery, values);
    const updatedPost = updatedRows[0];

    // Get author details
    const { rows: userRows } = await pool.query('SELECT id, name FROM "User" WHERE id = $1', [updatedPost.authorId]);
    updatedPost.author = userRows[0];

    res.json(updatedPost);
});

// DELETE /api/posts/:id — delete post (author or admin)
router.delete('/:id', authGuard, async (req, res) => {
    const id = parseInt(req.params.id);

    const { rows: postRows } = await pool.query('SELECT "authorId" FROM "Post" WHERE id = $1', [id]);
    if (postRows.length === 0) return res.status(404).json({ message: 'Post not found' });

    if (postRows[0].authorId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM "Post" WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
});

module.exports = router;
