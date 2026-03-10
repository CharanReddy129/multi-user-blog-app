const express = require('express');
const multer = require('multer');
const path = require('path');
const { authGuard } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    },
});

// POST /api/upload
router.post('/', authGuard, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
});

module.exports = router;
