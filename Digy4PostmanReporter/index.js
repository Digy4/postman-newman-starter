const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { env } = require('process');
const { v4: uuidv4, validate } = require("uuid");
const fetch = require("node-fetch")

Digy4PostmanReport = function(newman, options, collectionRunOptions) {
    
    let testResultsSummary;
    let envObject;

    const safe = (v, d='') => (v == null ? d : String(v).trim());
    
    function _getResultSummaryId() { 
        return envObject.projectName + "#" + envObject.teamName + "#" + envObject.buildId;
    }
    
    function _getTimeDifferenceInMs() {
        return testResultsSummary.endTime - testResultsSummary.startTime;
    }
    
    function _getTotalCount() {
        return testResultsSummary.passedCount + testResultsSummary.failedCount + testResultsSummary.skippedCount;
    }

    async function sendResult(test, sessionId) { 
        const response = await validateUser() 

        if (!response.valid) { 
            return false 
        }

        const resultPayload = { 
            id: _getResultSummaryId(), 
            buildId: envObject.buildId,
            teamName: envObject.teamName, 
            hubUrl: envObject.hubUrl, 
            hubId: envObject.hubId, 
            testCaseName: test.testCaseName, 
            testResult: test.testResult, 
            testResultMessage: test.testResultMessage, 
            projectName: envObject.projectName, 
            startTime: test.startTime,
            endTime: test.endTime,
            durationMs: _getTimeDifferenceInMs(), 
            sessionId: sessionId, 
            resultSummaryStartTime: testResultsSummary.startTime, 
            browserName: envObject.browserName,
            browserVersion: envObject.browserVersion,
            eventSessionIds: [], 
            scriptErrors: "", 
            capabilities: JSON.stringify(envObject), 
            resultSummaryId: _getResultSummaryId(), 
            deviceName: "N/A", 
            deviceVersion: "N/A", 
            moduleName: envObject.moduleName,
            tester: envObject.tester, 
            ba: envObject.ba,
            developer: envObject.developer,
            suiteName: envObject.suiteName,
            environment: envObject.environment,
            testType: envObject.testType,
            cloudFarm: envObject.cloudFarm,
            framework: envObject.framework,
            tenantId: response.tenantId,
            lob: envObject.lob, 
            application: envObject.application, 
            release: envObject.release, 
            pipelineId: envObject.pipelineId, 
            requirementId: envObject.requirementId, 
            tags: envObject.tags, 
            commitId: envObject.commitId
        }

        console.log('Result Payload:', JSON.stringify(resultPayload, null, 2));

        const payload = { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(resultPayload)
        };

        try {
            const response = await fetch(envObject.resultsUrl, payload)
            if (!response.ok) { 
                const text = await response.text().catch(() => "no error message")
                console.log(`Failed to send: ${test.testCaseName}, Response: ${response.status}, StatusText: ${response.statusText}, Error: ${text}`)
                return false
            }
            
            console.log(`Succesful sending: ${test.testCaseName}`)
            return true
        }catch(error) { 
            console.error(`Error sending ${test.testCaseName}: ${error.message}`)
            return false 
        }
    }

    async function sendResultsSummary(status) { 
        console.log('=== SENDING RESULTS SUMMARY ===');
        console.log('Status:', status);

        const response = await validateUser()
        console.log(response)

        if (!response.valid) { 
            console.error("Error in validating user/project")
            return; 
        }
        
        const resultSummaryPayload = { 
            _id: envObject._id, 
            buildId: envObject.buildId, 
            hubId: envObject.hubId, 
            hubUrl: envObject.hubUrl, 
            resultsSummaryId: _getResultSummaryId(), 
            projectName: envObject.projectName, 
            teamName: envObject.teamName, 
            suiteName: envObject.suiteName, 
            appVersion: envObject.appVersion, 
            browserName: envObject.browserName, 
            browserVersion: envObject.browserVersion, 
            deviceName: "N/A", 
            deviceVersion: "N/A",
            passedCount: testResultsSummary.passedCount, 
            skippedCount: testResultsSummary.skippedCount, 
            failedCount: testResultsSummary.failedCount, 
            errorCount: 0,
            totalCount: _getTotalCount(),
            startTime: testResultsSummary.startTime, 
            endTime: testResultsSummary.endTime, 
            durationMs: _getTimeDifferenceInMs(), 
            status: status, 
            framework: envObject.framework,
            environment: envObject.environment,
            moduleName: envObject.moduleName,
            ba: envObject.ba,
            developer: envObject.developer,
            testType: envObject.testType,
            cloudFarm: envObject.cloudFarm,
            tenantId: envObject.tenantId,
            lob: envObject.lob,
            application: envObject.application,
            release: envObject.release,
            pipelineId: envObject.pipelineId,
            requirementId: envObject.requirementId,
            tags: envObject.tags,
            commitId: envObject.commitId,
            tenantId: response.tenantId
        };

        console.log('Result Summary Payload:', JSON.stringify(resultSummaryPayload, null, 2));

        const payload = { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(resultSummaryPayload)
        };

        try {
            const url = envObject.resultsSummaryUrl;
            console.log('Target URL:', url);
            
            if (!url) {
                console.error('❌ No results summary URL configured in RESULTS_SUMMARY_URL environment variable');
                return false;
            }
            
            console.log('Making HTTP request...');
            
            const response = await fetch(url, payload)
            const data = await response.json() 

            console.log('Response: ', JSON.stringify(data, null, 2))

            return true
            
        } catch (error) { 
            console.error("❌ Error sending results:", error.message);
            console.error("❌ Full error:", error);
            return false;
        }
    }

    async function validateUser() { 
        try {
            const headers = {
                "Content-Type": "application/json"
            }
            const request = {
                client_id: envObject.clientId,
                client_secret: envObject.clientSecret
            };

            
            const projectPlanUrl = envObject.projectPlanUrl
            const projectName = envObject.projectName

            const response = await fetch(projectPlanUrl, { 
                method: 'POST',
                headers: headers, 
                body: JSON.stringify(request) 
            });

            console.log(`Digy4: Project validation endpoint status code : ` + response.status);

            const responseJson = await response.json()
            
            if (!responseJson.body) {
                console.error('Digy4: User is NOT authenticated/authorized. Reporting to Digy Dashboard will be skipped.');
                return {
                    valid: false
                };
            }
            if (responseJson.error.toString() === "true") {
                console.error('Digy4: User is NOT authorized. Reporting to Digy Dashboard will be skipped.');
                return {
                    valid: false
                };
            }
            if (responseJson.body.projects.some(project => project.name.toLowerCase() === projectName.toLowerCase())) {
                if (responseJson.body.testcase_plan_count <= responseJson.body.testcase_current_count) {
                    console.error('Digy4: Execution slots are not available or subscription ended. Reporting to Digy Dashboard will be skipped.');
                    return {
                        valid: false
                    };
                }

                return {
                    valid: true,
                    tenantId: responseJson.body.organization_id
                };
            }
            console.error('Digy4: Project name does not exist. Reporting to Digy Dashboard will be skipped.');
            return {
                valid: false
            };
        }catch(error) { 
            console.error("Error occured in validateUser: ", error)
            return { 
                valid: false
            }
        }
    }

    function envSummary() {
        return {
            _id: uuidv4(), 
            hubId: safe(process.env.HUB_ID, 'localhost'),
            hubUrl: safe(process.env.HUB_URL, 'http://localhost'),
            
            projectName: safe(process.env.PROJECT_NAME),
            teamName: safe(process.env.TEAM_NAME),
            buildId: safe(process.env.BUILD_ID, uuidv4()),
            suiteName: safe(process.env.SUITE_NAME, 'N/A'),
            
            appVersion: safe(process.env.APP_VERSION),
            browserName: safe(process.env.BROWSER_NAME, 'N/A'),
            browserVersion: safe(process.env.BROWSER_VERSION, 'N/A'),

            framework: safe(process.env.FRAMEWORK, 'Newman/Postman'),
            environment: safe(process.env.ENVIRONMENT, 'test'),
            moduleName: safe(process.env.MODULE_NAME),
            tester: safe(process.env.TESTER), 
            ba: safe(process.env.BA),
            developer: safe(process.env.DEVELOPER),
            testType: safe(process.env.TEST_TYPE, 'API'),
            cloudFarm: safe(process.env.CLOUD_FARM, 'LOCAL'),
            
            clientId: safe(process.env.CLIENT_ID), 
            clientSecret: safe(process.env.CLIENT_SECRET), 

            lob: safe(process.env.LOB),
            application: safe(process.env.APPLICATION),
            release: safe(process.env.RELEASE),
            pipelineId: safe(process.env.PIPELINE_ID),
            requirementId: safe(process.env.REQUIREMENT_ID),
            tags: safe(process.env.TAGS),
            commitId: safe(process.env.COMMIT_ID),
            
            resultsSummaryUrl: safe(process.env.RESULTS_SUMMARY_URL),
            resultsUrl: safe(process.env.RESULTS_URL),
            projectPlanUrl: safe(process.env.PROJECT_PLAN_URL), 
        };
    }

    newman.on('start', async function () {
        console.log('In start')

        console.log('Digy4 Newman Reporter: Starting...');
        envObject = envSummary();

        testResultsSummary = {
            passedCount: 0,
            skippedCount: 0,
            failedCount: 0,
            errorCount: 0,
            startTime: Date.now(),
            endTime: null,        
        };
    });

    newman.on('beforeDone', async function(err, o) {

        console.log('In before done')
        const sessionId = uuidv4()

        if (err) { 
            console.error('Error in beforeDone:', err);
            return;
        }

        if (!o.summary || !o.summary.run || !o.summary.run.executions) {
            console.error('Missing required summary data');
            return;
        }

        const executions = o.summary.run.executions;
        testResultsSummary.startTime = o.summary.run.timings?.started || testResultsSummary.startTime;
        testResultsSummary.endTime = o.summary.run.timings?.completed || Date.now();
        
        const allTestCases = executions.map(execution => { 
            const executionId = execution.cursor?.ref || 'unknown';
            const { assertions = [], request = {}, response = {} } = execution;
            const method = request.method || 'UNKNOWN';
            const url = Array.isArray(request.url?.path) ? request.url.path.join("/") : 'unknown-url';
            
            if (assertions.length > 0) {
                return assertions.map(assertion => { 
                    let testResult;
                    let resultMessage;
                    
                    if (assertion.skipped) { 
                        testResult = "SKIPPED";
                        resultMessage = "Execution Skipped";
                        testResultsSummary.skippedCount++;
                    } else if (assertion?.error !== undefined) { 
                        testResult = "FAIL";
                        const errorInfo = {
                            ...assertion.error,
                            method: method,
                            url: url,
                            executionId: executionId
                        };
                        resultMessage = JSON.stringify(errorInfo, null, 2);
                        testResultsSummary.failedCount++;
                    } else { 
                        testResult = "PASS";
                        resultMessage = "Executed Successfully";
                        testResultsSummary.passedCount++;
                    }

                    return { 
                        testCaseName: assertion.assertion, 
                        testResult, 
                        testResultMessage: resultMessage,
                        startTime: testResultsSummary.startTime,
                        endTime: testResultsSummary.endTime,
                    };
                });
            } else {
                // Handle executions with no assertions
                testResultsSummary.skippedCount++;
                return [{
                    testResult: "NO_ASSERTIONS",
                    resultMessage: "No assertions found for this request",
                    teamName: envObject.teamName,
                    method,
                    url,
                    executionId
                }];
            }
        }).flat(); 
        
        console.log('Test Results Summary:', testResultsSummary);
        console.log(`Total Tests: ${_getTotalCount()}, Passed: ${testResultsSummary.passedCount}, Failed: ${testResultsSummary.failedCount}, Skipped: ${testResultsSummary.skippedCount}`);
        console.log(`All Testcases: ${JSON.stringify(allTestCases, null, 2)}`)

        // Batch req 
        // const promises = allTestCases.map((test) => { 
        //     return sendResult(test, sessionId)
        // })

        for (const test of allTestCases){ 
            const response = await sendResult(test, sessionId)
            console.log(response)
        }
        
        try { 
            console.log('Digy4 Newman Reporter: Sending results summary...');
            const success = await sendResultsSummary('Completed')
            
            if (success) { 
                console.log('Digy4 Newman Reporter success sending result....')
            }else{ 
                console.error('Digy4 Newman Reporter failed sending result....')
            }
        }catch(error) { 
            console.error('Digy4 Newman Reporter failed sending result....')
            console.error("Error: ", error)
        }

    });

    newman.on('done', async function(err, o) {
        if (err) {
            console.error('Newman execution error:', err);
            return;
        }

        console.log('In done')
        
    });
}

module.exports = Digy4PostmanReport;