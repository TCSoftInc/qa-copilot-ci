/**
 * Utility functions for QA Copilot CI
 */
const { Configuration } = require('testcollab-sdk');

/**
 * Formats log messages with timestamps
 * 
 * @param {string} message - The message to log
 * @param {string} level - Log level (info, warn, error)
 * @returns {string} - Formatted log message
 */
function formatLog(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

/**
 * Logs messages with proper formatting
 * 
 * @param {string} message - The message to log
 * @param {string} level - Log level (info, warn, error)
 */
function log(message, level = 'info') {
  const formattedMessage = formatLog(message, level);
  
  switch (level.toLowerCase()) {
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

/**
 * Creates a simulated API response for testing
 * 
 * @param {Object} config - Configuration object
 * @returns {Object} - Mock response
 */
function createMockResponse(config) {
  return {
    status: 'success',
    message: 'Test run initiated successfully',
    data: {
      build_id: config.buildId,
      app_url: config.appUrl,
      project_id: config.projectId,
      test_run_id: `tr-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Creates a simulated logs API response for testing
 * 
 * @param {string} queueId - The queue ID
 * @param {number} lastLogId - The ID of the last log received
 * @param {boolean} finished - Whether the test run is finished
 * @returns {Object} - Mock logs response
 */
function createMockLogsResponse(queueId, lastLogId = 0, finished = false) {
  // Generate between 0-5 random logs
  const logCount = Math.floor(Math.random() * 6);
  const logs = [];
  
  for (let i = 0; i < logCount; i++) {
    const logId = lastLogId + i + 1;
    logs.push({
      id: logId,
      timestamp: new Date().toISOString(),
      level: ['INFO', 'DEBUG', 'WARN', 'ERROR'][Math.floor(Math.random() * 4)],
      message: `Mock log message #${logId} for queue ${queueId}`
    });
  }
  
  return {
    finished,
    logs
  };
}

/**
 * Validates a URL string
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Formats a duration in milliseconds to a human-readable string
 * 
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} - Formatted duration string (e.g., "2 minutes 30 seconds")
 */
function humanizeDuration(milliseconds) {
  if (milliseconds < 0) milliseconds = 0;
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let parts = [];
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  
  // Always show seconds, even if 0, if minutes are also 0, or if seconds > 0
  if (seconds > 0 || minutes === 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }
  
  // Handle cases less than 1 second
  if (parts.length === 0 && milliseconds > 0 && milliseconds < 1000) {
    return `${milliseconds} millisecond${milliseconds !== 1 ? 's' : ''}`;
  }
  
  // If duration is exactly 0ms
  if (parts.length === 0) {
    return '0 seconds';
  }
  
  return parts.join(' ');
}
const getDate = () => {
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let dateTime = date + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
  return dateTime;
}

const getTCConfig = (apiKey, tcURL) => {
  let config = new Configuration({
    basePath: tcURL,
      fetchApi: (url, options) => {
          // append the token to the url if no query string is present
          if (!url.includes('?')) {
              url = url + '?token=' + apiKey;
          }
          else {
              url = url + '&token=' + apiKey;
          }
          return fetch(url, options)
      },
  
  })
  return config;
}

module.exports = {
  log,
  formatLog,
  createMockResponse,
  createMockLogsResponse,
  isValidUrl, 
  getDate, 
  getTCConfig,
  humanizeDuration
};
