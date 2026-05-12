/**
 * browserConfig.js
 * Finds Chrome automatically across all environments.
 */

const fs   = require('fs');
const path = require('path');

function findChrome() {
  // ── 1. Scan Render's cache directory dynamically ──────────────────────────
  // This handles ANY version Puppeteer installs — no hardcoding needed
  try {
    const base = '/opt/render/.cache/puppeteer/chrome';
    if (fs.existsSync(base)) {
      const versions = fs.readdirSync(base)
        .filter(d => d.startsWith('linux-'))
        .sort()
        .reverse(); // newest first

      for (const version of versions) {
        const chromePath = path.join(base, version, 'chrome-linux64', 'chrome');
        if (fs.existsSync(chromePath)) {
          console.log(`[browser] ✅ Found Chrome at: ${chromePath}`);
          return chromePath;
        }
      }
    }
  } catch (err) {
    console.log('[browser] Directory scan failed:', err.message);
  }

  // ── 2. Known Render paths (fallback for specific versions) ────────────────
  const knownPaths = [
    '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome',
    '/opt/render/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    '/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.87/chrome-linux64/chrome',
    // Linux system Chrome
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Mac
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of knownPaths) {
    try {
      if (fs.existsSync(p)) {
        console.log(`[browser] ✅ Found Chrome at: ${p}`);
        return p;
      }
    } catch {}
  }

  console.log('[browser] ⚠️  No Chrome found — letting Puppeteer auto-detect');
  return undefined;
}

function getLaunchConfig(extraArgs = []) {
  const executablePath = findChrome();
  return {
    headless: 'new',
    ...(executablePath && { executablePath }),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--window-size=1280,800',
      ...extraArgs,
    ],
    defaultViewport: null,
  };
}

module.exports = { getLaunchConfig, findChrome };