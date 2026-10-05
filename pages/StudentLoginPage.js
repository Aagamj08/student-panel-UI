class StudentLoginPage {
  constructor(page) {
    this.page = page;

    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');

    this.continueButton = page.getByRole('button', {
      name: 'Continue',
      exact: true
    });

    this.googleButton = page.getByRole('button', {
      name: /Continue with Google/i
    });

    this.registerButton = page.getByRole('button', {
      name: 'Register',
      exact: true
    });

    this.forgotPassword = page.getByRole('button', {
      name: /Forgot your password/i
    });
  }

  async goto() {
    await this.page.goto('/student/login');
  }

  async login(username, password) {
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);
    await this.continueButton.click();
  }
}

module.exports = {
  StudentLoginPage
};