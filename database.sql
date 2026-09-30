-- ============================================================
-- SHOPORA - ONLINE SHOPPING MANAGEMENT SYSTEM
-- MySQL Database Setup Script
-- Database: online_shopping
-- Tables  : products, users
-- ============================================================

CREATE DATABASE IF NOT EXISTS online_shopping;
USE online_shopping;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(60) DEFAULT '',
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    mrp DECIMAL(10, 2) DEFAULT NULL,
    discount_percent INT DEFAULT 0,
    quantity INT NOT NULL DEFAULT 0,
    badge VARCHAR(50) DEFAULT NULL,
    promotional_badge VARCHAR(100) DEFAULT NULL,
    image VARCHAR(255) DEFAULT '',
    image_url VARCHAR(1000) DEFAULT '',
    rating DECIMAL(2, 1) DEFAULT 4.5,
    review_count INT DEFAULT 100,
    description VARCHAR(255)
);

-- Seed Real Catalog Products (32 Authentic Items)
INSERT INTO products (id, name, brand, category, price, mrp, discount_percent, quantity, image, rating, review_count, badge, description)
VALUES
(1, 'Nike Air Force 1 ''07 Sneakers', 'Nike', 'Footwear', 7495.00, 9695.00, 23, 35, 'assets/products/nike-air-force-1-07.jpg', 4.8, 2480, 'Best Seller', 'The radiance lives on in the Nike Air Force 1 ''07, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold colors and the perfect amount of flash to make you shine.'),
(2, 'JBL Tune 770NC Wireless ANC Headphones', 'JBL', 'Electronics', 5999.00, 9999.00, 40, 45, 'assets/products/jbl-tune-770nc.jpg', 4.6, 1869, 'Trending', 'Adaptive Noise Cancelling with Smart Ambient, up to 70 hours of battery life with speed charge, and JBL Pure Bass sound with Bluetooth 5.3 multi-point connectivity.'),
(3, 'JBL Flip 6 Portable Bluetooth Speaker', 'JBL', 'Electronics', 9999.00, 13999.00, 29, 25, 'assets/products/jbl-flip-6.jpg', 4.7, 3120, 'Hot Deal', 'Louder, more powerful sound with 2-way speaker system, IP67 waterproof and dustproof design, 12 hours of playtime, and PartyBoost compatibility.'),
(4, 'JBL Tune Beam 2 True Wireless Earbuds', 'JBL', 'Electronics', 4499.00, 7999.00, 44, 50, 'assets/products/jbl-tune-beam-2.jpg', 4.5, 940, 'New Arrival', 'True Wireless earbuds with Active Noise Cancelling, 4-mic technology for crisp calls, up to 48 hours battery life, and IP54 water resistance.'),
(5, 'Levi''s 511 Slim Fit Mid-Rise Jeans', 'Levi''s', 'Men', 2599.00, 3999.00, 35, 40, 'assets/products/levis-511-slim-fit-jeans.jpg', 4.6, 1420, 'Best Seller', 'A modern slim with room to move. Added stretch for all-day comfort. Crafted with premium denim featuring Levi''s iconic 5-pocket styling and leather patch.'),
(6, 'Adidas Grand Court Base 2.0 Tennis Sneakers', 'Adidas', 'Footwear', 3899.00, 5999.00, 35, 30, 'assets/products/adidas-grand-court-base.jpg', 4.7, 1650, 'Trending', 'Classic tennis-inspired sneakers with a smooth synthetic leather upper, Cloudfoam Comfort sockliner, and iconic 3-Stripes branding for effortless everyday style.'),
(7, 'Puma Smash v2 Leather Casual Sneakers', 'Puma', 'Footwear', 2499.00, 4499.00, 44, 35, 'assets/products/puma-smash-v2-sneakers.jpg', 4.5, 2180, 'Hot Deal', 'The Puma Smash v2 keeps you looking sporty and fresh. Soft leather upper with updated eyelets, a sleek padded collar, and durable rubber outsole.'),
(8, 'Apple AirPods (3rd Generation) with MagSafe', 'Apple', 'Electronics', 15900.00, 19900.00, 20, 20, 'assets/products/apple-airpods-3rd-gen.jpg', 4.9, 5410, 'Editor''s Pick', 'Personalized Spatial Audio with dynamic head tracking, sweat and water resistance, force sensor controls, and up to 30 hours of listening time with the MagSafe Charging Case.'),
(9, 'Sony WH-1000XM5 Wireless ANC Headphones', 'Sony', 'Electronics', 26990.00, 34990.00, 23, 15, 'assets/products/sony-wh-1000xm5.jpg', 4.9, 3820, 'Best Seller', 'Industry-leading noise cancellation with two processors and 8 microphones. Magnificent sound quality engineered to perfection with the new Integrated Processor V1.'),
(10, 'Tommy Hilfiger Pure Cotton Oxford Shirt', 'Tommy Hilfiger', 'Men', 3499.00, 5499.00, 36, 40, 'assets/products/tommy-hilfiger-oxford-shirt.jpg', 4.7, 830, 'Premium', 'Elevated American prep style in 100% breathable organic cotton oxford weave. Features a button-down collar, curved hem, and signature flag embroidery.'),
(11, 'U.S. Polo Assn. Classic Solid Pique Polo', 'U.S. Polo Assn.', 'Men', 1199.00, 1999.00, 40, 60, 'assets/products/us-polo-pique-polo-tshirt.jpg', 4.4, 1940, 'Essential', 'Authentic combed cotton pique polo with ribbed collar and armbands, two-button placket, and the signature double horseman logo embroidered on the chest.'),
(12, 'Manyavar Embroidered Silk Blend Kurta Set', 'Manyavar', 'Men', 2999.00, 4999.00, 40, 25, 'assets/products/manyavar-kurta-set.jpg', 4.8, 1220, 'Festive Edit', 'Exquisite festive wear crafted in a shimmering silk-blend fabric with intricate mandarin collar embroidery and paired with a traditional cream churidar.'),
(13, 'Zara Tailored Double-Breasted Structured Blazer', 'Zara', 'Women', 4990.00, 6990.00, 29, 20, 'assets/products/zara-tailored-blazer.jpg', 4.7, 910, 'Trending', 'A modern power silhouette with peaked lapels, structured shoulder pads, front flap pockets, and embossed tortoiseshell double-breasted buttons.'),
(14, 'Biba Printed Pure Cotton Anarkali Suit Set', 'Biba', 'Women', 2799.00, 4599.00, 39, 30, 'assets/products/biba-anarkali-suit.jpg', 4.6, 1540, 'Best Seller', 'Graceful flared Anarkali kurta featuring traditional floral hand-block prints, gota patti work along the neckline, matching palazzos, and a lightweight voile dupatta.'),
(15, 'H&M Tiered Floral Bohemian Maxi Dress', 'H&M', 'Women', 2299.00, 2999.00, 23, 35, 'assets/products/hm-floral-maxi-dress.jpg', 4.5, 1120, 'New Arrival', 'An airy, calf-length dress in woven viscose with a smocked bodice, sweetheart neckline, tiered gathered skirt, and romantic puffed puff sleeves.'),
(16, 'Mango High-Waisted Wide-Leg Pleated Trousers', 'Mango', 'Women', 3290.00, 4590.00, 28, 25, 'assets/products/mango-wide-leg-trousers.jpg', 4.6, 680, 'Editor''s Pick', 'Contemporary tailored trousers in lightweight flowy twill with front pleats, high-rise waist, side pockets, and relaxed full-length wide legs.'),
(20, 'Maybelline Super Stay Matte Ink Liquid Lipstick', 'Maybelline', 'Beauty', 499.00, 699.00, 29, 80, 'assets/products/maybelline-matte-ink-lipstick.jpg', 4.6, 8750, 'Best Seller', 'Up to 16 hours of saturated matte liquid color. Features an exclusive arrow applicator for precise application in an intensely pigmented transfer-proof formula.'),
(21, 'Minimalist 10% Niacinamide Face Serum with Zinc', 'Minimalist', 'Beauty', 569.00, 599.00, 5, 75, 'assets/products/minimalist-niacinamide-serum.jpg', 4.8, 6320, 'Trending', 'Pure vitamin B3 serum clinically proven to balance oil production, reduce blemishes, strengthen the skin barrier, and soothe acne-prone skin.'),
(22, 'Forest Essentials Soundarya Cream with 24K Gold', 'Forest Essentials', 'Beauty', 3450.00, 3950.00, 13, 20, 'assets/products/forest-essentials-soundarya-cream.jpg', 4.9, 1890, 'Luxury Ayurvedic', 'Infused with pure 24 Karat Gold Bhasma and SPF 25, this traditional Ayurvedic formula deeply nourishes, restores skin elasticity, and grants luminous radiance.'),
(23, 'L''Oreal Paris Extraordinary Oil Smooth Hair Serum', 'L''Oreal Paris', 'Beauty', 475.00, 649.00, 27, 65, 'assets/products/loreal-extraordinary-hair-serum.jpg', 4.7, 4510, 'Hot Deal', 'Enriched with a blend of 6 rare precious floral oils. Provides instant shine, controls frizz up to 48 hours, and offers heat protection up to 230°C.'),
(24, 'Mothercare Boys Pure Cotton Dinosaur T-Shirt', 'Mothercare', 'Kids', 699.00, 1199.00, 42, 40, 'assets/products/mothercare-boys-dino-tee.jpg', 4.8, 740, 'Best Seller', 'Super soft 100% breathable organic cotton jersey tee with fun dino screen prints, nickel-free shoulder poppers for easy dressing, and tagless comfort.'),
(25, 'H&M Girls Shimmering Tulle Party Dress', 'H&M', 'Kids', 1499.00, 1999.00, 25, 30, 'assets/products/hm-girls-tulle-dress.jpg', 4.7, 620, 'Party Edit', 'Delightful party dress with a sparkly glitter bodice, cap sleeves, full gathered tulle skirt with scalloped hem, and soft cotton jersey lining.'),
(26, 'GAP Kids Classic Denim Dungaree Overalls', 'GAP', 'Kids', 2199.00, 3499.00, 37, 25, 'assets/products/gap-kids-denim-overalls.jpg', 4.8, 890, 'Classic', 'Heavy-duty soft washed 100% cotton denim dungarees with adjustable buckle straps, front bib pocket, side button closures, and reinforced knee stitching.'),
(27, 'Crocs Kids Classic Slip-On Lightweight Clog', 'Crocs', 'Kids', 1995.00, 2495.00, 20, 45, 'assets/products/crocs-kids-classic-clog.jpg', 4.9, 3420, 'Top Rated', 'Incredibly light and fun to wear with Croslite foam cushioning, pivoting heel straps for a secure fit, ventilation ports, and customizable with Jibbitz charms.'),
(28, 'Philips Digital Air Fryer HD9252 Rapid Air', 'Philips', 'Home', 7999.00, 11995.00, 33, 20, 'assets/products/philips-digital-air-fryer.jpg', 4.7, 4890, 'Best Seller', 'Healthy frying with Rapid Air technology for up to 90% less fat. Features 7 preset touch screen cooking menus, 4.1L capacity, and NutriU recipe app integration.'),
(29, 'Sleepyhead Ergonomic Mesh High-Back Office Chair', 'Sleepyhead', 'Home', 5499.00, 9999.00, 45, 15, 'assets/products/sleepyhead-office-chair.jpg', 4.6, 1350, 'Work From Home', 'Breathable korean mesh back with dynamic adjustable lumbar support, 2D cushioned armrests, 135-degree tilt reclining mechanism, and heavy-duty nylon base.'),
(30, 'Bombay Dyeing 100% Cotton 300TC King Bedsheet', 'Bombay Dyeing', 'Home', 1299.00, 2199.00, 41, 50, 'assets/products/bombay-dyeing-cotton-bedsheet.jpg', 4.5, 2110, 'Hot Deal', 'Crafted from 100% super fine combed cotton with 300 thread count sateen weave. Includes 1 King bedsheet (274 x 274 cm) and 2 matching pillow covers.'),
(31, 'Milton Thermosteel Flip-Lid Insulated Flask', 'Milton', 'Home', 849.00, 1120.00, 24, 60, 'assets/products/milton-thermosteel-flask.jpg', 4.7, 5200, 'Kitchen Essential', '1000ml double-walled vacuum insulated flask fabricated inside and outside in 18/8 food-grade stainless steel. Keeps liquids hot or cold for 24 hours.'),
(32, 'Casio G-Shock GA-2100 Octagonal Watch', 'Casio', 'Accessories', 7995.00, 9995.00, 20, 30, 'assets/products/casio-g-shock-ga2100.jpg', 4.9, 4150, 'Cult Classic', 'The iconic octagonal Carbon Core Guard bezel with ultra-thin 11.8mm profile. Features 200M water resistance, double LED light, world time, and shock resistance.'),
(33, 'Fossil Grant Chronograph Leather Watch', 'Fossil', 'Accessories', 8995.00, 14995.00, 40, 25, 'assets/products/fossil-grant-chronograph.jpg', 4.7, 1840, 'Gentleman''s Choice', 'Modeled after vintage clocks, with classic Roman numerals, dark navy satin dial, three sub-dials for 24-hour and stopwatch tracking, and rich leather strap.'),
(35, 'Ray-Ban Classic Gold Aviator Polarized Sunglasses', 'Ray-Ban', 'Accessories', 8290.00, 10290.00, 19, 35, 'assets/products/ray-ban-aviator-rb3025.jpg', 4.8, 3290, 'Timeless Icon', 'Originally designed for US aviators in 1937. Iconic gold-tone metal frame with crystal green G-15 polarized lenses providing 100% UV protection and clarity.'),
(36, 'Wildcraft 35L Water-Resistant Laptop Backpack', 'Wildcraft', 'Accessories', 1799.00, 2999.00, 40, 45, 'assets/products/wildcraft-35l-backpack.jpg', 4.6, 2840, 'Travel Ready', 'Multi-compartment 35-liter backpack engineered with durable water-resistant polyester, padded 15.6-inch laptop sleeve, ventilated back panel, and organizer pockets.')
ON DUPLICATE KEY UPDATE
    name=VALUES(name), brand=VALUES(brand), category=VALUES(category),
    price=VALUES(price), mrp=VALUES(mrp), discount_percent=VALUES(discount_percent),
    quantity=VALUES(quantity), image=VALUES(image), rating=VALUES(rating),
    review_count=VALUES(review_count), badge=VALUES(badge), description=VALUES(description);
