const SalesPartner = require('../models/SalesPartner');
const Product = require('../models/Product');
const AffiliateClick = require('../models/AffiliateClick');
const AffiliateLead = require('../models/AffiliateLead');
const AffiliateSale = require('../models/AffiliateSale');
const PartnerProduct = require('../models/PartnerProduct');
const AffiliateSession = require('../models/AffiliateSession');
const AffiliateLogin = require('../models/AffiliateLogin');

/**
 * Validates partner and product by code and slug.
 * Returns the DB objects if valid, or throws an error.
 */
async function validatePartnerAndProduct(affiliateCode, productSlug = 'general') {
    if (!affiliateCode) {
        throw new Error('Affiliate code is required');
    }
    const cleanSlug = (productSlug || 'general').toString().toLowerCase().trim();

    const partner = await SalesPartner.findOne({ affiliateCode });
    if (!partner) {
        throw new Error('Invalid affiliate code');
    }
    if (partner.status !== 'active') {
        throw new Error('Sales partner is disabled');
    }

    let product = null;

    if (cleanSlug !== 'general') {
        product = await Product.findOne({ slug: cleanSlug });
        if (!product) {
            product = await Product.findOne({ name: new RegExp('^' + cleanSlug + '$', 'i') });
        }

        if (product) {
            let partnerProduct = await PartnerProduct.findOne({
                partnerId: partner._id,
                productId: product._id
            });
            if (!partnerProduct && product.status === 'active') {
                partnerProduct = new PartnerProduct({
                    partnerId: partner._id,
                    productId: product._id,
                    commission: product.commissionValue || 10,
                    status: 'active'
                });
                await partnerProduct.save();
            }
        }
    }

    return { partner, product };
}

/**
 * Helper to check if user agent matches bot traffic signatures.
 */
function isBot(userAgent) {
    if (!userAgent) return false;
    const botPattern = /bot|googlebot|crawler|spider|robot|crawling|headlesschrome|puppeteer|selenium|playwright/i;
    return botPattern.test(userAgent);
}

/**
 * Fallback to generate md5 hash based visitor ID when client-side generation isn't provided.
 */
function generateBackendVisitorId(ip, userAgent) {
    const crypto = require('crypto');
    return 'ipua_' + crypto.createHash('md5').update(`${ip}_${userAgent}`).digest('hex');
}

/**
 * Tracks a click on an affiliate link.
 */
async function trackClick(affiliateCode, productSlug, reqData = {}) {
    const userAgent = reqData.userAgent || reqData.user_agent || '';
    const slug = productSlug || reqData.productSlug || reqData.product || 'general';
    
    // Bot Protection
    if (isBot(userAgent)) {
        console.log(`🤖 Bot traffic detected: ${userAgent}. Click ignored.`);
        return { _id: 'bot_ignored', isBot: true };
    }

    const { partner, product } = await validatePartnerAndProduct(affiliateCode, slug);

    // Visitor Identification
    const ip = reqData.ip || '';
    const visitorId = reqData.visitorId || reqData.visitor_id || generateBackendVisitorId(ip, userAgent);

    // Throttle check (2 seconds) to avoid counting rapid page refreshes/F5 spam
    const queryCond = { visitor_id: visitorId, partner_id: partner._id };
    if (product) queryCond.product_id = product._id;
    else queryCond.product_id = { $exists: false };

    const lastClick = await AffiliateClick.findOne(queryCond).sort({ created_at: -1 });

    if (lastClick && (Date.now() - new Date(lastClick.created_at).getTime() < 2000)) {
        console.log(`⚠️ Throttling duplicate click request for visitor: ${visitorId}`);
        return lastClick;
    }

    // Check if any click exists for this visitor and partner (to determine unique click)
    const existingVisitorClick = await AffiliateClick.findOne({ visitor_id: visitorId, partner_id: partner._id });

    // Retrieve configurable session expiry length from Admin Settings (defaults to 24 hours)
    const Settings = require('../models/Settings');
    const sessionSetting = await Settings.findOne({ key: 'affiliate_session_expiry' });
    const expiryHours = sessionSetting && !isNaN(sessionSetting.value) ? Number(sessionSetting.value) : 24;
    const sessionExpiryMs = expiryHours * 60 * 60 * 1000;

    // Check for existing active session
    let session = await AffiliateSession.findOne({
        ...queryCond,
        last_activity: { $gt: new Date(Date.now() - sessionExpiryMs) }
    });

    let clickType = existingVisitorClick ? 'total' : 'unique';
    let sessionId = '';

    if (session) {
        // Restore session
        sessionId = session.session_id;
        session.last_activity = Date.now();
        await session.save();
    } else {
        // Create new session
        const crypto = require('crypto');
        sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
        
        session = new AffiliateSession({
            session_id: sessionId,
            visitor_id: visitorId,
            partner_id: partner._id,
            product_id: product ? product._id : undefined,
            affiliate_code: affiliateCode,
            landing_page: reqData.landingUrl || reqData.landingPage || '',
            ip_address: ip,
            user_agent: userAgent,
            device: reqData.device || 'Desktop',
            browser: reqData.browser || 'Unknown',
            country: reqData.country || 'Unknown',
            city: reqData.city || 'Unknown',
            is_converted: false
        });
        await session.save();
    }

    // Save Click Log
    const click = new AffiliateClick({
        partnerId: partner._id,
        productId: product ? product._id : undefined,
        partner_id: partner._id,
        product_id: product ? product._id : undefined,
        affiliateCode: affiliateCode,
        affiliate_code: affiliateCode,
        ip: ip,
        ip_address: ip,
        device: reqData.device || '',
        browser: reqData.browser || '',
        operatingSystem: reqData.operatingSystem || '',
        country: reqData.country || 'Unknown',
        referrer: reqData.referrer || '',
        landingUrl: reqData.landingUrl || reqData.landingPage || '',
        landing_page: reqData.landingUrl || reqData.landingPage || '',
        sessionId: sessionId,
        session_id: sessionId,
        visitor_id: visitorId,
        click_type: clickType
    });

    await click.save();
    return click;
}

