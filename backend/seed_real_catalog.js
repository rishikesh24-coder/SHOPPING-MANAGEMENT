const { pool } = require('./db');

const catalog = [
    {
        name: "Nike Air Force 1 '07 Sneakers",
        brand: "Nike",
        category: "Footwear",
        price: 7495.00,
        mrp: 9695.00,
        discount_percent: 23,
        quantity: 35,
        image: "assets/products/nike-air-force-1-07.jpg",
        rating: 4.8,
        review_count: 2480,
        badge: "Best Seller",
        description: "The radiance lives on in the Nike Air Force 1 '07, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold colors and the perfect amount of flash to make you shine."
    },
    {
        name: "JBL Tune 770NC Wireless ANC Headphones",
        brand: "JBL",
        category: "Electronics",
        price: 5999.00,
        mrp: 9999.00,
        discount_percent: 40,
        quantity: 45,
        image: "assets/products/jbl-tune-770nc.jpg",
        rating: 4.6,
        review_count: 1869,
        badge: "Trending",
        description: "Adaptive Noise Cancelling with Smart Ambient, up to 70 hours of battery life with speed charge, and JBL Pure Bass sound with Bluetooth 5.3 multi-point connectivity."
    },
    {
        name: "JBL Flip 6 Portable Bluetooth Speaker",
        brand: "JBL",
        category: "Electronics",
        price: 9999.00,
        mrp: 13999.00,
        discount_percent: 29,
        quantity: 25,
        image: "assets/products/jbl-flip-6.jpg",
        rating: 4.7,
        review_count: 3120,
        badge: "Hot Deal",
        description: "Louder, more powerful sound with 2-way speaker system, IP67 waterproof and dustproof design, 12 hours of playtime, and PartyBoost compatibility."
    },
    {
        name: "JBL Tune Beam 2 True Wireless Earbuds",
        brand: "JBL",
        category: "Electronics",
        price: 4499.00,
        mrp: 7999.00,
        discount_percent: 44,
        quantity: 50,
        image: "assets/products/jbl-tune-beam-2.jpg",
        rating: 4.5,
        review_count: 940,
        badge: "New Arrival",
        description: "True Wireless earbuds with Active Noise Cancelling, 4-mic technology for crisp calls, up to 48 hours battery life, and IP54 water resistance."
    },
    {
        name: "Levi's 511 Slim Fit Mid-Rise Jeans",
        brand: "Levi's",
        category: "Men",
        price: 2599.00,
        mrp: 3999.00,
        discount_percent: 35,
        quantity: 40,
        image: "assets/products/levis-511-slim-fit-jeans.jpg",
        rating: 4.6,
        review_count: 1420,
        badge: "Best Seller",
        description: "A modern slim with room to move. Added stretch for all-day comfort. Crafted with premium denim featuring Levi's iconic 5-pocket styling and leather patch."
    },
    {
        name: "Adidas Grand Court Base 2.0 Tennis Sneakers",
        brand: "Adidas",
        category: "Footwear",
        price: 3899.00,
        mrp: 5999.00,
        discount_percent: 35,
        quantity: 30,
        image: "assets/products/adidas-grand-court-base.jpg",
        rating: 4.7,
        review_count: 1650,
        badge: "Trending",
        description: "Classic tennis-inspired sneakers with a smooth synthetic leather upper, Cloudfoam Comfort sockliner, and iconic 3-Stripes branding for effortless everyday style."
    },
    {
        name: "Puma Smash v2 Leather Casual Sneakers",
        brand: "Puma",
        category: "Footwear",
        price: 2499.00,
        mrp: 4499.00,
        discount_percent: 44,
        quantity: 35,
        image: "assets/products/puma-smash-v2-sneakers.jpg",
        rating: 4.5,
        review_count: 2180,
        badge: "Hot Deal",
        description: "The Puma Smash v2 keeps you looking sporty and fresh. Soft leather upper with updated eyelets, a sleek padded collar, and durable rubber outsole."
    },
    {
        name: "Apple AirPods (3rd Generation) with MagSafe",
        brand: "Apple",
        category: "Electronics",
        price: 15900.00,
        mrp: 19900.00,
        discount_percent: 20,
        quantity: 20,
        image: "assets/products/apple-airpods-3rd-gen.jpg",
        rating: 4.9,
        review_count: 5410,
        badge: "Editor's Pick",
        description: "Personalized Spatial Audio with dynamic head tracking, sweat and water resistance, force sensor controls, and up to 30 hours of listening time with the MagSafe Charging Case."
    },
    {
        name: "Sony WH-1000XM5 Wireless ANC Headphones",
        brand: "Sony",
        category: "Electronics",
        price: 26990.00,
        mrp: 34990.00,
        discount_percent: 23,
        quantity: 15,
        image: "assets/products/sony-wh-1000xm5.jpg",
        rating: 4.9,
        review_count: 3820,
        badge: "Best Seller",
        description: "Industry-leading noise cancellation with two processors and 8 microphones. Magnificent sound quality engineered to perfection with the new Integrated Processor V1."
    },
    {
        name: "Tommy Hilfiger Pure Cotton Oxford Shirt",
        brand: "Tommy Hilfiger",
        category: "Men",
        price: 3499.00,
        mrp: 5499.00,
        discount_percent: 36,
        quantity: 40,
        image: "assets/products/tommy-hilfiger-oxford-shirt.jpg",
        rating: 4.7,
        review_count: 830,
        badge: "Premium",
        description: "Elevated American prep style in 100% breathable organic cotton oxford weave. Features a button-down collar, curved hem, and signature flag embroidery."
    },
    {
        name: "U.S. Polo Assn. Classic Solid Pique Polo",
        brand: "U.S. Polo Assn.",
        category: "Men",
        price: 1199.00,
        mrp: 1999.00,
        discount_percent: 40,
        quantity: 60,
        image: "assets/products/us-polo-pique-polo-tshirt.jpg",
        rating: 4.4,
        review_count: 1940,
        badge: "Essential",
        description: "Authentic combed cotton pique polo with ribbed collar and armbands, two-button placket, and the signature double horseman logo embroidered on the chest."
    },
    {
        name: "Manyavar Embroidered Silk Blend Kurta Set",
        brand: "Manyavar",
        category: "Men",
        price: 2999.00,
        mrp: 4999.00,
        discount_percent: 40,
        quantity: 25,
        image: "assets/products/manyavar-kurta-set.jpg",
        rating: 4.8,
        review_count: 1220,
        badge: "Festive Edit",
        description: "Exquisite festive wear crafted in a shimmering silk-blend fabric with intricate mandarin collar embroidery and paired with a traditional cream churidar."
    },
    {
        name: "Zara Tailored Double-Breasted Structured Blazer",
        brand: "Zara",
        category: "Women",
        price: 4990.00,
        mrp: 6990.00,
        discount_percent: 29,
        quantity: 20,
        image: "assets/products/zara-tailored-blazer.jpg",
        rating: 4.7,
        review_count: 910,
        badge: "Trending",
        description: "A modern power silhouette with peaked lapels, structured shoulder pads, front flap pockets, and embossed tortoiseshell double-breasted buttons."
    },
    {
        name: "Biba Printed Pure Cotton Anarkali Suit Set",
        brand: "Biba",
        category: "Women",
        price: 2799.00,
        mrp: 4599.00,
        discount_percent: 39,
        quantity: 30,
        image: "assets/products/biba-anarkali-suit.jpg",
        rating: 4.6,
        review_count: 1540,
        badge: "Best Seller",
        description: "Graceful flared Anarkali kurta featuring traditional floral hand-block prints, gota patti work along the neckline, matching palazzos, and a lightweight voile dupatta."
    },
    {
        name: "H&M Tiered Floral Bohemian Maxi Dress",
        brand: "H&M",
        category: "Women",
        price: 2299.00,
        mrp: 2999.00,
        discount_percent: 23,
        quantity: 35,
        image: "assets/products/hm-floral-maxi-dress.jpg",
        rating: 4.5,
        review_count: 1120,
        badge: "New Arrival",
        description: "An airy, calf-length dress in woven viscose with a smocked bodice, sweetheart neckline, tiered gathered skirt, and romantic puffed puff sleeves."
    },
    {
        name: "Mango High-Waisted Wide-Leg Pleated Trousers",
        brand: "Mango",
        category: "Women",
        price: 3290.00,
        mrp: 4590.00,
        discount_percent: 28,
        quantity: 25,
        image: "assets/products/mango-wide-leg-trousers.jpg",
        rating: 4.6,
        review_count: 680,
        badge: "Editor's Pick",
        description: "Contemporary tailored trousers in lightweight flowy twill with front pleats, high-rise waist, side pockets, and relaxed full-length wide legs."
    },
    {
        name: "Maybelline Super Stay Matte Ink Liquid Lipstick",
        brand: "Maybelline",
        category: "Beauty",
        price: 499.00,
        mrp: 699.00,
        discount_percent: 29,
        quantity: 80,
        image: "assets/products/maybelline-matte-ink-lipstick.jpg",
        rating: 4.6,
        review_count: 8750,
        badge: "Best Seller",
        description: "Up to 16 hours of saturated matte liquid color. Features an exclusive arrow applicator for precise application in an intensely pigmented transfer-proof formula."
    },
    {
        name: "Minimalist 10% Niacinamide Face Serum with Zinc",
        brand: "Minimalist",
        category: "Beauty",
        price: 569.00,
        mrp: 599.00,
        discount_percent: 5,
        quantity: 75,
        image: "assets/products/minimalist-niacinamide-serum.jpg",
        rating: 4.8,
        review_count: 6320,
        badge: "Trending",
        description: "Pure vitamin B3 serum clinically proven to balance oil production, reduce blemishes, strengthen the skin barrier, and soothe acne-prone skin."
    },
    {
        name: "Forest Essentials Soundarya Cream with 24K Gold",
        brand: "Forest Essentials",
        category: "Beauty",
        price: 3450.00,
        mrp: 3950.00,
        discount_percent: 13,
        quantity: 20,
        image: "assets/products/forest-essentials-soundarya-cream.jpg",
        rating: 4.9,
        review_count: 1890,
        badge: "Luxury Ayurvedic",
        description: "Infused with pure 24 Karat Gold Bhasma and SPF 25, this traditional Ayurvedic formula deeply nourishes, restores skin elasticity, and grants luminous radiance."
    },
    {
        name: "L'Oreal Paris Extraordinary Oil Smooth Hair Serum",
        brand: "L'Oreal Paris",
        category: "Beauty",
        price: 475.00,
        mrp: 649.00,
        discount_percent: 27,
        quantity: 65,
        image: "assets/products/loreal-extraordinary-hair-serum.jpg",
        rating: 4.7,
        review_count: 4510,
        badge: "Hot Deal",
        description: "Enriched with a blend of 6 rare precious floral oils. Provides instant shine, controls frizz up to 48 hours, and offers heat protection up to 230°C."
    },
    {
        name: "Mothercare Boys Pure Cotton Dinosaur T-Shirt",
        brand: "Mothercare",
        category: "Kids",
        price: 699.00,
        mrp: 1199.00,
        discount_percent: 42,
        quantity: 40,
        image: "assets/products/mothercare-boys-dino-tee.jpg",
        rating: 4.8,
        review_count: 740,
        badge: "Best Seller",
        description: "Super soft 100% breathable organic cotton jersey tee with fun dino screen prints, nickel-free shoulder poppers for easy dressing, and tagless comfort."
    },
    {
        name: "H&M Girls Shimmering Tulle Party Dress",
        brand: "H&M",
        category: "Kids",
        price: 1499.00,
        mrp: 1999.00,
        discount_percent: 25,
        quantity: 30,
        image: "assets/products/hm-girls-tulle-dress.jpg",
        rating: 4.7,
        review_count: 620,
        badge: "Party Edit",
        description: "Delightful party dress with a sparkly glitter bodice, cap sleeves, full gathered tulle skirt with scalloped hem, and soft cotton jersey lining."
    },
    {
        name: "GAP Kids Classic Denim Dungaree Overalls",
        brand: "GAP",
        category: "Kids",
        price: 2199.00,
        mrp: 3499.00,
        discount_percent: 37,
        quantity: 25,
        image: "assets/products/gap-kids-denim-overalls.jpg",
        rating: 4.8,
        review_count: 890,
        badge: "Classic",
        description: "Heavy-duty soft washed 100% cotton denim dungarees with adjustable buckle straps, front bib pocket, side button closures, and reinforced knee stitching."
    },
    {
        name: "Crocs Kids Classic Slip-On Lightweight Clog",
        brand: "Crocs",
        category: "Kids",
        price: 1995.00,
        mrp: 2495.00,
        discount_percent: 20,
        quantity: 45,
        image: "assets/products/crocs-kids-classic-clog.jpg",
        rating: 4.9,
        review_count: 3420,
        badge: "Top Rated",
        description: "Incredibly light and fun to wear with Croslite foam cushioning, pivoting heel straps for a secure fit, ventilation ports, and customizable with Jibbitz charms."
    },
    {
        name: "Philips Digital Air Fryer HD9252 Rapid Air",
        brand: "Philips",
        category: "Home",
        price: 7999.00,
        mrp: 11995.00,
        discount_percent: 33,
        quantity: 20,
        image: "assets/products/philips-digital-air-fryer.jpg",
        rating: 4.7,
        review_count: 4890,
        badge: "Best Seller",
        description: "Healthy frying with Rapid Air technology for up to 90% less fat. Features 7 preset touch screen cooking menus, 4.1L capacity, and NutriU recipe app integration."
    },
    {
        name: "Sleepyhead Ergonomic Mesh High-Back Office Chair",
        brand: "Sleepyhead",
        category: "Home",
        price: 5499.00,
        mrp: 9999.00,
        discount_percent: 45,
        quantity: 15,
        image: "assets/products/sleepyhead-office-chair.jpg",
        rating: 4.6,
        review_count: 1350,
        badge: "Work From Home",
        description: "Breathable korean mesh back with dynamic adjustable lumbar support, 2D cushioned armrests, 135-degree tilt reclining mechanism, and heavy-duty nylon base."
    },
    {
        name: "Bombay Dyeing 100% Cotton 300TC King Bedsheet",
        brand: "Bombay Dyeing",
        category: "Home",
        price: 1299.00,
        mrp: 2199.00,
        discount_percent: 41,
        quantity: 50,
        image: "assets/products/bombay-dyeing-cotton-bedsheet.jpg",
        rating: 4.5,
        review_count: 2110,
        badge: "Hot Deal",
        description: "Crafted from 100% super fine combed cotton with 300 thread count sateen weave. Includes 1 King bedsheet (274 x 274 cm) and 2 matching pillow covers."
    },
    {
        name: "Milton Thermosteel Flip-Lid Insulated Flask",
        brand: "Milton",
        category: "Home",
        price: 849.00,
        mrp: 1120.00,
        discount_percent: 24,
        quantity: 60,
        image: "assets/products/milton-thermosteel-flask.jpg",
        rating: 4.7,
        review_count: 5200,
        badge: "Kitchen Essential",
        description: "1000ml double-walled vacuum insulated flask fabricated inside and outside in 18/8 food-grade stainless steel. Keeps liquids hot or cold for 24 hours."
    },
    {
        name: "Casio G-Shock GA-2100 Octagonal Watch",
        brand: "Casio",
        category: "Accessories",
        price: 7995.00,
        mrp: 9995.00,
        discount_percent: 20,
        quantity: 30,
        image: "assets/products/casio-g-shock-ga2100.jpg",
        rating: 4.9,
        review_count: 4150,
        badge: "Cult Classic",
        description: "The iconic octagonal Carbon Core Guard bezel with ultra-thin 11.8mm profile. Features 200M water resistance, double LED light, world time, and shock resistance."
    },
    {
        name: "Fossil Grant Chronograph Leather Watch",
        brand: "Fossil",
        category: "Accessories",
        price: 8995.00,
        mrp: 14995.00,
        discount_percent: 40,
        quantity: 25,
        image: "assets/products/fossil-grant-chronograph.jpg",
        rating: 4.7,
        review_count: 1840,
        badge: "Gentleman's Choice",
        description: "Modeled after vintage clocks, with classic Roman numerals, dark navy satin dial, three sub-dials for 24-hour and stopwatch tracking, and rich leather strap."
    },
    {
        name: "Ray-Ban Classic Gold Aviator Polarized Sunglasses",
        brand: "Ray-Ban",
        category: "Accessories",
        price: 8290.00,
        mrp: 10290.00,
        discount_percent: 19,
        quantity: 35,
        image: "assets/products/ray-ban-aviator-rb3025.jpg",
        rating: 4.8,
        review_count: 3290,
        badge: "Timeless Icon",
        description: "Originally designed for US aviators in 1937. Iconic gold-tone metal frame with crystal green G-15 polarized lenses providing 100% UV protection and clarity."
    },
    {
        name: "Wildcraft 35L Water-Resistant Laptop Backpack",
        brand: "Wildcraft",
        category: "Accessories",
        price: 1799.00,
        mrp: 2999.00,
        discount_percent: 40,
        quantity: 45,
        image: "assets/products/wildcraft-35l-backpack.jpg",
        rating: 4.6,
        review_count: 2840,
        badge: "Travel Ready",
        description: "Multi-compartment 35-liter backpack engineered with durable water-resistant polyester, padded 15.6-inch laptop sleeve, ventilated back panel, and organizer pockets."
    }
];

