require('dotenv').config();

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { db } = require('../config/firebase');
const { decrypt } = require('./linkedinService');
const path = require('path');

puppeteer.use(StealthPlugin());

function randomDelay(min = 500, max = 1500) {
    return new Promise(resolve =>
        setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
    );
}

// ── Create a stealth browser ─────────────────────────────────────────────────
// Replace your existing launchBrowser with this
async function launchBrowser() {
    // PROXY_URL format: http://username:password@proxy-provider.com:port
    const proxyUrl = 'http://username-session-uniqueid123:password@proxy.provider.com:8080'; 

    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
    ];

    if (proxyUrl) {
        args.push(`--proxy-server=${proxyUrl}`);
    }

    const browser = await puppeteer.launch({
        headless: "new", // Use 'new' for better stealth than true/false
        executablePath: executablePath(),
        args,
        defaultViewport: { width: 1366, height: 768 }
    });

    // Handle Proxy Authentication if required
    if (proxyUrl && process.env.PROXY_USERNAME) {
        const page = await browser.newPage();
        await page.authenticate({
            username: process.env.PROXY_USERNAME,
            password: process.env.PROXY_PASSWORD,
        });
    }

    return browser;
}

// ── Set up a page with cookie + request interception ────────────────────────
async function setupPage(browser, liAt) {
    const page = await browser.newPage();

    // 1. Set a realistic viewport to match common desktop screens
    await page.setViewport({ width: 1440, height: 900 });

    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // 2. Request Interception (Optimized for speed + stealth)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();

        if (['media', 'font', 'stylesheet'].includes(resourceType) && !url.includes('linkedin.com')) {
            req.abort();
            return;
        }

        if (resourceType === 'image') {
            // Only allow LinkedIn hosted images (profile photos/icons)
            if (url.includes('licdn.com') || url.includes('linkedin.com')) {
                req.continue();
            } else {
                req.abort();
            }
            return;
        }

        req.continue();
    });

    // 3. Deep Stealth: Override navigator properties
    await page.evaluateOnNewDocument(() => {
        // Pass the Webdriver Test
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        // Mock hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
        // Mock Languages and Plugins
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    // 4. Dynamic User-Agent (Fixes the automation mismatch)
    let userAgent = await browser.userAgent();
    userAgent = userAgent.replace(/HeadlessChrome/g, "Chrome"); // Strip the "Headless" tag
    await page.setUserAgent(userAgent);

    // 5. Add a "Referer" to look like a natural click from Google
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/' 
    });

    // 6. Cookie Injection Sequence
    // We visit the domain first so the browser context is initialized for linkedin.com
    try {
        await page.goto('https://www.linkedin.com', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        await page.setCookie({
            name: 'li_at',
            value: liAt,
            domain: '.linkedin.com',
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        });
    } catch (err) {
        console.error("Initial page load or cookie injection failed:", err.message);
    }

    return page;
}

