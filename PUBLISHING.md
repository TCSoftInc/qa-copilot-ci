# Publishing QA Copilot CI to npm

This guide provides detailed instructions for publishing the QA Copilot CI package to the npm registry.

## Prerequisites

Before publishing, ensure you have:

- An npm account (create one at [npmjs.com/signup](https://www.npmjs.com/signup) if needed)
- Proper access rights to publish under the desired npm namespace
- Node.js and npm installed on your development machine

## Preparing for Publication

### 1. Update Package Information

Ensure your `package.json` file contains all required information:

- A unique `name` that isn't already taken on npm
- Appropriate `version` following semantic versioning (e.g., 1.0.0)
- Comprehensive `description`, `keywords`, and `author` fields
- Correct `license` information
- Required `engines` specification (e.g., Node.js version requirements)

Example:
```json
{
  "name": "qa-copilot-ci",
  "version": "1.0.0",
  "description": "A CI plugin for triggering Test Collab QA Copilot service from GitHub and GitLab pipelines",
  "main": "src/index.js",
  "bin": {
    "qac": "./bin/qac.js"
  },
  "keywords": [
    "ci",
    "qa",
    "testing",
    "test-collab",
    "github",
    "gitlab"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### 2. Control Package Contents

Decide which files should be included in the published package. You can either:

- Create a `.npmignore` file to specify files that should NOT be published (similar to `.gitignore`)
- Use the `files` field in `package.json` to explicitly list files that SHOULD be published

Example `files` field in `package.json`:
```json
"files": [
  "bin/",
  "src/",
  "LICENSE",
  "README.md"
]
```

### 3. Add npm Scripts (Optional)

Consider adding useful npm scripts for the publishing workflow:

```json
"scripts": {
  "prepublishOnly": "npm test",
  "version": "git add -A",
  "postversion": "git push && git push --tags"
}
```

### 4. Write Comprehensive Documentation

Ensure your README.md fully documents:

- Installation instructions
- Usage examples
- Configuration options
- Troubleshooting tips

## Publishing Process

### 1. Login to npm

```bash
npm login
```

Follow the prompts to enter your username, password, and email.

### 2. Test Your Package Locally

Before publishing, test that your package can be installed and used correctly:

```bash
# Create a test directory outside your project
mkdir ~/test-qa-copilot
cd ~/test-qa-copilot

# Install your package locally
npm install /path/to/your/qa-copilot-ci

# Test that it works
npx qac --help
```

### 3. Run a Dry Run Publication

This shows what files would be included without actually publishing:

```bash
npm publish --dry-run
```

Review the output to ensure only the necessary files are included.

### 4. Publish Your Package

When you're ready to publish:

```bash
npm publish
```

For a beta version:

```bash
# First update version in package.json to "1.0.0-beta.1"
npm version prerelease --preid=beta
npm publish --tag beta
```

### 5. Verify Publication

After publishing, verify your package appears on the npm registry:

1. Visit https://www.npmjs.com/package/qa-copilot-ci
2. Try installing it in a new directory: `npm install qa-copilot-ci`

## Managing Releases

### Publishing Updates

To publish an update:

1. Update your code with new features or bug fixes
2. Update the version in `package.json` following semantic versioning:
   ```bash
   # For a patch update (bug fixes)
   npm version patch
   
   # For a minor update (new features, backward compatible)
   npm version minor
   
   # For a major update (breaking changes)
   npm version major
   ```
3. Publish the new version:
   ```bash
   npm publish
   ```

### Using Tags

Tags allow users to install specific versions:

```bash
# Publish with a specific tag
npm publish --tag beta

# Users can then install with
npm install qa-copilot-ci@beta
```

Common tags include:
- `latest` (default)
- `beta`
- `next`
- `stable`

### Unpublishing (If Necessary)

In case you need to unpublish a version (within 72 hours of publishing):

```bash
npm unpublish qa-copilot-ci@1.0.0
```

To unpublish the entire package (not recommended unless absolutely necessary):

```bash
npm unpublish qa-copilot-ci --force
```

## Automating Publication with CI/CD

You can set up automated publishing using GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

To use this:
1. Add your npm token to GitHub Secrets as `NPM_TOKEN`
2. Create a new release in GitHub to trigger the workflow

## Publishing Checklist

Before every publication, go through this checklist:

- [ ] Code is thoroughly tested and working as expected
- [ ] Version is updated correctly in `package.json`
- [ ] Documentation is updated to reflect any changes
- [ ] CHANGELOG.md is updated (if you maintain one)
- [ ] All dependencies are correctly specified
- [ ] The package has been tested with `npm publish --dry-run`
- [ ] You are logged in to the correct npm account (`npm whoami`)
