# QA Copilot CI Installation Guide

This guide provides detailed instructions for integrating QA Copilot CI into your GitHub and GitLab CI/CD pipelines.

## Prerequisites

Before installation, ensure you have:

- A GitHub or GitLab repository with CI/CD workflows
- Node.js installed in your CI environment
- Test Collab API key and project ID
- Application deployment URL

## Installation Options

### From npm Registry (Recommended)

```bash
# Global installation
npm install -g qa-copilot-ci

# Local installation
npm install --save-dev qa-copilot-ci
```

### From GitHub Repository (Pre-npm Publishing)

While the package is not yet published to npm, you can install directly from GitHub:

```bash
# Global installation from GitHub
npm install -g github:your-username/qa-copilot-ci

# Local installation from GitHub
npm install --save-dev github:your-username/qa-copilot-ci
```

You can also specify a specific branch, commit, or tag:

```bash
npm install -g github:your-username/qa-copilot-ci#branch-name
npm install -g github:your-username/qa-copilot-ci#commit-hash
npm install -g github:your-username/qa-copilot-ci#v1.0.0
```

In your package.json dependencies:

```json
"dependencies": {
  "qa-copilot-ci": "github:your-username/qa-copilot-ci"
}
```

## A. How to Install on GitHub

### Step 1: Install QA Copilot CI

You can install QA Copilot CI globally or as a development dependency in your GitHub Actions workflow:

```yaml
# From npm registry (when published)
- name: Install QA Copilot CI
  run: npm install -g qa-copilot-ci

# OR from GitHub repository (pre-npm publishing)
- name: Install QA Copilot CI from GitHub
  run: npm install -g github:your-username/qa-copilot-ci
```

### Step 2: Add Required Secrets

In your GitHub repository:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add the following secrets:
   - `QA_COPILOT_API_KEY`: Your Test Collab API key
   - `TC_PROJECT_ID`: Your Test Collab project ID

### Step 3: Configure GitHub Actions Workflow

Create or modify a workflow file in `.github/workflows/` directory (e.g., `.github/workflows/main.yml`):

```yaml
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
          # Your deployment script here
          echo "::set-output name=app_url::https://staging.example.com"
      
      - name: Install QA Copilot CI
        run: npm install -g qa-copilot-ci
      
      - name: Trigger QA Tests
        run: |
          qac --build ${{ github.run_id }} \
              --app_url ${{ steps.deploy.outputs.app_url }} \
              --tc_project_id ${{ secrets.TC_PROJECT_ID }} \
              --api_key ${{ secrets.QA_COPILOT_API_KEY }}
```

### Step 4: Advanced Configuration Options

#### Environment Variables

You can also configure QA Copilot CI using environment variables in your workflow:

```yaml
- name: Trigger QA Tests
  env:
    QA_COPILOT_API_URL: "https://custom-api.example.com/webhook"
    QA_COPILOT_TEST_MODE: "false"
  run: |
    qac --build ${{ github.run_id }} \
        --app_url ${{ steps.deploy.outputs.app_url }} \
        --tc_project_id ${{ secrets.TC_PROJECT_ID }} \
        --api_key ${{ secrets.QA_COPILOT_API_KEY }}
```

#### Running in Test Mode

For verifying your workflow without triggering actual tests:

```yaml
- name: Verify QA Copilot Integration
  run: |
    qac --build ${{ github.run_id }} \
        --app_url ${{ steps.deploy.outputs.app_url }} \
        --tc_project_id ${{ secrets.TC_PROJECT_ID }} \
        --api_key ${{ secrets.QA_COPILOT_API_KEY }} \
        --test_mode
```

### Step 5: Troubleshooting GitHub Integration

- If the action fails with an authentication error, verify your API key in GitHub Secrets
- If logs show connection issues, check if your GitHub runner has network access to the Test Collab API
- For workflow file errors, use GitHub's workflow validation to check syntax

## B. How to Install on GitLab

### Step 1: Install QA Copilot CI

You can install QA Copilot CI in your GitLab CI/CD pipeline:

```yaml
# From npm registry (when published)
qa_installation:
  script:
    - npm install -g qa-copilot-ci

# OR from GitHub repository (pre-npm publishing)
qa_installation:
  script:
    - npm install -g github:your-username/qa-copilot-ci
```

### Step 2: Add Required Variables

In your GitLab repository:

1. Go to **Settings** > **CI/CD** > **Variables**
2. Add the following variables:
   - `QA_COPILOT_API_KEY`: Your Test Collab API key
   - `TC_PROJECT_ID`: Your Test Collab project ID
   - Set the "Protect variable" option based on your security requirements

### Step 3: Configure GitLab CI/CD Pipeline

Create or modify your `.gitlab-ci.yml` file:

```yaml
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
    - # Your deployment script here
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

### Step 4: Advanced Configuration Options

#### Using Environment Variables

You can configure QA Copilot CI using environment variables in your pipeline:

```yaml
qa_tests:
  stage: test
  script:
    - npm install -g qa-copilot-ci
    - export QA_COPILOT_API_URL="https://custom-api.example.com/webhook"
    - export QA_COPILOT_TEST_MODE="false"
    - qac --build $CI_PIPELINE_ID --app_url $APP_URL --tc_project_id $TC_PROJECT_ID --api_key $QA_COPILOT_API_KEY
  dependencies:
    - deploy
```

#### Running in Test Mode

For verifying your pipeline without triggering actual tests:

```yaml
qa_integration_verification:
  stage: test
  script:
    - npm install -g qa-copilot-ci
    - qac --build $CI_PIPELINE_ID --app_url $APP_URL --tc_project_id $TC_PROJECT_ID --api_key $QA_COPILOT_API_KEY --test_mode
  dependencies:
    - deploy
```

### Step 5: Handling Deployment URLs

If your application URL is dynamic:

```yaml
deploy:
  stage: deploy
  script:
    - # Your deployment script here
    - DEPLOYMENT_URL=$(your_command_to_get_url)
    - echo "APP_URL=$DEPLOYMENT_URL" >> deploy.env
  artifacts:
    reports:
      dotenv: deploy.env
```

### Step 6: Troubleshooting GitLab Integration

- For authentication errors, verify your variables in GitLab CI/CD settings
- For pipeline syntax issues, use GitLab's CI Lint tool
- If the pipeline fails during QA testing, check if the runner has the correct Node.js version installed

## Additional Resources

- [QA Copilot API Documentation](https://api.testcollab.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
