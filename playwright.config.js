require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  timeout: 5 * 60 * 1000,

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: 0,

  workers: 1,

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: './reports/playwright-report',
        open: 'never'
      }
    ]
  ],

  use: {
    baseURL: process.env.BASE_URL,

    headless: false,

    viewport: {
      width: 1440,
      height: 900
    },

    screenshot: 'on',

    video: 'on',

    trace: 'on',

    ignoreHTTPSErrors: true
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});