async function seedRealCatalog() {
    console.log('Seeding real product catalog in MySQL...');

    // Get current products
    const [existing] = await pool.query('SELECT id FROM products ORDER BY id');
    console.log(`Found ${existing.length} existing products in database.`);

    for (let i = 0; i < catalog.length; i++) {
        const item = catalog[i];
        if (i < existing.length) {
            // Update existing row
            const targetId = existing[i].id;
            await pool.query(
                `UPDATE products
                 SET name = ?, brand = ?, category = ?, price = ?, mrp = ?, discount_percent = ?, quantity = ?, image = ?, rating = ?, review_count = ?, badge = ?, description = ?
                 WHERE id = ?`,
                [
                    item.name,
                    item.brand,
                    item.category,
                    item.price,
                    item.mrp,
                    item.discount_percent,
                    item.quantity,
                    item.image,
                    item.rating,
                    item.review_count,
                    item.badge,
                    item.description,
                    targetId
                ]
            );
            console.log(`Updated Product #${targetId}: "${item.name}" (${item.brand})`);
        } else {
            // Insert new product
            const [res] = await pool.query(
                `INSERT INTO products (name, brand, category, price, mrp, discount_percent, quantity, image, rating, review_count, badge, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.name,
                    item.brand,
                    item.category,
                    item.price,
                    item.mrp,
                    item.discount_percent,
                    item.quantity,
                    item.image,
                    item.rating,
                    item.review_count,
                    item.badge,
                    item.description
                ]
            );
            console.log(`Inserted Product #${res.insertId}: "${item.name}" (${item.brand})`);
        }
    }

    const [finalList] = await pool.query('SELECT id, name, brand, category, price, mrp, discount_percent, image FROM products ORDER BY id');
    console.log(`\nCatalog seeded successfully! Total products: ${finalList.length}`);
    console.table(finalList.map(p => ({
        id: p.id,
        brand: p.brand,
        name: p.name.substring(0, 30),
        category: p.category,
        price: '₹' + p.price,
        mrp: '₹' + p.mrp,
        discount: p.discount_percent + '%',
        image: p.image
    })));

    await pool.end();
}

seedRealCatalog().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
