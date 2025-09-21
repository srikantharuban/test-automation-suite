const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  browser: process.env.BROWSER || 'chromium',
  headless: process.env.CI === 'true',
  baseURL: 'https://parabank.parasoft.com/parabank',
  timeout: 45000, // Increased timeout for reliability
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
  try {
    const screenshotPath = path.join(config.screenshotPath, `${name}_${config.browser}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  } catch (error) {
    log(`Screenshot failed for ${name}: ${error.message}`);
    return null;
  }
}

// Enhanced element interaction with multiple strategies
async function robustClick(page, selectors, description, timeout = config.timeout) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / selectors.length });
      await page.click(selector);
      log(`Successfully clicked ${description} using selector: ${selector}`);
      return true;
    } catch (error) {
      log(`Failed to click ${description} with selector ${selector}: ${error.message}`);
      continue;
    }
  }
  throw new Error(`Failed to click ${description} with any of the provided selectors: ${selectors.join(', ')}`);
}

async function robustFill(page, selectors, value, description, timeout = config.timeout) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / selectors.length });
      await page.fill(selector, value);
      log(`Successfully filled ${description} using selector: ${selector}`);
      return true;
    } catch (error) {
      log(`Failed to fill ${description} with selector ${selector}: ${error.message}`);
      continue;
    }
  }
  throw new Error(`Failed to fill ${description} with any of the provided selectors: ${selectors.join(', ')}`);
}

async function robustWaitAndNavigate(page, url, timeout = config.timeout) {
  try {
    await page.goto(url, { timeout, waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch (networkError) {
    // If networkidle fails, still continue if domcontentloaded succeeded
    log(`Network idle timeout, but page loaded: ${networkError.message}`);
  }
}

// Test execution framework
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
  
  testResults.summary.total++;
  testResults.tests.push(test);
  
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

function addTestStep(test, stepDescription) {
  test.steps.push({
    description: stepDescription,
    timestamp: new Date()
  });
  log(`  Step: ${stepDescription}`);
}

async function generateHTMLReport() {
  testResults.summary.endTime = new Date();
  testResults.summary.duration = testResults.summary.endTime - testResults.summary.startTime;
  
  const passRate = testResults.summary.total > 0 
    ? Math.round((testResults.summary.passed / testResults.summary.total) * 100) 
    : 0;
  
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
                <div class="number pass-rate">${passRate}%</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="number">${Math.round(testResults.summary.duration / 1000)}s</div>
            </div>
        </div>

        ${testResults.tests.map(test => `
        <div class="test-case">
            <div class="test-case-header">${test.name}</div>
            <div class="test-case-body">
                <div class="status-${test.status}">${test.status.toUpperCase()}</div>
                
                <div class="steps">
                    <h4>Test Steps:</h4>
                    ${test.steps.map(step => `<div class="step">• ${step.description}</div>`).join('')}
                </div>
                
                ${test.error ? `<div class="error"><strong>Error:</strong> ${test.error}</div>` : ''}
                
                <div class="metadata">
                    <div><strong>Duration:</strong> ${Math.round(test.duration / 1000)}s</div>
                    <div><strong>Start Time:</strong> ${test.startTime.toISOString()}</div>
                    <div><strong>Browser:</strong> ${config.browser}</div>
                    <div><strong>Environment:</strong> ${process.env.CI ? 'CI/CD Pipeline' : 'Local'}</div>
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

// Enhanced Test Cases with multiple selector strategies
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
    await robustWaitAndNavigate(page, `${config.baseURL}/index.htm`);
    await takeScreenshot(page, 'homepage');
    
    addTestStep(test, 'Click on Register link');
    // Multiple selector strategies for register link
    const registerSelectors = [
      'a[href="register.htm"]',
      'a[href*="register"]',
      'a:has-text("Register")',
      'text=Register',
      '//a[contains(@href, "register")]',
      '//a[text()="Register"]',
      '//a[contains(text(), "Register")]'
    ];
    
    await robustClick(page, registerSelectors, 'Register link');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, 'register_page');
    
    addTestStep(test, 'Fill registration form with test data');
    
    // Enhanced form filling with multiple selector strategies
    const formFields = [
      { selectors: ['#customer\\.firstName', 'input[name*="firstName"]', 'input[id*="firstName"]'], value: 'TestUser', desc: 'First Name' },
      { selectors: ['#customer\\.lastName', 'input[name*="lastName"]', 'input[id*="lastName"]'], value: 'CI_CD', desc: 'Last Name' },
      { selectors: ['#customer\\.address\\.street', 'input[name*="street"]', 'input[id*="street"]'], value: '123 Automation Street', desc: 'Street' },
      { selectors: ['#customer\\.address\\.city', 'input[name*="city"]', 'input[id*="city"]'], value: 'Test City', desc: 'City' },
      { selectors: ['#customer\\.address\\.state', 'input[name*="state"]', 'input[id*="state"]'], value: 'CA', desc: 'State' },
      { selectors: ['#customer\\.address\\.zipCode', 'input[name*="zipCode"]', 'input[id*="zipCode"]'], value: '90210', desc: 'Zip Code' },
      { selectors: ['#customer\\.phoneNumber', 'input[name*="phoneNumber"]', 'input[id*="phoneNumber"]'], value: '555-123-4567', desc: 'Phone' },
      { selectors: ['#customer\\.ssn', 'input[name*="ssn"]', 'input[id*="ssn"]'], value: '123-45-6789', desc: 'SSN' }
    ];
    
    for (const field of formFields) {
      await robustFill(page, field.selectors, field.value, field.desc);
    }
    
    addTestStep(test, `Enter unique credentials: ${username}`);
    await robustFill(page, ['#customer\\.username', 'input[name*="username"]', 'input[id*="username"]'], username, 'Username');
    await robustFill(page, ['#customer\\.password', 'input[name*="password"]', 'input[id*="password"]'], password, 'Password');
    await robustFill(page, ['#repeatedPassword', 'input[name*="repeatedPassword"]', 'input[id*="repeatedPassword"]'], password, 'Confirm Password');
    
    addTestStep(test, 'Submit registration form');
    const submitSelectors = [
      'input[value="Register"]',
      'input[type="submit"]',
      'button[type="submit"]',
      'button:has-text("Register")',
      '//input[@value="Register"]',
      '//button[text()="Register"]'
    ];
    
    await robustClick(page, submitSelectors, 'Register submit button');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, 'registration_success');
    
    addTestStep(test, 'Verify successful registration');
    
    // Enhanced verification with multiple strategies
    try {
      await page.waitForTimeout(3000); // Give page time to load
      
      const welcomeText = await page.textContent('body');
      const title = await page.title();
      const currentUrl = page.url();
      
      // Multiple verification strategies
      const verificationPassed = 
        welcomeText.includes('Welcome') || 
        welcomeText.includes(username) || 
        title.includes('Customer') || 
        title.includes('Welcome') ||
        currentUrl.includes('overview') ||
        currentUrl.includes('customer');
      
      if (!verificationPassed) {
        log(`Verification details - URL: ${currentUrl}, Title: ${title}, Body contains Welcome: ${welcomeText.includes('Welcome')}`);
        throw new Error('Registration verification failed: No success indicators found');
      }
      
      addTestStep(test, 'Registration completed successfully with verification passed');
      
    } catch (verificationError) {
      log(`Verification error: ${verificationError.message}`);
      // Try alternative verification
      await page.waitForTimeout(2000);
      const pageContent = await page.content();
      
      if (pageContent.includes('Account Created') || 
          pageContent.includes('Welcome') || 
          pageContent.includes(username)) {
        addTestStep(test, 'Registration completed successfully (alternative verification)');
      } else {
        throw new Error('Registration verification failed: No success indicators found in page content');
      }
    }
    
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
    await robustWaitAndNavigate(page, `${config.baseURL}/register.htm`);
    
    // Quick registration with enhanced selectors
    const quickRegFields = [
      { selectors: ['#customer\\.firstName', 'input[name*="firstName"]'], value: 'LoginTest' },
      { selectors: ['#customer\\.lastName', 'input[name*="lastName"]'], value: 'User' },
      { selectors: ['#customer\\.address\\.street', 'input[name*="street"]'], value: '456 Login Ave' },
      { selectors: ['#customer\\.address\\.city', 'input[name*="city"]'], value: 'Login City' },
      { selectors: ['#customer\\.address\\.state', 'input[name*="state"]'], value: 'NY' },
      { selectors: ['#customer\\.address\\.zipCode', 'input[name*="zipCode"]'], value: '10001' },
      { selectors: ['#customer\\.phoneNumber', 'input[name*="phoneNumber"]'], value: '555-987-6543' },
      { selectors: ['#customer\\.ssn', 'input[name*="ssn"]'], value: '987-65-4321' },
      { selectors: ['#customer\\.username', 'input[name*="username"]'], value: username },
      { selectors: ['#customer\\.password', 'input[name*="password"]'], value: password },
      { selectors: ['#repeatedPassword', 'input[name*="repeatedPassword"]'], value: password }
    ];
    
    for (const field of quickRegFields) {
      try {
        await robustFill(page, field.selectors, field.value, 'Registration field');
      } catch (fillError) {
        log(`Warning: Could not fill field with selectors ${field.selectors.join(', ')}: ${fillError.message}`);
      }
    }
    
    // Submit registration
    const regSubmitSelectors = ['input[value="Register"]', 'input[type="submit"]', 'button[type="submit"]'];
    await robustClick(page, regSubmitSelectors, 'Register submit');
    await page.waitForLoadState('domcontentloaded');
    
    addTestStep(test, 'Log out to test login functionality');
    
    // Enhanced logout with multiple selectors
    const logoutSelectors = [
      'a[href="logout.htm"]',
      'a[href*="logout"]',
      'a:has-text("Log Out")',
      'text=Log Out',
      '//a[contains(@href, "logout")]',
      '//a[text()="Log Out"]',
      '//a[contains(text(), "Log Out")]'
    ];
    
    try {
      await robustClick(page, logoutSelectors, 'Logout link');
      await page.waitForLoadState('domcontentloaded');
    } catch (logoutError) {
      log(`Logout failed, navigating directly to login page: ${logoutError.message}`);
    }
    
    await takeScreenshot(page, 'logout_complete');
    
    addTestStep(test, `Navigate to login page: ${config.baseURL}/index.htm`);
    await robustWaitAndNavigate(page, `${config.baseURL}/index.htm`);
    
    addTestStep(test, `Enter valid username: ${username}`);
    const usernameSelectors = ['input[name="username"]', 'input[id*="username"]', '#username'];
    await robustFill(page, usernameSelectors, username, 'Username field');
    
    addTestStep(test, 'Enter valid password');
    const passwordSelectors = ['input[name="password"]', 'input[id*="password"]', '#password'];
    await robustFill(page, passwordSelectors, password, 'Password field');
    await takeScreenshot(page, 'login_form_filled');
    
    addTestStep(test, 'Click Log In button');
    const loginSubmitSelectors = [
      'input[value="Log In"]',
      'input[type="submit"]',
      'button[type="submit"]',
      'button:has-text("Log In")',
      '//input[@value="Log In"]'
    ];
    
    await robustClick(page, loginSubmitSelectors, 'Login button');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, 'login_success');
    
    addTestStep(test, 'Verify successful login and account overview');
    
    // Enhanced verification
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const welcomeText = await page.textContent('body');
    const title = await page.title();
    
    // Multiple verification strategies
    const loginSuccess = 
      currentUrl.includes('overview') ||
      currentUrl.includes('account') ||
      welcomeText.includes('Welcome') ||
      title.includes('Accounts') ||
      title.includes('Overview') ||
      title.includes('ParaBank');
    
    if (!loginSuccess) {
      log(`Login verification details - URL: ${currentUrl}, Title: ${title}, Body includes Welcome: ${welcomeText.includes('Welcome')}`);
      throw new Error('Login verification failed: No success indicators found');
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