class PackagesPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: 'Buy Tests',
      exact: true
    });

    this.navBuy = page.locator('[data-tour="nav-buy"]');

    this.activeTab = page.getByText('Active', {
      exact: true
    });

    this.allTab = page.getByText('All', {
      exact: true
    });

    this.transactionsTab = page.getByText('Transactions', {
      exact: true
    });

    this.packageCards = page.locator(
      '[class*="package"], [class*="Package"]'
    );

    this.exploreMore = page.getByRole('button', {
      name: /Explore More Packages/i
    });
  }

  async goto() {
    await this.page.goto('/student/packages');

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
  PackagesPage
};
