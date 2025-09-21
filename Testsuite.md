# Instruction 

- You are a test automation engineer.  
- Execute all test cases listed in the **"Test Suite"** section.  
- Use **Playwright MCP tools** to perform each test step.  
- If any step or verification fails, mark the **entire test case as failed**.  
- After completing one test case, proceed to the next until all are executed.  
- When all test cases are completed, generate a **Test Execution Report** in `.html` format.  
- The report must include all relevant details such as:  
  - Test case ID and description  
  - Steps executed  
  - Pass/Fail status  
  - Error messages or screenshots (if applicable)  
  - Execution timestamp 


# Test suite

## TC 001 - Verify that user can register a new customer

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Click on the Register link.
- Fill the registration page. 
- Use unique username and password. 
- submit the form by clicking on the register page. 
- Verify that welcome message with the new username is displayed.

## TC 002 - Verify user login functionality with valid credentials

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Enter valid username in the username field
- Enter valid password in the password field
- Click on the "Log In" button
- Verify that user is successfully logged in and account overview page is displayed
- Verify that "Welcome [username]" message is displayed

## TC 003 - Verify user login functionality with invalid credentials

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Enter invalid username in the username field
- Enter invalid password in the password field
- Click on the "Log In" button
- Verify that appropriate error message is displayed
- Verify that user remains on the login page

## TC 004 - Verify account overview page functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Verify that Account Overview page is displayed
- Verify that account numbers are visible
- Verify that account balances are displayed
- Verify that total balance is calculated correctly
- Click on an account number link
- Verify that account details page opens

## TC 005 - Verify transfer funds functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Click on "Transfer Funds" link in the left menu
- Enter transfer amount in the amount field
- Select source account from dropdown
- Select destination account from dropdown
- Click on "Transfer" button
- Verify that transfer confirmation message is displayed
- Verify that transfer details are correct

## TC 006 - Verify bill pay functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Click on "Bill Pay" link in the left menu
- Enter payee name
- Enter payee address details
- Enter payee city, state, and zip code
- Enter payee phone number
- Enter account number
- Enter verification account number
- Enter amount to pay
- Select account to pay from
- Click on "Send Payment" button
- Verify that payment confirmation is displayed

## TC 007 - Verify find transactions functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Click on "Find Transactions" link in the left menu
- Select an account from dropdown
- Enter transaction ID in the search field
- Click on "Find Transactions" button
- Verify that transaction details are displayed
- Verify that transaction information is accurate

## TC 008 - Verify update contact info functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Click on "Update Contact Info" link in the left menu
- Modify first name field
- Modify last name field
- Modify address field
- Modify city field
- Modify state field
- Modify zip code field
- Modify phone number field
- Click on "Update Profile" button
- Verify that profile update confirmation is displayed

## TC 009 - Verify request loan functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Click on "Request Loan" link in the left menu
- Enter loan amount
- Enter down payment amount
- Select account for down payment from dropdown
- Click on "Apply Now" button
- Verify that loan application result is displayed
- Verify loan approval or denial status

## TC 010 - Verify logout functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Click on "Log Out" link in the left menu
- Verify that user is successfully logged out
- Verify that login page is displayed
- Verify that user cannot access account pages without logging in

## TC 011 - Verify forgot login info functionality

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Click on "Forgot login info?" link
- Enter first name
- Enter last name
- Enter address
- Enter city
- Enter state
- Enter zip code
- Enter social security number
- Click on "Find My Login Info" button
- Verify that login information is displayed or appropriate message is shown

## TC 012 - Verify new account creation

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Login with valid credentials
- Click on "Open New Account" link in the left menu
- Select account type (Checking or Savings)
- Select source account for minimum deposit
- Click on "Open New Account" button
- Verify that new account creation confirmation is displayed
- Verify that new account number is generated
- Verify that new account appears in account overview

## TC 013 - Verify empty field validation on registration

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Click on the Register link
- Leave all fields empty
- Click on "Register" button
- Verify that appropriate validation messages are displayed for required fields
- Verify that registration is not successful

## TC 014 - Verify password mismatch validation on registration

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Click on the Register link
- Fill all required fields except password confirmation
- Enter different password in confirm password field
- Click on "Register" button
- Verify that password mismatch error message is displayed
- Verify that registration is not successful

## TC 015 - Verify existing username validation on registration

- Navigate to `https://parabank.parasoft.com/parabank/index.htm`
- Click on the Register link
- Fill all required fields with existing username
- Click on "Register" button
- Verify that username already exists error message is displayed
- Verify that registration is not successful