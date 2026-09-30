// ============================================================
// db.js - MySQL Database Connection Configuration
// ============================================================
// This file establishes and exports a MySQL connection pool
// using the 'mysql2/promise' library, which supports async/await.
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// ============================================================
// ⚠️ CONFIGURE YOUR MYSQL DATABASE CREDENTIALS HERE ⚠️
// ============================================================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',

    // ************************************************************
    // 👇👇👇 ENTER YOUR MYSQL ROOT PASSWORD HERE 👇👇👇
    // Replace 'YOUR_MYSQL_PASSWORD' with your actual MySQL password.
    // If you don't have a password set (common in XAMPP), leave it as ''.
    // ************************************************************
    password: process.env.DB_PASSWORD || 'Rishi@12345',

    database: process.env.DB_NAME || 'online_shopping',
    port: process.env.DB_PORT || 3306,

    // Connection pool options for stability and performance
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create a connection pool to handle multiple queries simultaneously
const pool = mysql.createPool(dbConfig);

// Helper function to test the database connection on server startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('----------------------------------------------------');
        console.log('✅ [DATABASE CONNECTED] Successfully connected to MySQL!');
        console.log(`   Host:     ${dbConfig.host}:${dbConfig.port}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   User:     ${dbConfig.user}`);
        console.log('----------------------------------------------------');
        connection.release();
        return true;
    } catch (error) {
        console.error('----------------------------------------------------');
        console.error('❌ [DATABASE CONNECTION FAILED]');
        console.error('   Error Code:', error.code);
        console.error('   Error Message:', error.message);
        console.error('');
        console.error('   💡 TROUBLESHOOTING TIPS:');
        console.error('   1. Is MySQL Server running on your computer?');
        console.error('   2. Did you enter your password in backend/db.js?');
        console.error('   3. Did you run the SQL script to create database "online_shopping"?');
        console.error('----------------------------------------------------');
        return false;
    }
}

// Export the pool for running queries in routes, and the test function
module.exports = {
    pool,
    testConnection
};
