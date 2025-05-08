# 🔄 QA Copilot CI 🤖

A Node.js CLI plugin for triggering Test Collab QA Copilot service from GitHub and GitLab CI pipelines.

## 📋 Overview

This tool is designed to be integrated into CI/CD pipelines to automatically trigger the Test Collab QA Copilot service after a successful build. It streamlines the process of initiating automated testing by providing a simple CLI interface that passes build information to the Test Collab service.

The plugin works by:
1. 🚀 Triggering a test run on the Test Collab QA Copilot service
2. 🔑 Receiving a queue ID from the service
3. 📊 Subscribing to a logs API to stream test execution logs in real-time
4. ⏱️ Waiting for the test execution to complete and reporting results

## 📥 Installation

### Global Installation

```bash
npm install -g qa-copilot-ci
```

### Local Installation

```bash
npm install --save-dev qa-copilot-ci
```

## 🛠️ Usage

### Basic Usage

```bash
qac --build <build_id> --app_url <application_url> --tc_project_id <project_id> --api_key <api_key>
```

### Required Parameters

- `--build` - The build ID from your CI pipeline
- `--app_url` - The URL of the application to be tested
- `--tc_project_id` - The Test Collab project ID
- `--api_key` - Your Test Collab API key for authentication

### ⚙️ Optional Parameters

- `--api_url` - Custom API endpoint URL (defaults to environment variable or the built-in default)
- `--test_mode` - Run in test mode without making actual API calls (useful for testing CI pipeline integration)

### 💡 Examples

```bash
# Basic usage
qac --build 12345 --app_url https://staging.example.com --tc_project_id 678 --api_key abcdef123456

# Using test mode
qac --build 12345 --app_url https://staging.example.com --tc_project_id 678 --api_key abcdef123456 --test_mode

# Using custom API endpoint
qac --build 12345 --app_url https://staging.example.com --tc_project_id 678 --api_key abcdef123456 --api_url https://custom-api.example.com/webhook
```

## ⚙️ Configuration

The plugin can be configured through:

1. **Command-line arguments** (highest priority)
2. **Environment variables** (medium priority)
3. **Default values** (lowest priority)


## 🔄 CI Integration Examples

### 🐙 GitHub Actions

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to staging
        id: deploy
        run: |
          # Your deployment script
          echo "::set-output name=app_url::https://staging.example.com"
      
      - name: Install QA Copilot CI
        run: npm install -g qa-copilot-ci
      
      - name: Trigger QA Tests
        run: |
          qac --build ${{ github.run_id }} \
              --app_url ${{ steps.deploy.outputs.app_url }} \
              --tc_project_id ${{ vars.TC_PROJECT_ID }} \
              --api_key ${{ secrets.TESTCOLLAB_API_KEY }}
```

### 🦊 GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy
  - test

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - # Your deployment script
    - echo "APP_URL=https://staging.example.com" >> deploy.env
  artifacts:
    reports:
      dotenv: deploy.env

qa_tests:
  stage: test
  script:
    - npm install -g qa-copilot-ci
    - qac --build $CI_PIPELINE_ID --app_url $APP_URL --tc_project_id $TC_PROJECT_ID --api_key $QA_COPILOT_API_KEY
  dependencies:
    - deploy
```

## 👨‍💻 Development

To contribute to this project:

1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes
4. Test your changes: `node bin/qac.js --help`
5. Test with mock mode: `npm run test-mode`

## 📜 License

MIT

## 🚀 Sample Project

A sample project is available to help you get started with `qa-copilot-ci` quickly. It demonstrates a basic setup and integration for a Node.js application.

You can find the sample project here: [https://github.com/AbhimanyuG/qac-sample-project/](https://github.com/AbhimanyuG/qac-sample-project/)

Feel free to fork this repository and adapt it to your needs. It provides a practical example of how to configure and use `qa-copilot-ci` in a CI/CD environment.

## 🔗 Links

- **Homepage**: [testcollab.com](https://testcollab.com)
- **Repository**: [https://github.com/TCSoftInc/qa-copilot-ci](https://github.com/TCSoftInc/qa-copilot-ci)
- **Bug Reports**: [https://github.com/TCSoftInc/qa-copilot-ci/issues](https://github.com/TCSoftInc/qa-copilot-ci/issues)
- **Demo Video**: [QA Copilot YouTube explainer](https://www.youtube.com/watch?v=-T2lzy32-0g)
