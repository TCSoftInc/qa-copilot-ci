#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const { triggerQaCopilot } = require('../src/index');

program
  .name('qac')
  .description('QA Copilot CI plugin for triggering Test Collab')
  .version(version)
  .requiredOption('--build <id>', 'Build ID from the CI pipeline')
  .requiredOption('--app_url <url>', 'Application URL to test')
  .requiredOption('--tc_project_id <id>', 'Test Collab project ID')
  .requiredOption('--api_key <key>', 'API key for authentication')
  .option('--api_url <url>', 'Custom API endpoint URL')
  .option('--test_mode', 'Run in test mode without making actual API calls')
  .parse(process.argv);

const options = program.opts();

// Execute the main function
triggerQaCopilot(options)
  .then(response => {
    if (options.test_mode) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Successfully triggered QA Copilot in test mode');
      //console.log(`Queue ID: ${response.queueId || response.queue_id}`);
      console.log('Test mode enabled - no actual API calls were made');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data) {
        console.log('Mock response data:', response.data);
      }
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`QA Copilot process completed`);
      
      if (response.status === 'success') {
        console.log('Status: SUCCESS');
      } else {
        console.log(`Status: ${response.status || 'UNKNOWN'}`);
      }
      
      if (response.details) {
        console.log('Test Results:', response.details);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error triggering QA Copilot:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  });
