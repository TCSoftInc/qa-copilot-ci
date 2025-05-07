const { log, getTCConfig, humanizeDuration } = require('./utils'); // Added humanizeDuration
//testcollab-sdk
const { TestPlansApi, TestPlanTestCasesApi } = require('testcollab-sdk'); // Added TestPlanTestCasesApi

// Helper function to map test plan status codes to names
const getPlanStatusName = (status) => { // Renamed
  switch (status) {
    case 0: return 'Draft';
    case 1: return 'Ready to execute';
    case 2: return 'Finished';
    case 3: return 'Finished (with failures)';
    default: return `Unknown Plan Status (${status})`;
  }
};

// Helper function to map test case status codes to names (adjust if TC statuses differ)
const getCaseStatusName = (status) => {
  switch (status) {
    case 1: return 'Passed';
    case 2: return 'Failed';
    case 3: return 'Skipped';
    case 4: return 'Blocked';
    case 5: return 'Unexecuted'; // Assuming 5 is unexecuted based on common patterns
    default: return `Unknown Case Status (${status})`;
  }
};

// Helper function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch all test cases for a plan (handles pagination)
async function getAllTestCases(testPlanCasesApi, projectId, testPlanId) { // Added projectId parameter
  let allCases = [];
  let currentPage = 1;
  const perPage = 100; // Max items per page for this API endpoint
  let hasMore = true;

  log(`Fetching all test cases for Test Plan ID: ${testPlanId}...`, 'info');

  while(hasMore) {
    try {
      // Note: SDK might have different method names or parameters. Adjust if needed.
      // Assuming getTestPlanTestCases supports pagination via 'page' and 'perPage'.
      const response = await testPlanCasesApi.getTestPlanTestCases({
        project: projectId, // Added project ID
        testplan: testPlanId,
        page: currentPage,
        perPage: perPage,
      });

      // The API returns a direct array of test cases.
      if (response && Array.isArray(response)) { 
        allCases = allCases.concat(response);
        
        // If the number of items returned is less than perPage, assume it's the last page.
        // Note: This is an assumption. If the API *always* returns all cases regardless of perPage, 
        // this check might be unnecessary, and hasMore should just be set to false.
        if (response.length < perPage) {
           hasMore = false;
        } else {
           // If we got a full page, increment to check for the next one.
           currentPage++; 
        }
      } else {
        // If the response is not an array or is empty on the first page, stop.
        log(`Warning: No test cases found or unexpected response format on page ${currentPage}.`, 'warn');
        hasMore = false; 
      }
    } catch (error) {
       log(`Error fetching page ${currentPage} of test cases for plan ${testPlanId}: ${error.message}`, 'error');
       // Decide if we should continue or re-throw. Re-throwing might be safer.
       throw new Error(`Failed during test case pagination: ${error.message}`);
    }
  }
  log(`Fetched ${allCases.length} total test cases for plan ${testPlanId}.`, 'info');
  return allCases;
}

/**
 * Streams test plan status and results from the Test Collab API and outputs them to console.
 * 
 * @param {Object} config - Configuration object containing apiKey, apiUrl, and projectId.
 * @param {number} testPlanId - The ID of the test plan to monitor.
 * @returns {Promise<Object>} - Result object with status ('success' or 'error') and final test plan details or error message.
 */