/**
 * Tracks a lead generated from an affiliate referral.
 */
async function trackLead(affiliateCode, productSlug, customerData) {
    const visitorId = customerData.visitorId || customerData.visitor_id;
    
    let resolvedCode = affiliateCode;
    let resolvedSlug = productSlug;

    // Resolve details from session if not explicitly provided
    if ((!resolvedCode || !resolvedSlug) && visitorId) {
        const Settings = require('../models/Settings');
        const sessionSetting = await Settings.findOne({ key: 'affiliate_session_expiry' });
        const expiryHours = sessionSetting && !isNaN(sessionSetting.value) ? Number(sessionSetting.value) : 24;
        const sessionExpiryMs = expiryHours * 60 * 60 * 1000;

        const activeSession = await AffiliateSession.findOne({
            visitor_id: visitorId,
            last_activity: { $gt: new Date(Date.now() - sessionExpiryMs) }
        }).populate('partner_id').populate('product_id');
        
        if (activeSession && activeSession.partner_id && activeSession.product_id) {
            resolvedCode = activeSession.affiliate_code || activeSession.partner_id.affiliateCode;
            resolvedSlug = activeSession.product_id.slug;
        }
    }

    // Resolve details from customer email if not resolved and email is provided
    if (!resolvedCode && customerData.email) {
        const email = customerData.email.toLowerCase();
        
        // 1. Look up AffiliateLogin (first-touch permanent mapping)
        const loginAttr = await AffiliateLogin.findOne({ customerEmail: email });
        if (loginAttr) {
            resolvedCode = loginAttr.affiliateCode;
            if (loginAttr.productId && !resolvedSlug) {
                const productObj = await Product.findById(loginAttr.productId);
                if (productObj) resolvedSlug = productObj.slug;
            }
        }
        
        // 2. If not found, look up AffiliateLead (lead tracking mapping)
        if (!resolvedCode) {
            const leadAttr = await AffiliateLead.findOne({ email }).sort({ created_at: -1 });
            if (leadAttr) {
                resolvedCode = leadAttr.affiliateCode;
                if (leadAttr.productId && !resolvedSlug) {
                    const productObj = await Product.findById(leadAttr.productId);
                    if (productObj) resolvedSlug = productObj.slug;
                }
            }
        }
    }

    const { partner, product } = await validatePartnerAndProduct(resolvedCode, resolvedSlug);

    if (!customerData.email || !customerData.name) {
        throw new Error('Customer name and email are required for lead tracking');
    }

    // Check if lead already exists for this email and product
    let lead = await AffiliateLead.findOne({
        productId: product._id,
        email: customerData.email.toLowerCase()
    });

    if (lead) {
        lead.customerName = customerData.name;
        lead.phone = customerData.phone || lead.phone;
        lead.affiliateCode = resolvedCode;
        lead.visitor_id = visitorId || lead.visitor_id || '';
        if (customerData.status) {
            lead.status = customerData.status;
        }
        await lead.save();
    } else {
        lead = new AffiliateLead({
            partnerId: partner._id,
            productId: product._id,
            affiliateCode: resolvedCode,
            customerName: customerData.name,
            email: customerData.email.toLowerCase(),
            phone: customerData.phone || '',
            status: customerData.status || 'New',
            leadSource: customerData.leadSource || 'web',
            visitor_id: visitorId || ''
        });
        await lead.save();
    }

    return lead;
}

