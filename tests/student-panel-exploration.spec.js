require('dotenv').config();

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.setTimeout(120000);

test('Student Panel Complete UI Exploration', async ({ page }) => {
  // ============================================================
  // CONFIGURATION
  // ============================================================

  const loginUrl = '/student/login';
  const dashboardUrl = '/student/dashboard';

  const modules = [
    {
      name: 'Dashboard',
      url: '/student/dashboard'
    },
    {
      name: 'Tests',
      url: '/student/my-test'
    },
    {
      name: 'Results',
      url: '/student/my-reports'
    },
    {
      name: 'Buy Tests',
      url: '/student/packages'
    },
    {
      name: 'Settings',
      url: '/student/settings'
    }
  ];

  const inventory = {
    generatedAt: new Date().toISOString(),
    login: {},
    pages: [],
    tabs: [],
    sections: [],
    detailViews: [],
    navigationItems: [],
    consoleErrors: [],
    failedRequests: [],
    brokenImages: [],
    summary: {}
  };

  const visitedUrls = new Set();

  // ============================================================
  // CONSOLE / NETWORK MONITORING
  // ============================================================

  page.on('console', message => {
    if (message.type() === 'error') {
      inventory.consoleErrors.push({
        type: message.type(),
        text: message.text()
      });
    }
  });

  page.on('requestfailed', request => {
    inventory.failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'Unknown failure'
    });
  });

  // ============================================================
  // HELPERS
  // ============================================================

  function printSection(title) {
    console.log('\n========================================');
    console.log(title);
    console.log('========================================\n');
  }

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  async function waitForPageStability() {
    await page.waitForLoadState('domcontentloaded', {
      timeout: 15000
    }).catch(() => {});

    await page.waitForLoadState('networkidle', {
      timeout: 10000
    }).catch(() => {});

    await page.waitForTimeout(500);
  }

  async function closeOpenDialogs() {
    const dialogs = page.locator('[role="dialog"]');

    if (await dialogs.count() === 0) {
      return;
    }

    console.log('Open dialog detected. Attempting safe close...');

    const dialog = dialogs.last();

    if (!(await dialog.isVisible().catch(() => false))) {
      return;
    }

    // First preference: buttons explicitly labelled Close / Cancel.
    const closeButtons = dialog.getByRole('button', {
      name: /^(close|cancel)$/i
    });

    if (await closeButtons.count() > 0) {
      for (let i = 0; i < await closeButtons.count(); i++) {
        const button = closeButtons.nth(i);

        if (await button.isVisible().catch(() => false)) {
          await button.click({ force: true }).catch(() => {});
          await page.waitForTimeout(300);
          break;
        }
      }
    }

    // Second preference: buttons with common close attributes.
    if (await dialogs.count() > 0) {
      const attributeClose = page.locator(
        '[role="dialog"] button[aria-label*="close" i], ' +
        '[role="dialog"] button[title*="close" i]'
      );

      if (await attributeClose.count() > 0) {
        await attributeClose.first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    // Last safe fallback: press Escape.
    if (await dialogs.count() > 0) {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);
    }

    // Wait until dialog is no longer visible.
    await expect(dialog).toBeHidden({
      timeout: 3000
    }).catch(() => {});
  }

  async function ensureNoBlockingDialog() {
    await closeOpenDialogs();

    const visibleOverlay = page.locator(
      '[data-state="open"].fixed.inset-0.z-50'
    );

    if (await visibleOverlay.count() > 0) {
      for (let i = 0; i < await visibleOverlay.count(); i++) {
        const overlay = visibleOverlay.nth(i);

        if (await overlay.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(300);
        }
      }
    }
  }

  async function inspectBrokenImages() {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const image = images.nth(i);

      const result = await image.evaluate(img => ({
        src: img.currentSrc || img.src || '',
        alt: img.alt || '',
        complete: img.complete,
        naturalWidth: img.naturalWidth
      })).catch(() => null);

      if (
        result &&
        result.src &&
        result.complete &&
        result.naturalWidth === 0
      ) {
        inventory.brokenImages.push({
          url: page.url(),
          src: result.src,
          alt: result.alt
        });
      }
    }
  }

  async function inspectPage(pageName) {
    await waitForPageStability();

    const headings = await page.locator('h1,h2,h3,h4,h5,h6').allTextContents();

    const counts = {
      inputs: await page.locator('input').count(),
      buttons: await page.locator('button').count(),
      links: await page.locator('a').count(),
      images: await page.locator('img').count(),
      svgs: await page.locator('svg').count(),
      tables: await page.locator('table').count(),
      rows: await page.locator('tr').count(),
      forms: await page.locator('form').count(),
      dialogs: await page.locator('[role="dialog"]').count(),
      tabs: await page.locator(
        '[role="tab"], button[aria-selected], [data-state="active"]'
      ).count(),
      selects: await page.locator('select').count(),
      textareas: await page.locator('textarea').count()
    };

    const bodyText = normalizeText(
      await page.locator('body').innerText().catch(() => '')
    );

    const pageData = {
      name: pageName,
      url: page.url(),
      title: await page.title(),
      headings: headings.map(normalizeText).filter(Boolean),
      counts,
      textPreview: bodyText.substring(0, 3000),
      inspectedAt: new Date().toISOString()
    };

    inventory.pages.push(pageData);

    visitedUrls.add(page.url());

    await inspectBrokenImages();

    console.log(`\n========================================`);
    console.log(`PAGE DISCOVERED: ${pageName}`);
    console.log(`========================================`);
    console.log(`URL: ${page.url()}`);
    console.log(`Title: ${pageData.title}`);

    console.log('\nHeadings:');
    console.log(pageData.headings);

    console.log('\nElement Counts:');
    console.log(counts);

    console.log('\nPage Text Preview:');
    console.log(pageData.textPreview);
  }

  // ============================================================
  // SAFE ACTION FILTERS
  // ============================================================

  const destructivePattern =
    /delete|deletion|remove|logout all|log out all|terminate account|close account/i;

  const businessActionPattern =
    /buy|purchase|select package|get free plan|activate|checkout|pay|payment|upgrade|start test|start assessment|begin test|begin assessment|submit|finish|complete test/i;

  const globalControlPattern =
    /notification|tour guide|theme|dark mode|light mode|toggle sidebar|open menu|close menu/i;

  function isSafeButtonText(text) {
    const value = normalizeText(text);

    if (!value) {
      return false;
    }

    if (destructivePattern.test(value)) {
      return false;
    }

    if (businessActionPattern.test(value)) {
      return false;
    }

    if (globalControlPattern.test(value)) {
      return false;
    }

    return true;
  }

  // ============================================================
  // SAFE DETAIL VIEW DISCOVERY
  // ============================================================

  async function discoverDetailViews(pageName) {
    console.log('\n----------------------------------------');
    console.log('DETAIL VIEW DISCOVERY');
    console.log('----------------------------------------');

    await ensureNoBlockingDialog();

    const buttons = page.locator('button');
    const count = await buttons.count();

    const candidates = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      const visible = await button.isVisible().catch(() => false);

      if (!visible) {
        continue;
      }

      const text = normalizeText(
        await button.innerText().catch(() => '')
      );

      const ariaLabel = normalizeText(
        await button.getAttribute('aria-label').catch(() => '')
      );

      const title = normalizeText(
        await button.getAttribute('title').catch(() => '')
      );

      const combined = normalizeText(
        `${text} ${ariaLabel} ${title}`
      );

      if (!isSafeButtonText(combined)) {
        continue;
      }

      // Avoid navigation controls and generic controls.
      if (
        /dashboard|my tests|results|buy tests|settings|back|next|previous/i.test(
          combined
        )
      ) {
        continue;
      }

      // Only consider buttons that look like a possible view/details action.
      if (
        /view|details|open|more|information|info|show/i.test(combined)
      ) {
        candidates.push({
          index: i,
          text: combined
        });
      }
    }

    console.log(`Potential safe detail actions found: ${candidates.length}`);

    for (const candidate of candidates) {
      await ensureNoBlockingDialog();

      const buttonsNow = page.locator('button');

      if (candidate.index >= await buttonsNow.count()) {
        continue;
      }

      const button = buttonsNow.nth(candidate.index);

      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }

      const beforeUrl = page.url();

      console.log(`Safe detail candidate: ${candidate.text}`);

      await button.click({ timeout: 5000 }).catch(() => null);

      await waitForPageStability();

      const afterUrl = page.url();

      const dialogCount = await page.locator('[role="dialog"]').count();

      if (afterUrl !== beforeUrl || dialogCount > 0) {
        inventory.detailViews.push({
          page: pageName,
          action: candidate.text,
          beforeUrl,
          afterUrl,
          dialogOpened: dialogCount > 0
        });

        console.log(
          `Detail view recorded: ${candidate.text}`
        );

        await inspectPage(
          `Detail: ${candidate.text}`
        );
      }

      await ensureNoBlockingDialog();

      // If the click changed the URL, return to the original page.
      if (page.url() !== beforeUrl) {
        await page.goto(beforeUrl, {
          waitUntil: 'domcontentloaded'
        }).catch(() => {});

        await waitForPageStability();
      }
    }
  }

  // ============================================================
  // SAFE SECTION DISCOVERY
  // ============================================================

  async function discoverSafeSections(pageName) {
    console.log('\n----------------------------------------');
    console.log('SAFE SECTION DISCOVERY');
    console.log('----------------------------------------');

    await ensureNoBlockingDialog();

    const candidates = [];

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }

      const text = normalizeText(
        await button.innerText().catch(() => '')
      );

      const ariaLabel = normalizeText(
        await button.getAttribute('aria-label').catch(() => '')
      );

      const title = normalizeText(
        await button.getAttribute('title').catch(() => '')
      );

      const dataTour = await button
        .getAttribute('data-tour')
        .catch(() => '');

      const combined = normalizeText(
        `${text} ${ariaLabel} ${title}`
      );

      // Navigation controls are not sections.
      if (dataTour && dataTour.startsWith('nav-')) {
        continue;
      }

      if (!isSafeButtonText(combined)) {
        continue;
      }

      // Global controls are not page sections.
      if (globalControlPattern.test(combined)) {
        continue;
      }

      // Ignore empty icon buttons.
      if (!combined) {
        continue;
      }

      // Look for likely section-opening controls.
      if (
        /download information|change password|edit|profile|security|parent information|push notifications/i.test(
          combined
        )
      ) {
        candidates.push({
          index: i,
          text: combined
        });
      }
    }

    // Also inspect buttons with aria-expanded that may expose sections.
    const expandedButtons = page.locator(
      'button[aria-expanded="false"], button[aria-expanded="true"]'
    );

    const expandedCount = await expandedButtons.count();

    for (let i = 0; i < expandedCount; i++) {
      const button = expandedButtons.nth(i);

      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }

      const text = normalizeText(
        await button.innerText().catch(() => '')
      );

      if (
        text &&
        isSafeButtonText(text) &&
        !candidates.some(candidate => candidate.text === text)
      ) {
        candidates.push({
          text,
          locatorType: 'expanded'
        });
      }
    }

    console.log(`Potential safe sections found: ${candidates.length}`);

    for (const candidate of candidates) {
      await ensureNoBlockingDialog();

      let button;

      if (candidate.locatorType === 'expanded') {
        button = page.getByRole('button', {
          name: candidate.text,
          exact: true
        }).first();
      } else {
        button = page.locator('button').nth(candidate.index);
      }

      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }

      console.log(`\nSECTION CANDIDATE: ${candidate.text}`);

      const beforeUrl = page.url();

      await button.click({
        timeout: 5000
      }).catch(() => null);

      await waitForPageStability();

      const dialog = page.locator('[role="dialog"]');

      const dialogVisible =
        await dialog.count() > 0 &&
        await dialog.last().isVisible().catch(() => false);

      const afterUrl = page.url();

      inventory.sections.push({
        page: pageName,
        section: candidate.text,
        beforeUrl,
        afterUrl,
        dialogOpened: dialogVisible
      });

      await inspectPage(
        `Section: ${candidate.text}`
      );

      // --------------------------------------------------------
      // IMPORTANT:
      // Close dialogs before returning to navigation.
      // This prevents the overlay from intercepting clicks.
      // --------------------------------------------------------

      if (dialogVisible) {
        console.log(
          `Dialog detected for section: ${candidate.text}`
        );

        await closeOpenDialogs();
      }

      await ensureNoBlockingDialog();

      // If the section changed the URL, restore the original page.
      if (page.url() !== beforeUrl) {
        await page.goto(beforeUrl, {
          waitUntil: 'domcontentloaded'
        }).catch(() => {});

        await waitForPageStability();
      }
    }

    // Final cleanup.
    await ensureNoBlockingDialog();
  }

  // ============================================================
  // TAB DISCOVERY
  // ============================================================

  async function discoverTabs(pageName) {
    console.log('\n----------------------------------------');
    console.log('TAB DISCOVERY');
    console.log('----------------------------------------');

    await ensureNoBlockingDialog();

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount === 0) {
      console.log('No standard tabs found.');
      return;
    }

    for (let i = 0; i < tabCount; i++) {
      await ensureNoBlockingDialog();

      const tab = tabs.nth(i);

      if (!(await tab.isVisible().catch(() => false))) {
        continue;
      }

      const tabText = normalizeText(
        await tab.innerText().catch(() => '')
      );

      if (!tabText) {
        continue;
      }

      console.log(`\nTAB: ${tabText}`);

      await tab.click({
        timeout: 5000
      }).catch(() => null);

      await waitForPageStability();

      const tabUrl = page.url();

      inventory.tabs.push({
        page: pageName,
        tab: tabText,
        url: tabUrl
      });

      await inspectPage(
        `Tab: ${tabText}`
      );

      await discoverDetailViews(
        `Tab: ${tabText}`
      );

      await discoverSafeSections(
        `Tab: ${tabText}`
      );

      await ensureNoBlockingDialog();
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================

  printSection('STUDENT PANEL COMPLETE UI EXPLORATION');

  console.log(`Login URL: ${process.env.BASE_URL || loginUrl}`);

  await page.goto(loginUrl, {
    waitUntil: 'domcontentloaded'
  });

  await waitForPageStability();

  console.log(`Login Title: ${await page.title()}`);

  inventory.login = {
    url: page.url(),
    title: await page.title()
  };

  const emailInput = page.locator(
    'input[name="email"], input[placeholder="Email or Username"]'
  ).first();

  const passwordInput = page.locator(
    'input[name="password"], input[placeholder="Password"]'
  ).first();

  await expect(emailInput).toBeVisible({
    timeout: 15000
  });

  await expect(passwordInput).toBeVisible({
    timeout: 15000
  });

  const username = process.env.STUDENT_USERNAME || process.env.EMAIL;
  const password = process.env.STUDENT_PASSWORD || process.env.PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Student credentials were not found in .env. ' +
      'Expected STUDENT_USERNAME/STUDENT_PASSWORD or EMAIL/PASSWORD.'
    );
  }

  await emailInput.fill(username);
  await passwordInput.fill(password);

  const continueButton = page.getByRole('button', {
    name: /^Continue$/i
  });

  await expect(continueButton).toBeVisible({
    timeout: 10000
  });

  await continueButton.click();

  await page.waitForURL(
    /\/student\/dashboard/,
    {
      timeout: 30000
    }
  );

  await waitForPageStability();

  console.log('\nLOGIN SUCCESSFUL.');
  console.log(`Dashboard URL: ${page.url()}`);
  console.log(`Dashboard Title: ${await page.title()}`);

  // ============================================================
  // PRIMARY MODULE EXPLORATION
  // ============================================================

  for (const module of modules) {
    printSection(`PRIMARY MODULE: ${module.name}`);

    console.log(`Module URL: ${module.url}`);

    await ensureNoBlockingDialog();

    // Dashboard is already loaded after login.
    if (!page.url().includes(module.url)) {
      await page.goto(module.url, {
        waitUntil: 'domcontentloaded'
      });

      await waitForPageStability();
    }

    await inspectPage(module.name);

    // ----------------------------------------------------------
    // Navigation inventory
    // ----------------------------------------------------------

    if (module.name === 'Dashboard') {
      const navButtons = page.locator(
        '[data-tour^="nav-"]'
      );

      const navCount = await navButtons.count();

      for (let i = 0; i < navCount; i++) {
        const nav = navButtons.nth(i);

        if (!(await nav.isVisible().catch(() => false))) {
          continue;
        }

        const text = normalizeText(
          await nav.innerText().catch(() => '')
        );

        const tour = await nav
          .getAttribute('data-tour')
          .catch(() => '');

        inventory.navigationItems.push({
          text,
          dataTour: tour
        });
      }
    }

    // ----------------------------------------------------------
    // Tabs
    // ----------------------------------------------------------

    await discoverTabs(module.name);

    // ----------------------------------------------------------
    // Safe sections
    // ----------------------------------------------------------

    await discoverSafeSections(module.name);

    // ----------------------------------------------------------
    // Safe detail views
    // ----------------------------------------------------------

    await discoverDetailViews(module.name);

    // ----------------------------------------------------------
    // Cleanup before next module
    // ----------------------------------------------------------

    await ensureNoBlockingDialog();

    // ----------------------------------------------------------
    // Return to Dashboard
    // ----------------------------------------------------------

    if (module.name !== 'Settings') {
      console.log('\nReturning to Dashboard...');

      await ensureNoBlockingDialog();

      await page.goto(dashboardUrl, {
        waitUntil: 'domcontentloaded'
      }).catch(() => {});

      await waitForPageStability();

      await ensureNoBlockingDialog();

      console.log(
        `Returned URL: ${page.url()}`
      );
    }
  }

  // ============================================================
  // FINAL DASHBOARD STATE
  // ============================================================

  await ensureNoBlockingDialog();

  if (!page.url().includes('/student/dashboard')) {
    await page.goto(dashboardUrl, {
      waitUntil: 'domcontentloaded'
    }).catch(() => {});

    await waitForPageStability();
  }

  // ============================================================
  // SUMMARY
  // ============================================================

  inventory.summary = {
    pagesExplored: inventory.pages.length,
    detailViews: inventory.detailViews.length,
    tabsExplored: inventory.tabs.length,
    sectionsExplored: inventory.sections.length,
    navigationItems: inventory.navigationItems.length,
    uiElementsInspected: inventory.pages.reduce(
      (total, pageData) => {
        const counts = pageData.counts;

        return total +
          counts.inputs +
          counts.buttons +
          counts.links +
          counts.images +
          counts.svgs +
          counts.tables +
          counts.rows +
          counts.forms +
          counts.dialogs +
          counts.tabs +
          counts.selects +
          counts.textareas;
      },
      0
    ),
    consoleErrors: inventory.consoleErrors.length,
    failedRequests: inventory.failedRequests.length,
    brokenImages: inventory.brokenImages.length,
    discoveredUrls: Array.from(visitedUrls)
  };

  // ============================================================
  // SAVE INVENTORY
  // ============================================================

  const reportsDirectory = path.resolve(
    process.cwd(),
    'reports'
  );

  fs.mkdirSync(reportsDirectory, {
    recursive: true
  });

  const inventoryPath = path.join(
    reportsDirectory,
    'student-panel-ui-inventory.json'
  );

  fs.writeFileSync(
    inventoryPath,
    JSON.stringify(inventory, null, 2),
    'utf8'
  );

  // ============================================================
  // FINAL OUTPUT
  // ============================================================

  printSection('STUDENT PANEL EXPLORATION COMPLETE');

  console.log(
    `Pages Explored: ${inventory.summary.pagesExplored}`
  );

  console.log(
    `Detail Views: ${inventory.summary.detailViews}`
  );

  console.log(
    `Tabs Explored: ${inventory.summary.tabsExplored}`
  );

  console.log(
    `Sections Explored: ${inventory.summary.sectionsExplored}`
  );

  console.log(
    `Navigation Items: ${inventory.summary.navigationItems}`
  );

  console.log(
    `UI Elements Inspected: ${inventory.summary.uiElementsInspected}`
  );

  console.log(
    `Console Errors: ${inventory.summary.consoleErrors}`
  );

  console.log(
    `Failed Requests: ${inventory.summary.failedRequests}`
  );

  console.log(
    `Broken Images: ${inventory.summary.brokenImages}`
  );

  console.log('\nDiscovered URLs:');

  for (const url of inventory.summary.discoveredUrls) {
    console.log(`- ${url}`);
  }

  console.log(
    `\nInventory saved to: ${inventoryPath}`
  );

  console.log('\n========================================\n');
});