// ── SEND CONNECTION REQUESTS for all pending leads ───────────────────────────
async function sendConnectionRequests(campaignId) {
    console.log(`🚀 Starting connection requests for campaign: ${campaignId}`);

    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) throw new Error('Campaign not found');

    const { userId, messageTemplate } = campaignDoc.data();

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new Error('User not found');

    const { linkedinSession } = userDoc.data();
    if (!linkedinSession) throw new Error('LinkedIn not connected');

    const liAt = decrypt(linkedinSession);

    const leadsSnap = await db.collection('leads')
        .where('campaignId', '==', campaignId)
        .where('status', '==', 'pending')
        .get();

    if (leadsSnap.empty) {
        console.log('ℹ️  No pending leads to process');
        return { sent: 0, failed: 0 };
    }

    const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${leads.length} pending leads`);
    console.log(`⏱️  Estimated time: ${leads.length * 7} to ${leads.length * 12} minutes`);

    const browser = await launchBrowser();
    const page = await setupPage(browser, liAt);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        console.log(`\n🔗 [${i + 1}/${leads.length}] Sending connection to ${lead.name || lead.profileUrl}`);

        try {
            // ── 5-10 minute delay between each connection request ─────────────
            // ── 5-10 minute delay before EVERY connection request including first ──
            const delayMinutes = Math.floor(Math.random() * 6) + 5; // 5-10 mins
            console.log(`   ⏳ Waiting ${delayMinutes} minutes before sending to ${lead.name}...`);
            await randomDelay(delayMinutes * 60 * 1000, (delayMinutes + 1) * 60 * 1000);

            await page.goto(lead.profileUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            }).catch(() => {
                console.warn(`⏱️ Timeout loading profile — continuing`);
            });

            const currentUrl = page.url();
            if (
                currentUrl.includes('/authwall') ||
                currentUrl.includes('/login') ||
                currentUrl.includes('checkpoint')
            ) {
                console.warn('⚠️ Auth wall hit — stopping campaign');
                break;
            }

            // ── Wait for page content ─────────────────────────────────────────
            await page.waitForFunction(
                () => {
                    const text = document.body.innerText;
                    return text.includes('Connect') ||
                        text.includes('Message') ||
                        text.includes('Follow') ||
                        text.includes('Pending');
                },
                { timeout: 20000 }
            ).catch(() => null);

            // ── 10-15 second delay for profile card to fully render ───────────
            const renderWait = Math.floor(Math.random() * 6000) + 10000; // 10-15 seconds
            console.log(`   ⏳ Waiting ${Math.round(renderWait / 1000)}s for profile to render...`);
            await randomDelay(renderWait, renderWait + 2000);

            // ── Scroll to trigger React hydration then back to top ────────────
            await page.evaluate(() => window.scrollBy(0, 400));
            await randomDelay(2000, 3000);
            await page.evaluate(() => window.scrollTo(0, 0));
            await randomDelay(2000, 3000);

            const bodyText = await page.evaluate(() =>
                document.body ? document.body.innerText.slice(0, 300) : ''
            );
            console.log(`📄 Preview: ${bodyText.replace(/\n/g, ' ')}`);

            if (!bodyText || bodyText.length < 20) {
                console.warn(`⚠️ Profile page didn't render`);
                failed++;
                continue;
            }

            const connected = await sendConnectionOnPage(page, messageTemplate, lead.name, i + 1);

            if (connected === true) {
                await db.collection('leads').doc(lead.id).update({
                    status: 'sent',
                    sentAt: new Date().toISOString()
                });
                console.log(`   ✅ Connection request sent to ${lead.name}`);
                sent++;
            } else if (connected === 'already-connected') {
                await db.collection('leads').doc(lead.id).update({
                    status: 'accepted',
                    acceptedAt: new Date().toISOString()
                });
                console.log(`   ℹ️ ${lead.name} already connected — marked accepted`);
            } else if (connected === 'follow-only' || connected === 'pending') {
                await db.collection('leads').doc(lead.id).update({
                    status: 'ignored',
                    ignoreReason: connected
                });
            } else {
                console.warn(`   ⚠️ Could not connect — keeping as pending for retry`);
                failed++;
            }

        } catch (err) {
            console.warn(`⚠️ Failed for ${lead.profileUrl}:`, err.message);
            failed++;
        }
    }

    await browser.close();
    console.log(`\n✅ Campaign done — sent: ${sent}, failed: ${failed}`);
    return { sent, failed };
}

