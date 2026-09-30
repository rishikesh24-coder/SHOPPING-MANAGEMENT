// ============================================================
// middleware/auth.js - JWT Authentication Middleware
// ============================================================
// Verifies JSON Web Tokens (JWT) sent in the HTTP Authorization header:
//   Authorization: Bearer <token>
// Protects routes from unauthorized access.
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'shopora_jwt_secret_key_2026_super_secure';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // Check if Authorization header is present
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Authentication token required.'
        });
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authorization format. Format must be: Bearer <token>'
        });
    }

    const token = parts[1];

    try {
        // Verify the token with JWT_SECRET
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach authenticated user information to request object
        req.user = decoded; // { id, email, name, iat, exp }

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token. Please log in again.',
            error: error.message
        });
    }
}

module.exports = authenticateToken;
