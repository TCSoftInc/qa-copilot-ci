const axios = require('axios');
const { createMockResponse } = require('./utils');

/**
 * Makes an API request to the Test Collab QA Copilot service
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.apiUrl - The API endpoint URL
 * @param {string} config.buildId - The build ID from CI pipeline
 * @param {string} config.appUrl - The application URL to test
 * @param {string} config.projectId - The Test Collab project ID
 * @param {string} config.apiKey - The API key for authentication
 * @param {boolean} config.testMode - Whether to run in test mode
 * @returns {Promise<Object>} - The API response including queue_id
 */
async function makeApiRequest(config) {
  const { apiUrl, buildId, appUrl, projectId, apiKey } = config;

  try {
    // Validate required parameters
    if (!buildId || !appUrl || !projectId || !apiKey) {
      throw new Error('Missing required parameters');
    }
    
    // If test mode is enabled, return a mock response with queue_id
    if (config.testMode) {
      console.log('Running in test mode - no actual API call will be made');
      const mockResponse = createMockResponse(config);
      // Add queue_id to mock response
      mockResponse.queue_id = `mock-queue-${Date.now()}`;
      return mockResponse;
    }

    // Prepare request payload
    const payload = {
      build_id: buildId,
      app_url: appUrl,
      tc_project_id: projectId
    };

    // Prepare request headers with authorization
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Make the API request
    const response = await axios.post(apiUrl, payload, { headers });
    
    // Validate that queue_id exists in the response
    if (!response.data.queue_id) {
      throw new Error('API response missing required queue_id');
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data || {};
      
      throw new Error(`API Error (${status}): ${data.message || 'Unknown error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from the server');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
}

module.exports = {
  makeApiRequest
};
