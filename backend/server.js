// ============================================================
// server.js - Express Server Entry Point
// ============================================================
// Initializes Express app, configures CORS, JSON parsers,
// mounts REST API routes (/api/products and /api/auth),
// and serves the frontend static assets.
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./db');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE CONFIGURATION
// ============================================================

// 1. Enable CORS for all incoming client requests
app.use(cors());

// 2. Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Serve frontend static files directly from Express
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// REST API ROUTES
// ============================================================

// Mount authentication routes (/api/auth/register, /api/auth/login, /api/auth/me)
app.use('/api/auth', authRouter);

// Mount product CRUD routes (/api/products)
app.use('/api/products', productsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        message: 'SHOPORA API is operational'
    });
});

// Fallback for unmatched API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.originalUrl} not found.`
    });
});

// ============================================================
// START SERVER & TEST DATABASE
// ============================================================
app.listen(PORT, async () => {
    console.log('====================================================');
    console.log('🛍️  SHOPORA E-COMMERCE MANAGEMENT SYSTEM');
    console.log('====================================================');
    console.log(`🚀 Server listening on:  http://localhost:${PORT}`);
    console.log(`🌐 Frontend UI:          http://localhost:${PORT}`);
    console.log(`📡 Products API:         http://localhost:${PORT}/api/products`);
    console.log(`🔐 Auth API:             http://localhost:${PORT}/api/auth`);
    console.log('====================================================');

    // Test MySQL connectivity on startup
    await testConnection();
});
