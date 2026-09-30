const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStartupAuthTests() {
    console.log('========================================================');
    console.log('TESTING MANDATORY STARTUP LOGIN FLOW (TESTS 1 - 7)');
    console.log('========================================================\n');

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    try {
        // Register a test user via API first so credentials are ready
        const testEmail = `user_startup_${Date.now()}@example.com`;
        const testPassword = 'Password123!';
        const testName = 'Devika Sen';

        await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });

        // Register a test user via fetch inside page
        const regResult = await page.evaluate(async ({ name, email, password }) => {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, confirmPassword: password })
            });
            return await res.json();
        }, { name: testName, email: testEmail, password: testPassword });

        console.log('Registration result:', regResult.success ? 'Created user successfully' : regResult.message);

        // TEST 1: Login successfully -> EXPECTED: SHOPORA homepage
        await page.type('#main-login-email', testEmail);
        await page.type('#main-login-password', testPassword);
        await page.$eval('#main-login-submit', btn => btn.click());
        await sleep(2000);

        const t1HomeVisible = await page.$eval('#shopora-home', el => getComputedStyle(el).display !== 'none');
        const t1AuthHidden = await page.$eval('#auth-screen', el => getComputedStyle(el).display === 'none');
        const t1Passed = t1HomeVisible && t1AuthHidden;
        console.log(`TEST 1: Login successfully -> ${t1Passed ? '✅ PASS' : '❌ FAIL'} (homeVisible=${t1HomeVisible})`);

        // TEST 2: Click Profile -> EXPECTED: Profile dropdown opens
        await page.evaluate(() => {
            const tc = document.getElementById('toast-container');
            if (tc) tc.innerHTML = '';
        });
        await page.click('#profile-btn');
        await sleep(300);
        const dropClass = await page.$eval('#profile-dropdown', el => el.className);
        console.log('Dropdown class after click:', dropClass);
        const t2DropdownActive = dropClass.includes('active');
        console.log(`TEST 2: Click Profile -> ${t2DropdownActive ? '✅ PASS' : '❌ FAIL'} (dropdownActive=${t2DropdownActive})`);

        // TEST 3: Logout -> EXPECTED: Login page
        await page.$eval('button[onclick*="handleProfileDropdownAction(\'logout\')"]', btn => btn.click());
        await sleep(500);
        const t3AuthVisible = await page.$eval('#auth-screen', el => getComputedStyle(el).display !== 'none');
        const t3HomeHidden = await page.$eval('#shopora-home', el => getComputedStyle(el).display === 'none');
        const t3Passed = t3AuthVisible && t3HomeHidden;
        console.log(`TEST 3: Logout -> ${t3Passed ? '✅ PASS' : '❌ FAIL'} (authVisible=${t3AuthVisible}, homeHidden=${t3HomeHidden})`);

        // TEST 4: Close browser / open fresh http://localhost:5000 -> EXPECTED: Login page
        await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
        await sleep(400);
        const t4AuthVisible = await page.$eval('#auth-screen', el => getComputedStyle(el).display !== 'none');
        const t4HomeHidden = await page.$eval('#shopora-home', el => getComputedStyle(el).display === 'none');
        const t4ProfileModalHidden = await page.$eval('#profile-modal', el => getComputedStyle(el).display === 'none');
        const t4Passed = t4AuthVisible && t4HomeHidden && t4ProfileModalHidden;
        console.log(`TEST 4: Open fresh http://localhost:5000 -> ${t4Passed ? '✅ PASS' : '❌ FAIL'} (authVisible=${t4AuthVisible}, homeHidden=${t4HomeHidden})`);

        // TEST 5: If an old shopora_token exists in localStorage -> EXPECTED: LOGIN PAGE must STILL appear first (no bypass)
        await page.evaluate(() => {
            localStorage.setItem('shopora_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_stored_token');
        });
        await page.reload({ waitUntil: 'networkidle0' });
        await sleep(400);
        const t5AuthVisible = await page.$eval('#auth-screen', el => getComputedStyle(el).display !== 'none');
        const t5HomeHidden = await page.$eval('#shopora-home', el => getComputedStyle(el).display === 'none');
        const t5Passed = t5AuthVisible && t5HomeHidden;
        console.log(`TEST 5: Old token in localStorage -> ${t5Passed ? '✅ PASS' : '❌ FAIL'} (Login still appears first, no bypass: authVisible=${t5AuthVisible}, homeHidden=${t5HomeHidden})`);

        // TEST 6: Enter valid email/password -> EXPECTED: SHOPORA homepage
        await page.type('#main-login-email', testEmail);
        await page.type('#main-login-password', testPassword);
        await page.$eval('#main-login-submit', btn => btn.click());
        await sleep(2000);
        const t6HomeVisible = await page.$eval('#shopora-home', el => getComputedStyle(el).display !== 'none');
        console.log(`TEST 6: Enter valid credentials -> ${t6HomeVisible ? '✅ PASS' : '❌ FAIL'} (homeVisible=${t6HomeVisible})`);

        // TEST 7: Refresh -> EXPECTED: Login page appears (mandatory entry screen)
        await page.reload({ waitUntil: 'networkidle0' });
        await sleep(400);
        const t7AuthVisible = await page.$eval('#auth-screen', el => getComputedStyle(el).display !== 'none');
        const t7HomeHidden = await page.$eval('#shopora-home', el => getComputedStyle(el).display === 'none');
        const t7Passed = t7AuthVisible && t7HomeHidden;
        console.log(`TEST 7: Refresh page -> ${t7Passed ? '✅ PASS' : '❌ FAIL'} (Default entry screen is Login: authVisible=${t7AuthVisible}, homeHidden=${t7HomeHidden})`);

    } catch (err) {
        console.error('Test error:', err);
    } finally {
        await browser.close();
    }
}

runStartupAuthTests();
