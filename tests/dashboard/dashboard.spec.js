const { test, expect } = require('../../fixtures/auth.fixture');
const { DashboardPage } = require('../../pages/DashboardPage');
const {
  expectVisibleWithEvidence,
  expectTextWithEvidence
} = require('../../utils/uiAssertions');
const { captureFindingScreenshot } = require('../../utils/screenshotEvidence');
const { recordFinding } = require('../../utils/findingReporter');
const { inspectElement } = require('../../utils/uiInspector');

test.describe('Dashboard UI Automation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
  });

  test('Dashboard core content is visible', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const dashboard = new DashboardPage(page);

    await expectVisibleWithEvidence(page, dashboard.heading, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Dashboard heading',
      expected: 'Dashboard heading should be visible',
      findingName: 'dashboard-heading-missing'
    });

    await expectVisibleWithEvidence(page, dashboard.welcomeHeading, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Welcome heading',
      expected: 'Student welcome heading should be visible',
      findingName: 'welcome-heading-missing'
    });

    await expectVisibleWithEvidence(page, dashboard.coreSkills, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Core skills indicator',
      expected: '5 Core Skills should be visible',
      findingName: 'core-skills-missing'
    });

    await expectVisibleWithEvidence(page, dashboard.resultsIn, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Results time indicator',
      expected: 'Results in 5 mins should be visible',
      findingName: 'results-time-missing'
    });

    await expectVisibleWithEvidence(page, dashboard.satisfaction, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Satisfaction indicator',
      expected: '98% Satisfaction should be visible',
      findingName: 'satisfaction-missing'
    });

    await expectVisibleWithEvidence(page, dashboard.choosePackage, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Package section',
      expected: 'Choose Your Package should be visible',
      findingName: 'choose-package-section-missing'
    });

    await expectVisibleWithEvidence(page, dashboard.secureConfidential, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Secure and confidential section',
      expected: 'Secure & Confidential should be visible',
      findingName: 'secure-confidential-missing'
    });

    await expectVisibleWithEvidence(page, dashboard.needHelp, {
      module: 'dashboard',
      pageName: 'Dashboard',
      check: 'Help section',
      expected: 'Need help? Contact us should be visible',
      findingName: 'help-section-missing'
    });
  });

  test('Dashboard navigation controls are available', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const dashboard = new DashboardPage(page);

    const navigation = [
      ['Dashboard', dashboard.navDashboard],
      ['Tests', dashboard.navTests],
      ['Results', dashboard.navResults],
      ['Buy', dashboard.navBuy],
      ['Settings', dashboard.navSettings]
    ];

    for (const [name, locator] of navigation) {
      await expectVisibleWithEvidence(page, locator, {
        module: 'dashboard',
        pageName: 'Dashboard',
        check: `${name} navigation control`,
        expected: `${name} navigation control should be visible`,
        findingName: `${name}-navigation-missing`
      });

      await expect(locator).toBeEnabled();
    }
  });

  test('Dashboard heading typography and dimensions are valid', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const dashboard = new DashboardPage(page);

    const snapshot = await inspectElement(
      dashboard.heading,
      'Dashboard heading'
    );

    if (!snapshot.visible || snapshot.size.width <= 0 || snapshot.size.height <= 0) {
      const screenshot = await captureFindingScreenshot(page, {
        module: 'dashboard',
        name: 'dashboard-heading-invalid-dimensions',
        locator: dashboard.heading
      });

      await recordFinding(page, {
        module: 'dashboard',
        page: 'Dashboard',
        check: 'Dashboard heading dimensions',
        expected: 'Heading should be visible with non-zero dimensions',
        actual: JSON.stringify(snapshot),
        severity: 'High',
        screenshot
      });

      throw new Error('Dashboard heading has invalid dimensions');
    }

    expect(snapshot.typography.fontFamily).toBeTruthy();
    expect(snapshot.typography.fontSize).toBeTruthy();
    expect(snapshot.typography.fontWeight).toBeTruthy();
    expect(snapshot.typography.lineHeight).toBeTruthy();
    expect(snapshot.typography.color).toBeTruthy();
  });

  test('Dashboard images are loaded', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const image = images.nth(i);

      if (!(await image.isVisible().catch(() => false))) {
        continue;
      }

      const loaded = await image.evaluate(img => {
        return img.complete && img.naturalWidth > 0;
      });

      if (!loaded) {
        const screenshot = await captureFindingScreenshot(page, {
          module: 'dashboard',
          name: `broken-image-${i}`,
          locator: image
        });

        await recordFinding(page, {
          module: 'dashboard',
          page: 'Dashboard',
          check: `Dashboard image ${i + 1}`,
          expected: 'Image should load successfully',
          actual: 'Image failed to load',
          severity: 'Medium',
          screenshot
        });

        throw new Error(`Dashboard image ${i + 1} failed to load`);
      }
    }
  });

  test('Dashboard does not contain horizontal overflow', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));

    if (dimensions.documentWidth > dimensions.viewportWidth + 1) {
      const screenshot = await captureFindingScreenshot(page, {
        module: 'dashboard',
        name: 'horizontal-overflow',
        fullPage: true
      });

      await recordFinding(page, {
        module: 'dashboard',
        page: 'Dashboard',
        check: 'Horizontal overflow',
        expected: `Document width should not exceed viewport width (${dimensions.viewportWidth}px)`,
        actual: `Document width is ${dimensions.documentWidth}px`,
        severity: 'Medium',
        screenshot
      });

      throw new Error(
        `Dashboard has horizontal overflow: ${dimensions.documentWidth}px > ${dimensions.viewportWidth}px`
      );
    }

    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );
  });
});