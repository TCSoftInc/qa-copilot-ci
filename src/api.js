const axios = require('axios');
const { createMockResponse } = require('./utils');

const { getDate, getTCConfig } = require('./utils');
//testcollab-sdk
const { TestCasesApi, TestPlansApi, TestPlanTestCasesApi, TestPlansAssignmentApi, ProjectUsersApi } = require('testcollab-sdk');

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
  //console.log('here');
  //process.exit(1);

  const { apiUrl, buildId, appUrl, projectId, apiKey } = config;
  console.log({ apiUrl, buildId, appUrl, projectId, apiKey })

  let frontendURL;
  // if apiUrl has testcollab-dev.io in it, set frontendURL to https://testcollab-dev.io
  if (apiUrl.includes('testcollab-dev.io')) {
    frontendURL = 'https://testcollab-dev.io';
  } else if (apiUrl.includes('testcollab.io')) {
    frontendURL = 'https://testcollab.io';
  }

  try {
    // Validate required parameters
    if (!buildId || !appUrl || !projectId || !apiKey) {
      throw new Error('Missing required parameters');
    }
    let config = getTCConfig(apiKey, apiUrl);

    // init apis
    const testPlansApi = new TestPlansApi(config);
    const testPlanCases = new TestPlanTestCasesApi(config);
    const testPlanAssignment = new TestPlansAssignmentApi(config);
    const testCasesApi = new TestCasesApi(config);
    const projectUsersApi = new ProjectUsersApi(config);

    // Prepare request payload
    const payload = {
      build_id: buildId,
      app_url: appUrl,
      tc_project_id: projectId
    };

    // convert projectId to numeric
    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(projectIdNum)) {
      throw new Error('Invalid project ID');
    }

    console.log('Project ID:', projectIdNum);
    console.log('Build ID:', buildId);
    //process.exit(1);

    // get qa copilot status from project settings - from testcollab api
    let qaCopilotStatusAPI_url = `${apiUrl}/projectsettings?project=${projectIdNum}&token=${apiKey}`;
    let qaCopilotStatusAPI_headers = {
      'Content-Type': 'application/json',
    };
    let qaCopilotStatusAPI_response = await axios.get(qaCopilotStatusAPI_url, { headers: qaCopilotStatusAPI_headers });
    let projectSettings = qaCopilotStatusAPI_response.data;
    // find name 'enable_copilot' in elements
    let qaCopilotStatusValue = projectSettings.find(element => element.name === 'enable_copilot');
    if (qaCopilotStatusValue.value != "1") {
      console.log('QA Copilot is not enabled for this project');
      process.exit(1);
    }
    console.log('QA Copilot is enabled for this project');
    let companyId = qaCopilotStatusValue.project.company;
    //console.log('qaCopilotStatus:', qaCopilotStatusValue);
    //process.exit(1);

    // find custom field id for app_url
    let customFieldAPI_url = `${apiUrl}/customfields?company=${companyId}&token=${apiKey}`;
    let customFieldAPI_headers = {
      'Content-Type': 'application/json',
    };
    let customFieldAPI_response = await axios.get(customFieldAPI_url, { headers: customFieldAPI_headers });
    let customFields = customFieldAPI_response.data;
    //console.log('customFields:', customFields);
    //process.exit(1);

    let hasAppURL_CF = customFields.find(field => field.name === 'App URL_url');
    if (!hasAppURL_CF) {
      console.error('App URL custom field not found');
      console.log('Suggestion: You might have enabled the QA Copilot for this project before 2 May 2025, in that case just disable and enabled it, and the custom field will be created automatically');
      console.log('If you have deleted the custom field, please create it again with the label "App URL" and field type "URL"');
      process.exit(1);
    }
    let appUrlCustomFieldId = hasAppURL_CF.id;
    console.log('App URL custom field found! CF ID:', appUrlCustomFieldId);

    // get tags
    let tags = await testCasesApi.getTestCasesTags({ project: projectIdNum });
    console.log('Tags:', tags);


    // find tag with name 'ci'
    let ciTag = tags.find(tag => tag.name === 'ci');
    if (!ciTag) {
      console.error('Tag "ci" not found');
      process.exit(1);
    }
    console.log('Tag "ci" found! ID:', ciTag.id);
    let ciTagId = ciTag.id;

    // find out how many test cases are tagged with 'ci'
    // 🔧 Easy-to-tweak settings
    //const tagId = 13;
    const url = apiUrl+"/testcases/aggrid?token=" + apiKey;

    // 📦 Request body (adjust freely)
    const body = {
      startRow: 0,
      endRow: 1,
      rowGroupCols: [],
      valueCols: [{ id: "id", aggFunc: "count", displayName: "ID", field: "id" }],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {
        tags: { filter: [[ciTagId]], type: "equals", filterType: "number" },

      },
      sortModel: [],
      project: projectIdNum,
      showImmediateChildren: false
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      //console.log("Response:", data);
      //process.exit(1);
      testCases = data.filteredCount;
      console.log("CI-tagged test-case count:", testCases);
      // if its 0, exit
      if (testCases === 0) {
        console.error('No test cases found with tag "ci"');
        console.log('Please add some test cases with tag "ci" to the project');
        console.log('You can do this by going to the test cases and applying the tag "ci" to the test cases');
        process.exit(1);
      }
      //return data;
    } catch (err) {
      console.error("Test case count fetch Error:", err);
      process.exit(1);
      //throw err;
    }


    if (testCases.length === 0) {
      console.error('No test cases found with tag "ci"');
      console.log('Please add some test cases with tag "ci" to the project');
      console.log('You can do this by going to the project settings and adding the tag "ci" to the test cases');
    }

    // TODO: add app_url to custom fields in payload

    const testPlanPayloadQAC = {
      project: projectIdNum,
      title: 'CI Test for build #' + buildId,
      description: 'Test Plan created by CI for build #' + buildId + ' on ' + new Date().toISOString() + ' for ' + appUrl,
      status: 1,
      priority: 1,
      testPlanFolder: null,
      //customFields: []

      customFields: [
        {
          "name": "App URL_url",
          "id": appUrlCustomFieldId,
          "label": "App URL",
          "valueLabel": "",
          "color": "",
          "value": appUrl
        }
      ]

    }

    console.log('Creating test plan with title:', testPlanPayloadQAC.title);
    let tp_response = await testPlansApi.addTestPlan({
      testPlanPayload: testPlanPayloadQAC
    });

    // get the test plan id
    const testPlanId = tp_response.id;

    let tpURL = `${frontendURL}/project/${projectIdNum}/test_plans/${tp_response.id}/view`;
    console.log('Test Plan created! ID: ', tp_response.id, 'URL: ', tpURL);

    // now we add some test cases to it
    const res2 = await testPlanCases.bulkAddTestPlanTestCases({
      testPlanTestCaseBulkAddPayload:
      {
        testplan: testPlanId,
        //testplan: 46044,
        "testCaseCollection": {
          testCases: [],
          selector: [
            {
              "field": "tags",
              "operator": "jsonstring_2",
              "value": "{\"filter\":[[" + ciTagId + "]],\"type\":\"equals\",\"filterType\":\"number\"}"
            }
          ]
        }
      }
    });

    // check if the response is ok
    if (res2.status !== true) {
      console.error('Error adding test cases to test plan:', res2.message);
      process.exit(1);
  
    }

    console.log('Getting QA Copilot user...');
    // get the user id of the qa copilot user
    const res4 = await projectUsersApi.getProjectUsers({
      project: projectIdNum,
      user: 0,
      status: 1,
      role: 0,
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      perPage: 1000
    });
    // find username starting with copilot_
    const qaCopilotUser = res4.find(userObj => userObj.user.username.startsWith('copilot_'));
    if (!qaCopilotUser) {
      console.error('QA Copilot user not found. ');
    }
    //console.log('QA Copilot user found! ID:', qaCopilotUser);
    //process.exit(1);
    console.log('QA Copilot user found! ID:', qaCopilotUser.user.id);
    let qacUserId = qaCopilotUser.user.id;
  

    // refer https://github.com/TCSoftInc/selenium-integration/blob/main/createTestPlan.js
    // assign test plan to user

    console.log('Assign the test plan to a user...')
    // assign the test plan to a user

    const res3 = await testPlanAssignment.assignTestPlan({
        project: projectIdNum,
        testplan: testPlanId,
        testPlanAssignmentPayload: {
            "executor": "team",
            "assignmentCriteria": "testCase",
            "assignmentMethod": "automatic",
            "assignment": {
                "user": [qacUserId],
                "testCases": {
                    "testCases": [],
                    "selector": []
                },
                "configuration": null
            },
            "project": projectIdNum,
            "testplan": testPlanId
        }
    })

    let res3JSON = JSON.parse(res3);

    //console.log(res3JSON.status);
    //process.exit(1);
    if(res3JSON.status != true) {
        console.error('Error assigning test plan to user:', res3.message);
        process.exit(1);
    }

    console.log('Test Plan assigned to QA Copilot!');
    return {testPlanId};



    // todo: payload should contain app url filled as custom field

    //console.log('Payload:', testPlanPayload);
    //process.exit(1);
    //process.exit(1);

    // If test mode is enabled, return a mock response with queue_id
    if (config.testMode) {
      console.log('Running in test mode - no actual API call will be made');
      const mockResponse = createMockResponse(config);
      // Add queue_id to mock response
      mockResponse.queue_id = `mock-queue-${Date.now()}`;
      return mockResponse;
    }



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
