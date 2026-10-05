const { test, expect } = require('../../fixtures/auth.fixture');
const { MyTestsPage } = require('../../pages/MyTestsPage');
const {
  expectVisibleWithEvidence
} = require('../../utils/uiAssertions');
const { captureFindingScreenshot } = require('../../utils/screenshotEvidence');
const { recordFinding } = require('../../utils/findingReporter');

test.describe('My Tests UI Automation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const myTests = new MyTestsPage(authenticatedPage);
    await myTests.goto();
  });

  test('My Tests page loads correctly', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const myTests = new MyTestsPage(page);

    await expect(page).toHaveURL(/\/student\/my-test/);

    await expectVisibleWithEvidence(page, myTests.heading, {
      module: 'my-tests',
      pageName: 'My Tests',
      check: 'My Tests heading',
      expected: 'My Tests heading should be visible',
      findingName: 'my-tests-heading-missing'
    });
  });

  test('My Tests navigation control is available', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const myTests = new MyTestsPage(page);

    await expectVisibleWithEvidence(page, myTests.navTests, {
      module: 'my-tests',
      pageName: 'My Tests',
      check: 'Tests navigation control',
      expected: 'Tests navigation control should be visible',
      findingName: 'tests-navigation-missing'
    });

    await expect(myTests.navTests).toBeEnabled();
  });

  test('My Tests tabs are available', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const myTests = new MyTestsPage(page);

    const tabs = [
      ['Active Tests', myTests.activeTestsTab],
      ['Purchased Tests', myTests.purchasedTestsTab]
    ];

    for (const [name, locator] of tabs) {
      await expectVisibleWithEvidence(page, locator, {
        module: 'my-tests',
        pageName: 'My Tests',
        check: `${name} tab`,
        expected: `${name} should be visible`,
        findingName: `${name}-tab-missing`
      });
    }
  });

  test('My Tests page does not contain horizontal overflow', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));

    if (dimensions.documentWidth > dimensions.viewportWidth + 1) {
      const screenshot = await captureFindingScreenshot(page, {
        module: 'my-tests',
        name: 'horizontal-overflow',
        fullPage: true
      });

      await recordFinding(page, {
        module: 'my-tests',
        page: 'My Tests',
        check: 'Horizontal overflow',
        expected: `Document width should not exceed viewport width (${dimensions.viewportWidth}px)`,
        actual: `Document width is ${dimensions.documentWidth}px`,
        severity: 'Medium',
        screenshot
      });

      throw new Error(
        `My Tests has horizontal overflow: ${dimensions.documentWidth}px > ${dimensions.viewportWidth}px`
      );
    }

    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );
  });
});
