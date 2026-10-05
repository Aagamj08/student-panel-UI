const { test, expect } = require('../../fixtures/auth.fixture');
const { SettingsPage } = require('../../pages/SettingsPage');
const {
  expectVisibleWithEvidence
} = require('../../utils/uiAssertions');
const { captureFindingScreenshot } = require('../../utils/screenshotEvidence');
const { recordFinding } = require('../../utils/findingReporter');

test.describe('Settings UI Automation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const settings = new SettingsPage(authenticatedPage);
    await settings.goto();
  });

  test('Settings page loads correctly', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const settings = new SettingsPage(page);

    await expect(page).toHaveURL(/\/student\/settings/);

    await expectVisibleWithEvidence(page, settings.heading, {
      module: 'settings',
      pageName: 'Settings',
      check: 'Settings heading',
      expected: 'Settings heading should be visible',
      findingName: 'settings-heading-missing'
    });
  });

  test('Settings navigation control is available', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const settings = new SettingsPage(page);

    await expectVisibleWithEvidence(page, settings.navSettings, {
      module: 'settings',
      pageName: 'Settings',
      check: 'Settings navigation control',
      expected: 'Settings navigation control should be visible',
      findingName: 'settings-navigation-missing'
    });

    await expect(settings.navSettings).toBeEnabled();
  });

  test('Safe Settings actions are available', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;
    const settings = new SettingsPage(page);

    const editCount = await settings.editButton.count();

    if (editCount > 0) {
      await expectVisibleWithEvidence(page, settings.editButton, {
        module: 'settings',
        pageName: 'Settings',
        check: 'Edit button',
        expected: 'Edit button should be visible',
        findingName: 'settings-edit-button-missing'
      });

      await expect(settings.editButton).toBeEnabled();
    }

    const downloadCount =
      await settings.downloadInformationButton.count();

    if (downloadCount > 0) {
      await expectVisibleWithEvidence(
        page,
        settings.downloadInformationButton,
        {
          module: 'settings',
          pageName: 'Settings',
          check: 'Download Information button',
          expected: 'Download Information button should be visible',
          findingName: 'download-information-button-missing'
        }
      );

      await expect(
        settings.downloadInformationButton
      ).toBeEnabled();
    }
  });

  test('Settings page does not contain horizontal overflow', async ({
    authenticatedPage
  }) => {
    const page = authenticatedPage;

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));

    if (dimensions.documentWidth > dimensions.viewportWidth + 1) {
      const screenshot = await captureFindingScreenshot(page, {
        module: 'settings',
        name: 'horizontal-overflow',
        fullPage: true
      });

      await recordFinding(page, {
        module: 'settings',
        page: 'Settings',
        check: 'Horizontal overflow',
        expected: `Document width should not exceed viewport width (${dimensions.viewportWidth}px)`,
        actual: `Document width is ${dimensions.documentWidth}px`,
        severity: 'Medium',
        screenshot
      });

      throw new Error(
        `Settings has horizontal overflow: ${dimensions.documentWidth}px > ${dimensions.viewportWidth}px`
      );
    }

    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );
  });
});