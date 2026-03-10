const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../lib/db');
const { authGuard } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const { rows: existingUser } = await pool.query(
        'SELECT * FROM "User" WHERE email = $1',
        [email]
    );

    if (existingUser.length > 0) {
        return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows: newUser } = await pool.query(
        'INSERT INTO "User" (name, email, "passwordHash") VALUES ($1, $2, $3) RETURNING *',
        [name, email, passwordHash]
    );
    const user = newUser[0];
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    res
        .cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
        })
        .status(201)
        .json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }
    const { rows } = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = rows[0];

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    res
        .cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
        })
        .json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token').json({ message: 'Logged out' });
});

router.get('/me', authGuard, async (req, res) => {
    const { rows } = await pool.query(
        'SELECT id, name, email, role, avatar, "createdAt" FROM "User" WHERE id = $1',
        [req.user.id]
    );
    const user = rows[0];

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

module.exports = router;
