// ============================================================
// routes/cart.js - Shopping Bag / Cart REST API (MySQL)
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// Helper to compute cart totals
function calculateSummary(items) {
    let subtotal = 0;
    let totalItems = 0;

    for (const item of items) {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity, 10) || 1;
        subtotal += price * qty;
        totalItems += qty;
    }

    // 15% promotional discount simulation for realistic e-commerce checkout
    const discount = subtotal > 0 ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
    // Free delivery on orders over ₹799, otherwise ₹99
    const deliveryFee = (subtotal - discount >= 799 || subtotal === 0) ? 0 : 99;
    const finalTotal = Math.max(0, Math.round((subtotal - discount + deliveryFee) * 100) / 100);

    return {
        totalItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        deliveryFee: parseFloat(deliveryFee.toFixed(2)),
        finalTotal: parseFloat(finalTotal.toFixed(2))
    };
}

// 1. GET /api/cart - Get user's cart items & bill summary
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            `SELECT c.id AS cart_id, c.product_id, c.quantity, c.created_at, c.updated_at,
                    p.id, p.name, p.category, p.price, p.quantity AS stock, p.description
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = ?
             ORDER BY c.created_at DESC`,
            [userId]
        );

        const summary = calculateSummary(rows);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
            summary
        });
    } catch (error) {
        console.error('Fetch cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error retrieving cart.',
            error: error.message
        });
    }
});

// 2. POST /api/cart - Add item to cart
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        const parsedQty = parseInt(quantity, 10);
        if (!productId || isNaN(parsedQty) || parsedQty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid Product ID and quantity greater than zero are required.'
            });
        }

        // Verify product & available stock
        const [prods] = await pool.query(
            'SELECT id, name, price, quantity FROM products WHERE id = ?',
            [productId]
        );

        if (prods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        const product = prods[0];
        if (product.quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: `"${product.name}" is currently out of stock.`
            });
        }

        // Check if item already in user's cart
        const [existing] = await pool.query(
            'SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        let newQuantity = parsedQty;
        if (existing.length > 0) {
            newQuantity = existing[0].quantity + parsedQty;
            if (newQuantity > product.quantity) {
                newQuantity = product.quantity;
            }
            await pool.query(
                'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
                [newQuantity, userId, productId]
            );
        } else {
            if (newQuantity > product.quantity) {
                newQuantity = product.quantity;
            }
            await pool.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, newQuantity]
            );
        }

        res.status(201).json({
            success: true,
            message: `Added "${product.name}" to your bag.`,
            quantity: newQuantity
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to bag.',
            error: error.message
        });
    }
});

// 3. PUT /api/cart/:productId - Update item quantity in cart
router.put('/:productId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { quantity } = req.body;

        const parsedQty = parseInt(quantity, 10);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1.'
            });
        }

        // Verify product stock
        const [prods] = await pool.query('SELECT quantity, name FROM products WHERE id = ?', [productId]);
        if (prods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        const maxStock = prods[0].quantity;
        if (parsedQty > maxStock) {
            return res.status(400).json({
                success: false,
                message: `Only ${maxStock} units of "${prods[0].name}" are available in stock.`
            });
        }

        const [result] = await pool.query(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [parsedQty, userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in bag.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bag quantity updated successfully.'
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update bag quantity.',
            error: error.message
        });
    }
});

// 4. DELETE /api/cart/:productId - Remove specific item from cart
router.delete('/:productId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const [result] = await pool.query(
            'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item was not found in your bag.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Item removed from your shopping bag.'
        });
    } catch (error) {
        console.error('Delete from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from bag.',
            error: error.message
        });
    }
});

// 5. DELETE /api/cart - Clear entire cart
router.delete('/', async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);

        res.status(200).json({
            success: true,
            message: 'Shopping bag cleared.'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear shopping bag.',
            error: error.message
        });
    }
});

module.exports = router;
