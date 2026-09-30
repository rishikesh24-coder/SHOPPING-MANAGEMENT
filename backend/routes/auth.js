// ============================================================
// routes/auth.js - Authentication REST API Endpoints
// ============================================================
// Handles User Registration, Login, Current User Profile (JWT),
// and Development Password Reset.
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'shopora_jwt_secret_key_2026_super_secure';

// Helper: Basic email validation regex
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// 1. REGISTER NEW USER
// Method: POST
// URL:    /api/auth/register
// Body:   { name, email, password, confirmPassword }
// ============================================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // 1. Input validations
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (name, email, password).'
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long.'
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and Confirm Password do not match.'
            });
        }

        // 2. Check if email already exists in MySQL
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists. Please log in.'
            });
        }

        // 3. Hash password using bcrypt (cost factor: 10 rounds)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Insert user record into MySQL
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [trimmedName, normalizedEmail, hashedPassword]
        );

        // 5. Send success response (NEVER return password)
        res.status(201).json({
            success: true,
            message: 'Registration successful! You can now log in.',
            user: {
                id: result.insertId,
                name: trimmedName,
                email: normalizedEmail
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration.',
            error: error.message
        });
    }
});

// ============================================================
// 2. USER LOGIN
// Method: POST
// URL:    /api/auth/login
// Body:   { email, password }
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate inputs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Find user in MySQL database
        const [users] = await pool.query(
            'SELECT id, name, email, password, created_at FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // 3. Compare supplied password with stored bcrypt hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // 4. Generate JWT Token (valid for 7 days)
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 5. Return token and safe user details (NO password)
        res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login.',
            error: error.message
        });
    }
});

// ============================================================
// 3. GET CURRENT USER PROFILE (Protected)
// Method: GET
// URL:    /api/auth/me
// Header: Authorization: Bearer <token>
// ============================================================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user profile.',
            error: error.message
        });
    }
});

// ============================================================
// 4. RESET PASSWORD (Development-friendly & safe)
// Method: POST
// URL:    /api/auth/reset-password
// Body:   { email, newPassword, confirmNewPassword }
// ============================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, confirmNewPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email and new password are required.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long.'
            });
        }

        if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const [users] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account registered with this email address.'
            });
        }

        // Hash new password with bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update in MySQL
        await pool.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, normalizedEmail]
        );

        res.status(200).json({
            success: true,
            message: 'Password updated successfully! Please log in with your new password.'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error resetting password.',
            error: error.message
        });
    }
});

module.exports = router;
