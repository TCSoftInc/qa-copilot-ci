const axios = require('axios');
const { log } = require('./utils');

/**
 * Constructs the logs API URL from the trigger API URL
 * 
 * @param {string} apiUrl - The trigger API URL
 * @param {string} queueId - The queue ID to subscribe to
 * @returns {string} - The logs API URL
 */
function getLogsUrl(apiUrl, queueId) {
  // Replace '/trigger' with '/logs/' or append '/logs/' if '/trigger' doesn't exist
  const baseUrl = apiUrl.includes('/trigger') 
    ? apiUrl.replace('/trigger', '/logs') 
    : apiUrl.endsWith('/') ? `${apiUrl}logs` : `${apiUrl}/logs`;
  
  return `${baseUrl}/${queueId}`;
}

/**
 * Fetch new logs from the remote API
 * 
 * @param {Object} config - Configuration object
 * @param {string} queueId - The queue ID returned from the initial API call
 * @param {number} lastLogId - The ID of the last log received
 * @returns {Promise<Object>} - The logs response
 */
async function fetchLogs(config, queueId, lastLogId = 0) {
  const { apiUrl, apiKey } = config;
  const logsUrl = getLogsUrl(apiUrl, queueId);
  
  // Set up authorization headers
  const headers = {
    'Authorization': `Bearer ${apiKey}`
  };
  
  // Add since parameter to only get new logs
  const params = {
    since: lastLogId
  };
  
  try {
    const response = await axios.get(logsUrl, { headers, params });
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || {};
      
      throw new Error(`Logs API Error (${status}): ${data.message || 'Unknown error'}`);
    } else if (error.request) {
      throw new Error('No response received from the logs server');
    } else {
      throw error;
    }
  }
}

/**
 * Streams logs from the remote API and outputs them to console
 * 
 * @param {Object} config - Configuration object
 * @param {string} queueId - The queue ID returned from the initial API call
 * @returns {Promise<Object>} - Result object with status and details
 */
async function streamLogs(config, queueId) {
  let finished = false;
  let lastLogId = 0;
  let retries = 0;
  const MAX_RETRIES = 5;
  const POLLING_INTERVAL = 2000; // 2 seconds
  const RETRY_INTERVAL = 5000; // 5 seconds
  
  log(`Started streaming logs for queue ID: ${queueId}`, 'info');
  
  // Poll for logs until finished flag is received
  while (!finished) {
    try {
      // Get logs since the last received log
      const logData = await fetchLogs(config, queueId, lastLogId);
      
      // Reset retries on successful fetch
      retries = 0;
      
      // Display new logs
      if (logData.logs && logData.logs.length > 0) {
        logData.logs.forEach(logEntry => {
          const timestamp = new Date(logEntry.timestamp).toISOString();
          const level = logEntry.level || 'INFO';
          const message = logEntry.message;
          
          console.log(`[${timestamp}] [${level}] ${message}`);
          
          // Update last log ID
          if (logEntry.id > lastLogId) {
            lastLogId = logEntry.id;
          }
        });
      }
      
      // Check if testing is finished
      if (logData.finished === true) {
        finished = true;
        log('Testing completed', 'info');
        
        return {
          status: 'success',
          message: 'Testing completed successfully',
          details: logData.details || {}
        };
      } else {
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      }
    } catch (error) {
      log(`Error streaming logs: ${error.message}`, 'error');
      
      // Increment retry counter
      retries++;
      
      // If max retries exceeded, throw error
      if (retries >= MAX_RETRIES) {
        throw new Error(`Failed to stream logs after ${MAX_RETRIES} attempts: ${error.message}`);
      }
      
      // Wait longer before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
  
  // Should not reach here, but just in case
  return {
    status: 'success',
    message: 'Log streaming completed'
  };
}

module.exports = {
  streamLogs,
  fetchLogs,
  getLogsUrl
};