async function streamLogs(config, testPlanId) {
  // Record start time for duration calculation
  const startTime = Date.now();
  
  // Destructure projectId from config as well
  const { apiKey, apiUrl, projectId } = config; 
  log(`Starting status stream for Test Plan ID: ${testPlanId} in Project ID: ${projectId}`, 'info'); // Updated log

  log(`Starting status stream for Test Plan ID: ${testPlanId}`, 'info');
  
  // Determine frontendURL for test plan link
  let frontendURL;
  if (apiUrl.includes('testcollab-dev.io')) {
    frontendURL = 'https://testcollab-dev.io';
  } else if (apiUrl.includes('testcollab.io')) {
    frontendURL = 'https://testcollab.io';
  } else {
    // Fallback if apiUrl format is unexpected
    let uiBaseUrl = apiUrl;
    const apiSuffixMatch = uiBaseUrl.match(/\/api(\/v\d+)?$/);
    if (apiSuffixMatch) {
      uiBaseUrl = uiBaseUrl.substring(0, apiSuffixMatch.index);
    }
    frontendURL = uiBaseUrl;
    log(`Could not determine frontendURL directly from apiUrl: ${apiUrl}. Using derived base: ${frontendURL}`, 'warn');
  }

  const projectIdNum = parseInt(projectId, 10);
  const testPlanLink = `${frontendURL}/project/${projectIdNum}/test_plans/${testPlanId}/view`;

  let tcConfig;
  let testPlansApi;
  let testPlanCasesApi; // Added
  try {
    tcConfig = getTCConfig(apiKey, apiUrl);
    testPlansApi = new TestPlansApi(tcConfig);
    testPlanCasesApi = new TestPlanTestCasesApi(tcConfig); // Instantiate
  } catch (error) {
    log(`Error initializing Test Collab API: ${error.message}`, 'error');
    // Exit immediately if API init fails, as we can't proceed.
    console.error(`❌ Fatal Error: Could not initialize Test Collab API. ${error.message}`);
    process.exit(1); 
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

      // Use renamed function and ensure variables are declared only once within this scope
      const planStatusName = getPlanStatusName(status); 
      const overallResults = testPlan.results?.overall || {}; 

      // Format and log the status and results
      const currentTimestamp = new Date().toISOString();
      console.log(`[${currentTimestamp}] Test Plan Status: ${planStatusName}`);
      console.log(`[${currentTimestamp}] Results: Passed: ${overallResults.passed ?? 0}, Failed: ${overallResults.failed ?? 0}, Unexecuted: ${overallResults.unexecuted ?? 0}, Skipped: ${overallResults.skipped ?? 0}, Blocked: ${overallResults.blocked ?? 0}`);

      // Check if finished using the correct status variable and name
      if (status === 2 || status === 3) {
        finished = true;
        log(`Test plan ${testPlanId} has finished with status: ${planStatusName}. Fetching final case details...`, 'info');
        
        // Calculate elapsed time
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const elapsedTimeString = humanizeDuration(durationMs);

        try {
          // Fetch all test cases for the plan, passing projectId
          const allCases = await getAllTestCases(testPlanCasesApi, projectId, testPlanId);

          const failedCases = [];
          const skippedCases = [];

          allCases.forEach(tc => {
            // From the debug output, the status seems to be directly on the object: tc.status
            // It's a string '3' in the example for skipped. Let's compare with strings.
            const caseStatus = tc.status; 
            const caseTitle = tc.testCase?.title || `Case ID ${tc.testCase?.id || tc.id}`; // Use tc.testCase based on debug output

            if (caseStatus === '2') { // Status code for Failed (as string)
              failedCases.push(caseTitle);
            } else if (caseStatus === '3') { // Status code for Skipped (as string)
              skippedCases.push(caseTitle);
            }
          });

          // --- Final Outcome ---
          if (failedCases.length > 0) {
            console.error(`\n❌ Test Plan Failed!`);
            console.error(`Time Elapsed: ${elapsedTimeString}`);
            console.error('------------------------------------');
            console.error('Failed Test Cases:');
            failedCases.forEach(title => console.error(`  - ${title}`));
            console.error('------------------------------------');

            console.log(`😢 View Test Plan: ${testPlanLink}`);
            process.exit(1); // Exit with error code
          } else if (skippedCases.length > 0) {
            console.warn(`\n⚠️ Test Plan Completed with Skipped Tests!`);
            console.warn(`Time Elapsed: ${elapsedTimeString}`);
            console.warn('------------------------------------');
            console.warn('Skipped Test Cases:');
            skippedCases.forEach(title => console.warn(`  - ${title}`));
            console.warn('------------------------------------');
            console.log(`🌟 View Test Plan: ${testPlanLink}`);
            // Return success, but indicate skips occurred using correct status name
             return {
               status: 'success_with_skips',
               message: `Test plan ${testPlanId} finished with status: ${planStatusName}, but contained skipped tests.`,
               testPlan: testPlan,
               skippedCases: skippedCases
             };
          } else {
            console.log(`\n✅ Test Plan Completed Successfully!`);
            console.log(`Time Elapsed: ${elapsedTimeString}`);
            console.log('------------------------------------');
            console.log(`🌟 View Test Plan: ${testPlanLink}`);
             // Return success using correct status name
             return {
               status: 'success',
               message: `Test plan ${testPlanId} finished successfully with status: ${planStatusName}`,
               testPlan: testPlan
             };
          }

        } catch (fetchError) {
          log(`Error fetching/processing final test case details: ${fetchError.message}`, 'error');
          // Decide how to handle this - exit or return error? Exiting might be safer in CI.
          console.error(`\n❌ Error retrieving final test case details for Test Plan ${testPlanId}.`);
          console.error(`Error: ${fetchError.message}`);
          process.exit(1); 
        }

      } else {
        // Plan still running, log progress and continue polling using correct status name
        log(`Test plan ${testPlanId} is still in progress (Status: ${planStatusName}). Checking again in ${POLLING_INTERVAL / 1000}s...`, 'info');
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