/**
 * Tracks a sale made from an affiliate referral.
 */
async function trackSale(affiliateCode, productSlug, saleData = {}) {
    const visitorId = saleData.visitorId || saleData.visitor_id;
    
    let resolvedCode = affiliateCode;
    let resolvedSlug = productSlug;

    // 1. Fallback: Resolve from active AffiliateSession by visitorId
    if ((!resolvedCode || !resolvedSlug) && visitorId) {
        const Settings = require('../models/Settings');
        const sessionSetting = await Settings.findOne({ key: 'affiliate_session_expiry' });
        const expiryHours = sessionSetting && !isNaN(sessionSetting.value) ? Number(sessionSetting.value) : 24;
        const sessionExpiryMs = expiryHours * 60 * 60 * 1000;

        const activeSession = await AffiliateSession.findOne({
            visitor_id: visitorId,
            last_activity: { $gt: new Date(Date.now() - sessionExpiryMs) }
        }).sort({ last_activity: -1 }).populate('partner_id').populate('product_id');
        
        if (activeSession && activeSession.partner_id) {
            resolvedCode = resolvedCode || activeSession.affiliate_code || activeSession.partner_id.affiliateCode;
            if (activeSession.product_id && !resolvedSlug) {
                resolvedSlug = activeSession.product_id.slug;
            }
        }
    }

    // 2. Fallback: Resolve from recent AffiliateClick by visitorId
    if (!resolvedCode && visitorId) {
        const lastClick = await AffiliateClick.findOne({
            visitor_id: visitorId
        }).sort({ created_at: -1 }).populate('partner_id');
        
        if (lastClick && lastClick.partner_id) {
            resolvedCode = lastClick.affiliate_code || lastClick.affiliateCode || lastClick.partner_id.affiliateCode;
            if (lastClick.productSlug && !resolvedSlug) {
                resolvedSlug = lastClick.productSlug;
            }
        }
    }

    // 3. Fallback: Resolve from customer email if email is provided
    if (!resolvedCode && saleData.customerEmail) {
        const email = saleData.customerEmail.toLowerCase();
        
        // 3a. Look up AffiliateLogin (first-touch permanent mapping)
        const loginAttr = await AffiliateLogin.findOne({ customerEmail: email });
        if (loginAttr) {
            resolvedCode = loginAttr.affiliateCode;
            if (loginAttr.productId && !resolvedSlug) {
                const productObj = await Product.findById(loginAttr.productId);
                if (productObj) resolvedSlug = productObj.slug;
            }
        }
        
        // 3b. Look up AffiliateLead (lead tracking mapping)
        if (!resolvedCode) {
            const leadAttr = await AffiliateLead.findOne({ email }).sort({ created_at: -1 });
            if (leadAttr) {
                resolvedCode = leadAttr.affiliateCode;
                if (leadAttr.productId && !resolvedSlug) {
                    const productObj = await Product.findById(leadAttr.productId);
                    if (productObj) resolvedSlug = productObj.slug;
                }
            }
        }
    }

    if (!resolvedCode) {
        throw new Error('Affiliate code is missing and could not be resolved for sale attribution.');
    }

    const { partner, product } = await validatePartnerAndProduct(resolvedCode, resolvedSlug);

    const orderId = saleData.orderId || saleData.paymentId || ('ord_' + Date.now());
    const amount = Number(saleData.amount) || 0;

    if (!amount) {
        throw new Error('Order amount must be greater than 0 for sale tracking.');
    }

    // Check if sale already registered to prevent duplicates
    let sale = await AffiliateSale.findOne({
        $or: [
            { orderId: orderId },
            ...(saleData.paymentId ? [{ transactionId: saleData.paymentId }] : [])
        ]
    });

    if (sale) {
        console.log(`ℹ️ Sale already tracked for orderId ${orderId}. Returning existing record.`);
        return sale;
    }

    // Fetch custom commission for this partner and product
    let commissionRate = 10; // Default 10% for general sales
    let productId = undefined;
    if (product) {
        productId = product._id;
        const partnerProduct = await PartnerProduct.findOne({
            partnerId: partner._id,
            productId: product._id
        });
        commissionRate = partnerProduct ? partnerProduct.commission : (product.commissionValue || 10);
    }
    const commissionEarned = amount * (commissionRate / 100);

    const gatewayName = saleData.paymentGateway || saleData.gateway || 'Razorpay';

    sale = new AffiliateSale({
        partnerId: partner._id,
        productId: productId,
        affiliateCode: resolvedCode,
        orderId: orderId,
        customerName: saleData.customerName || 'Customer',
        customerEmail: saleData.customerEmail ? saleData.customerEmail.toLowerCase() : 'customer@uwo.in',
        amount: amount,
        currency: saleData.currency || 'INR',
        paymentStatus: saleData.paymentStatus || 'paid',
        transactionId: saleData.paymentId || saleData.transactionId || '',
        paymentGateway: gatewayName,
        purchaseDate: saleData.purchaseDate || Date.now(),
        commissionRate: commissionRate,
        commissionEarned: commissionEarned,
        orderStatus: saleData.orderStatus || 'completed'
    });

    await sale.save();
    console.log(`✅ Affiliate Sale Attributed: ${resolvedCode} | Product: ${product ? product.name : 'General'} | Amount: ₹${amount} | Gateway: ${gatewayName}`);

    // Create Activity Log for Partner & Product Dashboard
    try {
        const activity = new AffiliateClick({
            partnerId: partner._id,
            productId: productId,
            partner_id: partner._id,
            product_id: productId,
            affiliateCode: resolvedCode,
            affiliate_code: resolvedCode,
            productSlug: product ? product.slug : (productSlug || 'general'),
            visitor_id: visitorId || 'customer',
            click_type: 'sale',
            action: `Purchased ${product ? product.name : (productSlug || 'Product')}`,
            amount: `₹${amount}`,
            created_at: new Date()
        });
        await activity.save();
    } catch (actErr) {
        console.warn("Non-fatal error logging sale activity:", actErr);
    }

    // Mark corresponding lead as Converted if it exists
    if (saleData.customerEmail) {
        const leadQuery = { email: saleData.customerEmail.toLowerCase() };
        if (product) {
            leadQuery.productId = product._id;
        }
        await AffiliateLead.findOneAndUpdate(
            leadQuery,
            { status: 'Converted' }
        );
    }

    // Mark corresponding session as converted
    if (visitorId) {
        const sessionQuery = { visitor_id: visitorId, partner_id: partner._id };
        if (product) {
            sessionQuery.product_id = product._id;
        }
        await AffiliateSession.findOneAndUpdate(
            sessionQuery,
            { is_converted: true }
        );
    }

    return sale;
}

