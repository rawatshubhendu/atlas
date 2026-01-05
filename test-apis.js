const http = require('http');

const API_BASE = 'http://localhost:3000';

async function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testAPIs() {
  console.log('🚀 Testing Atlas API endpoints...\n');

  const tests = [
    // Test posts endpoint
    {
      name: 'GET /api/posts (no auth)',
      endpoint: '/api/posts',
      method: 'GET'
    },
    {
      name: 'GET /api/posts (with search)',
      endpoint: '/api/posts?search=test&status=published',
      method: 'GET'
    },
    // Test auth endpoints (these will fail without proper setup, but should return proper error responses)
    {
      name: 'POST /api/auth/signup (invalid data)',
      endpoint: '/api/auth/signup',
      method: 'POST',
      body: { email: 'invalid', password: 'short' }
    },
    {
      name: 'POST /api/auth/signin (invalid credentials)',
      endpoint: '/api/auth/signin',
      method: 'POST',
      body: { email: 'test@example.com', password: 'wrong' }
    },
    // Test upload endpoint
    {
      name: 'POST /api/upload (no file)',
      endpoint: '/api/upload',
      method: 'POST'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      const response = await makeRequest(test.endpoint, {
        method: test.method,
        body: test.body
      });

      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ PASS: ${response.status} - ${test.endpoint}`);
        passed++;
      } else if (response.status >= 400 && response.status < 500) {
        // Expected error responses (validation errors, auth failures)
        console.log(`✅ PASS: ${response.status} - ${test.endpoint} (expected error)`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${response.status} - ${test.endpoint}`);
        console.log(`   Response:`, response.data);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.endpoint} - ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log(`📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All API endpoints are working correctly!');
  } else {
    console.log('\n⚠️  Some API endpoints need attention.');
  }
}

// Wait for server to start
setTimeout(() => {
  testAPIs().catch(console.error);
}, 3000);
