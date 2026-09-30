// ============================================================
// routes/products.js - REST API Endpoints for Products (CRUD)
// ============================================================
// Supports full Product CRUD with MySQL database connectivity:
//   - GET    /api/products      -> READ all products (Public)
//   - GET    /api/products/:id  -> READ single product (Public)
//   - POST   /api/products      -> CREATE new product (Protected: JWT Required)
//   - PUT    /api/products/:id  -> UPDATE product (Protected: JWT Required)
//   - DELETE /api/products/:id  -> DELETE product (Protected: JWT Required)
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

// ============================================================
// 1. READ ALL PRODUCTS (Public)
// Method: GET
// URL:    /api/products
// ============================================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: Could not retrieve products.',
            error: error.message
        });
    }
});

// ============================================================
// 2. READ A SINGLE PRODUCT BY ID (Public)
// Method: GET
// URL:    /api/products/:id
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Product with ID ${id} not found.`
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching single product:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: Could not retrieve product.',
            error: error.message
        });
    }
});

// ============================================================
// 3. CREATE A NEW PRODUCT (Protected - JWT Required)
// Method: POST
// URL:    /api/products
// Header: Authorization: Bearer <token>
// Body:   { name, category, price, quantity, description }
// ============================================================
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            category,
            price,
            quantity,
            description,
            brand = '',
            mrp = null,
            discount_percent = null,
            image = '',
            rating = 4.5,
            review_count = 100,
            badge = null
        } = req.body;

        // Validation
        if (!name || !category || price === undefined || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: Please provide name, category, price, and quantity.'
            });
        }

        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(quantity, 10);
        const parsedMrp = mrp !== null && mrp !== undefined ? parseFloat(mrp) : Math.round(parsedPrice * 1.25);
        const calculatedDiscount = discount_percent !== null && discount_percent !== undefined
            ? parseInt(discount_percent, 10)
            : Math.max(0, Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100));

        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: Price must be a valid positive number.'
            });
        }

        if (isNaN(parsedQuantity) || parsedQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: Quantity must be a valid positive integer.'
            });
        }

        // SQL parameterized INSERT
        const sql = `
            INSERT INTO products (name, brand, category, price, mrp, discount_percent, quantity, image, rating, review_count, badge, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            name.trim(),
            brand ? brand.trim() : '',
            category.trim(),
            parsedPrice,
            parsedMrp,
            calculatedDiscount,
            parsedQuantity,
            image ? image.trim() : '',
            parseFloat(rating) || 4.5,
            parseInt(review_count, 10) || 100,
            badge ? badge.trim() : null,
            description ? description.trim() : ''
        ];

        const [result] = await pool.query(sql, values);

        res.status(201).json({
            success: true,
            message: 'Product added successfully!',
            id: result.insertId,
            data: {
                id: result.insertId,
                name: name.trim(),
                brand: brand ? brand.trim() : '',
                category: category.trim(),
                price: parsedPrice,
                mrp: parsedMrp,
                discount_percent: calculatedDiscount,
                quantity: parsedQuantity,
                image: image ? image.trim() : '',
                rating: parseFloat(rating) || 4.5,
                review_count: parseInt(review_count, 10) || 100,
                badge: badge ? badge.trim() : null,
                description: description ? description.trim() : ''
            }
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: Failed to insert product.',
            error: error.message
        });
    }
});

// ============================================================
// 4. UPDATE AN EXISTING PRODUCT (Protected - JWT Required)
// Method: PUT
// URL:    /api/products/:id
// Header: Authorization: Bearer <token>
// Body:   { name, category, price, quantity, description, brand, mrp, ... }
// ============================================================
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            category,
            price,
            quantity,
            description,
            brand,
            mrp,
            discount_percent,
            image,
            rating,
            review_count,
            badge
        } = req.body;

        if (!name || !category || price === undefined || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: Please provide name, category, price, and quantity.'
            });
        }

        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(quantity, 10);

        if (isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedQuantity) || parsedQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: Price and quantity must be valid non-negative numbers.'
            });
        }

        const parsedMrp = mrp !== undefined ? parseFloat(mrp) : Math.round(parsedPrice * 1.25);
        const calculatedDiscount = discount_percent !== undefined
            ? parseInt(discount_percent, 10)
            : Math.max(0, Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100));

        // SQL parameterized UPDATE
        const sql = `
            UPDATE products
            SET name = ?, brand = COALESCE(?, brand), category = ?, price = ?, mrp = ?, discount_percent = ?, quantity = ?, image = COALESCE(?, image), rating = COALESCE(?, rating), review_count = COALESCE(?, review_count), badge = ?, description = ?
            WHERE id = ?
        `;
        const values = [
            name.trim(),
            brand !== undefined ? brand.trim() : null,
            category.trim(),
            parsedPrice,
            parsedMrp,
            calculatedDiscount,
            parsedQuantity,
            image !== undefined ? image.trim() : null,
            rating !== undefined ? parseFloat(rating) : null,
            review_count !== undefined ? parseInt(review_count, 10) : null,
            badge !== undefined ? badge : null,
            description ? description.trim() : '',
            id
        ];

        const [result] = await pool.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Product with ID ${id} not found.`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully!',
            data: {
                id: Number(id),
                name: name.trim(),
                category: category.trim(),
                price: parsedPrice,
                quantity: parsedQuantity,
                description: description ? description.trim() : ''
            }
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: Failed to update product.',
            error: error.message
        });
    }
});

// ============================================================
// 5. DELETE A PRODUCT (Protected - JWT Required)
// Method: DELETE
// URL:    /api/products/:id
// Header: Authorization: Bearer <token>
// ============================================================
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // SQL parameterized DELETE
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Product with ID ${id} not found.`
            });
        }

        res.status(200).json({
            success: true,
            message: `Product with ID ${id} deleted successfully!`
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: Failed to delete product.',
            error: error.message
        });
    }
});

module.exports = router;
