const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/authMiddleware');
const { checkAndSendMessages } = require('../services/automationService');

// POST /api/v1/campaigns/create
router.post('/create', authMiddleware, async (req, res) => {
    const { name, messageTemplate } = req.body;
    const uid = req.user.uid;

    if (!name || !messageTemplate) {
        return res.status(400).json({ error: 'name and messageTemplate are required' });
    }

    try {
        const campaignRef = await db.collection('campaigns').add({
            userId: uid,
            name,
            messageTemplate,
            status: 'active',
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ success: true, campaignId: campaignRef.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/campaigns
router.get('/', authMiddleware, async (req, res) => {
    const uid = req.user.uid;

    try {
        const snapshot = await db.collection('campaigns')
            .where('userId', '==', uid)
            .get();

        const campaigns = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ campaigns });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/v1/campaigns/:campaignId/status
router.put('/:campaignId/status', authMiddleware, async (req, res) => {
    const { campaignId } = req.params;
    const { status } = req.body;
    const uid = req.user.uid;

    if (!['active', 'paused', 'skipped'].includes(status)) {
        return res.status(400).json({ error: 'status must be active, paused, or skipped' });
    }

    try {
        const campaignRef = db.collection('campaigns').doc(campaignId);
        const campaignDoc = await campaignRef.get();

        if (!campaignDoc.exists || campaignDoc.data().userId !== uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await campaignRef.update({ status });
        res.json({ success: true, campaignId, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/campaigns/:campaignId/leads
router.get('/:campaignId/leads', authMiddleware, async (req, res) => {
    const { campaignId } = req.params;
    const uid = req.user.uid;

    try {
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get();

        if (!campaignDoc.exists || campaignDoc.data().userId !== uid) {
            return res.status(403).json({ error: 'Campaign not found or access denied' });
        }

        const snapshot = await db.collection('leads')
            .where('campaignId', '==', campaignId)
            .get();

        const leads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ leads });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/v1/campaigns/:campaignId/import-leads
router.post('/:campaignId/import-leads', authMiddleware, async (req, res) => {
    const { campaignId } = req.params;
    const { searchUrl } = req.body;
    const uid = req.user.uid;

    if (!searchUrl) {
        return res.status(400).json({ error: 'searchUrl is required' });
    }

    try {
        // ✅ Guard: check user doc exists before accessing data()
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();

        if (!userData.linkedinSession) {
            return res.status(400).json({
                error: 'LinkedIn not connected. Connect first via /auth/linkedin-connect'
            });
        }

        const { scrapeLeads } = require('../services/linkedinService');
        const leads = await scrapeLeads(uid, userData.linkedinSession, searchUrl, campaignId);

        res.json({ success: true, leadsImported: leads.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// POST /api/v1/campaigns/:campaignId/check-accepted
// Checks which 'sent' leads have accepted, updates status, sends messages
router.post('/:campaignId/check-accepted', authMiddleware, async (req, res) => {
    const { campaignId } = req.params;
    const uid = req.user.uid;

    try {
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get();

        if (!campaignDoc.exists || campaignDoc.data().userId !== uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { checkAndSendMessages } = require('../services/automationService');

        // Fire and forget — respond immediately, run in background
        checkAndSendMessages(campaignId).catch(err => {
            console.error(`❌ checkAndSendMessages failed for ${campaignId}:`, err.message);
        });

        res.json({ success: true, message: 'Checking accepted connections and sending messages...' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// PUT /api/v1/leads/:leadId/status
// Manually update a single lead's status
router.put('/leads/:leadId/status', authMiddleware, async (req, res) => {
    const { leadId } = req.params;
    const { status } = req.body;
    const uid = req.user.uid;

    const validStatuses = ['pending', 'sent', 'accepted', 'replied', 'meeting', 'ignored'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const leadRef = db.collection('leads').doc(leadId);
        const leadDoc = await leadRef.get();

        if (!leadDoc.exists) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Verify this lead belongs to the requesting user
        if (leadDoc.data().userId !== uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await leadRef.update({
            status,
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedBy: 'manual'
        });

        res.json({ success: true, leadId, status });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// POST /api/v1/campaigns/:campaignId/start
router.post('/:campaignId/start', authMiddleware, async (req, res) => {
    const { campaignId } = req.params;
    const uid = req.user.uid;

    try {
        const campaignRef = db.collection('campaigns').doc(campaignId);
        const campaignDoc = await campaignRef.get();

        if (!campaignDoc.exists || campaignDoc.data().userId !== uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { runCampaign } = require('../services/automationService');

        // Fire and forget — don't await so response returns immediately
        runCampaign(campaignId).catch(err => {
            console.error(`❌ Campaign ${campaignId} failed:`, err.message);
        });

        res.json({ success: true, message: 'Campaign started successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
