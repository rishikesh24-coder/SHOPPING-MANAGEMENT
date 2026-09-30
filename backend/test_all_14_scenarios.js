const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAll14Tests() {
    console.log('========================================================');
    console.log('STARTING AUTOMATED E2E TESTS FOR 14 SCENARIOS');
    console.log('========================================================\n');

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    const results = [];

    function record(testNum, title, passed, detail) {
        results.push({ testNum, title, passed, detail });
        console.log(`TEST ${testNum}: ${title} -> ${passed ? '✅ PASS' : '❌ FAIL'}${detail ? ' (' + detail + ')' : ''}`);
    }

    try {
        // Clear cookies and storage first
        await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle0' });
        await sleep(500);

        // TEST 1: Open localhost:5000 while logged out
        const t1AuthDisplay = await page.$eval('#auth-screen', el => getComputedStyle(el).display);
        const t1HomeDisplay = await page.$eval('#shopora-home', el => getComputedStyle(el).display);
        const t1ProfileDisplay = await page.$eval('#profile-modal', el => getComputedStyle(el).display);
        const t1Passed = t1AuthDisplay !== 'none' && t1HomeDisplay === 'none' && t1ProfileDisplay === 'none';
        record(1, 'Open http://localhost:5000 while logged out', t1Passed, `auth=${t1AuthDisplay}, home=${t1HomeDisplay}, profile=${t1ProfileDisplay}`);

        // TEST 2: Register a user
        const uniqueEmail = `scenario_test_${Date.now()}@example.com`;
        const uniquePassword = 'Password123!';
        const uniqueName = 'Aditi Rao';

        // Click register link
        await page.click('#goto-register-btn');
        await sleep(300);
        await page.type('#main-reg-name', uniqueName);
        await page.type('#main-reg-email', uniqueEmail);
        await page.type('#main-reg-password', uniquePassword);
        await page.type('#main-reg-confirm-password', uniquePassword);
        await page.$eval('#main-register-submit', el => { el.scrollIntoView(); el.click(); });
        await sleep(1000);

        // Check if registration succeeded and switched to login
        const t2LoginVisible = await page.$eval('#auth-login-view', el => getComputedStyle(el).display !== 'none');
        record(2, 'Register a user in MySQL', t2LoginVisible, `Registered ${uniqueEmail} & switched to login`);

        // TEST 3: Login
        const currentEmailVal = await page.$eval('#main-login-email', el => el.value);
        if (!currentEmailVal) {
            await page.type('#main-login-email', uniqueEmail);
        }
        await page.type('#main-login-password', uniquePassword);
        await page.$eval('#main-login-submit', el => { el.scrollIntoView(); el.click(); });
        await sleep(2500);

        const alertText = await page.$eval('#auth-alert', el => el.textContent);
        if (alertText) console.log('Auth Alert:', alertText);

        const t3HomeDisplay = await page.$eval('#shopora-home', el => getComputedStyle(el).display);
        const t3Greeting = await page.$eval('#profile-btn-label', el => el.textContent.trim());
        const t3DropdownOpen = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));
        const t3Passed = t3HomeDisplay !== 'none' && t3Greeting.includes('Hi, Aditi') && !t3DropdownOpen;
        record(3, 'Login opens SHOPORA homepage', t3Passed, `home=${t3HomeDisplay}, greeting=${t3Greeting}, dropdownOpen=${t3DropdownOpen}`);

        // TEST 4: Refresh browser
        await page.reload({ waitUntil: 'networkidle0' });
        await sleep(1000);

        const t4HomeDisplay = await page.$eval('#shopora-home', el => getComputedStyle(el).display);
        const t4DropdownOpen = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));
        const t4ProfileModalOpen = await page.$eval('#profile-modal', el => getComputedStyle(el).display !== 'none');
        const t4Passed = t4HomeDisplay !== 'none' && !t4DropdownOpen && !t4ProfileModalOpen;
        record(4, 'Refresh browser keeps session and dropdown CLOSED', t4Passed, `home=${t4HomeDisplay}, dropdownOpen=${t4DropdownOpen}, profileModal=${t4ProfileModalOpen}`);

        // TEST 5: Click Profile
        await page.click('#profile-btn');
        await sleep(200);

        const t5DropdownOpen = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));
        const t5AriaExpanded = await page.$eval('#profile-btn', el => el.getAttribute('aria-expanded'));
        const t5Passed = t5DropdownOpen && t5AriaExpanded === 'true';
        record(5, 'Click Profile opens dropdown', t5Passed, `active=${t5DropdownOpen}, aria-expanded=${t5AriaExpanded}`);

        // TEST 6: Move mouse slowly from Profile button into dropdown
        // Move mouse slowly across the gap
        const btnBox = await page.$eval('#profile-btn', el => {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        const dropBox = await page.$eval('#profile-dropdown', el => {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + 20 };
        });

        await page.mouse.move(btnBox.x, btnBox.y);
        await sleep(100);
        // Move gradually through the gap
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            const curX = btnBox.x + (dropBox.x - btnBox.x) * (i / steps);
            const curY = btnBox.y + (dropBox.y - btnBox.y) * (i / steps);
            await page.mouse.move(curX, curY);
            await sleep(20);
        }
        await sleep(200);

        const t6DropdownOpen = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));
        record(6, 'Move mouse slowly into dropdown keeps it open', t6DropdownOpen, `active=${t6DropdownOpen}`);

        // TEST 7: Move around inside dropdown
        await page.mouse.move(dropBox.x + 20, dropBox.y + 40);
        await sleep(100);
        await page.mouse.move(dropBox.x - 20, dropBox.y + 70);
        await sleep(100);

        const t7DropdownOpen = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));
        record(7, 'Move around inside dropdown keeps it open', t7DropdownOpen, `active=${t7DropdownOpen}`);

        // TEST 8: Click "My Profile"
        await page.$eval('button[onclick*="handleProfileDropdownAction(\'profile\')"]', btn => btn.click());
        await sleep(400);

        const t8ModalOpen = await page.$eval('#profile-modal', el => getComputedStyle(el).display !== 'none');
        const t8DropdownOpen = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));
        const t8ModalName = await page.$eval('#profile-display-name', el => el.textContent.trim());
        const t8Passed = t8ModalOpen && !t8DropdownOpen && t8ModalName === uniqueName;
        record(8, 'Click "My Profile" opens profile modal and closes dropdown', t8Passed, `modalOpen=${t8ModalOpen}, dropdownOpen=${t8DropdownOpen}, user=${t8ModalName}`);

        // Close modal
        await page.click('#profile-modal-close');
        await sleep(200);

        // TEST 9: Open Profile dropdown again and move mouse away
        await page.hover('#profile-btn');
        await sleep(200);
        const t9OpenBefore = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));
        
        // Move mouse far away to (10, 10)
        await page.mouse.move(10, 10);
        // Wait for debounce timer (200ms) plus a buffer
        await sleep(350);

        const t9ClosedAfter = await page.$eval('#profile-dropdown', el => !el.classList.contains('active'));
        const t9Passed = t9OpenBefore && t9ClosedAfter;
        record(9, 'Hover open dropdown and move mouse away closes cleanly after timer', t9Passed, `openBefore=${t9OpenBefore}, closedAfter=${t9ClosedAfter}`);

        // TEST 10: Click outside dropdown
        await page.click('#profile-btn');
        await sleep(200);
        const t10OpenBefore = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));

        // Click on the body or header logo
        await page.click('#logo-link');
        await sleep(200);

        const t10ClosedAfter = await page.$eval('#profile-dropdown', el => !el.classList.contains('active'));
        record(10, 'Click outside dropdown closes it immediately', t10OpenBefore && t10ClosedAfter, `openBefore=${t10OpenBefore}, closedAfter=${t10ClosedAfter}`);

        // TEST 11: Press Escape
        await page.click('#profile-btn');
        await sleep(200);
        const t11OpenBefore = await page.$eval('#profile-dropdown', el => el.classList.contains('active'));

        await page.keyboard.press('Escape');
        await sleep(200);

        const t11ClosedAfter = await page.$eval('#profile-dropdown', el => !el.classList.contains('active'));
        record(11, 'Press Escape closes dropdown immediately', t11OpenBefore && t11ClosedAfter, `openBefore=${t11OpenBefore}, closedAfter=${t11ClosedAfter}`);

        // TEST 12: Logout
        await page.click('#profile-btn');
        await page.$eval('button[onclick*="handleProfileDropdownAction(\'logout\')"]', btn => btn.click());
        await sleep(500);

        const t12AuthVisible = await page.$eval('#auth-screen', el => getComputedStyle(el).display !== 'none');
        const t12HomeHidden = await page.$eval('#shopora-home', el => getComputedStyle(el).display === 'none');
        const t12TokenCleared = await page.evaluate(() => !localStorage.getItem('shopora_token'));
        const t12Passed = t12AuthVisible && t12HomeHidden && t12TokenCleared;
        record(12, 'Logout returns to LOGIN PAGE and clears JWT', t12Passed, `authVisible=${t12AuthVisible}, homeHidden=${t12HomeHidden}, tokenCleared=${t12TokenCleared}`);

        // TEST 13: Open localhost again after logout
        await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
        await sleep(500);

        const t13AuthDisplay = await page.$eval('#auth-screen', el => getComputedStyle(el).display);
        const t13HomeDisplay = await page.$eval('#shopora-home', el => getComputedStyle(el).display);
        const t13ProfileDisplay = await page.$eval('#profile-modal', el => getComputedStyle(el).display);
        const t13Passed = t13AuthDisplay !== 'none' && t13HomeDisplay === 'none' && t13ProfileDisplay === 'none';
        record(13, 'Open localhost:5000 after logout shows LOGIN PAGE', t13Passed, `auth=${t13AuthDisplay}, home=${t13HomeDisplay}, profile=${t13ProfileDisplay}`);

        // TEST 14: Use an invalid/expired JWT
        await page.evaluate(() => {
            localStorage.setItem('shopora_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload_expired.fake_signature');
        });
        await page.reload({ waitUntil: 'networkidle0' });
        await sleep(800);

        const t14AuthDisplay = await page.$eval('#auth-screen', el => getComputedStyle(el).display);
        const t14HomeDisplay = await page.$eval('#shopora-home', el => getComputedStyle(el).display);
        const t14TokenRemoved = await page.evaluate(() => !localStorage.getItem('shopora_token'));
        const t14Passed = t14AuthDisplay !== 'none' && t14HomeDisplay === 'none' && t14TokenRemoved;
        record(14, 'Invalid/expired JWT rejected, cleared, and shows LOGIN PAGE', t14Passed, `auth=${t14AuthDisplay}, home=${t14HomeDisplay}, tokenRemoved=${t14TokenRemoved}`);

    } catch (err) {
        console.error('Fatal error during scenario execution:', err);
    } finally {
        await browser.close();
    }

    console.log('\n========================================================');
    const totalPassed = results.filter(r => r.passed).length;
    console.log(`SUMMARY: ${totalPassed} / ${results.length} SCENARIOS PASSED`);
    console.log('========================================================');
}

runAll14Tests();
