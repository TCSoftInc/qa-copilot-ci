const axios = require('axios');
const { log, getTCConfig } = require('./utils'); // Removed getDate as it's unused here
//testcollab-sdk - Removed unused APIs
const { TestPlansApi } = require('testcollab-sdk'); 

// Helper function to map status codes to names
const getStatusName = (status) => {
  switch (status) {
    case 0: return 'Draft';
    case 1: return 'Ready to execute';
    case 2: return 'Finished';
    case 3: return 'Finished (with failures)';
    default: return `Unknown (${status})`;
  }
};

// Helper function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Streams test plan status and results from the Test Collab API and outputs them to console.
 * 
 * @param {Object} config - Configuration object containing apiKey and apiUrl.
 * @param {number} testPlanId - The ID of the test plan to monitor.
 * @returns {Promise<Object>} - Result object with status ('success' or 'error') and final test plan details or error message.
 */
async function streamLogs(config, testPlanId) {
  const { apiKey, apiUrl } = config; // Removed unused config destructuring
  log(`Starting status stream for Test Plan ID: ${testPlanId}`, 'info');

  let tcConfig;
  let testPlansApi;
  try {
    tcConfig = getTCConfig(apiKey, apiUrl);
    testPlansApi = new TestPlansApi(tcConfig);
  } catch (error) {
    log(`Error initializing Test Collab API: ${error.message}`, 'error');
    return { status: 'error', message: 'API initialization failed' };
  }

  let finished = false;
  let retries = 0;
  const MAX_RETRIES = 5;
  const POLLING_INTERVAL = 5000; // Increased polling interval to 5 seconds
  const RETRY_INTERVAL = 5000; // 5 seconds

  // Poll for status until finished
  while (!finished) {
    try {
      const testPlan = await testPlansApi.getTestPlan({ id: testPlanId }); // Pass ID in an object

      let status = testPlan.status; // Ensure status is a number
      // conver to number if it's a string
      if (typeof status === 'string') {
         status = parseInt(status, 10);
          if (isNaN(status)) {
            throw new Error(`Invalid status value: ${status}`);
          }
      }

      const statusName = getStatusName(status);
      const results = testPlan.results?.overall || {}; // Use optional chaining and default to empty object

      // Format and log the status and results
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Test Plan Status: ${statusName}`);
      console.log(`[${timestamp}] Results: Passed: ${results.passed ?? 0}, Failed: ${results.failed ?? 0}, Unexecuted: ${results.unexecuted ?? 0}, Skipped: ${results.skipped ?? 0}, Blocked: ${results.blocked ?? 0}`);

      // Check if finished
      if (status === 2 || status === 3) {
        finished = true;
        log(`Test plan ${testPlanId} finished with status: ${statusName}`, 'info');
        // Return final status
        return {
          status: 'success',
          message: `Test plan ${testPlanId} finished with status: ${statusName}`,
          testPlan: testPlan // Include the final test plan object
        };
      } else {
        log(`Test plan ${testPlanId} is still in progress (Status: ${statusName}). Checking again in ${POLLING_INTERVAL / 1000}s...`, 'info');
      }

      // Reset retries on successful poll
      retries = 0;

    } catch (error) {
      retries++;
      log(`Error fetching test plan status (Attempt ${retries}/${MAX_RETRIES}): ${error.message}`, 'error');

      if (retries >= MAX_RETRIES) {
        log(`Max retries reached. Aborting status stream for Test Plan ID: ${testPlanId}.`, 'error');
        return {
          status: 'error',
          message: `Failed to fetch test plan status after ${MAX_RETRIES} attempts: ${error.message}`
        };
      }
      // Wait before retrying
      await delay(RETRY_INTERVAL);
      continue; // Skip the main delay and retry immediately
    }

    // Wait before the next poll if not finished
    if (!finished) {
      await delay(POLLING_INTERVAL);
    }
  }

  // This part should ideally not be reached if the loop exits correctly upon finish
  log('Status streaming loop exited unexpectedly.', 'warn');
  return {
    status: 'error', // Indicate an unexpected exit
    message: 'Log streaming loop finished unexpectedly.'
  };
}

module.exports = {
  streamLogs // Only export streamLogs
  // Removed fetchLogs and getLogsUrl
};
