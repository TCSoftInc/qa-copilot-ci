/**
 * Utility functions for QA Copilot CI
 */

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

module.exports = {
  log,
  formatLog,
  createMockResponse,
  createMockLogsResponse,
  isValidUrl
};
