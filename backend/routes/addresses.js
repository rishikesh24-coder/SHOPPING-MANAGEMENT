// ============================================================
// routes/addresses.js - User Shipping Addresses REST API (MySQL)
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// 1. GET /api/addresses - List all saved addresses for user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
            [userId]
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Fetch addresses error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error retrieving addresses.',
            error: error.message
        });
    }
});

// 2. POST /api/addresses - Create new address
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const full_name = (req.body.full_name || '').trim();
        const phone = (req.body.phone || '').trim();
        const street_address = (req.body.street_address || req.body.street || '').trim();
        const city = (req.body.city || '').trim();
        const state = (req.body.state || '').trim();
        const pincode = (req.body.pincode || '').trim();
        const isDef = req.body.is_default ? 1 : 0;

        if (!full_name || !phone || !street_address || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'All address fields (Full Name, Phone, Address, City, State, Pincode) are required.'
            });
        }

        // If marked as default, unset previous defaults
        if (isDef) {
            await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        const [result] = await pool.query(
            `INSERT INTO addresses (user_id, full_name, phone, street_address, city, state, pincode, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, full_name, phone, street_address, city, state, pincode, isDef]
        );

        res.status(201).json({
            success: true,
            message: 'Address saved successfully!',
            id: result.insertId,
            data: {
                id: result.insertId,
                user_id: userId,
                full_name: full_name,
                phone: phone,
                street_address: street_address,
                street: street_address,
                city: city,
                state: state,
                pincode: pincode,
                is_default: !!isDef
            }
        });
    } catch (error) {
        console.error('Create address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save address.',
            error: error.message
        });
    }
});

// 3. PUT /api/addresses/:id - Update address
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const full_name = (req.body.full_name || '').trim();
        const phone = (req.body.phone || '').trim();
        const street_address = (req.body.street_address || req.body.street || '').trim();
        const city = (req.body.city || '').trim();
        const state = (req.body.state || '').trim();
        const pincode = (req.body.pincode || '').trim();
        const is_default = req.body.is_default;

        if (!full_name || !phone || !street_address || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'All address fields are required.'
            });
        }

        const isDef = is_default ? 1 : 0;
        if (isDef) {
            await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        const [result] = await pool.query(
            `UPDATE addresses
             SET full_name = ?, phone = ?, street_address = ?, city = ?, state = ?, pincode = ?, is_default = ?
             WHERE id = ? AND user_id = ?`,
            [full_name.trim(), phone.trim(), street_address.trim(), city.trim(), state.trim(), pincode.trim(), isDef, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Address not found or unauthorized.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Address updated successfully!'
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address.',
            error: error.message
        });
    }
});

// 4. DELETE /api/addresses/:id - Delete address
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM addresses WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Address not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully.'
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address.',
            error: error.message
        });
    }
});

module.exports = router;
