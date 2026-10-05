const fs = require('fs');
const path = require('path');

const findingsDirectory = path.resolve(
  process.cwd(),
  'reports',
  'findings'
);

const findingsFile = path.join(
  findingsDirectory,
  'findings.json'
);

function ensureDirectory() {
  fs.mkdirSync(findingsDirectory, {
    recursive: true
  });
}

function readFindings() {
  ensureDirectory();

  if (!fs.existsSync(findingsFile)) {
    return [];
  }

  try {
    return JSON.parse(
      fs.readFileSync(findingsFile, 'utf8')
    );
  } catch {
    return [];
  }
}

function writeFindings(findings) {
  ensureDirectory();

  fs.writeFileSync(
    findingsFile,
    JSON.stringify(findings, null, 2),
    'utf8'
  );
}

function createFinding({
  module,
  page,
  check,
  expected,
  actual,
  severity = 'Medium',
  url,
  screenshot
}) {
  const findings = readFindings();

  const finding = {
    id: `F-${String(findings.length + 1).padStart(4, '0')}`,
    timestamp: new Date().toISOString(),
    module,
    page,
    check,
    expected,
    actual,
    severity,
    url,
    screenshot
  };

  findings.push(finding);

  writeFindings(findings);

  return finding;
}

async function recordFinding(page, options) {
  return createFinding({
    ...options,
    url: options.url || page.url()
  });
}

module.exports = {
  createFinding,
  recordFinding,
  readFindings
};