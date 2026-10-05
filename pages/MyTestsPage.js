class MyTestsPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: 'My Tests',
      exact: true
    });

    this.navTests = page.locator('[data-tour="nav-tests"]');

    this.activeTestsTab = page.getByText('Active Tests', {
      exact: true
    });

    this.purchasedTestsTab = page.getByText('Purchased Tests', {
      exact: true
    });
  }

  async goto() {
    await this.page.goto('/student/my-test');

    await this.page.waitForLoadState('domcontentloaded');

    try {
      await this.page.waitForLoadState('networkidle', {
        timeout: 10000
      });
    } catch {
      // Background requests may remain active.
    }

    await this.page.waitForTimeout(1000);
  }
}

module.exports = {
  MyTestsPage
};
