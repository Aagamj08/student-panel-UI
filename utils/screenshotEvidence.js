const fs = require('fs');
const path = require('path');

function safeName(value) {
  return String(value || 'finding')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 100);
}

async function captureFindingScreenshot(
  page,
  {
    module = 'general',
    name = 'finding',
    locator = null,
    fullPage = false
  } = {}
) {
  const directory = path.resolve(
    process.cwd(),
    'screenshots',
    'findings',
    safeName(module)
  );

  fs.mkdirSync(directory, { recursive: true });

  const filePath = path.join(
    directory,
    `${safeName(name)}.png`
  );

  if (locator) {
    await locator.screenshot({
      path: filePath,
      animations: 'disabled'
    });
  } else {
    await page.screenshot({
      path: filePath,
      fullPage,
      animations: 'disabled'
    });
  }

  return filePath;
}

module.exports = {
  captureFindingScreenshot,
  safeName
};