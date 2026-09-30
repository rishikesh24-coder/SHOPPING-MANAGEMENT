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
// Body:   { name, brand, category, price, mrp, quantity, promotional_badge, image_url, description }
// ============================================================
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            brand = '',
            category,
            price,
            mrp = null,
            quantity,
            promotional_badge = null,
            badge = null,
            image_url = '',
            image = '',
            description = ''
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
        const finalBadge = promotional_badge !== undefined && promotional_badge !== null ? promotional_badge : badge;
        const finalImage = image_url !== undefined && image_url !== '' ? image_url : image;

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

        // Dynamically match available table columns to prevent unknown column errors
        const [cols] = await pool.query('SHOW COLUMNS FROM products');
        const colNames = cols.map(c => c.Field);

        const fields = ['name', 'brand', 'category', 'price', 'mrp', 'quantity', 'promotional_badge', 'image_url', 'description'];
        const values = [
            name.trim(),
            brand ? brand.trim() : '',
            category.trim(),
            parsedPrice,
            parsedMrp,
            parsedQuantity,
            finalBadge ? finalBadge.trim() : null,
            finalImage ? finalImage.trim() : '',
            description ? description.trim() : ''
        ];

        // Also populate legacy columns if present in table
        if (colNames.includes('image')) {
            fields.push('image');
            values.push(finalImage ? finalImage.trim() : '');
        }
        if (colNames.includes('badge')) {
            fields.push('badge');
            values.push(finalBadge ? finalBadge.trim() : null);
        }
        if (colNames.includes('discount_percent')) {
            fields.push('discount_percent');
            const discount = Math.max(0, Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100));
            values.push(discount);
        }
        if (colNames.includes('rating')) {
            fields.push('rating');
            values.push(4.5);
        }
        if (colNames.includes('review_count')) {
            fields.push('review_count');
            values.push(100);
        }

        // Filter fields/values to only those that actually exist in the table
        const insertFields = [];
        const insertValues = [];
        for (let i = 0; i < fields.length; i++) {
            if (colNames.includes(fields[i])) {
                insertFields.push(fields[i]);
                insertValues.push(values[i]);
            }
        }

        const placeholders = insertFields.map(() => '?').join(', ');
        const sql = `INSERT INTO products (${insertFields.join(', ')}) VALUES (${placeholders})`;

        const [result] = await pool.query(sql, insertValues);

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
                quantity: parsedQuantity,
                promotional_badge: finalBadge ? finalBadge.trim() : null,
                image_url: finalImage ? finalImage.trim() : '',
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
// Body:   { name, brand, category, price, mrp, quantity, promotional_badge, image_url, description }
// ============================================================
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            brand,
            category,
            price,
            mrp,
            quantity,
            promotional_badge,
            badge,
            image_url,
            image,
            description
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

        const parsedMrp = mrp !== undefined && mrp !== null ? parseFloat(mrp) : Math.round(parsedPrice * 1.25);
        const finalBadge = promotional_badge !== undefined ? promotional_badge : badge;
        const finalImage = image_url !== undefined ? image_url : image;

        // Check columns in products table
        const [cols] = await pool.query('SHOW COLUMNS FROM products');
        const colNames = cols.map(c => c.Field);

        const updatePairs = [];
        const values = [];

        function addUpdate(col, val) {
            if (colNames.includes(col)) {
                updatePairs.push(`${col} = ?`);
                values.push(val);
            }
        }

        addUpdate('name', name.trim());
        addUpdate('brand', brand !== undefined ? brand.trim() : '');
        addUpdate('category', category.trim());
        addUpdate('price', parsedPrice);
        addUpdate('mrp', parsedMrp);
        addUpdate('quantity', parsedQuantity);
        addUpdate('promotional_badge', finalBadge !== undefined ? (finalBadge ? finalBadge.trim() : null) : null);
        addUpdate('image_url', finalImage !== undefined ? (finalImage ? finalImage.trim() : '') : '');
        addUpdate('description', description ? description.trim() : '');

        // Legacy columns
        if (finalImage !== undefined) addUpdate('image', finalImage ? finalImage.trim() : '');
        if (finalBadge !== undefined) addUpdate('badge', finalBadge ? finalBadge.trim() : null);
        if (colNames.includes('discount_percent')) {
            const discount = Math.max(0, Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100));
            addUpdate('discount_percent', discount);
        }

        values.push(id);
        const sql = `UPDATE products SET ${updatePairs.join(', ')} WHERE id = ?`;

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
                brand: brand !== undefined ? brand.trim() : '',
                category: category.trim(),
                price: parsedPrice,
                mrp: parsedMrp,
                quantity: parsedQuantity,
                promotional_badge: finalBadge !== undefined ? (finalBadge ? finalBadge.trim() : null) : null,
                image_url: finalImage !== undefined ? (finalImage ? finalImage.trim() : '') : '',
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
