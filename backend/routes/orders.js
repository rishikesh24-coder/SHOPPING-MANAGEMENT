// ============================================================
// routes/orders.js - Orders & Order Items REST API (MySQL)
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// 1. GET /api/orders - List all orders for authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        const [orders] = await pool.query(
            `SELECT id, total_amount, subtotal, discount, shipping_fee,
                    status, shipping_name, shipping_phone, shipping_address,
                    payment_method, created_at
             FROM orders
             WHERE user_id = ?
             ORDER BY id DESC`,
            [userId]
        );

        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        const orderIds = orders.map(o => o.id);
        const [items] = await pool.query(
            `SELECT id, order_id, product_id, product_name, quantity, price
             FROM order_items
             WHERE order_id IN (?)`,
            [orderIds]
        );

        // Group items by order_id
        const itemsByOrder = {};
        for (const it of items) {
            if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
            itemsByOrder[it.order_id].push(it);
        }

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
        }));

        res.status(200).json({
            success: true,
            count: ordersWithItems.length,
            data: ordersWithItems
        });
    } catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error retrieving orders.',
            error: error.message
        });
    }
});

// 2. GET /api/orders/:id - Get specific order details
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [orders] = await pool.query(
            `SELECT id, total_amount, subtotal, discount, shipping_fee,
                    status, shipping_name, shipping_phone, shipping_address,
                    payment_method, created_at
             FROM orders
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Order #${id} not found.`
            });
        }

        const order = orders[0];
        const [items] = await pool.query(
            `SELECT id, order_id, product_id, product_name, quantity, price
             FROM order_items
             WHERE order_id = ?`,
            [id]
        );

        order.items = items;

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Fetch single order error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error retrieving order details.',
            error: error.message
        });
    }
});

// 3. POST /api/orders - Place a new order (from cart or direct buy now)
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { addressId, paymentMethod = 'Cash on Delivery', directItem } = req.body;

        // 1. Validate shipping address
        let shippingInfo = null;
        if (addressId) {
            const [addresses] = await conn.query(
                'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
                [addressId, userId]
            );
            if (addresses.length > 0) {
                const a = addresses[0];
                shippingInfo = {
                    name: a.full_name,
                    phone: a.phone,
                    address: `${a.street_address}, ${a.city}, ${a.state} - ${a.pincode}`
                };
            }
        }

        if (!shippingInfo && req.body.shippingDetails) {
            const s = req.body.shippingDetails;
            if (s.full_name && s.phone && s.street_address) {
                shippingInfo = {
                    name: s.full_name,
                    phone: s.phone,
                    address: `${s.street_address}, ${s.city || ''}, ${s.state || ''} - ${s.pincode || ''}`
                };
            }
        }

        if (!shippingInfo) {
            conn.release();
            return res.status(400).json({
                success: false,
                message: 'Please provide or select a valid delivery address.'
            });
        }

        await conn.beginTransaction();

        // 2. Determine items to order
        let orderItems = [];

        if (directItem && directItem.productId) {
            // Direct Buy Now flow
            const [p] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [directItem.productId]);
            if (p.length === 0) {
                await conn.rollback();
                conn.release();
                return res.status(404).json({ success: false, message: 'Product not found.' });
            }
            const qty = parseInt(directItem.quantity, 10) || 1;
            if (p[0].quantity < qty) {
                await conn.rollback();
                conn.release();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for "${p[0].name}". Available: ${p[0].quantity}`
                });
            }
            orderItems.push({
                product_id: p[0].id,
                product_name: p[0].name,
                price: parseFloat(p[0].price),
                quantity: qty
            });
        } else {
            // Cart checkout flow
            const [cartRows] = await conn.query(
                `SELECT c.product_id, c.quantity, p.name, p.price, p.quantity AS stock
                 FROM cart c
                 JOIN products p ON c.product_id = p.id
                 WHERE c.user_id = ?
                 FOR UPDATE`,
                [userId]
            );

            if (cartRows.length === 0) {
                await conn.rollback();
                conn.release();
                return res.status(400).json({
                    success: false,
                    message: 'Your shopping bag is empty.'
                });
            }

            for (const row of cartRows) {
                if (row.stock < row.quantity) {
                    await conn.rollback();
                    conn.release();
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${row.name}". Available: ${row.stock}, requested: ${row.quantity}`
                    });
                }
                orderItems.push({
                    product_id: row.product_id,
                    product_name: row.name,
                    price: parseFloat(row.price),
                    quantity: row.quantity
                });
            }
        }

        // 3. Compute Financials
        let subtotal = 0;
        for (const item of orderItems) {
            subtotal += item.price * item.quantity;
        }

        const discount = subtotal > 0 ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
        const shippingFee = (subtotal - discount >= 799) ? 0 : 99;
        const totalAmount = Math.max(0, Math.round((subtotal - discount + shippingFee) * 100) / 100);

        // 4. Create Order Record
        const [orderResult] = await conn.query(
            `INSERT INTO orders
             (user_id, total_amount, subtotal, discount, shipping_fee, status,
              shipping_name, shipping_phone, shipping_address, payment_method)
             VALUES (?, ?, ?, ?, ?, 'PLACED', ?, ?, ?, ?)`,
            [
                userId,
                totalAmount,
                subtotal,
                discount,
                shippingFee,
                shippingInfo.name,
                shippingInfo.phone,
                shippingInfo.address,
                paymentMethod
            ]
        );

        const newOrderId = orderResult.insertId;

        // 5. Insert Order Items & Decrement Stock
        for (const item of orderItems) {
            await conn.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                 VALUES (?, ?, ?, ?, ?)`,
                [newOrderId, item.product_id, item.product_name, item.quantity, item.price]
            );

            // Deduct inventory in MySQL
            await conn.query(
                'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // 6. Clear user cart if ordered from cart
        if (!directItem) {
            await conn.query('DELETE FROM cart WHERE user_id = ?', [userId]);
        }

        await conn.commit();
        conn.release();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            orderId: newOrderId,
            orderNumber: `#SHOP-${10000 + newOrderId}`,
            totalAmount: totalAmount,
            status: 'PLACED'
        });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('Place order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process order. Please try again.',
            error: error.message
        });
    }
});

// 4. PUT /api/orders/:id/cancel - Cancel order & restore stock
router.put('/:id/cancel', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await conn.beginTransaction();

        const [orders] = await conn.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
            [id, userId]
        );

        if (orders.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({
                success: false,
                message: `Order #${id} not found.`
            });
        }

        const order = orders[0];
        if (order.status === 'CANCELLED') {
            await conn.rollback();
            conn.release();
            return res.status(400).json({
                success: false,
                message: 'This order is already cancelled.'
            });
        }

        if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
            await conn.rollback();
            conn.release();
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled because it is already ${order.status.toLowerCase()}.`
            });
        }

        // Update status to CANCELLED
        await conn.query("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [id]);

        // Restore stock in products table
        const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
        for (const item of items) {
            if (item.product_id) {
                await conn.query(
                    'UPDATE products SET quantity = quantity + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
        }

        await conn.commit();
        conn.release();

        res.status(200).json({
            success: true,
            message: `Order #${id} has been cancelled successfully. Stock has been restored.`
        });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order.',
            error: error.message
        });
    }
});

module.exports = router;
