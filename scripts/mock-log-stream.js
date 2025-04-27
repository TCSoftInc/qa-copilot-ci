/**
 * Mock Log Stream Server
 * 
 * This script creates a simple HTTP server that mocks the Test Collab QA Copilot
 * service API, providing endpoints for triggering tests and streaming logs.
 * 
 * Usage:
 *   node scripts/mock-log-stream.js
 * 
 * Then in another terminal:
 *   node bin/qac.js --build test123 --app_url https://example.com --tc_project_id test-project --api_key any-key --api_url http://localhost:3000/qa-copilot/trigger
 */

const http = require('http');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const TEST_DURATION = 20000; // 20 seconds for the whole test to complete
const LOG_INTERVAL = 1000; // Generate a new log every second

// Store active test runs
const activeTests = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  console.log(`${method} ${path}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Route handling
  try {
    if (path === '/qa-copilot/trigger' && method === 'POST') {
      handleTriggerRequest(req, res);
    } else if (path.startsWith('/qa-copilot/logs/') && method === 'GET') {
      handleLogsRequest(req, res, path);
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

/**
 * Handle trigger API request
 */
function handleTriggerRequest(req, res) {
  let data = '';
  
  req.on('data', chunk => {
    data += chunk;
  });
  
  req.on('end', () => {
    try {
      const body = data ? JSON.parse(data) : {};
      const buildId = body.build_id || 'unknown';
      const appUrl = body.app_url || 'unknown';
      
      console.log(`Triggering test for build ${buildId} at ${appUrl}`);
      
      // Generate unique queue ID
      const queueId = `queue-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Initialize test run
      initializeTestRun(queueId, buildId, appUrl);
      
      // Send response
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'success',
        message: 'Test run initiated successfully',
        queue_id: queueId
      }));
    } catch (error) {
      console.error('Error parsing request body:', error);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  });
}

/**
 * Handle logs API request
 */
function handleLogsRequest(req, res, path) {
  // Extract queue ID from path
  const queueId = path.split('/').pop();
  const parsedUrl = url.parse(req.url, true);
  const sinceId = parseInt(parsedUrl.query.since || '0', 10);
  
  if (!activeTests.has(queueId)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Test run not found' }));
    return;
  }
  
  const testRun = activeTests.get(queueId);
  
  // Get logs since the given ID
  const newLogs = testRun.logs.filter(log => log.id > sinceId);
  
  // Send response
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    finished: testRun.finished,
    logs: newLogs,
    details: testRun.finished ? {
      passed: testRun.passed,
      total: testRun.total,
      failed: testRun.failed,
      duration_ms: testRun.durationMs
    } : undefined
  }));
}

/**
 * Initialize a new test run and set up log generation
 */
function initializeTestRun(queueId, buildId, appUrl) {
  const startTime = Date.now();
  const totalTests = Math.floor(Math.random() * 20) + 10; // 10-30 tests
  let currentLogId = 0;
  
  const testRun = {
    queueId,
    buildId,
    appUrl,
    logs: [],
    logInterval: null,
    finished: false,
    passed: 0,
    failed: 0,
    total: totalTests,
    durationMs: 0,
    startTime
  };
  
  // Add initial log
  addLog(testRun, 'INFO', `Starting test run for build ${buildId} at ${appUrl}`);
  addLog(testRun, 'INFO', `Planning to execute ${totalTests} tests`);
  
  // Set up interval to generate logs
  let testIndex = 0;
  testRun.logInterval = setInterval(() => {
    // If all tests are done, finish the test run
    if (testIndex >= totalTests) {
      finishTestRun(testRun);
      return;
    }
    
    testIndex++;
    const testPassed = Math.random() > 0.2; // 80% chance of success
    
    // Add test result logs
    if (testPassed) {
      testRun.passed++;
      addLog(testRun, 'INFO', `Test #${testIndex} passed: Check element visibility`);
    } else {
      testRun.failed++;
      addLog(testRun, 'ERROR', `Test #${testIndex} failed: Element not found`);
      addLog(testRun, 'DEBUG', `Selector '.test-element-${testIndex}' returned no results`);
    }
    
    // Sometimes add random logs
    if (Math.random() > 0.7) {
      addLog(testRun, 'DEBUG', `Browser version: Chrome 98.0.${Math.floor(Math.random() * 100)}`);
    }
    
    // Add progress log every 5 tests
    if (testIndex % 5 === 0) {
      addLog(testRun, 'INFO', `Progress: ${testIndex}/${totalTests} tests completed`);
    }
  }, LOG_INTERVAL);
  
  // Store in active tests
  activeTests.set(queueId, testRun);
  
  // Helper function to add a log
  function addLog(testRun, level, message) {
    currentLogId++;
    testRun.logs.push({
      id: currentLogId,
      timestamp: new Date().toISOString(),
      level,
      message
    });
  }
  
  // Set a timeout to finish the test after TEST_DURATION
  setTimeout(() => {
    finishTestRun(testRun);
  }, TEST_DURATION);
  
  console.log(`Test run ${queueId} initialized with ${totalTests} tests`);
}

/**
 * Finish a test run
 */
function finishTestRun(testRun) {
  if (testRun.finished) return;
  
  clearInterval(testRun.logInterval);
  testRun.finished = true;
  testRun.durationMs = Date.now() - testRun.startTime;
  
  // Add final logs
  testRun.logs.push({
    id: testRun.logs[testRun.logs.length - 1].id + 1,
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `Test run completed in ${testRun.durationMs}ms`
  });
  
  testRun.logs.push({
    id: testRun.logs[testRun.logs.length - 1].id + 1,
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `Results: ${testRun.passed} passed, ${testRun.failed} failed, ${testRun.total} total`
  });
  
  const status = testRun.failed === 0 ? 'SUCCESS' : 'FAILURE';
  testRun.logs.push({
    id: testRun.logs[testRun.logs.length - 1].id + 1,
    timestamp: new Date().toISOString(),
    level: testRun.failed === 0 ? 'INFO' : 'ERROR',
    message: `Final status: ${status}`
  });
  
  console.log(`Test run ${testRun.queueId} finished with status ${status}`);
  
  // Remove test run after 5 minutes to clean up memory
  setTimeout(() => {
    activeTests.delete(testRun.queueId);
    console.log(`Test run ${testRun.queueId} cleaned up from memory`);
  }, 5 * 60 * 1000);
}

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Mock Log Stream Server running at http://${HOST}:${PORT}/`);
  console.log(`Trigger endpoint: http://${HOST}:${PORT}/qa-copilot/trigger`);
  console.log(`Logs endpoint: http://${HOST}:${PORT}/qa-copilot/logs/{queue_id}`);
  console.log(`\nTo test, run in another terminal:`);
  console.log(`node bin/qac.js --build test123 --app_url https://example.com --tc_project_id test-project --api_key any-key --api_url http://${HOST}:${PORT}/qa-copilot/trigger`);
});
