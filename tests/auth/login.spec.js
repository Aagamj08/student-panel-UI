const { test, expect } = require('@playwright/test');
const path = require('path');

const { StudentLoginPage } = require('../../pages/StudentLoginPage');

test('authenticate student and save reusable session', async ({ page }) => {
  const username = process.env.STUDENT_USERNAME;
  const password = process.env.STUDENT_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'STUDENT_USERNAME and STUDENT_PASSWORD must be configured in .env'
    );
  }

  const loginPage = new StudentLoginPage(page);

  await loginPage.goto();

  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();

  await loginPage.emailInput.fill(username);
  await loginPage.passwordInput.fill(password);

  await expect(loginPage.continueButton).toBeEnabled();

  await loginPage.continueButton.click();

  await page.waitForURL('**/student/dashboard', {
    timeout: 30000
  });

  await expect(page).toHaveURL(/\/student\/dashboard/);

  await page.context().storageState({
    path: path.resolve(process.cwd(), 'auth', 'student.json')
  });
});