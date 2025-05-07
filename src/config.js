require('dotenv').config();

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  // Default API URL, can be overridden by environment variable or command-line option
  apiUrl: 'https://api.testcollab.io',
  // disabled: Test mode flag, disables actual API calls
  //testMode: process.env.QA_COPILOT_TEST_MODE === 'true' || false
};

/**
 * Loads and merges configuration from various sources
 * Priority (highest to lowest): command-line arguments, environment variables, defaults
 * 
 * @param {Object} cliOptions - Command-line options
 * @returns {Object} - The merged configuration
 */
function loadConfig(cliOptions = {}) {
  return {
    ...DEFAULT_CONFIG,
    
    // Override with environment variables if they exist

    // Override with CLI options if specified (highest priority)
    ...(cliOptions.api_url && { apiUrl: cliOptions.api_url }),
    ...(cliOptions.test_mode && { testMode: true }),
    
    // Required options from CLI
    buildId: cliOptions.build,
    appUrl: cliOptions.app_url,
    projectId: cliOptions.tc_project_id,
    apiKey: cliOptions.api_key
  };
}

module.exports = {
  loadConfig,
  DEFAULT_CONFIG
};
