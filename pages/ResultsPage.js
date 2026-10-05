class ResultsPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: 'Results',
      exact: true
    });

    this.navResults = page.locator('[data-tour="nav-results"]');
  }

  async goto() {
    await this.page.goto('/student/my-reports');

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
  ResultsPage
};