/**
 * Tracks a customer registration/login event attributed to an affiliate referral.
 * Enforces first-touch attribution: once referred, the customer is permanently tied to that affiliate.
 */
async function trackLogin(affiliateCode, productSlug, customerData) {
    if (!customerData.email) {
        throw new Error('Customer email is required for login tracking');
    }

    const email = customerData.email.toLowerCase();

    // Check if this customer is already attributed to ANY affiliate (First-touch attribution)
    const existingAttribution = await AffiliateLogin.findOne({ customerEmail: email });
    if (existingAttribution) {
        console.log(`ℹ️ Customer ${email} is already attributed to affiliate ${existingAttribution.affiliateCode}. Skipping new attribution.`);
        return existingAttribution;
    }

    // Validate partner and product
    const { partner, product } = await validatePartnerAndProduct(affiliateCode, productSlug);

    // Create the login tracking record
    const loginRecord = new AffiliateLogin({
        partnerId: partner._id,
        productId: product ? product._id : undefined,
        affiliateCode,
        customerEmail: email,
        customerName: customerData.name || '',
        visitorId: customerData.visitorId || '',
        sessionId: customerData.sessionId || '',
        browser: customerData.browser || '',
        device: customerData.device || '',
        ip: customerData.ip || ''
    });

    await loginRecord.save();
    console.log(`✅ Affiliate login tracked for ${email} under affiliate code ${affiliateCode}`);
    return loginRecord;
}