// ── Click "Connect" on a profile page and send invitation ───────────────────
async function sendConnectionOnPage(page, messageTemplate, name, index = 0) {
    try {
        await page.evaluate(() => window.scrollTo(0, 0));

        // ── Extra wait at top for profile card buttons to fully render ────────
        const topWait = Math.floor(Math.random() * 5000) + 10000; // 10-15 seconds
        console.log(`   ⏳ Waiting ${Math.round(topWait / 1000)}s for buttons to render...`);
        await randomDelay(topWait, topWait + 2000);

        // ── Step 1: Early exit — already connected or pending ─────────────────
        const currentStatus = await page.evaluate(() => {
            const text = document.body.innerText.slice(0, 2000);
            if (text.includes('· 1st') || text.includes('1st degree')) return '1st';
            if (text.includes('Remove connection')) return '1st';
            if (text.includes('Pending') || text.includes('Withdraw')) return 'pending';
            return 'not-connected';
        });
        console.log(`   🔗 Status: ${currentStatus}`);

        if (currentStatus === '1st') return 'already-connected';
        if (currentStatus === 'pending') return 'pending';

        // ── Step 2: Check what action is available ────────────────────────────
        const profileAction = await page.evaluate(() => {
            const text = document.body.innerText.slice(0, 2000);
            const btns = [...document.querySelectorAll('button')];

            if (text.includes('· 1st') || text.includes('Remove connection')) return 'already-connected';
            if (text.includes('Pending') || text.includes('Withdraw')) return 'pending';

            const hasConnect = btns.some(b =>
                b.innerText.trim() === 'Connect' ||
                (b.getAttribute('aria-label') || '').toLowerCase().includes('connect')
            );
            if (hasConnect) return 'can-connect';

            const hasFollow = btns.some(b => b.innerText.trim() === 'Follow');
            const hasMoreBtn = btns.some(b => b.getAttribute('aria-label') === 'More');

            if (hasMoreBtn) return 'check-more';
            if (!hasConnect && hasFollow) return 'follow-only';
            return 'unknown';
        });
        console.log(`   🎯 Action: ${profileAction}`);

        if (profileAction === 'already-connected') return 'already-connected';
        if (profileAction === 'pending') return 'pending';
        if (profileAction === 'follow-only') return 'follow-only';

// ── Step 3: Find Connect — it's an <a> tag not a <button>! ───────────
let connectElement = null;

// Strategy 1: Fixed Syntax Error
if (name) {
    const firstName = name.split(' ')[0];
    const fullName = name.split(' ').slice(0, 2).join(' ');
    const variants = [fullName, firstName];

    for (const v of variants) {
        // Corrected selector and variable usage
        // This is the "clean" version that handles both cases ("Connect" and "connect") in one go
        const el = await page.$(`a[aria-label*="${v}"][aria-label*="Connect" i], a[aria-label*="${v}"][aria-label*="connect" i]`);
        if (el) {
            const box = await el.boundingBox();
            if (box) {
                console.log(`   📍 Found <a> Connect by name "${v}"`);
                connectElement = el;
                break;
            }
        }
    }
}

// Strategy 2: any <a> tag with "connect" in aria-label — pick topmost
if (!connectElement) {
    const allLinks = await page.$$('a[aria-label*="onnect"], a[aria-label*="connect"]');
    let topmost = null;
    let topmostY = Infinity;

    for (const link of allLinks) {
        const ariaLabel = await link.evaluate(el =>
            (el.getAttribute('aria-label') || '').toLowerCase()
        );
        const box = await link.boundingBox();
        if (!box) continue;

        console.log(`   🔘 <a> Connect candidate: "${ariaLabel}" at y=${Math.round(box.y)}`);

        if (box.y < topmostY) {
            topmostY = box.y;
            topmost = link;
        }
    }

    if (topmost) {
        connectElement = topmost;
        console.log(`   ✅ Using topmost <a> Connect at y=${Math.round(topmostY)}`);
    }
}

// Strategy 3: href contains custom-invite (LinkedIn's connect URL pattern)
if (!connectElement) {
    const inviteLink = await page.$('a[href*="custom-invite"], a[href*="connect"]');
    if (inviteLink) {
        const box = await inviteLink.boundingBox();
        console.log(`   📍 Found via href pattern at x=${Math.round(box?.x || 0)}, y=${Math.round(box?.y || 0)}`);
        connectElement = inviteLink;
    }
}

// Strategy 4: More dropdown (for profiles where Connect is hidden)
if (!connectElement) {
    console.log(`   🔽 Trying More dropdown`);
    const moreBtn = await page.$('button[aria-label="More"]');

    if (moreBtn) {
        const moreBox = await moreBtn.boundingBox();
        if (moreBox && moreBox.y < 700) {
            await moreBtn.click();
            await randomDelay(2000, 3000);

            const items = await page.$$('[role="menuitem"]');
            const allItemTexts = [];

            for (const item of items) {
                const text = await item.evaluate(el => el.textContent.trim());
                allItemTexts.push(text);
                if (text.toLowerCase().includes('connect')) {
                    connectElement = item;
                    console.log(`   ✅ Found Connect in More dropdown`);
                    break;
                }
            }

            console.log(`   📋 Dropdown items:`, allItemTexts);

            if (!connectElement) {
                if (allItemTexts.some(t => t.includes('Remove connection'))) {
                    await page.keyboard.press('Escape');
                    return 'already-connected';
                }
                await page.keyboard.press('Escape');
            }
        }
    }
}
        // ── Step 4: Scroll into view + get position ───────────────────────────
        await connectElement.scrollIntoView();
        await randomDelay(2000, 3000);

        const box = await connectElement.boundingBox();
        if (!box) { console.warn(`   ⚠️ No bounding box`); return 'no-button'; }

        console.log(`   📍 Final: x=${Math.round(box.x)}, y=${Math.round(box.y)}, w=${Math.round(box.width)}, h=${Math.round(box.height)}`);

        // ── Step 5: Real mouse click ──────────────────────────────────────────
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        await page.mouse.move(centerX, centerY, { steps: 15 });
        await randomDelay(500, 1000);
        await page.mouse.click(centerX, centerY);
        console.log(`   ✅ Clicked at (${Math.round(centerX)}, ${Math.round(centerY)})`);

        // ── Wait for modal to appear ──────────────────────────────────────────
        await randomDelay(4000, 6000);

        // ── Step 6: Screenshot ────────────────────────────────────────────────
        const screenshotPath = path.join(process.cwd(), `debug-connect-${index}-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`   📸 ${screenshotPath}`);

        // ── Step 7: Check if modal opened ────────────────────────────────────
        const modalOpened = await page.evaluate(() => {
            return !!(
                document.querySelector('[role="dialog"]') ||
                document.querySelector('.artdeco-modal') ||
                document.querySelector('textarea[name="message"]') ||
                [...document.querySelectorAll('button')].find(b =>
                    b.innerText.includes('Send invitation') ||
                    b.innerText.includes('Add a note') ||
                    b.innerText.trim() === 'Send'
                )
            );
        });
        console.log(`   🪟 Modal: ${modalOpened}`);

        const dialogContent = await page.evaluate(() => {
            const d = document.querySelector('[role="dialog"], .artdeco-modal');
            return d ? d.innerText.slice(0, 200).replace(/\n/g, ' ') : 'NO DIALOG';
        });
        console.log(`   💬 Dialog: ${dialogContent}`);

        // ── Step 8: Keyboard Enter fallback ──────────────────────────────────
        if (!modalOpened) {
            await connectElement.focus();
            await randomDelay(500, 1000);
            await page.keyboard.press('Enter');
            await randomDelay(4000, 5000);

            const modalAfterEnter = await page.evaluate(() => !!(
                document.querySelector('[role="dialog"]') ||
                document.querySelector('.artdeco-modal')
            ));
            console.log(`   🪟 Modal after Enter: ${modalAfterEnter}`);

            if (!modalAfterEnter) {
                const isPending = await page.evaluate(() =>
                    [...document.querySelectorAll('button')].some(b =>
                        b.innerText.includes('Pending') || b.innerText.includes('Withdraw')
                    )
                );
                if (isPending) { console.log(`   ✅ Pending without modal!`); return true; }
                console.warn(`   ⚠️ Modal never opened`);
                return 'modal-failed';
            }
        }

        // ── Step 9: Handle "How do you know X?" modal ────────────────────────
        await randomDelay(1000, 2000);
        await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b =>
                b.innerText.includes('Other') ||
                b.innerText.includes('Friend') ||
                b.innerText.includes('colleague') ||
                b.innerText.includes('classmate')
            );
            if (btn) btn.click();
        });
        await randomDelay(1000, 2000);

        // ── Step 10: Add note ─────────────────────────────────────────────────
        const addNoteHandle = await page.evaluateHandle(() =>
            [...document.querySelectorAll('button')]
                .find(b => b.innerText.includes('Add a note')) || null
        );

        if (addNoteHandle.asElement()) {
            await addNoteHandle.asElement().click();
            await randomDelay(2000, 3000);

            const note = messageTemplate.replace('{{name}}', name || 'there').substring(0, 300);
            const textarea = await page.$('textarea[name="message"], #custom-message, textarea');
            if (textarea) {
                await textarea.click();
                await textarea.type(note, { delay: 80 });
                await randomDelay(1000, 2000);
                console.log(`   📝 Note typed`);
            }
        } else {
            console.log(`   ℹ️ No note button — sending without note`);
        }

        // ── Step 11: Click Send ───────────────────────────────────────────────
        const sendHandle = await page.evaluateHandle(() =>
            [...document.querySelectorAll('button')].find(b =>
                b.innerText.trim() === 'Send' ||
                b.innerText.trim() === 'Send invitation' ||
                b.innerText.trim() === 'Done'
            ) || null
        );

        if (sendHandle.asElement()) {
            await sendHandle.asElement().click();
            await randomDelay(3000, 5000);
            console.log(`   ✅ Invitation sent!`);
            return true;
        }

        // ── Step 12: Final pending check ──────────────────────────────────────
        const isPendingFinal = await page.evaluate(() =>
            [...document.querySelectorAll('button')].some(b =>
                b.innerText.includes('Pending') || b.innerText.includes('Withdraw')
            )
        );
        if (isPendingFinal) { console.log(`   ✅ Pending!`); return true; }

        console.warn(`   ⚠️ Send button not found`);
        return 'modal-failed';

    } catch (err) {
        console.warn(`sendConnectionOnPage error:`, err.message);
        return 'error';
    }
}

// ── CHECK ACCEPTED CONNECTIONS and send follow-up messages ──────────────────
async function checkAndSendMessages(campaignId) {
    console.log(`📬 Checking accepted connections for campaign: ${campaignId}`);

    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) throw new Error('Campaign not found');

    const { userId, messageTemplate } = campaignDoc.data();

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new Error('User not found');

    const { linkedinSession } = userDoc.data();
    if (!linkedinSession) throw new Error('LinkedIn not connected');

    const liAt = decrypt(linkedinSession);

    const leadsSnap = await db.collection('leads')
        .where('campaignId', '==', campaignId)
        .where('status', '==', 'sent')
        .get();

    if (leadsSnap.empty) {
        console.log('ℹ️  No sent leads to check');
        return { messaged: 0, failed: 0 };
    }

    const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Checking ${leads.length} sent leads`);

    const browser = await launchBrowser();
    const page = await setupPage(browser, liAt);

    let messaged = 0;
    let failed = 0;

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        console.log(`\n📨 Checking ${lead.name} (${i + 1}/${leads.length})`);

        try {
            // 3-5 minute delay between checking each lead
            const delayMinutes = Math.floor(Math.random() * 3) + 3;
            console.log(`   ⏳ Waiting ${delayMinutes} minutes...`);
            await randomDelay(delayMinutes * 60 * 1000, (delayMinutes + 1) * 60 * 1000);

            await page.goto(lead.profileUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            }).catch(() => {});

            const currentUrl = page.url();
            if (currentUrl.includes('/authwall') || currentUrl.includes('/login')) {
                console.warn('⚠️ Auth wall — stopping');
                break;
            }

            await page.waitForFunction(
                () => document.body.innerText.includes('Message') ||
                    document.body.innerText.includes('Connect') ||
                    document.body.innerText.includes('Pending'),
                { timeout: 20000 }
            ).catch(() => null);

            // 10-15 second wait for page to fully render
            const renderWait = Math.floor(Math.random() * 5000) + 10000;
            console.log(`   ⏳ Waiting ${Math.round(renderWait / 1000)}s for render...`);
            await randomDelay(renderWait, renderWait + 2000);

            const preview = await page.evaluate(() =>
                document.body.innerText.slice(0, 300).replace(/\n/g, ' ')
            );
            console.log(`   📄 Preview: ${preview}`);

            const isConnected = await page.evaluate(() => {
                const text = document.body.innerText.slice(0, 2000);
                return text.includes('· 1st') ||
                    text.includes('1st degree') ||
                    text.includes('Remove connection');
            });

            console.log(`   🔗 Connected: ${isConnected}`);

            if (!isConnected) {
                console.log(`   ⏳ ${lead.name} hasn't accepted yet`);
                continue;
            }

            await db.collection('leads').doc(lead.id).update({
                status: 'accepted',
                acceptedAt: new Date().toISOString()
            });
            console.log(`   ✅ ${lead.name} accepted — sending message`);

            const msgSent = await sendMessageOnPage(page, messageTemplate, lead.name);

            if (msgSent) {
                await db.collection('leads').doc(lead.id).update({
                    status: 'replied',
                    repliedAt: new Date().toISOString()
                });
                console.log(`   ✅ Message sent to ${lead.name}`);
                messaged++;
            } else {
                console.warn(`   ⚠️ Could not send message to ${lead.name}`);
                failed++;
            }

        } catch (err) {
            console.warn(`⚠️ Error for ${lead.profileUrl}:`, err.message);
            failed++;
        }
    }

    await browser.close();
    console.log(`\n✅ Messaging done — messaged: ${messaged}, failed: ${failed}`);
    return { messaged, failed };
}

