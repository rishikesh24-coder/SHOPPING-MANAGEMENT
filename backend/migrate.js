// ============================================================
// migrate.js - Database Schema Initialization and Data Population
// ============================================================
// Creates tables for Wishlist, Cart, Addresses, Orders, Order Items,
// and seeds diverse e-commerce products across Men, Women, Kids,
// Beauty, Electronics, Home, Footwear, and Accessories.
// ============================================================

const { pool } = require('./db');

async function runMigration() {
    console.log('🔄 Starting SHOPORA Database Migration...');
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Wishlist Table
        console.log('📦 Creating wishlist table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_product (user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        // 2. Cart Table
        console.log('📦 Creating cart table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS cart (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_cart (user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        // 3. Addresses Table
        console.log('📦 Creating addresses table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                street_address VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                pincode VARCHAR(20) NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 4. Orders Table
        console.log('📦 Creating orders table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(10, 2) DEFAULT 0.00,
                shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
                status ENUM('PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PLACED',
                shipping_name VARCHAR(100) NOT NULL,
                shipping_phone VARCHAR(20) NOT NULL,
                shipping_address VARCHAR(255) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 5. Order Items Table
        console.log('📦 Creating order_items table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT,
                product_name VARCHAR(150) NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `);

        // 6. Enrich Products Catalog with realistic fashion, beauty, kids, footwear, electronics items
        console.log('🛍️ Checking category product diversity...');
        const newProducts = [
            // Men
            { name: 'Men Slim Fit Oxford Cotton Shirt', category: 'Men', price: 1499.00, quantity: 45, description: '100% breathable pure cotton button-down casual shirt with tailored cuffs' },
            { name: 'Men Relaxed Denim Jacket', category: 'Men', price: 2499.00, quantity: 20, description: 'Classic indigo washed denim jacket with dual chest pockets and brass buttons' },
            { name: 'Men Tailored Chino Trousers', category: 'Men', price: 1799.00, quantity: 35, description: 'Comfort-stretch mid-rise flat front chinos for workwear and weekends' },
            // Women
            { name: 'Floral Tiered Bohemian Maxi Dress', category: 'Women', price: 2199.00, quantity: 25, description: 'Airy georgette tiered maxi dress featuring romantic puff sleeves and V-neckline' },
            { name: 'Women Oversized Linen Blend Blazer', category: 'Women', price: 2899.00, quantity: 18, description: 'Contemporary single-breasted blazer woven in breathable European flax linen' },
            { name: 'Women High-Waisted Wide Leg Pants', category: 'Women', price: 1699.00, quantity: 30, description: 'Flowy pleated wide leg trousers with concealed waistband and deep pockets' },
            // Kids
            { name: 'Kids Organic Cotton Graphic Tee Set', category: 'Kids', price: 899.00, quantity: 50, description: 'Pack of 2 hypoallergenic super-soft organic cotton tees with playful motifs' },
            { name: 'Kids Denim Overalls with Straps', category: 'Kids', price: 1299.00, quantity: 22, description: 'Durable stretch denim dungarees with adjustable buckle straps and reinforced knees' },
            // Beauty
            { name: 'Rosewater & Hyaluronic Radiance Serum', category: 'Beauty', price: 799.00, quantity: 60, description: 'Ultra-hydrating daily facial glow serum enriched with niacinamide and botanical extracts' },
            { name: 'Matte Liquid Velvet Lip Color Duo', category: 'Beauty', price: 649.00, quantity: 40, description: 'Long-wear non-drying smudge-proof lipsticks in flattering nude and berry shades' },
            // Footwear
            { name: 'Cloud-Foam Athletic Running Shoes', category: 'Footwear', price: 2999.00, quantity: 30, description: 'Engineered mesh upper with responsive shock-absorbing cushioning and grip sole' },
            { name: 'Handcrafted Leather Penny Loafers', category: 'Footwear', price: 3499.00, quantity: 15, description: 'Premium full-grain tan leather slip-ons with cushioned arch-support insole' },
            // Accessories
            { name: 'Minimalist Matte Chronograph Watch', category: 'Accessories', price: 2299.00, quantity: 28, description: 'Sleek 40mm stainless steel casing with interchangeable genuine leather strap' },
            { name: 'UV400 Polarized Aviator Sunglasses', category: 'Accessories', price: 1199.00, quantity: 50, description: 'Classic gold-tone metal frame with anti-glare scratch-resistant tinted lenses' }
        ];

        for (const p of newProducts) {
            const [exists] = await conn.query('SELECT id FROM products WHERE name = ?', [p.name]);
            if (exists.length === 0) {
                await conn.query(
                    'INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)',
                    [p.name, p.category, p.price, p.quantity, p.description]
                );
                console.log(`   + Added product: ${p.name} (${p.category})`);
            }
        }

        await conn.commit();
        console.log('✅ Database Migration Completed Successfully!');
    } catch (error) {
        await conn.rollback();
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        conn.release();
    }
}

if (require.main === module) {
    runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runMigration };
