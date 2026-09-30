const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing API Authentication Scenarios ---');

    // Scenario 1: /api/auth/me without token -> should fail 401
    const unauthMe = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/me',
        method: 'GET'
    });
    console.log('Scenario 1 (No token /me):', unauthMe.status === 401 ? 'PASS (401)' : `FAIL (${unauthMe.status})`);

    // Scenario 2: Register a new test user
    const testEmail = `ux_test_${Date.now()}@example.com`;
    const regRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        name: 'UX Tester',
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123'
    });
    console.log('Scenario 2 (Register user in MySQL):', regRes.status === 201 ? 'PASS (201 Created)' : `FAIL (${regRes.status})`);

    // Scenario 3: Login with registered user
    const loginRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        email: testEmail,
        password: 'password123'
    });
    console.log('Scenario 3 (Login):', loginRes.status === 200 && loginRes.body.token ? 'PASS (Token received)' : `FAIL (${loginRes.status})`);
    const validToken = loginRes.body.token;

    // Scenario 4: /api/auth/me with valid token
    const authMe = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${validToken}` }
    });
    console.log('Scenario 4 (Valid token /me):', authMe.status === 200 && authMe.body.user.email === testEmail ? 'PASS (User profile returned)' : `FAIL (${authMe.status})`);

    // Scenario 5: /api/auth/me with invalid / forged token
    const badMe = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/me',
        method: 'GET',
        headers: { 'Authorization': 'Bearer bad_invalid_token_12345' }
    });
    console.log('Scenario 5 (Invalid token /me):', badMe.status === 401 ? 'PASS (401 Rejected)' : `FAIL (${badMe.status})`);

    console.log('--- API Tests Complete ---');
}

runTests().catch(console.error);
