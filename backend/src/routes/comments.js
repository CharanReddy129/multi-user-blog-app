const express = require('express');
const { pool } = require('../lib/db');
const { authGuard } = require('../middleware/auth');

const router = express.Router();

// POST /api/comments — add comment
router.post('/', authGuard, async (req, res) => {
    const { content, postId } = req.body;
    if (!content || !postId) {
        return res.status(400).json({ message: 'Content and postId required' });
    }

    const { rows: postRows } = await pool.query('SELECT id FROM "Post" WHERE id = $1', [parseInt(postId)]);
    if (postRows.length === 0) return res.status(404).json({ message: 'Post not found' });

    const { rows: commentRows } = await pool.query(`
        INSERT INTO "Comment" (content, "postId", "authorId")
        VALUES ($1, $2, $3)
        RETURNING *
    `, [content, parseInt(postId), req.user.id]);

    const comment = commentRows[0];

    const { rows: userRows } = await pool.query('SELECT id, name, avatar FROM "User" WHERE id = $1', [req.user.id]);
    comment.author = userRows[0];

    res.status(201).json(comment);
});

// DELETE /api/comments/:id — delete comment (author or admin)
router.delete('/:id', authGuard, async (req, res) => {
    const id = parseInt(req.params.id);

    const { rows: commentRows } = await pool.query('SELECT "authorId" FROM "Comment" WHERE id = $1', [id]);
    if (commentRows.length === 0) return res.status(404).json({ message: 'Comment not found' });

    if (commentRows[0].authorId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM "Comment" WHERE id = $1', [id]);
    res.json({ message: 'Comment deleted' });
});

module.exports = router;
