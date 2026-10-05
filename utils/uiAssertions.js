const { expect } = require('@playwright/test');
const { captureFindingScreenshot } = require('./screenshotEvidence');
const { recordFinding } = require('./findingReporter');

async function captureEvidenceSafely(page, options) {
  try {
    return await captureFindingScreenshot(page, options);
  } catch {
    try {
      return await captureFindingScreenshot(page, {
        module: options.module,
        name: options.name,
        fullPage: true
      });
    } catch {
      return null;
    }
  }
}

async function expectVisibleWithEvidence(
  page,
  locator,
  {
    module,
    pageName,
    check,
    expected,
    findingName,
    severity = 'High'
  }
) {
  try {
    await expect(locator).toBeVisible({
      timeout: 10000
    });
  } catch (error) {
    const screenshot = await captureEvidenceSafely(page, {
      module,
      name: findingName || check,
      locator
    });

    await recordFinding(page, {
      module,
      page: pageName,
      check,
      expected,
      actual: 'Element was not visible or could not be located',
      severity,
      screenshot
    });

    throw error;
  }
}

async function expectTextWithEvidence(
  page,
  locator,
  expectedText,
  {
    module,
    pageName,
    check,
    findingName,
    severity = 'Medium'
  }
) {
  try {
    await expect(locator).toContainText(expectedText, {
      timeout: 10000
    });
  } catch (error) {
    const screenshot = await captureEvidenceSafely(page, {
      module,
      name: findingName || check,
      locator
    });

    let actual = 'Unable to read element text';

    try {
      actual = await locator.textContent();
    } catch {
      // Keep fallback value.
    }

    await recordFinding(page, {
      module,
      page: pageName,
      check,
      expected: expectedText,
      actual: actual || 'Element was not found',
      severity,
      screenshot
    });

    throw error;
  }
}

module.exports = {
  expectVisibleWithEvidence,
  expectTextWithEvidence
};