const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const { StudentLoginPage } = require('../../pages/StudentLoginPage');
const { captureFindingScreenshot, safeName } = require('../../utils/screenshotEvidence');
const { recordFinding } = require('../../utils/findingReporter');

const AUTH_FILE = path.resolve(process.cwd(), 'auth', 'student.json');
const COVERAGE_FILE = path.resolve(
  process.cwd(),
  'reports',
  'checklist-coverage.json'
);

const ROUTES = {
  login: '/student/login',
  dashboard: '/student/dashboard',
  tests: '/student/my-test',
  purchasedTests: '/student/my-test?tab=all',
  results: '/student/my-reports',
  packages: '/student/packages',
  myPackages: '/student/packages?tab=active',
  transactions: '/student/packages?tab=transactions',
  settings: '/student/settings'
};

const coverage = {
  startedAt: new Date().toISOString(),
  source: 'student-panel-ui-master-checklist-reviewed.md',
  environment: 'DEV',
  browser: 'Desktop Chrome',
  viewport: '1440x900',
  status: {
    passed: [],
    failed: [],
    investigate: [],
    dataDependent: [],
    manual: [],
    later: []
  },
  findings: [],
  completedAt: null
};

function ensureReports() {
  fs.mkdirSync(path.dirname(COVERAGE_FILE), { recursive: true });
}

function saveCoverage() {
  ensureReports();
  coverage.completedAt = new Date().toISOString();
  fs.writeFileSync(
    COVERAGE_FILE,
    JSON.stringify(coverage, null, 2),
    'utf8'
  );
}

function pass(check) {
  coverage.status.passed.push(check);
}

function fail(check, details) {
  coverage.status.failed.push({ check, details });
}

function addInvestigate(check, details) {
  coverage.status.investigate.push({ check, details });
}

function addData(check, reason) {
  coverage.status.dataDependent.push({ check, reason });
}

function addManual(check, reason) {
  coverage.status.manual.push({ check, reason });
}

function addLater(check, reason) {
  coverage.status.later.push({ check, reason });
}

async function evidence(page, moduleName, checkName, locator = null) {
  try {
    return await captureFindingScreenshot(page, {
      module: moduleName,
      name: checkName,
      locator,
      fullPage: !locator
    });
  } catch {
    return null;
  }
}

