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

// Safe migration to ensure products table contains required columns
async function migrateProductsSchema() {
    try {
        const [cols] = await pool.query('SHOW COLUMNS FROM products');
        const existing = cols.map(c => c.Field.toLowerCase());

        const required = [
            { name: 'brand', ddl: 'ADD COLUMN brand VARCHAR(100) DEFAULT \'\'' },
            { name: 'mrp', ddl: 'ADD COLUMN mrp DECIMAL(10,2) DEFAULT NULL' },
            { name: 'promotional_badge', ddl: 'ADD COLUMN promotional_badge VARCHAR(100) DEFAULT NULL' },
            { name: 'image_url', ddl: 'ADD COLUMN image_url VARCHAR(1000) DEFAULT \'\'' }
        ];

        for (const col of required) {
            if (!existing.includes(col.name)) {
                await pool.query(`ALTER TABLE products ${col.ddl}`);
                console.log(`✅ [SCHEMA MIGRATION] Added missing column: ${col.name}`);
            }
        }
    } catch (error) {
        console.error('⚠️ [SCHEMA MIGRATION ERROR]:', error.message);
    }
}

// Test database connection and ensure schema compatibility
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

        // Safe auto-migration for required products table columns
        await migrateProductsSchema();

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