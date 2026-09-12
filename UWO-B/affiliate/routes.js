const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const enterpriseController = require('./enterpriseController');
const { authPartner, authAdmin } = require('./middleware');
const tracking = require('./tracking');

// Cache clearing middleware for live reloading
router.use((req, res, next) => {
    try {
        delete require.cache[require.resolve('./controllers')];
    } catch (e) {}
    next();
});

// ================= DEBUG ROUTE =================
router.get('/debug/db', async (req, res) => {
    try {
        const Product = require('../models/Product');
        const SalesPartner = require('../models/SalesPartner');
        const AffiliateClick = require('../models/AffiliateClick');
        const products = await Product.find({}, { name: 1, slug: 1, _id: 1 });
        const partners = await SalesPartner.find({}, { name: 1, affiliateCode: 1, status: 1 });
        const clicks = await AffiliateClick.find({}).limit(5);
        res.json({ products, partners, clicks });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/debug/visitor/:visitorId', async (req, res) => {
    try {
        const AffiliateClick = require('../models/AffiliateClick');
        const AffiliateSession = require('../models/AffiliateSession');
        const AffiliateLead = require('../models/AffiliateLead');
        const AffiliateSale = require('../models/AffiliateSale');

        const { visitorId } = req.params;
        const clicks = await AffiliateClick.find({ visitor_id: visitorId });
        const sessions = await AffiliateSession.find({ visitor_id: visitorId });
        const leads = await AffiliateLead.find({ visitor_id: visitorId });
        const leadEmails = leads.map(l => l.email.toLowerCase());
        const sales = await AffiliateSale.find({ customerEmail: { $in: leadEmails } });

        res.json({ clicks, sessions, leads, sales });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= PUBLIC TRACKING ROUTES =================

/**
 * Handle Earn & Refer registrations.
 */
router.post('/referrals', async (req, res) => {
    try {
        const liveControllers = require('./controllers');
        return await liveControllers.submitReferral(req, res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Route to validate an affiliate code and set secure cookie.
 */
router.get('/validate', async (req, res) => {
    try {
        const { code, product } = req.query;
        const liveTracking = require('./tracking');
        const result = await liveTracking.validatePartnerAndProduct(code, product || 'general');
        if (result && result.partner) {
            const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
            res.cookie('affiliate_code', code, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
                secure: isSecure,
                httpOnly: true,
                sameSite: isSecure ? 'none' : 'lax',
                path: '/'
            });
            return res.json({ valid: true, affiliateCode: code });
        }
        res.status(400).json({ valid: false, error: 'Invalid partner or product' });
    } catch (err) {
        res.status(400).json({ valid: false, error: err.message });
    }
});

/**
 * Route to record immediate affiliate view / landing visit.
 * Payload: { affiliateCode, product, page, referrer, userAgent, timestamp, visitorId, sessionId }
 */
async function handleTrackView(req, res) {
    try {
        const { affiliateCode, product, productSlug, page, referrer, userAgent: bodyUA, visitorId, visitor_id, sessionId } = req.body;
        const targetProduct = (product || productSlug || 'general').toLowerCase();
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = bodyUA || req.headers['user-agent'] || '';

        const liveTracking = require('./tracking');
        const view = await liveTracking.trackView(affiliateCode, targetProduct, {
            ip,
            page: page || '',
            landingPage: page || '',
            landingUrl: page || '',
            referrer: referrer || '',
            sessionId: sessionId || '',
            visitorId: visitorId || visitor_id,
            userAgent
        });

        if (view && view._id && view._id !== 'bot_ignored') {
            const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
            res.cookie('affiliate_code', affiliateCode, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
                secure: isSecure,
                httpOnly: true,
                sameSite: isSecure ? 'none' : 'lax',
                path: '/'
            });
            if (view.visitor_id) {
                res.cookie('visitor_id', view.visitor_id, {
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    secure: isSecure,
                    httpOnly: false,
                    sameSite: isSecure ? 'none' : 'lax',
                    path: '/'
                });
            }
        }

        res.status(201).json({ 
            message: 'View tracked successfully', 
            viewId: view._id,
            visitorId: view.visitor_id,
            isDuplicate: !!view.isDuplicate
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

router.post('/track-view', handleTrackView);
router.post('/track/view', handleTrackView);
router.post('/track/click', handleTrackView);

/**
 * GET /api/affiliate/track
 * Handled by enterpriseController
 */
router.get('/track', enterpriseController.trackClickGet);

/**
 * Route to attribute a lead.
 */
router.post('/track/lead', async (req, res) => {
    try {
        const { affiliateCode, productSlug, customerName, email, phone, status, leadSource, visitorId, visitor_id } = req.body;

        const lead = await tracking.trackLead(affiliateCode, productSlug, {
            name: customerName,
            email,
            phone,
            status,
            leadSource,
            visitorId: visitorId || visitor_id
        });

        res.status(201).json({ message: 'Lead attributed successfully', leadId: lead._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * Route to attribute a sale (Razorpay, Cashfree, or direct gateway).
 * Payload: { affiliateCode, productSlug, orderId, paymentId, customerName, customerEmail, amount, currency, paymentStatus, paymentGateway, visitorId }
 */
async function handleTrackSale(req, res) {
    try {
        const {
            affiliateCode,
            affiliate_code,
            product,
            productSlug,
            productId,
            orderId,
            paymentId,
            customerName,
            customerEmail,
            amount,
            currency,
            paymentStatus,
            paymentGateway,
            gateway,
            visitorId,
            visitor_id
        } = req.body;

        const resolvedCode = affiliateCode || affiliate_code || req.headers['x-uwo-affiliate-code'] || (req.cookies && (req.cookies.affiliate_code || req.cookies.uwo_affiliate_code));
        const resolvedVisitorId = visitorId || visitor_id || req.headers['x-uwo-visitor-id'] || (req.cookies && (req.cookies.visitor_id || req.cookies.uwo_visitor_id));
        const targetProduct = product || productSlug || 'general';
        const targetGateway = paymentGateway || gateway || 'Razorpay';

        const sale = await tracking.trackSale(resolvedCode, targetProduct, {
            orderId: orderId || paymentId || ('ord_' + Date.now()),
            paymentId: paymentId || orderId || '',
            customerName: customerName || '',
            customerEmail: customerEmail || '',
            amount: Number(amount) || 0,
            currency: currency || 'INR',
            paymentStatus: (paymentStatus || 'paid').toLowerCase() === 'success' ? 'paid' : (paymentStatus || 'paid'),
            paymentGateway: targetGateway,
            visitorId: resolvedVisitorId
        });

        res.status(201).json({
            success: true,
            message: 'Sale attributed successfully',
            saleId: sale._id,
            partnerId: sale.partnerId,
            amount: sale.amount,
            paymentGateway: sale.paymentGateway || targetGateway
        });
    } catch (err) {
        console.error("❌ Sale tracking error:", err);
        res.status(400).json({ success: false, error: err.message });
    }
}

router.post('/track/sale', handleTrackSale);
router.post('/track-sale', handleTrackSale);

/**
 * Route to receive Razorpay Webhooks.
 * Endpoint: POST /api/affiliate/webhook/razorpay
 */
async function handleRazorpayWebhook(req, res) {
    try {
        const crypto = require('crypto');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (webhookSecret && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (expectedSignature !== signature) {
                console.warn('⚠️ [Razorpay Webhook] Invalid signature received!');
                return res.status(400).json({ error: 'Invalid webhook signature' });
            }
        }

        const { event, payload } = req.body;
        console.log(`💳 [Razorpay Webhook Event Received]: ${event}`);

        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payment ? payload.payment.entity : (payload.order ? payload.order.entity : {});
            const notes = paymentEntity.notes || {};

            const customerEmail = paymentEntity.email || notes.email || notes.customerEmail || '';
            const customerName = notes.name || notes.customerName || '';
            const amount = paymentEntity.amount ? paymentEntity.amount / 100 : Number(notes.amount || 0); // Convert paise to currency unit
            const orderId = paymentEntity.order_id || paymentEntity.id || ('ord_' + Date.now());
            const paymentId = paymentEntity.id || '';
            const affiliateCode = notes.affiliateCode || notes.affiliate_code || notes.ref || '';
            const productSlug = notes.productSlug || notes.product || 'general';

            if (customerEmail || affiliateCode) {
                const sale = await tracking.trackSale(affiliateCode, productSlug, {
                    orderId,
                    paymentId,
                    customerName,
                    customerEmail,
                    amount,
                    currency: paymentEntity.currency || 'INR',
                    paymentGateway: 'Razorpay'
                });

                console.log(`✅ [Razorpay Webhook] Sale tracked successfully for ${customerEmail}! Sale ID: ${sale._id}`);
                return res.status(200).json({ status: 'ok', message: 'Sale tracked successfully', saleId: sale._id });
            }
        }

        res.status(200).json({ status: 'ignored', message: 'Event ignored' });
    } catch (err) {
        console.error('❌ [Razorpay Webhook Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
}

router.post('/webhook/razorpay', handleRazorpayWebhook);

/**
 * Route to receive Cashfree Webhooks.
 * Endpoint: POST /api/affiliate/webhook/cashfree
 */
async function handleCashfreeWebhook(req, res) {
    try {
        const payload = req.body || {};
        const eventType = payload.type || payload.event || '';
        const data = payload.data || {};

        console.log(`💳 [Cashfree Webhook Event Received]: ${eventType}`);

        if (eventType.includes('PAYMENT_SUCCESS') || eventType.includes('SUCCESS') || (data.payment && data.payment.payment_status === 'SUCCESS')) {
            const order = data.order || {};
            const payment = data.payment || {};
            const customer = data.customer_details || {};
            const tags = order.order_tags || {};

            const customerEmail = customer.customer_email || customer.email || '';
            const customerName = customer.customer_name || customer.name || '';
            const amount = Number(payment.payment_amount || order.order_amount || 0);
            const orderId = order.order_id || ('ord_' + Date.now());
            const paymentId = String(payment.cf_payment_id || payment.payment_id || orderId);
            const affiliateCode = tags.affiliateCode || tags.affiliate_code || tags.ref || '';
            const productSlug = tags.productSlug || tags.product || 'general';

            if (customerEmail || affiliateCode) {
                const sale = await tracking.trackSale(affiliateCode, productSlug, {
                    orderId,
                    paymentId,
                    customerName,
                    customerEmail,
                    amount,
                    currency: order.order_currency || 'INR',
                    paymentGateway: 'Cashfree'
                });

                console.log(`✅ [Cashfree Webhook] Sale tracked successfully for ${customerEmail}! Sale ID: ${sale._id}`);
                return res.status(200).json({ status: 'ok', message: 'Sale tracked successfully', saleId: sale._id });
            }
        }

        res.status(200).json({ status: 'ignored', message: 'Event ignored' });
    } catch (err) {
        console.error('❌ [Cashfree Webhook Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
}

router.post('/webhook/cashfree', handleCashfreeWebhook);



/**
 * Route to attribute a login/registration (compatibility route).
 */
router.post('/track/login', enterpriseController.trackLogin);

/**
 * POST /api/affiliate/login
 * Handled by enterpriseController
 */
router.post('/login', enterpriseController.trackLogin);

/**
 * GET /api/affiliate/live-updates
 * Server-Sent Events live stream.
 */
router.get('/live-updates', enterpriseController.liveUpdatesSSE);


// Cache clearing middleware for live reloading
router.use((req, res, next) => {
    try {
        delete require.cache[require.resolve('./controllers')];
    } catch (e) {}
    next();
});

// ================= SALES PARTNER ROUTES =================

router.post('/partner/login', (req, res, next) => require('./controllers').partnerLogin(req, res, next));
router.post('/partner/register', (req, res, next) => require('./controllers').partnerRegister(req, res, next));
router.post('/referrals', (req, res, next) => require('./controllers').submitReferral(req, res, next));
router.get('/partner/dashboard', authPartner, (req, res, next) => require('./controllers').getPartnerDashboard(req, res, next));
router.get('/partner/dashboard/:productId', authPartner, (req, res, next) => require('./controllers').getPartnerProductDashboard(req, res, next));
router.get('/partner/activity', authPartner, (req, res, next) => require('./controllers').getPartnerActivity(req, res, next));

// Dedicated route aliases for direct paths
router.get('/dashboard', authPartner, (req, res, next) => require('./controllers').getPartnerDashboard(req, res, next));
router.get('/product/:productId', authPartner, (req, res, next) => require('./controllers').getPartnerProductDashboard(req, res, next));
router.get('/activity', authPartner, (req, res, next) => require('./controllers').getPartnerActivity(req, res, next));


// ================= ADMIN MANAGEMENT ROUTES =================

router.get('/admin/partners', authAdmin, (req, res, next) => require('./controllers').getPartners(req, res, next));
router.get('/admin/partner-details/:partnerId', authAdmin, (req, res, next) => require('./controllers').getAdminPartnerDetail(req, res, next));
router.get('/admin/partners/:id', authAdmin, (req, res, next) => require('./controllers').getPartnerDetails(req, res, next));
router.post('/admin/partners', authAdmin, (req, res, next) => require('./controllers').createPartner(req, res, next));
router.put('/admin/partners/:id', authAdmin, controllers.updatePartner);
router.get('/admin/partners/:id/assigned-products', authAdmin, controllers.getPartnerAssignedProducts);
router.put('/admin/partners/:id/assigned-products', authAdmin, controllers.updatePartnerAssignedProducts);
router.put('/admin/partners/:id/reset-password', authAdmin, controllers.resetPassword);
router.delete('/admin/partners/:id', authAdmin, controllers.deletePartner);
router.get('/admin/analytics', authAdmin, controllers.getAdminAnalytics);

// Product Management CRUD
router.get('/admin/products', authAdmin, controllers.getProducts);
router.post('/admin/products', authAdmin, controllers.createProduct);
router.put('/admin/products/:id', authAdmin, controllers.updateProduct);
router.delete('/admin/products/:id', authAdmin, controllers.deleteProduct);

// Registration requests review
router.get('/admin/pending-requests', authAdmin, controllers.getPendingRequests);
router.post('/admin/approve-request/:id', authAdmin, controllers.approvePartnerRequest);
router.post('/admin/reject-request/:id', authAdmin, controllers.rejectPartnerRequest);

module.exports = router;

