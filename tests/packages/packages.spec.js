const { test, expect } = require('../../fixtures/auth.fixture');
const { PackagesPage } = require('../../pages/PackagesPage');
const {
  expectVisibleWithEvidence
} = require('../../utils/uiAssertions');
const { captureFindingScreenshot } = require('../../utils/screenshotEvidence');
const { recordFinding } = require('../../utils/findingReporter');

test.describe('Packages UI Automation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const packages = new PackagesPage(authenticatedPage);
    await packages.goto();
  });

  test('Buy Tests page loads correctly', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const packages = new PackagesPage(page);

    await expect(page).toHaveURL(/\/student\/packages/);

    await expectVisibleWithEvidence(page, packages.heading, {
      module: 'packages',
      pageName: 'Buy Tests',
      check: 'Buy Tests heading',
      expected: 'Buy Tests heading should be visible',
      findingName: 'buy-tests-heading-missing'
    });
  });

  test('Package tabs are available', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const packages = new PackagesPage(page);

    const tabs = [
      ['Active', packages.activeTab],
      ['All', packages.allTab],
      ['Transactions', packages.transactionsTab]
    ];

    for (const [name, locator] of tabs) {
      const count = await locator.count();

      if (count === 0) {
        continue;
      }

      await expectVisibleWithEvidence(page, locator, {
        module: 'packages',
        pageName: 'Buy Tests',
        check: `${name} package tab`,
        expected: `${name} tab should be visible`,
        findingName: `${name}-package-tab-missing`
      });
    }
  });

  test('Buy Tests page does not contain horizontal overflow', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));

    if (dimensions.documentWidth > dimensions.viewportWidth + 1) {
      const screenshot = await captureFindingScreenshot(page, {
        module: 'packages',
        name: 'horizontal-overflow',
        fullPage: true
      });

      await recordFinding(page, {
        module: 'packages',
        page: 'Buy Tests',
        check: 'Horizontal overflow',
        expected: `Document width should not exceed viewport width (${dimensions.viewportWidth}px)`,
        actual: `Document width is ${dimensions.documentWidth}px`,
        severity: 'Medium',
        screenshot
      });

      throw new Error(
        `Buy Tests has horizontal overflow: ${dimensions.documentWidth}px > ${dimensions.viewportWidth}px`
      );
    }

    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );
  });
});