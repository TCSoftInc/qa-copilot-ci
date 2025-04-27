# Development Guide for QA Copilot CI

This guide provides instructions for setting up and working in the development environment for the QA Copilot CI project.

## Prerequisites

- Node.js >= 14.0.0
- npm or yarn package manager
- Git

## Setting Up the Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/qa-copilot-ci.git
   cd qa-copilot-ci
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**
   Create a `.env` file in the root directory with:
   ```
   QA_COPILOT_API_URL=https://your-api-endpoint.com
   QA_COPILOT_TEST_MODE=false
   ```

## Project Structure

- `/bin`: Contains the CLI executable
- `/src`: Core source code
  - `/src/api.js`: API client for Test Collab service
  - `/src/config.js`: Configuration handling
  - `/src/logs.js`: Log streaming functionality
  - `/src/utils.js`: Utility functions
  - `/src/index.js`: Main entry point
- `/scripts`: Helper scripts, including mock log stream for testing

## Development Workflow

### Running the Tool Locally

To test the CLI tool during development:

```bash
npm start -- --build test-build --app_url https://example.com --tc_project_id test-project --api_key test-key
```

Or use the test mode script:

```bash
npm run test-mode
```

### Using Mock Log Stream

For testing log streaming functionality without making actual API calls:

```bash
npm run mock-logs
```

### Testing Changes

Before submitting changes:

1. Test functionality in test mode:
   ```bash
   npm run test-mode
   ```

2. Test with mock logs:
   ```bash
   npm run mock-logs
   ```

3. Verify the CLI help works:
   ```bash
   node bin/qac.js --help
   ```

## Making a Local Build for Testing

To test the CLI tool as if it were installed globally:

```bash
# Link the package globally
npm link

# Now you can use the command anywhere
qac --help

# When finished testing, unlink the package
npm unlink -g qa-copilot-ci
```

## Debugging

To enable debug logging, set:

```bash
export DEBUG=qa-copilot:*
```

Then run your commands as usual.

## Publishing to npm

When you're ready to publish the package to npm:

1. **Create an npm account** if you don't already have one:
   ```bash
   npm adduser
   ```
   Or register at https://www.npmjs.com/signup

2. **Login to npm** from your terminal:
   ```bash
   npm login
   ```

3. **Prepare your package**:
   - Ensure your package.json is complete
   - Review the `.npmignore` file or `files` field in package.json

4. **Test your package installation** locally:
   ```bash
   # In a different directory
   npm install /path/to/qa-copilot-ci
   ```

5. **Do a dry run** to see what would be published:
   ```bash
   npm publish --dry-run
   ```

6. **Publish your package**:
   ```bash
   npm publish
   ```
   
   For a beta version:
   ```bash
   # First change version in package.json to "1.0.0-beta.1"
   npm publish --tag beta
   ```

## GitHub Installation (Pre-npm Publishing)

While the package is not yet published to npm, users can install directly from GitHub:

```bash
npm install github:your-username/qa-copilot-ci
```

Or in their package.json:

```json
"dependencies": {
  "qa-copilot-ci": "github:your-username/qa-copilot-ci"
}
```

## Contributing Guidelines

- Follow existing code style and patterns
- Include meaningful commit messages
- Test all changes thoroughly before submitting PRs
- Document any new functionality or changes to existing behavior
