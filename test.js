const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  browser: process.env.BROWSER || 'chromium',
  headless: process.env.CI === 'true',
  baseURL: 'https://parabank.parasoft.com/parabank',
  timeout: 30000,
  screenshotPath: './screenshots',
  reportPath: './test-results'
};

// Ensure directories exist
if (!fs.existsSync(config.screenshotPath)) {
  fs.mkdirSync(config.screenshotPath, { recursive: true });
}
if (!fs.existsSync(config.reportPath)) {
  fs.mkdirSync(config.reportPath, { recursive: true });
}

// Test results storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: new Date(),
    endTime: null,
    duration: null
  },
  tests: []
};

// Utility functions
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function generateUniqueId() {
  return `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(config.screenshotPath, `${name}_${config.browser}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function runTest(testName, testFunction) {
  const test = {
    name: testName,
    status: 'running',
    startTime: new Date(),
    endTime: null,
    duration: null,
    steps: [],
    error: null,
    screenshots: []
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  
  log(`Starting test: ${testName}`);
  
  try {
    await testFunction(test);
    test.status = 'passed';
    testResults.summary.passed++;
    log(`✅ Test passed: ${testName}`);
  } catch (error) {
    test.status = 'failed';
    test.error = error.message;
    testResults.summary.failed++;
    log(`❌ Test failed: ${testName} - ${error.message}`);
  } finally {
    test.endTime = new Date();
    test.duration = test.endTime - test.startTime;
  }
}

function addTestStep(test, step, status = 'completed') {
  test.steps.push({
    description: step,
    status: status,
    timestamp: new Date()
  });
  log(`  Step: ${step}`);
}

async function generateHTMLReport() {
  testResults.summary.endTime = new Date();
  testResults.summary.duration = testResults.summary.endTime - testResults.summary.startTime;
  
  const passRate = testResults.summary.total > 0 ? 
    Math.round((testResults.summary.passed / testResults.summary.total) * 100) : 0;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParaBank CI/CD Test Report - ${config.browser}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #2196F3; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2196F3; margin: 0; font-size: 2.5em; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid #2196F3; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #2196F3; }
        .test-case { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 25px; overflow: hidden; }
        .test-case-header { background: #2196F3; color: white; padding: 15px 20px; font-weight: bold; }
        .test-case-body { padding: 20px; }
        .status-passed { background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; display: inline-block; margin-bottom: 15px; }
        .status-failed { background: #f44336; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; display: inline-block; margin-bottom: 15px; }
        .steps { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .step { margin: 8px 0; padding: 8px 0; border-bottom: 1px dotted #ccc; }
        .step:last-child { border-bottom: none; }
        .error { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0; color: #c62828; }
        .metadata { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .pass-rate { font-size: 1.5em; color: ${passRate === 100 ? '#4CAF50' : passRate >= 50 ? '#FF9800' : '#f44336'}; font-weight: bold; }
        .browser-badge { background: #673AB7; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8em; margin-left: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ParaBank CI/CD Test Report <span class="browser-badge">${config.browser}</span></h1>
            <p>Automated Test Execution - ${testResults.summary.startTime.toISOString()}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="number">${testResults.summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number" style="color: #4CAF50;">${testResults.summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number" style="color: #f44336;">${testResults.summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Pass Rate</h3>
                <div class="pass-rate">${passRate}%</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="number" style="font-size: 1.2em;">${Math.round(testResults.summary.duration / 1000)}s</div>
            </div>
            <div class="summary-card">
                <h3>Browser</h3>
                <div class="number" style="font-size: 1.2em;">${config.browser}</div>
            </div>
        </div>

        ${testResults.tests.map(test => `
        <div class="test-case">
            <div class="test-case-header">
                ${test.name}
            </div>
            <div class="test-case-body">
                <div class="${test.status === 'passed' ? 'status-passed' : 'status-failed'}">
                    ${test.status === 'passed' ? '✓ PASSED' : '✗ FAILED'}
                </div>
                
                ${test.steps.length > 0 ? `
                <div class="steps">
                    <h4>Test Steps:</h4>
                    ${test.steps.map((step, index) => `
                    <div class="step">
                        <strong>${index + 1}.</strong> ${step.description}
                        <small style="float: right; color: #666;">${step.timestamp.toLocaleTimeString()}</small>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${test.error ? `
                <div class="error">
                    <h4>Error Details:</h4>
                    <p>${test.error}</p>
                </div>
                ` : ''}
                
                <div class="metadata">
                    <div><strong>Duration:</strong> ${Math.round(test.duration / 1000)}s</div>
                    <div><strong>Start Time:</strong> ${test.startTime.toLocaleString()}</div>
                    <div><strong>End Time:</strong> ${test.endTime.toLocaleString()}</div>
                    <div><strong>Browser:</strong> ${config.browser}</div>
                </div>
            </div>
        </div>
        `).join('')}

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
            <p><strong>ParaBank CI/CD Pipeline</strong></p>
            <p>Generated on ${new Date().toISOString()} | Browser: ${config.browser} | Environment: ${process.env.CI ? 'CI' : 'Local'}</p>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync('test-report.html', html);
  log('HTML report generated: test-report.html');
}

// Test Cases
async function testCustomerRegistration(test) {
  const browserType = { chromium, firefox, webkit }[config.browser];
  const browser = await browserType.launch({ headless: config.headless });
  const page = await browser.newPage();
  
  try {
    // Generate unique credentials
    const uniqueId = generateUniqueId();
    const username = `${uniqueId}`;
    const password = 'TestPass123!';
    
    addTestStep(test, `Navigate to ${config.baseURL}/index.htm`);
    await page.goto(`${config.baseURL}/index.htm`, { timeout: config.timeout });
    await takeScreenshot(page, 'homepage');
    
    addTestStep(test, 'Click on Register link');
    await page.click('a[href="register.htm"]');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, 'register_page');
    
    addTestStep(test, 'Fill registration form with test data');
    await page.fill('#customer\\.firstName', 'TestUser');
    await page.fill('#customer\\.lastName', 'CI_CD');
    await page.fill('#customer\\.address\\.street', '123 Automation Street');
    await page.fill('#customer\\.address\\.city', 'Test City');
    await page.fill('#customer\\.address\\.state', 'CA');
    await page.fill('#customer\\.address\\.zipCode', '90210');
    await page.fill('#customer\\.phoneNumber', '555-123-4567');
    await page.fill('#customer\\.ssn', '123-45-6789');
    
    addTestStep(test, `Enter unique credentials: ${username}`);
    await page.fill('#customer\\.username', username);
    await page.fill('#customer\\.password', password);
    await page.fill('#repeatedPassword', password);
    
    addTestStep(test, 'Submit registration form');
    await page.click('input[value="Register"]');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, 'registration_success');
    
    addTestStep(test, 'Verify successful registration');
    // Check for welcome message
    const welcomeText = await page.textContent('body');
    if (!welcomeText.includes('Welcome') || !welcomeText.includes(username)) {
      throw new Error('Registration verification failed: Welcome message not found');
    }
    
    // Check page title
    const title = await page.title();
    if (!title.includes('Customer Created')) {
      throw new Error('Registration verification failed: Expected page title not found');
    }
    
    addTestStep(test, 'Registration completed successfully with welcome message displayed');
    
  } finally {
    await browser.close();
  }
}

async function testUserLogin(test) {
  const browserType = { chromium, firefox, webkit }[config.browser];
  const browser = await browserType.launch({ headless: config.headless });
  const page = await browser.newPage();
  
  try {
    // First register a user to test login
    const uniqueId = generateUniqueId();
    const username = `login_${uniqueId}`;
    const password = 'LoginTest123!';
    
    addTestStep(test, 'Pre-setup: Register test user for login verification');
    await page.goto(`${config.baseURL}/register.htm`, { timeout: config.timeout });
    
    // Quick registration
    await page.fill('#customer\\.firstName', 'LoginTest');
    await page.fill('#customer\\.lastName', 'User');
    await page.fill('#customer\\.address\\.street', '456 Login Ave');
    await page.fill('#customer\\.address\\.city', 'Login City');
    await page.fill('#customer\\.address\\.state', 'NY');
    await page.fill('#customer\\.address\\.zipCode', '10001');
    await page.fill('#customer\\.phoneNumber', '555-987-6543');
    await page.fill('#customer\\.ssn', '987-65-4321');
    await page.fill('#customer\\.username', username);
    await page.fill('#customer\\.password', password);
    await page.fill('#repeatedPassword', password);
    await page.click('input[value="Register"]');
    await page.waitForLoadState('domcontentloaded');
    
    addTestStep(test, 'Log out to test login functionality');
    await page.click('a[href="logout.htm"]');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, 'logout_complete');
    
    addTestStep(test, `Navigate to login page: ${config.baseURL}/index.htm`);
    await page.goto(`${config.baseURL}/index.htm`, { timeout: config.timeout });
    
    addTestStep(test, `Enter valid username: ${username}`);
    await page.fill('input[name="username"]', username);
    
    addTestStep(test, 'Enter valid password');
    await page.fill('input[name="password"]', password);
    await takeScreenshot(page, 'login_form_filled');
    
    addTestStep(test, 'Click Log In button');
    await page.click('input[value="Log In"]');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, 'login_success');
    
    addTestStep(test, 'Verify successful login and account overview');
    // Check URL contains overview
    const currentUrl = page.url();
    if (!currentUrl.includes('overview.htm')) {
      throw new Error('Login verification failed: Not redirected to overview page');
    }
    
    // Check for welcome message
    const welcomeText = await page.textContent('body');
    if (!welcomeText.includes('Welcome')) {
      throw new Error('Login verification failed: Welcome message not found');
    }
    
    // Check page title
    const title = await page.title();
    if (!title.includes('Accounts Overview')) {
      throw new Error('Login verification failed: Account overview page not loaded');
    }
    
    addTestStep(test, 'Login successful - Account overview page loaded with welcome message');
    
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  log(`Starting ParaBank CI/CD Test Suite on ${config.browser}`);
  log(`Environment: ${process.env.CI ? 'CI/CD Pipeline' : 'Local'}`);
  log(`Headless mode: ${config.headless}`);
  
  try {
    await runTest('TC 001 - Customer Registration', testCustomerRegistration);
    await runTest('TC 002 - User Login Functionality', testUserLogin);
    
    await generateHTMLReport();
    
    // Output summary for CI
    log('\n=== TEST EXECUTION SUMMARY ===');
    log(`Total Tests: ${testResults.summary.total}`);
    log(`Passed: ${testResults.summary.passed}`);
    log(`Failed: ${testResults.summary.failed}`);
    log(`Pass Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
    log(`Duration: ${Math.round(testResults.summary.duration / 1000)}s`);
    log(`Browser: ${config.browser}`);
    
    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();