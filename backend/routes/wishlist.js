// ============================================================
// routes/wishlist.js - Wishlist REST API Endpoints (MySQL)
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

// All wishlist routes require valid JWT authentication
router.use(authenticateToken);

// 1. GET /api/wishlist - Retrieve authenticated user's wishlist
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            `SELECT w.id AS wishlist_id, w.product_id, w.created_at,
                    p.id, p.name, p.category, p.price, p.quantity, p.description
             FROM wishlist w
             JOIN products p ON w.product_id = p.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Fetch wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error retrieving wishlist.',
            error: error.message
        });
    }
});

// 2. POST /api/wishlist - Add product to wishlist
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required.'
            });
        }

        // Verify product exists in MySQL
        const [prod] = await pool.query('SELECT id, name FROM products WHERE id = ?', [productId]);
        if (prod.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        // Insert or ignore if already wishlisted
        await pool.query(
            'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
            [userId, productId]
        );

        res.status(201).json({
            success: true,
            message: `Added "${prod[0].name}" to your wishlist.`
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to wishlist.',
            error: error.message
        });
    }
});

// 3. DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete('/:productId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const [result] = await pool.query(
            'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item was not found in your wishlist.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Item removed from your wishlist.'
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from wishlist.',
            error: error.message
        });
    }
});

module.exports = router;