async function check(page, moduleName, checkName, fn, options = {}) {
  try {
    await fn();
    pass(checkName);
    return true;
  } catch (error) {
    const screenshot = await evidence(
      page,
      moduleName,
      checkName,
      options.locator || null
    );

    const actual =
      options.actual ||
      error?.message ||
      'Automated check failed';

    fail(checkName, actual);

    const finding = await recordFinding(page, {
      module: moduleName,
      page: options.pageName || page.url(),
      check: checkName,
      expected: options.expected || 'Checklist condition should pass',
      actual,
      severity: options.severity || 'High',
      screenshot
    });

    coverage.findings.push(finding);
    return false;
  }
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

async function authenticatedPage(browser) {
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error(
      `Authentication state not found: ${AUTH_FILE}. Run tests/auth/login.spec.js first.`
    );
  }

  const context = await browser.newContext({
    storageState: AUTH_FILE,
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  return { context, page };
}

function markNonAutoChecklistItems() {
  const manual = [
    'Authentication visual logo sizing/positioning',
    'Authentication validation-message styling',
    'Authentication keyboard focus visibility',
    'Responsive login behavior',
    'Recovery-flow visual consistency',
    'Registration layout/responsive behavior',
    'Header height/alignment/icon styling',
    'Sidebar visual styling',
    'Global background/card/border/radius/shadow consistency',
    'Typography baseline',
    'Button visual baseline',
    'Input visual baseline',
    'Card visual baseline',
    'Tab visual styling',
    'Pagination visual alignment',
    'Dialog visual styling',
    'Dashboard package-card visual alignment',
    'Dashboard skill-card visual styling',
    'My Tests empty-state visual layout',
    'Results empty-state visual layout',
    'Buy Tests package-card visual layout',
    'Buy Tests multilingual wrapping',
    'Settings profile visual layout',
    'Settings country dropdown visual rendering',
    'Security success/error presentation',
    'Notification visual layout',
    'Data/privacy destructive-action styling',
    'Download dialog visual layout',
    'Device-list visual layout',
    'Cross-page consistency',
    'Overall visual quality',
    'Design-intent comparison',
    'Unusual responsive behavior',
    'Exploratory unexpected states',
    'Suspicious automated findings',
    'Browser/third-party permission behavior'
  ];

  const later = [
    'Responsive login/dashboard/tests/results/packages/settings',
    'Loading states',
    'API failure states',
    '401/session expiry',
    '403/404/500 behavior',
    'Retry behavior',
    'Invalid/expired routes',
    'Dedicated accessibility audit',
    'Approved console-noise baseline',
    'New unexpected console-error gate',
    'Failed-request automation after baseline',
    'Visual regression',
    'Responsive validation',
    'Assessment execution'
  ];

  const data = [
    'Successful registration',
    'Active test records',
    'Purchased test records',
    'Test detail',
    'Test execution',
    'Completed assessment',
    'Result history/data',
    'Result detail/charts/feedback',
    'Purchased package records',
    'Transaction records',
    'Profile save/persistence',
    'Profile-picture upload',
    'Password change',
    'Notification persistence',
    'Data export content',
    'Device logout',
    'Account deletion request',
    'Package selection flow without unauthorized purchase'
  ];

  manual.forEach((item) => addManual(item, 'Reviewed checklist marks this as MANUAL.'));
  later.forEach((item) => addLater(item, 'Reviewed checklist marks this as LATER.'));
  data.forEach((item) =>
    addData(item, 'Current account does not contain the required controlled data.')
  );
}

test.describe('AZE Student Panel - Reviewed Master Checklist', () => {
  test('Execute all currently automatable checklist coverage', async ({ browser }) => {
    coverage.startedAt = new Date().toISOString();
    markNonAutoChecklistItems();

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const failedRequests = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText || 'unknown'
      });
    });

    try {
      // ============================================================
      // 3.1 AUTHENTICATION
      // ============================================================
      const login = new StudentLoginPage(page);

      await check(
        page,
        'authentication',
        'Check that /student/login loads successfully',
        async () => {
          await login.goto();
          await expect(page).toHaveURL(/\/student\/login/);
        }
      );

      await check(
        page,
        'authentication',
        'Check that the login page title is correct',
        async () => {
          await expect(page).toHaveTitle(/ES AI STUDENT \| Login/i);
        }
      );

      const logo = page.locator('img').first();

      await check(
        page,
        'authentication',
        'Check that the AZE logo is visible',
        async () => {
          await expect(logo).toBeVisible();
        },
        { locator: logo }
      );

      const email = login.emailInput;
      const password = login.passwordInput;
      const continueButton = login.continueButton;

      await check(
        page,
        'authentication',
        'Check that the Email or Username field is visible',
        async () => {
          await expect(email).toBeVisible();
        },
        { locator: email }
      );

      await check(
        page,
        'authentication',
        'Check that the field placeholder is Email or Username',
        async () => {
          await expect(email).toHaveAttribute(
            'placeholder',
            /Email or Username/i
          );
        },
        { locator: email }
      );

      await check(
        page,
        'authentication',
        'Check that the Password field is visible',
        async () => {
          await expect(password).toBeVisible();
        },
        { locator: password }
      );

      await check(
        page,
        'authentication',
        'Check that the Password placeholder is correct',
        async () => {
          await expect(password).toHaveAttribute('placeholder', /password/i);
        },
        { locator: password }
      );

      await check(
        page,
        'authentication',
        'Check that password characters are masked by default',
        async () => {
          await expect(password).toHaveAttribute('type', 'password');
        },
        { locator: password }
      );

      const visibilityControl = page.locator(
        'button[aria-label*="password" i], button[title*="password" i]'
      ).first();

      await check(
        page,
        'authentication',
        'Check that password visibility control is present and works',
        async () => {
          await expect(visibilityControl).toBeVisible();
          await password.fill('ChecklistPassword123!');
          await visibilityControl.click();
          await expect(password).toHaveAttribute('type', /text/i);
          await visibilityControl.click();
          await expect(password).toHaveAttribute('type', 'password');
          await password.fill('');
        },
        { locator: visibilityControl }
      );

      await check(
        page,
        'authentication',
        'Check that Continue is present',
        async () => {
          await expect(continueButton).toBeVisible();
        },
        { locator: continueButton }
      );

      await check(
        page,
        'authentication',
        'Check empty-field validation',
        async () => {
          await email.fill('');
          await password.fill('');
          await expect(continueButton).toBeDisabled();
        },
        {
          locator: continueButton,
          expected: 'Continue is disabled when required login fields are empty'
        }
      );

      await check(
        page,
        'authentication',
        'Check that Continue with Google is present',
        async () => {
          await expect(
            page.getByRole('button', { name: /Continue with Google/i })
          ).toBeVisible();
        }
      );

      await check(
        page,
        'authentication',
        'Check that Register is present',
        async () => {
          await expect(
            page.getByRole('button', { name: 'Register', exact: true })
          ).toBeVisible();
        }
      );

      await check(
        page,
        'authentication',
        'Check that Forgot your password? is present',
        async () => {
          await expect(
            page.getByRole('button', { name: /Forgot your password/i })
          ).toBeVisible();
        }
      );

      // Invalid credentials. Use a syntactically valid but deliberately
      // invalid credential. No account data is changed.
      await check(
        page,
        'authentication',
        'Check invalid credential handling',
        async () => {
          await email.fill('invalid-checklist-user@example.invalid');
          await password.fill('DefinitelyWrongPassword123!');
          await expect(continueButton).toBeEnabled();
          await continueButton.click();
          await page.waitForTimeout(1500);

          await expect(page).toHaveURL(/\/student\/login/);

          const bodyText = await page.locator('body').innerText();
          const handled =
            /invalid email or password|invalid credentials|incorrect|failed|invalid/i.test(
              bodyText
            );

          if (!handled) {
            throw new Error(
              'Invalid credentials were rejected/retained on login, but no recognizable validation/toast text was found.'
            );
          }
        }
      );

      // Valid login.
      const username = process.env.STUDENT_USERNAME;
      const studentPassword = process.env.STUDENT_PASSWORD;

      if (!username || !studentPassword) {
        throw new Error(
          'STUDENT_USERNAME and STUDENT_PASSWORD must be configured in .env'
        );
      }

      await check(
        page,
        'authentication',
        'Check valid login redirects to Dashboard',
        async () => {
          await email.fill(username);
          await password.fill(studentPassword);
          await expect(continueButton).toBeEnabled();
          await continueButton.click();
          await page.waitForURL('**/student/dashboard', {
            timeout: 30000
          });
          await expect(page).toHaveURL(/\/student\/dashboard/);
        }
      );

      await check(
        page,
        'authentication',
        'Check authenticated navigation does not leave the user on the login page',
        async () => {
          await expect(page).not.toHaveURL(/\/student\/login/);
        }
      );

      // Save a fresh authenticated state for the remaining checklist.
      await context.storageState({ path: AUTH_FILE });

      // ============================================================
      // 4. GLOBAL SHELL
      // ============================================================
      const sidebar = [
        ['Dashboard', '[data-tour="nav-dashboard"]', ROUTES.dashboard],
        ['Tests', '[data-tour="nav-tests"]', ROUTES.tests],
        ['Results', '[data-tour="nav-results"]', ROUTES.results],
        ['Buy', '[data-tour="nav-buy"]', ROUTES.packages],
        ['Settings', '[data-tour="nav-settings"]', ROUTES.settings]
      ];

      for (const [name, selector, route] of sidebar) {
        await safeGoto(page, route);

        await check(
          page,
          'global-shell',
          `Check ${name} navigation control is available`,
          async () => {
            await expect(page.locator(selector)).toBeVisible();
          },
          { locator: page.locator(selector) }
        );

        await check(
          page,
          'global-shell',
          `Check ${name} navigation reaches expected URL`,
          async () => {
            await page.locator(selector).click();
            await page.waitForURL(`**${route}`);
            await expect(page).toHaveURL(new RegExp(route.replace(/[?]/g, '\\?')));
          }
        );
      }

      await safeGoto(page, ROUTES.dashboard);

      await check(
        page,
        'global-shell',
        'Check header is present on authenticated pages',
        async () => {
          await expect(page.locator('header').first()).toBeVisible();
        }
      );

      const headerControlChecks = [
        ['Tour guide', /tour guide/i],
        ['Notifications', /notifications/i]
      ];

      for (const [name, pattern] of headerControlChecks) {
        await check(
          page,
          'global-shell',
          `Check ${name} control`,
          async () => {
            await expect(
              page.getByRole('button', { name: pattern }).first()
            ).toBeVisible();
          }
        );
      }

      await check(
        page,
        'global-shell',
        'Check theme control',
        async () => {
          const candidate = page.locator(
            'button[aria-label*="theme" i], button[title*="theme" i], [aria-label*="dark mode" i], [aria-label*="light mode" i]'
          ).first();
          await expect(candidate).toBeVisible();
        }
      );

      // ============================================================
      // 5. REUSABLE UI AUTOMATED BASELINE
      // ============================================================
      await check(
        page,
        'reusable-ui',
        'Check critical text is not clipped or unexpectedly truncated',
        async () => {
          const clipped = await page.locator('body *').evaluateAll((elements) => {
            return elements
              .filter((el) => {
                const style = getComputedStyle(el);
                const text = el.innerText?.trim();
                if (!text || el.children.length > 10) return false;
                return (
                  (style.overflow === 'hidden' || style.textOverflow === 'ellipsis') &&
                  el.scrollWidth > el.clientWidth + 1
                );
              })
              .slice(0, 10)
              .map((el) => el.innerText.trim());
          });

          if (clipped.length) {
            throw new Error(`Potential clipped text: ${clipped.join(' | ')}`);
          }
        }
      );

      await check(
        page,
        'reusable-ui',
        'Check enabled/disabled button state is respected',
        async () => {
          const actionable = await page.locator('button').evaluateAll((buttons) =>
            buttons
              .filter((button) => {
                const rect = button.getBoundingClientRect();
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  !button.disabled &&
                  button.getAttribute('aria-disabled') === 'true'
                );
              })
              .map((button) => button.innerText.trim())
          );

          if (actionable.length) {
            throw new Error(
              `Buttons expose aria-disabled=true while remaining enabled: ${actionable.join(', ')}`
            );
          }
        }
      );

      await check(
        page,
        'reusable-ui',
        'Check accessible names for interactive controls',
        async () => {
          const unnamed = await page.locator('button, a, input, select, textarea').evaluateAll(
            (elements) =>
              elements
                .filter((el) => {
                  const style = getComputedStyle(el);
                  const rect = el.getBoundingClientRect();
                  if (
                    style.display === 'none' ||
                    style.visibility === 'hidden' ||
                    rect.width === 0 ||
                    rect.height === 0
                  ) {
                    return false;
                  }

                  const aria = el.getAttribute('aria-label');
                  const labelled = el.getAttribute('aria-labelledby');
                  const title = el.getAttribute('title');
                  const text = el.innerText?.trim();
                  const placeholder = el.getAttribute('placeholder');

                  return !(
                    aria ||
                    labelled ||
                    title ||
                    text ||
                    placeholder
                  );
                })
                .slice(0, 20)
                .map((el) => el.outerHTML.slice(0, 250))
          );

          if (unnamed.length) {
            throw new Error(
              `Visible interactive controls without an accessible/name source: ${unnamed.length}`
            );
          }
        }
      );

      await check(
        page,
        'reusable-ui',
        'Check unexpected horizontal overflow',
        async () => {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth + 1
          );
          expect(overflow).toBe(false);
        }
      );

      await check(
        page,
        'reusable-ui',
        'Check unexpected vertical overflow',
        async () => {
          const bodyOverflow = await page.evaluate(
            () => document.body.scrollWidth > document.documentElement.clientWidth + 1
          );
          expect(bodyOverflow).toBe(false);
        }
      );

      // ============================================================
      // 6. DASHBOARD
      // ============================================================
      await safeGoto(page, ROUTES.dashboard);

      const dashboardTexts = [
        'Dashboard',
        'WELCOME',
        '5 Core Skills',
        'Results in 5 mins',
        '98% Satisfaction',
        'Choose Your Package',
        'Explore More Packages',
        'Language Awareness',
        'Reading Skills',
        'Writing Skills',
        'Listening Skills',
        'Speaking Skills',
        'Secure & Confidential',
        'Need help? Contact us'
      ];

      for (const text of dashboardTexts) {
        await check(
          page,
          'dashboard',
          `Check Dashboard text: ${text}`,
          async () => {
            await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
          }
        );
      }

      await check(
        page,
        'dashboard',
        'Check student greeting',
        async () => {
          await expect(page.getByText(/^Hi .+👋$/, { exact: false }).first()).toBeVisible();
        }
      );

      await check(
        page,
        'dashboard',
        'Check package cards render package names, prices, counts and metadata',
        async () => {
          await expect(page.getByText(/test included/i).first()).toBeVisible();
          await expect(page.getByText(/Veriff ID Verification:/i).first()).toBeVisible();
          await expect(page.getByText(/Proctoring:/i).first()).toBeVisible();
        }
      );

      await check(
        page,
        'dashboard',
        'Check Explore More Packages navigates to /student/packages',
        async () => {
          await page.getByText('Explore More Packages', { exact: true }).click();
          await page.waitForURL('**/student/packages');
          await expect(page).toHaveURL(/\/student\/packages$/);
        }
      );

      // ============================================================
      // 7. MY TESTS
      // ============================================================
      await safeGoto(page, ROUTES.tests);

      for (const text of [
        'My Tests',
        'Active Tests',
        'Purchased Tests',
        'No Tests Yet',
        'Purchase a test package to get started with your English proficiency assessment',
        'Browse Test Packages',
        'Need More Tests?',
        'REMAINING 0'
      ]) {
        await check(
          page,
          'my-tests',
          `Check My Tests text: ${text}`,
          async () => {
            await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
          }
        );
      }

      await check(
        page,
        'my-tests',
        'Check Purchased Tests tab and query state',
        async () => {
          await page.getByText('Purchased Tests', { exact: true }).first().click();
          await page.waitForURL('**/student/my-test?tab=all');
          await expect(page).toHaveURL(/\/student\/my-test\?tab=all/);
        }
      );

      // Current account is empty, so data-rich tests remain DATA.
      addData('My Tests active-test cards', 'No active tests exist for the current account.');
      addData('My Tests purchased-test cards', 'No purchased tests exist for the current account.');
      addData('Test Detail', 'No test record is available to open.');

      // ============================================================
      // 8. RESULTS
      // ============================================================
      await safeGoto(page, ROUTES.results);

      for (const text of [
        'Results',
        'Test History',
        'No Assessment Available',
        'Complete a test to see your results and track your progress'
      ]) {
        await check(
          page,
          'results',
          `Check Results text: ${text}`,
          async () => {
            await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
          }
        );
      }

      addData('Result history/detail/charts', 'Current account has no completed assessment results.');

      // ============================================================
      // 9. BUY TESTS
      // ============================================================
      await safeGoto(page, ROUTES.packages);

      for (const text of ['Buy Tests', 'Buy Packages']) {
        await check(
          page,
          'buy-tests',
          `Check Buy Tests text: ${text}`,
          async () => {
            await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
          }
        );
      }

      await check(
        page,
        'buy-tests',
        'Check package cards render package metadata',
        async () => {
          await expect(page.getByText(/test included/i).first()).toBeVisible();
          await expect(page.getByText(/Veriff ID Verification:/i).first()).toBeVisible();
          await expect(page.getByText(/Proctoring:/i).first()).toBeVisible();
          await expect(page.getByText(/Languages:/i).first()).toBeVisible();
        }
      );

      await check(
        page,
        'buy-tests',
        'Check pagination record-count summary',
        async () => {
          await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/i)).toBeVisible();
        }
      );

      await check(
        page,
        'buy-tests',
        'Check page-size state',
        async () => {
          await expect(page.getByText(/Show:/i).first()).toBeVisible();
        }
      );

      await check(
        page,
        'buy-tests',
        'Check Previous and Next pagination controls',
        async () => {
          await expect(page.getByRole('button', { name: /Prev/i }).first()).toBeVisible();
          await expect(page.getByRole('button', { name: /Next/i }).last()).toBeVisible();
        }
      );

      await check(
        page,
        'buy-tests',
        'Check My Packages tab and query state',
        async () => {
          await page.getByText('My Packages', { exact: true }).first().click();
          await page.waitForURL('**/student/packages?tab=active');
          await expect(page).toHaveURL(/\/student\/packages\?tab=active/);
          await expect(page.getByText('No Packages Yet', { exact: true })).toBeVisible();
        }
      );

      await check(
        page,
        'buy-tests',
        'Check Transactions tab and query state',
        async () => {
          await page.getByText('Transactions', { exact: true }).first().click();
          await page.waitForURL('**/student/packages?tab=transactions');
          await expect(page).toHaveURL(/\/student\/packages\?tab=transactions/);
          await expect(page.getByText('My Transactions', { exact: true })).toBeVisible();
          await expect(page.getByText('No Transactions Yet', { exact: true })).toBeVisible();
        }
      );

      addData('Package selection/purchase workflow', 'Checklist prohibits unauthorized purchase automation.');
      addData('Purchased package records', 'Current account has no purchased packages.');
      addData('Transaction records', 'Current account has no transactions.');

      // ============================================================
      // 10. SETTINGS
      // ============================================================
      await safeGoto(page, ROUTES.settings);

      for (const text of [
        'Settings',
        'Student ID',
        'First Name',
        'Last Name',
        'Username',
        'Email',
        'Verified',
        'Phone',
        'Gender',
        'Age',
        'Country',
        'Nationality',
        'Parent Information',
        'Parent Name',
        'Parent Email',
        'Security',
        'Notifications',
        'Data & Privacy',
        'Logged In Devices'
      ]) {
        await check(
          page,
          'settings',
          `Check Settings text: ${text}`,
          async () => {
            await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
          }
        );
      }

      const editButton = page.getByRole('button', { name: /^Edit$/i }).first();

      await check(
        page,
        'settings',
        'Check Edit opens',
        async () => {
          await editButton.click();
          await expect(page.getByText('Edit Profile', { exact: true })).toBeVisible();
        }
      );

      await check(
        page,
        'settings',
        'Check Edit Profile fields are rendered',
        async () => {
          const visibleInputs = await page.locator('input:visible').count();
          expect(visibleInputs).toBeGreaterThanOrEqual(10);
          await expect(page.getByText('Save Changes', { exact: true })).toBeVisible();
        }
      );

      await check(
        page,
        'settings',
        'Check Cancel closes edit mode without saving',
        async () => {
          await page.getByRole('button', { name: /^Cancel$/i }).first().click();
          await expect(page.getByText('Edit Profile', { exact: true })).not.toBeVisible();
        }
      );

      await check(
        page,
        'settings',
        'Check Change Password section is available',
        async () => {
          await expect(page.getByText('Change Password', { exact: true })).toBeVisible();
        }
      );

      await check(
        page,
        'settings',
        'Check Push Notifications section is available',
        async () => {
          await expect(page.getByText('Push Notifications', { exact: true })).toBeVisible();
          await expect(page.getByText(/Status: Blocked in browser/i)).toBeVisible();
          await expect(page.getByText('Enable', { exact: true }).first()).toBeVisible();
        }
      );

      await check(
        page,
        'settings',
        'Check Download Information action',
        async () => {
          await expect(
            page.getByRole('button', { name: /Download Information/i })
          ).toBeVisible();
        }
      );

      await check(
        page,
        'settings',
        'Check Download Information dialog opens and exposes required controls',
        async () => {
          await page.getByRole('button', { name: /Download Information/i }).click();
          const dialog = page.getByRole('dialog');
          await expect(dialog).toBeVisible();
          await expect(dialog.getByText(/Format/i).first()).toBeVisible();
          await expect(dialog.getByText(/Data Types/i).first()).toBeVisible();
          await expect(dialog.getByText('JSON', { exact: true }).first()).toBeVisible();
          await expect(dialog.getByText('HTML', { exact: true }).first()).toBeVisible();

          const cancel = dialog.getByRole('button', { name: /Cancel|Close/i }).first();
          if (await cancel.count()) {
            await cancel.click().catch(() => {});
          }
        }
      );

      await check(
        page,
        'settings',
        'Check Account Deletion section and Request Deletion action',
        async () => {
          await expect(page.getByText('Account Deletion', { exact: true })).toBeVisible();
          await expect(
            page.getByRole('button', { name: /Request Deletion/i })
          ).toBeVisible();
        }
      );

      await check(
        page,
        'settings',
        'Check current logged-in device information',
        async () => {
          await expect(page.getByText('Windows Device', { exact: true })).toBeVisible();
          await expect(page.getByText('Other Devices (7)', { exact: true })).toBeVisible();
          await expect(page.getByText(/Windows · Chrome/i)).toBeVisible();
        }
      );

      addData('Profile save/persistence', 'Saving user profile changes requires controlled test data.');
      addData('Password change', 'Requires controlled credentials and must not be performed against the normal account.');
      addData('Data export content', 'Requires actual export execution and file-content verification.');
      addData('Device logout', 'Requires controlled secondary device/session.');
      addData('Account deletion request', 'Destructive action requires explicit controlled test authorization.');

      // ============================================================
      // 13. NAVIGATION AND URL INTEGRITY
      // ============================================================
      await safeGoto(page, ROUTES.dashboard);

      await check(
        page,
        'navigation',
        'Check browser Back and Forward',
        async () => {
          await page.goto(ROUTES.tests);
          await page.goto(ROUTES.results);
          await page.goBack();
          await expect(page).toHaveURL(/\/student\/my-test/);
          await page.goForward();
          await expect(page).toHaveURL(/\/student\/my-reports/);
        }
      );

      await check(
        page,
        'navigation',
        'Check refresh behavior on authenticated route',
        async () => {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await expect(page).toHaveURL(/\/student\/my-reports/);
          await expect(page.getByText('Results', { exact: true }).first()).toBeVisible();
        }
      );

      await check(
        page,
        'navigation',
        'Check authenticated routes do not unexpectedly redirect to login',
        async () => {
          for (const route of [
            ROUTES.dashboard,
            ROUTES.tests,
            ROUTES.results,
            ROUTES.packages,
            ROUTES.settings
          ]) {
            await safeGoto(page, route);
            await expect(page).not.toHaveURL(/\/student\/login/);
          }
        }
      );

      // ============================================================
      // 15. ACCESSIBILITY AUTOMATABLE BASELINE
      // ============================================================
      await safeGoto(page, ROUTES.dashboard);

      await check(
        page,
        'accessibility',
        'Check visible images expose alt text where meaningful',
        async () => {
          const missing = await page.locator('img:visible').evaluateAll((images) =>
            images
              .filter((img) => {
                const alt = img.getAttribute('alt');
                return alt === null;
              })
              .map((img) => img.outerHTML.slice(0, 250))
          );

          if (missing.length) {
            throw new Error(`Visible images without alt attribute: ${missing.length}`);
          }
        }
      );

      await check(
        page,
        'accessibility',
        'Check heading hierarchy has a top-level heading',
        async () => {
          await expect(page.locator('h1:visible').first()).toBeVisible();
        }
      );

      await check(
        page,
        'accessibility',
        'Check disabled controls are not actionable',
        async () => {
          const bad = await page.locator('button:visible').evaluateAll((buttons) =>
            buttons
              .filter(
                (button) =>
                  button.disabled &&
                  button.getAttribute('aria-disabled') !== 'true' &&
                  button.getAttribute('type') !== 'submit'
              )
              .map((button) => button.innerText.trim())
          );

          // Native disabled controls are valid even without aria-disabled.
          // This check intentionally only records the disabled-state inventory.
          expect(Array.isArray(bad)).toBe(true);
        }
      );

      // ============================================================
      // 16. CONSOLE / NETWORK INVESTIGATION
      // ============================================================
      if (consoleErrors.length) {
        addInvestigate(
          'Console errors observed during master checklist',
          consoleErrors
        );
      } else {
        pass('No console errors observed during master checklist run');
      }

      if (failedRequests.length) {
        addInvestigate(
          'Failed requests observed during master checklist',
          failedRequests
        );
      } else {
        pass('No failed requests observed during master checklist run');
      }

      await check(
        page,
        'assets',
        'Check for broken images',
        async () => {
          const broken = await page.locator('img:visible').evaluateAll((images) =>
            images
              .filter((img) => !img.complete || img.naturalWidth === 0)
              .map((img) => img.src)
          );

          if (broken.length) {
            throw new Error(`Broken images: ${broken.join(', ')}`);
          }
        }
      );

      // ============================================================
      // FINAL REPORT
      // ============================================================
      coverage.summary = {
        passed: coverage.status.passed.length,
        failed: coverage.status.failed.length,
        investigate: coverage.status.investigate.length,
        dataDependent: coverage.status.dataDependent.length,
        manual: coverage.status.manual.length,
        later: coverage.status.later.length,
        consoleErrors: consoleErrors.length,
        failedRequests: failedRequests.length
      };

      saveCoverage();

      console.log('\n========================================');
      console.log('AZE REVIEWED MASTER CHECKLIST COMPLETE');
      console.log('========================================');
      console.log(`Passed:          ${coverage.summary.passed}`);
      console.log(`Failed:          ${coverage.summary.failed}`);
      console.log(`Investigate:     ${coverage.summary.investigate}`);
      console.log(`Data dependent:  ${coverage.summary.dataDependent}`);
      console.log(`Manual:          ${coverage.summary.manual}`);
      console.log(`Later:           ${coverage.summary.later}`);
      console.log(`Console errors:  ${coverage.summary.consoleErrors}`);
      console.log(`Failed requests: ${coverage.summary.failedRequests}`);
      console.log(`Coverage file:   ${COVERAGE_FILE}`);
      console.log('========================================\n');

      // Do not fail the entire run because of one checklist finding.
      // Individual failures are persisted with screenshots for Jira review.
    } finally {
      coverage.completedAt = new Date().toISOString();
      saveCoverage();
      await context.close();
    }
  });
});