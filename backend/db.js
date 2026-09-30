// ============================================================
// db.js - MySQL Database Connection Configuration
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log('----------------------------------------------------');
        console.log('✅ [DATABASE CONNECTED] Successfully connected!');
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
        console.error('----------------------------------------------------');

        return false;
    }
}

module.exports = {
    pool,
    testConnection
};