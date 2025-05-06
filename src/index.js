const { loadConfig } = require('./config');
const { makeApiRequest } = require('./api');
const { streamLogs } = require('./logs');
const { log, isValidUrl } = require('./utils');

/**
 * Main function to trigger the QA Copilot service
 * 
 * @param {Object} options - Command-line options
 * @returns {Promise<Object>} - The API response
 */
async function triggerQaCopilot(options) {
  try {
    // Load configuration
    const config = loadConfig(options);
    
    // Validate required configuration
    validateConfig(config);
    
    // Log the action
    log(`Triggering QA Copilot for build ${config.buildId} at ${config.appUrl}`, 'info');
    
    
    // Make the API request to trigger testing
    const response = await makeApiRequest(config);
    
    // Extract queue ID from the response
    const testPlanId = response.testPlanId;
    if (!testPlanId) {
      throw new Error('No test plan ID received from API');
    }
    
    log(`Test queued with  ID: ${testPlanId}`, 'info');
    
    // If test mode is enabled, skip log streaming
    if (config.testMode) {
      return {
        ...response,
        //queueId,
        message: 'Test mode enabled - skipping log streaming'
      };
    }
    
    // Stream logs until completion
    log('Streaming logs...', 'info');
    const streamResult = await streamLogs(config, testPlanId);
    
    return {
      ...response,
      ...streamResult,
      //queueId
    };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Validates the configuration object
 * 
 * @param {Object} config - Configuration object
 * @throws {Error} - If validation fails
 */
function validateConfig(config) {
  const requiredFields = ['buildId', 'appUrl', 'projectId', 'apiKey', 'apiUrl'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }
  
  // Validate URL format
  if (!isValidUrl(config.apiUrl) || !isValidUrl(config.appUrl)) {
    throw new Error('Invalid URL format in configuration');
  }
}

module.exports = {
  triggerQaCopilot
};
