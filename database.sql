-- ============================================================
-- SHOPORA - ONLINE SHOPPING MANAGEMENT SYSTEM
-- MySQL Database Setup Script
-- Database: online_shopping
-- Tables  : products, users
-- ============================================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS online_shopping;

-- Step 2: Switch to Database
USE online_shopping;

-- Step 3: Create 'users' Table for Authentication
-- Columns:
--   id         : Unique user identifier (Primary Key, Auto Increment)
--   name       : User's full name (VARCHAR 100)
--   email      : User's unique email address (VARCHAR 150)
--   password   : Bcrypt-hashed password (VARCHAR 255) - NEVER store plain text!
--   created_at : Account registration timestamp
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create 'products' Table for E-Commerce Catalog
-- Columns:
--   id          : Unique product identifier (Primary Key, Auto Increment)
--   name        : Product name / title (VARCHAR 100)
--   category    : Product category (e.g. Electronics, Clothing, Footwear)
--   price       : Price with 2 decimal precision (DECIMAL 10,2)
--   quantity    : Available stock count (INT)
--   description : Product specifications or summary (VARCHAR 255)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    description VARCHAR(255)
);

-- Step 5: Insert Sample Products (if table is empty)
INSERT INTO products (name, category, price, quantity, description)
SELECT * FROM (
    SELECT 'Wireless Bluetooth Headphones' AS name, 'Electronics' AS category, 49.99 AS price, 25 AS quantity, 'High-fidelity audio with active noise cancellation' AS description UNION ALL
    SELECT 'Classic Cotton T-Shirt', 'Clothing', 19.99, 60, '100% breathable organic cotton crew-neck t-shirt' UNION ALL
    SELECT 'Stainless Steel Water Bottle', 'Home & Kitchen', 14.50, 40, 'Double-wall vacuum insulated 750ml flask' UNION ALL
    SELECT 'Mechanical Gaming Keyboard', 'Electronics', 89.99, 15, 'RGB tactile mechanical switches with detachable USB-C' UNION ALL
    SELECT 'Ergonomic Office Chair', 'Furniture', 149.00, 10, 'Breathable mesh back with adjustable lumbar support' UNION ALL
    SELECT 'Running Sports Sneakers', 'Footwear', 65.00, 30, 'Lightweight breathable athletic shoes with air cushioning' UNION ALL
    SELECT 'Polarized Wayfarer Sunglasses', 'Accessories', 29.99, 45, 'UV400 protection with matte black lightweight frame' UNION ALL
    SELECT 'Smart Fitness Band', 'Electronics', 39.99, 50, 'Heart rate, sleep tracking, and 14-day battery life'
) AS sample_rows
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Step 6: Verify Tables
SHOW TABLES;
SELECT * FROM products;
SELECT * FROM users;
