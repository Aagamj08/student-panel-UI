class SettingsPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: 'Settings',
      exact: true
    });

    this.navSettings = page.locator('[data-tour="nav-settings"]');

    this.editButton = page.getByRole('button', {
      name: 'Edit',
      exact: true
    });

    this.downloadInformationButton = page.getByRole('button', {
      name: /Download Information/i
    });
  }

  async goto() {
    await this.page.goto('/student/settings');

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
  SettingsPage
};