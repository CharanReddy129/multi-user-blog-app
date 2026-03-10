const express = require('express');
const { pool } = require('../lib/db');
const { adminGuard } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/users
router.get('/users', adminGuard, async (req, res) => {
    const { rows: users } = await pool.query(`
        SELECT id, name, email, role, "createdAt" 
        FROM "User" 
        ORDER BY "createdAt" DESC
    `);
    res.json(users);
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', adminGuard, async (req, res) => {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }
    const { rows } = await pool.query(`
        UPDATE "User"
        SET role = $1
        WHERE id = $2
        RETURNING id, name, email, role
    `, [role, id]);

    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(rows[0]);
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminGuard, async (req, res) => {
    const id = parseInt(req.params.id);
    if (id === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const { rowCount } = await pool.query('DELETE FROM "User" WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted' });
});

// GET /api/admin/posts — all posts (published + drafts)
router.get('/posts', adminGuard, async (req, res) => {
    const { rows: posts } = await pool.query(`
        SELECT p.*,
               json_build_object('id', u.id, 'name', u.name, 'email', u.email) as author,
               (SELECT COUNT(*) FROM "Comment" c WHERE c."postId" = p.id)::int as "_count_comments"
        FROM "Post" p
        JOIN "User" u ON p."authorId" = u.id
        ORDER BY p."createdAt" DESC
    `);

    const formattedPosts = posts.map(post => ({
        ...post,
        _count: { comments: post._count_comments },
        _count_comments: undefined
    }));

    res.json(formattedPosts);
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', adminGuard, async (req, res) => {
    const id = parseInt(req.params.id);
    const { rowCount } = await pool.query('DELETE FROM "Post" WHERE id = $1', [id]);

    if (rowCount === 0) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted' });
});

// GET /api/admin/stats
router.get('/stats', adminGuard, async (req, res) => {
    const [userCount, postCount, commentCount] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM "User"'),
        pool.query('SELECT COUNT(*) FROM "Post"'),
        pool.query('SELECT COUNT(*) FROM "Comment"'),
    ]);

    res.json({
        users: parseInt(userCount.rows[0].count),
        posts: parseInt(postCount.rows[0].count),
        comments: parseInt(commentCount.rows[0].count)
    });
});

module.exports = router;
