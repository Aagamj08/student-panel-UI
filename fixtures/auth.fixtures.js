const base = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const AUTH_FILE = path.resolve(
  process.cwd(),
  'auth',
  'student.json'
);

const test = base.test.extend({
  authenticatedPage: async ({ browser }, use) => {
    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error(
        `Authentication state not found at: ${AUTH_FILE}\n` +
        `Run: npx playwright test tests/auth/login.spec.js`
      );
    }

    const context = await browser.newContext({
      storageState: AUTH_FILE
    });

    const page = await context.newPage();

    await use(page);

    await context.close();
  }
});

module.exports = {
  test,
  expect: base.expect
};