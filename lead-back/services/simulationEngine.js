const cron = require('node-cron');
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

// Fetch all active campaigns
async function getActiveCampaigns() {
  const snapshot = await db.collection('campaigns')
    .where('status', '==', 'active')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get limited pending leads (ANTI-SPAM)
async function getPendingLeads(campaignId, limit = 5) {
  const snapshot = await db.collection('leads')
    .where('campaignId', '==', campaignId)
    .where('status', '==', 'pending')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Send connection request (REUSED PAGE)
async function sendConnectionRequest(page, lead, campaign, liAt) {
  try {
    await page.setCookie({
      name: 'li_at',
      value: liAt,
      domain: '.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });

    // Human-like navigation
    await page.goto('https://www.linkedin.com/feed', { waitUntil: 'domcontentloaded' });
    await randomDelay(3000, 4000);

    console.log(`👤 Visiting: ${lead.profileUrl}`);
    await page.goto(lead.profileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(3000, 6000);

    const connectBtn = await page.$('button[aria-label*="Connect"]');

    if (!connectBtn) {
      console.log('⚠️ No Connect button — skipping');
      await db.collection('leads').doc(lead.id).update({ status: 'skipped' });
      return;
    }

    await connectBtn.click();
    await randomDelay(1000, 2000);

    const addNoteBtn = await page.$('button[aria-label="Add a note"]');
    if (addNoteBtn) {
      await addNoteBtn.click();
      await randomDelay(500, 1000);

      const message = campaign.messageTemplate
        .replace('{{name}}', lead.name || 'there');

      await page.type('textarea[name="message"]', message, { delay: 80 });
      await randomDelay(500, 1000);
    }

    const sendBtn =
      await page.$('button[aria-label="Send now"]') ||
      await page.$('button[aria-label="Send invitation"]');

    if (sendBtn) {
      await sendBtn.click();
      console.log(`✅ Request sent to: ${lead.profileUrl}`);
    }

    await db.collection('leads').doc(lead.id).update({
      status: 'sent',
      requestedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error(`❌ Error for ${lead.profileUrl}:`, err.message);

    await db.collection('leads').doc(lead.id).update({
      status: 'failed',
      error: err.message
    });
  }
}

// 🚀 MAIN ENGINE
function startSimulationEngine() {
  console.log('🤖 Simulation Engine started...');

  cron.schedule('*/5 9-18 * * 1-5', async () => {
    console.log('⏰ Checking active campaigns...');

    const campaigns = await getActiveCampaigns();
    if (campaigns.length === 0) {
      console.log('🔴 No active campaigns');
      return;
    }

    // 🔥 ONE browser for all campaigns
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );

    for (const campaign of campaigns) {

      // Check campaign still active
      const campaignDoc = await db.collection('campaigns').doc(campaign.id).get();
      if (!campaignDoc.exists || campaignDoc.data().status !== 'active') {
        console.log(`⛔ Campaign paused: ${campaign.name}`);
        continue;
      }

      const leads = await getPendingLeads(campaign.id, 3); // limit per run
      if (leads.length === 0) {
        console.log(`🔴 No pending leads for: ${campaign.name}`);
        continue;
      }

      const userDoc = await db.collection('users').doc(campaign.userId).get();
      const { linkedinSession } = userDoc.data();

      if (!linkedinSession) {
        console.log('⚠️ No LinkedIn session');
        continue;
      }

      const liAt = decrypt(linkedinSession);

      for (const lead of leads) {

        // Random delay between leads (human behavior)
        const delay = Math.floor(Math.random() * (8 - 2 + 1) + 2) * 60000;
        console.log(`⏳ Waiting ${delay / 60000} mins before next action...`);

        await randomDelay(delay, delay + 2000);

        // Re-check campaign status
        const latestCampaign = await db.collection('campaigns').doc(campaign.id).get();
        if (latestCampaign.data().status !== 'active') {
          console.log('⛔ Campaign stopped mid-run');
          break;
        }

        await sendConnectionRequest(page, lead, campaign, liAt);
      }
    }

    await browser.close();
  });

  // 📥 Inbox sync every 15 mins
  cron.schedule('*/15 * * * *', async () => {
    console.log('📥 Auto-syncing inboxes...');

    const { syncInboxMessages } = require('./inboxService');

    const usersSnapshot = await db.collection('users')
      .where('linkedinSession', '!=', null)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      const { linkedinSession } = userDoc.data();
      if (!linkedinSession) continue;

      try {
        await syncInboxMessages(userDoc.id, linkedinSession);
      } catch (err) {
        console.error(`❌ Inbox sync failed for ${userDoc.id}:`, err.message);
      }
    }
  });
}

module.exports = { startSimulationEngine };