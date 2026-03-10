const jwt = require('jsonwebtoken');

const authGuard = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const adminGuard = (req, res, next) => {
    authGuard(req, res, () => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    });
};

module.exports = { authGuard, adminGuard };
