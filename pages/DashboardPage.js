class DashboardPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: 'Dashboard',
      exact: true
    });

    // The welcome text exists in the Dashboard DOM,
    // but is not exposed as a semantic heading.
   this.welcomeHeading = page.getByText('Hi Aagam Jain', {
  exact: false
}).first();

    this.navDashboard = page.locator('[data-tour="nav-dashboard"]');
    this.navTests = page.locator('[data-tour="nav-tests"]');
    this.navResults = page.locator('[data-tour="nav-results"]');
    this.navBuy = page.locator('[data-tour="nav-buy"]');
    this.navSettings = page.locator('[data-tour="nav-settings"]');

    this.coreSkills = page.getByText('5 Core Skills', {
      exact: true
    });

    this.resultsIn = page.getByText('Results in 5 mins', {
      exact: true
    });

    this.satisfaction = page.getByText('98% Satisfaction', {
      exact: true
    });

    this.choosePackage = page.getByText('Choose Your Package', {
      exact: true
    });

    this.secureConfidential = page.getByText('Secure & Confidential', {
      exact: true
    });

    this.needHelp = page.getByText('Need help? Contact us', {
      exact: true
    });

    this.getFreePlan = page.getByRole('button', {
      name: 'Get free plan',
      exact: true
    });

    this.selectPackageButtons = page.getByRole('button', {
      name: 'Select Package',
      exact: true
    });

    this.exploreMorePackages = page.getByRole('button', {
      name: 'Explore More Packages',
      exact: true
    });
  }

  async goto() {
    await this.page.goto('/student/dashboard');

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
  DashboardPage
};