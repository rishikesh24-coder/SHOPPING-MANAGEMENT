# SHOPORA — Modern E-Commerce & Product Management System

A full-stack, production-grade e-commerce application inspired by modern Indian shopping platforms (e.g. Myntra), built with **Node.js, Express, MySQL, Vanilla JavaScript, and JWT Authentication**.

---

## 🌟 Architecture Overview

```text
┌─────────────────────────────────┐
│        SHOPORA Frontend         │ ◄── HTML5, CSS3, Vanilla JavaScript
│  (Modern Fashion / E-Commerce)  │     (Hero Carousel, Search, Wishlist, Bag, Modals)
└────────────────┬────────────────┘
                 │
                 │ HTTP fetch() with JSON & Bearer <JWT>
                 ▼
┌─────────────────────────────────┐
│      Express REST API           │ ◄── Node.js & Express
│   (Authentication & Products)   │     (CORS, Middleware, Password Hashing, JWT verification)
└────────────────┬────────────────┘
                 │
                 │ Parameterized SQL queries via mysql2/promise pool
                 ▼
┌─────────────────────────────────┐
│        MySQL Database           │ ◄── Database: online_shopping
│       (users & products)        │     (Bcrypt-hashed passwords, Auto-increment IDs)
└─────────────────────────────────┘
```

---

## 📂 Project Structure

```text
SHOPPING MANAGEMENT SYSTEM/
│
├── database.sql               # MySQL script for 'online_shopping' database, 'users' & 'products' tables
├── README.md                  # Project documentation & viva guide
│
├── backend/
│   ├── server.js              # Express app entry point, CORS, static hosting
│   ├── db.js                  # MySQL connection pool configuration (mysql2/promise)
│   ├── package.json           # Dependencies: express, mysql2, cors, dotenv, bcryptjs, jsonwebtoken
│   ├── .env                   # Environment variables (DB credentials, JWT_SECRET)
│   ├── .env.example           # Template for environment configuration
│   │
│   ├── middleware/
│   │   └── auth.js            # JWT Authentication middleware (Bearer token verifier)
│   │
│   └── routes/
│       ├── auth.js            # User Register, Login, Me (Profile), Reset Password
│       └── products.js        # Product CRUD (GET, POST, PUT, DELETE with JWT protection)
│
└── frontend/
    ├── index.html             # High-conversion shopping layout (Header, Hero, Categories, Catalog, Modals)
    ├── style.css              # Custom styling inspired by top e-commerce platforms
    └── script.js              # Full-stack client: dynamic images, search, filters, auth & CRUD logic
```

---

## 📡 REST API Reference

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Registers a new user. Hashes password using `bcryptjs`. |
| **POST** | `/api/auth/login` | Public | Authenticates user credentials and returns a signed `JWT` (valid 7 days). |
| **GET** | `/api/auth/me` | Protected | Returns authenticated user details (Name, Email, ID, Registration Date). |
| **POST** | `/api/auth/reset-password` | Public | Development-friendly safe password reset flow. |

### 2. Product Management Endpoints (`/api/products`)

| Method | Endpoint | Access | Description | SQL Query Executed |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/products` | Public | Retrieves all products | `SELECT * FROM products ORDER BY id DESC` |
| **GET** | `/api/products/:id` | Public | Retrieves single product | `SELECT * FROM products WHERE id = ?` |
| **POST** | `/api/products` | **Protected (JWT)** | Inserts new product | `INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)` |
| **PUT** | `/api/products/:id` | **Protected (JWT)** | Updates existing product | `UPDATE products SET name=?, category=?, price=?, quantity=?, description=? WHERE id=?` |
| **DELETE** | `/api/products/:id` | **Protected (JWT)** | Deletes product | `DELETE FROM products WHERE id = ?` |

---

## ⚡ Quick Start Guide

### Step 1: Verify MySQL Database
Ensure MySQL Server is running locally. The database script [database.sql](file:///c:/Users/rishi/OneDrive/Desktop/SHOPPING%20MANAGEMENT%20SYSTEM/database.sql) automatically sets up the tables:
```sql
USE online_shopping;
SHOW TABLES;
-- Expected output: 'products' and 'users'
```

### Step 2: Configure Environment Credentials
Check [backend/.env](file:///c:/Users/rishi/OneDrive/Desktop/SHOPPING%20MANAGEMENT%20SYSTEM/backend/.env):
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Rishi@12345
DB_NAME=online_shopping
DB_PORT=3306
JWT_SECRET=shopora_jwt_secret_key_2026_super_secure
```

### Step 3: Run the Backend Server
```powershell
cd "c:\Users\rishi\OneDrive\Desktop\SHOPPING MANAGEMENT SYSTEM\backend"
npm start
```
You will see:
```text
====================================================
🛍️  SHOPORA E-COMMERCE MANAGEMENT SYSTEM
====================================================
🚀 Server listening on:  http://localhost:5000
🌐 Frontend UI:          http://localhost:5000
📡 Products API:         http://localhost:5000/api/products
🔐 Auth API:             http://localhost:5000/api/auth
====================================================
✅ [DATABASE CONNECTED] Successfully connected to MySQL!
```

### Step 4: Open the Frontend
Simply open your browser and go to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🧪 Testing Guide

### 1. Test User Registration & Login
1. Click **Profile** on the top right header.
2. Select **REGISTER** tab.
3. Enter your Name, Email, Password (min 6 chars), and Confirm Password. Click **CREATE ACCOUNT**.
4. The system securely hashes your password with `bcryptjs` and inserts the row into the MySQL `users` table.
5. You are redirected to **LOGIN**. Enter your email & password and click **LOGIN**.
6. The backend verifies the bcrypt hash and issues a signed JWT token stored securely in the browser.
7. The header now shows **Hi, [Your Name]** with access to your Profile and Admin product management!

### 2. Test Product CRUD (Create, Read, Update, Delete)
1. **READ**: The product catalog automatically queries `GET /api/products` from MySQL and renders cards with real images, stock counts, and prices in `₹`.
2. **CREATE**: Click the **➕ Add New Product** button in the catalog or profile menu. Fill in the details (e.g. *Nike Air Max*, *Footwear*, *₹7,999*, *15 units*) and submit. A green toast confirms insertion into MySQL.
3. **UPDATE**: When logged in, each product card displays an **✏️ Edit** button. Click it to open the pre-filled modal, modify the price or quantity, and save. The card updates immediately.
4. **DELETE**: Click the **🗑️ Delete** button on any product card. A confirmation dialog appears. Confirm to delete the record from MySQL via `DELETE /api/products/:id`.
5. **PROTECTION**: If you click **Log Out** and attempt to send a POST/PUT/DELETE request, the backend immediately blocks the request with `401 Unauthorized`.
