/**
 * DIAGNOSTIC SCRIPT - Test Dashboard Endpoints Individually
 * 
 * This script tests each Dashboard API endpoint independently
 * to identify which one is returning HTTP 400.
 * 
 * DO NOT COMMIT THIS FILE - For diagnostic purposes only
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// You'll need to replace this with an actual valid JWT token
// Get it from browser DevTools → Application → Local Storage → access_token
const TOKEN = 'REPLACE_WITH_ACTUAL_JWT_TOKEN';

const testEndpoints = [
  {
    name: 'Dashboard Summary',
    method: 'GET',
    url: `${BASE_URL}/dashboard`,
    params: {},
  },
  {
    name: 'Users (Total Count)',
    method: 'GET',
    url: `${BASE_URL}/users`,
    params: { page: 1, limit: 1 },
  },
  {
    name: 'Room Requests (Pending)',
    method: 'GET',
    url: `${BASE_URL}/room-requests`,
    params: { status: 'PENDING', page: 1, limit: 3 },
  },
  {
    name: 'Announcements',
    method: 'GET',
    url: `${BASE_URL}/announcements`,
    params: { page: 1, limit: 3 },
  },
  {
    name: 'Laboratory Statistics',
    method: 'GET',
    url: `${BASE_URL}/dashboard/laboratories`,
    params: {},
  },
];

async function testEndpoint(test) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`REQUEST: ${test.method} ${test.url}`);
    console.log(`PARAMS:`, JSON.stringify(test.params, null, 2));

    const response = await axios({
      method: test.method,
      url: test.url,
      params: test.params,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`STATUS: ${response.status} ${response.statusText}`);
    console.log(`RESPONSE:`);
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`RESULT: ✅ PASS`);
    
    return { ...test, status: response.status, result: 'PASS', response: response.data };
  } catch (error) {
    console.log(`STATUS: ${error.response?.status || 'ERROR'}`);
    console.log(`RESPONSE:`);
    console.log(JSON.stringify(error.response?.data || error.message, null, 2));
    console.log(`RESULT: ❌ FAIL`);
    
    return {
      ...test,
      status: error.response?.status || 'ERROR',
      result: 'FAIL',
      response: error.response?.data || { error: error.message },
    };
  }
}

async function runDiagnostics() {
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`DASHBOARD ENDPOINT DIAGNOSTICS`);
  console.log(`${'#'.repeat(60)}`);
  console.log(`\nTesting ${testEndpoints.length} endpoints individually...\n`);

  const results = [];

  for (const test of testEndpoints) {
    const result = await testEndpoint(test);
    results.push(result);
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${'#'.repeat(60)}\n`);

  results.forEach(result => {
    const statusIcon = result.result === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.name}`);
    console.log(`   ${result.method} ${result.url}`);
    console.log(`   Status: ${result.status}`);
    if (result.result === 'FAIL') {
      console.log(`   Error:`, result.response.message || result.response.error || 'Unknown');
    }
    console.log('');
  });

  const failedTests = results.filter(r => r.result === 'FAIL');
  
  if (failedTests.length > 0) {
    console.log(`\n⚠️  ${failedTests.length} endpoint(s) FAILED`);
    console.log(`\nFailing endpoints:`);
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.url}`);
    });
  } else {
    console.log(`\n✅ All endpoints PASSED`);
  }
}

// Check if TOKEN is set
if (TOKEN === 'REPLACE_WITH_ACTUAL_JWT_TOKEN') {
  console.error('\n❌ ERROR: Please set a valid JWT token in the TOKEN variable');
  console.error('\nTo get a token:');
  console.error('1. Open browser and login to the application');
  console.error('2. Open DevTools (F12)');
  console.error('3. Go to Application tab → Local Storage');
  console.error('4. Find "access_token" key');
  console.error('5. Copy the value and replace TOKEN variable in this script');
  console.error('\nThen run: node test-dashboard-endpoints.js\n');
  process.exit(1);
}

runDiagnostics().catch(console.error);
