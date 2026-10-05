const { test, expect } = require('../../fixtures/auth.fixture');
const { MyTestsPage } = require('../../pages/MyTestsPage');
const {
  captureFindingScreenshot
} = require('../../utils/screenshotEvidence');
const {
  recordFinding
} = require('../../utils/findingReporter');

test.describe('My Tests Functional Automation', () => {
  test('Active and Purchased Tests tabs update the page state', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const myTests = new MyTestsPage(page);

    await myTests.goto();

    try {
      await expect(page).toHaveURL(/\/student\/my-test(?:\?.*)?$/);

      await myTests.purchasedTestsTab.click();

      await expect(page).toHaveURL(
        /\/student\/my-test\?tab=all/,
        { timeout: 10000 }
      );

      await myTests.activeTestsTab.click();

      await expect(page).toHaveURL(
        /\/student\/my-test(?:\?.*)?$/,
        { timeout: 10000 }
      );

      expect(page.url()).not.toContain('tab=all');
    } catch (error) {
      let screenshot = null;

      try {
        screenshot = await captureFindingScreenshot(page, {
          module: 'my-tests',
          name: 'tab-switching-failed',
          fullPage: true
        });
      } catch {
        // Keep screenshot nullable if capture fails.
      }

      await recordFinding(page, {
        module: 'my-tests',
        page: 'My Tests',
        check: 'Active/Purchased Tests tab switching',
        expected: 'Switching tabs should update the My Tests URL/state correctly',
        actual: `Tab switching failed. Current URL: ${page.url()}`,
        severity: 'High',
        screenshot
      });

      throw error;
    }
  });
});