// ── Send message on a profile page ───────────────────────────────────────────
async function sendMessageOnPage(page, messageTemplate, name) {
    try {
        // Find Message button by aria-label
        let msgBtn = await page.$('button[aria-label*="Message"], button[aria-label*="message"]');

        // Fallback: find by text
        if (!msgBtn) {
            const allBtns = await page.$$('button');
            for (const btn of allBtns) {
                const text = await btn.evaluate(el => el.innerText.trim());
                if (text === 'Message') {
                    msgBtn = btn;
                    break;
                }
            }
        }

        if (!msgBtn) {
            console.warn(`   ⚠️ Message button not found`);
            return false;
        }

        await msgBtn.click();
        await randomDelay(3000, 5000);
        console.log(`   ✅ Clicked Message button`);

        const msgBox = await page.waitForSelector(
            '.msg-form__contenteditable, div[contenteditable="true"][role="textbox"], textarea',
            { timeout: 15000 }
        ).catch(() => null);

        if (!msgBox) {
            console.warn(`   ⚠️ Compose box not found`);
            return false;
        }

        const message = messageTemplate.replace('{{name}}', name || 'there');
        await msgBox.click();
        await randomDelay(1000, 2000);
        await page.keyboard.type(message, { delay: 60 });
        await randomDelay(2000, 3000);
        console.log(`   📝 Message typed`);

        const sendBtn = await page.evaluateHandle(() => {
            const form = document.querySelector('.msg-form, .msg-convo-wrapper');
            if (form) {
                const btn = [...form.querySelectorAll('button')].find(b =>
                    b.innerText.trim() === 'Send' ||
                    b.getAttribute('type') === 'submit' ||
                    b.getAttribute('data-control-name') === 'send'
                );
                if (btn) return btn;
            }
            return [...document.querySelectorAll('button')].find(b =>
                b.innerText.trim() === 'Send'
            ) || null;
        });

        if (sendBtn && await sendBtn.asElement()) {
            await sendBtn.asElement().click();
            await randomDelay(3000, 5000);
            console.log(`   ✅ Message sent!`);
            return true;
        }

        // Keyboard fallback
        console.log(`   ⌨️ Trying Ctrl+Enter`);
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');
        await randomDelay(3000, 5000);
        return true;

    } catch (err) {
        console.warn('sendMessageOnPage error:', err.message);
        return false;
    }
}

// ── Run a full campaign ───────────────────────────────────────────────────────
async function runCampaign(campaignId) {
    console.log(`\n🎯 Running campaign: ${campaignId}`);

    try {
        const connResult = await sendConnectionRequests(campaignId);
        console.log(`📊 Connections — sent: ${connResult.sent}, failed: ${connResult.failed}`);

        // Wait 60 seconds before checking accepted
        console.log('⏳ Waiting 60s before checking accepted...');
        await new Promise(r => setTimeout(r, 60000));

        const msgResult = await checkAndSendMessages(campaignId);
        console.log(`📊 Messages — sent: ${msgResult.messaged}, failed: ${msgResult.failed}`);

        await db.collection('campaigns').doc(campaignId).update({
            lastRunAt: new Date().toISOString(),
            lastRunResult: {
                connectionsSent: connResult.sent,
                messagesSent: msgResult.messaged
            }
        });

        return { success: true, ...connResult, ...msgResult };

    } catch (err) {
        console.error(`❌ runCampaign error:`, err.message);
        throw err;
    }
}

module.exports = { runCampaign, sendConnectionRequests, checkAndSendMessages };
