const { test, expect } = require('../../fixtures/auth.fixture');
const { ResultsPage } = require('../../pages/ResultsPage');
const {
  expectVisibleWithEvidence
} = require('../../utils/uiAssertions');
const { captureFindingScreenshot } = require('../../utils/screenshotEvidence');
const { recordFinding } = require('../../utils/findingReporter');

test.describe('Results UI Automation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const results = new ResultsPage(authenticatedPage);
    await results.goto();
  });

  test('Results page loads correctly', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const results = new ResultsPage(page);

    await expect(page).toHaveURL(/\/student\/my-reports/);

    await expectVisibleWithEvidence(page, results.heading, {
      module: 'results',
      pageName: 'Results',
      check: 'Results heading',
      expected: 'Results heading should be visible',
      findingName: 'results-heading-missing'
    });
  });

  test('Results navigation control is available', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const results = new ResultsPage(page);

    await expectVisibleWithEvidence(page, results.navResults, {
      module: 'results',
      pageName: 'Results',
      check: 'Results navigation control',
      expected: 'Results navigation control should be visible',
      findingName: 'results-navigation-missing'
    });

    await expect(results.navResults).toBeEnabled();
  });

  test('Results page does not contain horizontal overflow', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));

    if (dimensions.documentWidth > dimensions.viewportWidth + 1) {
      const screenshot = await captureFindingScreenshot(page, {
        module: 'results',
        name: 'horizontal-overflow',
        fullPage: true
      });

      await recordFinding(page, {
        module: 'results',
        page: 'Results',
        check: 'Horizontal overflow',
        expected: `Document width should not exceed viewport width (${dimensions.viewportWidth}px)`,
        actual: `Document width is ${dimensions.documentWidth}px`,
        severity: 'Medium',
        screenshot
      });

      throw new Error(
        `Results has horizontal overflow: ${dimensions.documentWidth}px > ${dimensions.viewportWidth}px`
      );
    }

    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );
  });
});
