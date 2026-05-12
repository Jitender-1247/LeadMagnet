/**
 * browserConfig.js
 * Finds the correct Chrome executable path across all environments:
 * - Local development (Mac, Windows, Linux)
 * - Render.com hosting
 * - Other cloud providers
 */

const fs   = require('fs');
const path = require('path');

/**
 * Finds Chrome executable path automatically.
 * Checks known locations in order of priority.
 */
function findChrome() {
  const candidates = [
    // Render.com — puppeteer downloaded chrome
    '/opt/render/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
    '/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.87/chrome-linux64/chrome',
    '/opt/render/.cache/puppeteer/chrome/linux-130.0.6723.116/chrome-linux64/chrome',

    // Render generic glob — finds whatever version is installed
    ...(() => {
      try {
        const base = '/opt/render/.cache/puppeteer/chrome';
        if (fs.existsSync(base)) {
          return fs.readdirSync(base)
            .filter(d => d.startsWith('linux-'))
            .map(d => path.join(base, d, 'chrome-linux64', 'chrome'))
        }
      } catch {}
      return [];
    })(),

    // Railway / Heroku / generic Linux
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',

    // Mac (local dev)
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',

    // Windows (local dev)
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        console.log(`[browser] ✅ Found Chrome at: ${p}`);
        return p;
      }
    } catch {}
  }

  // Let Puppeteer find it itself as last resort
  console.log('[browser] ⚠️  No Chrome found at known paths — letting Puppeteer auto-detect');
  return undefined;
}

/**
 * Standard Puppeteer launch args that work on Render and locally.
 * Pass additional args (e.g. proxy) via extraArgs.
 */
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