const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { db } = require('../config/firebase');
const { decrypt } = require('./linkedinService');

puppeteer.use(StealthPlugin());

function randomDelay(min, max) {
    return new Promise(resolve =>
        setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
    );
}

async function syncInboxMessages(uid, encryptedCookie) {
    const liAt = decrypt(encryptedCookie);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
        await page.setCookie({
                    name: 'li_at',
                    value: liAt,
                    domain: '.linkedin.com',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None'
                });

        console.log('📥 Opening LinkedIn messaging...');
        await page.goto('https://www.linkedin.com/messaging/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        await randomDelay(3000, 4000);

        const conversations = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.msg-conversation-listitem').forEach(el => {
                const nameEl = el.querySelector('.msg-conversation-listitem__participant-names');
                const previewEl = el.querySelector('.msg-conversation-listitem__message-snippet');
                const linkEl = el.querySelector('a');
                const timeEl = el.querySelector('time');

                if (nameEl && linkEl) {
                    items.push({
                        name: nameEl.innerText.trim(),
                        preview: previewEl ? previewEl.innerText.trim() : '',
                        threadUrl: 'https://www.linkedin.com' + linkEl.getAttribute('href'),
                        receivedAt: timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString()
                    });
                }
            });
            return items.slice(0, 20);
        });

        console.log(`📬 Found ${conversations.length} conversations`);

        const batch = db.batch();
        conversations.forEach(convo => {
            const ref = db.collection('messages').doc();
            batch.set(ref, { userId: uid, ...convo, synced: true });
        });
        await batch.commit();

        await browser.close();
        return conversations.length;
    } catch (err) {
        await browser.close();
        throw err;
    }
}

async function replyToMessage(encryptedCookie, threadUrl, message) {
    const liAt = decrypt(encryptedCookie);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
        await page.setCookie({
                name: 'li_at',
                value: liAt,
                domain: '.linkedin.com',
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'None'
            });

        console.log('💬 Opening thread:', threadUrl);
        await page.goto(threadUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await randomDelay(3000, 4000);

        const msgBox = await page.$('.msg-form__contenteditable');
        if (!msgBox) {
            await browser.close();
            return { success: false, message: 'Could not find message input' };
        }

        await msgBox.click();
        await randomDelay(500, 1000);
        await page.type('.msg-form__contenteditable', message, { delay: 100 });
        await randomDelay(500, 1000);

        const sendBtn = await page.$('button.msg-form__send-button');
        if (sendBtn) {
            await sendBtn.click();
            console.log('✅ Reply sent!');
        }

        await browser.close();
        return { success: true, message: 'Reply sent successfully ✅' };
    } catch (err) {
        await browser.close();
        return { success: false, message: err.message };
    }
}

module.exports = { syncInboxMessages, replyToMessage };