/**
 * Tracks a view / landing page visit on an affiliate link with 30-minute F5 refresh deduplication.
 */
async function trackView(affiliateCode, productSlug, reqData = {}) {
    const userAgent = reqData.userAgent || reqData.user_agent || '';
    const slug = productSlug || reqData.productSlug || reqData.product || 'general';

    // Bot Protection
    if (isBot(userAgent)) {
        console.log(`🤖 Bot traffic detected: ${userAgent}. View ignored.`);
        return { _id: 'bot_ignored', isBot: true };
    }

    const { partner, product } = await validatePartnerAndProduct(affiliateCode, slug);

    // Visitor Identification
    const ip = reqData.ip || '';
    const visitorId = reqData.visitorId || reqData.visitor_id || generateBackendVisitorId(ip, userAgent);

    // 30-minute (1800000 ms) Deduplication Rate Limit Check
    const queryCond = { visitor_id: visitorId, partner_id: partner._id };
    if (product) queryCond.product_id = product._id;

    const DUP_WINDOW_MS = 30 * 60 * 1000; // 30 Minutes
    const lastView = await AffiliateClick.findOne({
        ...queryCond,
        created_at: { $gt: new Date(Date.now() - DUP_WINDOW_MS) }
    }).sort({ created_at: -1 });

    if (lastView) {
        console.log(`⚠️ Deduplicating refresh view for visitor ${visitorId} on product ${productSlug || 'general'}`);
        return { ...lastView.toObject(), isDuplicate: true };
    }

    // Check if any click/view exists for this visitor and partner (to determine unique vs returning view)
    const existingVisitorClick = await AffiliateClick.findOne({ visitor_id: visitorId, partner_id: partner._id });
    const clickType = existingVisitorClick ? 'total' : 'unique';

    // Retrieve active session or create new
    const Settings = require('../models/Settings');
    const sessionSetting = await Settings.findOne({ key: 'affiliate_session_expiry' });
    const expiryHours = sessionSetting && !isNaN(sessionSetting.value) ? Number(sessionSetting.value) : 24;
    const sessionExpiryMs = expiryHours * 60 * 60 * 1000;

    let session = await AffiliateSession.findOne({
        ...queryCond,
        last_activity: { $gt: new Date(Date.now() - sessionExpiryMs) }
    });

    let sessionId = reqData.sessionId || '';
    if (session) {
        sessionId = session.session_id;
        session.last_activity = Date.now();
        await session.save();
    } else {
        const crypto = require('crypto');
        sessionId = reqData.sessionId || ('sess_' + crypto.randomBytes(16).toString('hex'));
        
        session = new AffiliateSession({
            session_id: sessionId,
            visitor_id: visitorId,
            partner_id: partner._id,
            product_id: product ? product._id : undefined,
            affiliate_code: affiliateCode,
            landing_page: reqData.landingUrl || reqData.landingPage || reqData.page || '',
            ip_address: ip,
            user_agent: userAgent,
            device: reqData.device || 'Desktop',
            browser: reqData.browser || 'Unknown',
            country: reqData.country || 'Unknown',
            city: reqData.city || 'Unknown',
            is_converted: false
        });
        await session.save();
    }

    // Save Click/View Log
    const click = new AffiliateClick({
        partnerId: partner._id,
        productId: product ? product._id : undefined,
        partner_id: partner._id,
        product_id: product ? product._id : undefined,
        affiliateCode: affiliateCode,
        affiliate_code: affiliateCode,
        productSlug: product ? product.slug : (productSlug || 'general'),
        visitor_id: visitorId,
        session_id: sessionId,
        click_type: clickType,
        ip: ip,
        user_agent: userAgent,
        device: reqData.device || 'Desktop',
        browser: reqData.browser || 'Unknown',
        country: reqData.country || 'Unknown',
        city: reqData.city || 'Unknown',
        referrer: reqData.referrer || '',
        landing_page: reqData.landingUrl || reqData.landingPage || reqData.page || '',
        clickedAt: new Date(),
        created_at: new Date()
    });

    await click.save();
    console.log(`✅ Affiliate View recorded: ${affiliateCode} | Product: ${productSlug || 'general'} | Type: ${clickType}`);
    return click;
}

module.exports = {
    validatePartnerAndProduct,
    trackClick,
    trackView,
    trackLead,
    trackSale,
    trackLogin
};
