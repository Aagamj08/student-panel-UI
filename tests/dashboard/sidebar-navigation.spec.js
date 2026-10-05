const { test, expect } = require('../../fixtures/auth.fixture');
const { DashboardPage } = require('../../pages/DashboardPage');
const {
  captureFindingScreenshot
} = require('../../utils/screenshotEvidence');
const {
  recordFinding
} = require('../../utils/findingReporter');

test.describe('Student Panel Sidebar Navigation', () => {
  test('Sidebar navigation opens the correct modules', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const dashboard = new DashboardPage(page);

    await dashboard.goto();

    const navigation = [
      {
        name: 'Dashboard',
        locator: dashboard.navDashboard,
        url: /\/student\/dashboard/
      },
      {
        name: 'Tests',
        locator: dashboard.navTests,
        url: /\/student\/my-test/
      },
      {
        name: 'Results',
        locator: dashboard.navResults,
        url: /\/student\/my-reports/
      },
      {
        name: 'Buy',
        locator: dashboard.navBuy,
        url: /\/student\/packages/
      },
      {
        name: 'Settings',
        locator: dashboard.navSettings,
        url: /\/student\/settings/
      }
    ];

    for (const item of navigation) {
      try {
        await item.locator.click();

        await expect(page).toHaveURL(item.url, {
          timeout: 10000
        });

        await page.goBack();

        await page.waitForLoadState('domcontentloaded');

        try {
          await page.waitForLoadState('networkidle', {
            timeout: 5000
          });
        } catch {
          // Background requests may remain active.
        }
      } catch (error) {
        let screenshot = null;

        try {
          screenshot = await captureFindingScreenshot(page, {
            module: 'navigation',
            name: `${item.name}-navigation-failed`,
            fullPage: true
          });
        } catch {
          // Keep screenshot nullable if capture fails.
        }

        await recordFinding(page, {
          module: 'navigation',
          page: 'Student Panel Sidebar',
          check: `${item.name} navigation`,
          expected: `${item.name} should navigate to the correct module`,
          actual: `Navigation failed. Current URL: ${page.url()}`,
          severity: 'High',
          screenshot
        });

        throw error;
      }
    }
  });
});