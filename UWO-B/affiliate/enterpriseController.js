const mongoose = require('mongoose');
const crypto = require('crypto');
const Product = require('../models/Product');
const SalesPartner = require('../models/SalesPartner');
const AffiliateLink = require('../models/AffiliateLink');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const AffiliateSale = require('../models/AffiliateSale');
const AffiliateLog = require('../models/AffiliateLog');
const AffiliateLogin = require('../models/AffiliateLogin');
const AffiliateSession = require('../models/AffiliateSession');

// SSE client management
let sseClients = [];

/**
 * SSE endpoint for live updates.
 */
exports.liveUpdatesSSE = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = { id: Date.now(), res };
    sseClients.push(client);
    console.log(`📡 SSE client connected: ${client.id}. Active: ${sseClients.length}`);

    res.write(`data: ${JSON.stringify({ type: 'connected', id: client.id })}\n\n`);

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== client.id);
        console.log(`📡 SSE client disconnected: ${client.id}. Active: ${sseClients.length}`);
    });
};

/**
 * Broadcasts data to all connected SSE clients.
 */
function broadcastSSE(data) {
    console.log(`📡 Broadcasting event:`, data);
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
        try {
            client.res.write(payload);
        } catch (err) {
            console.error(`Error writing to SSE client ${client.id}:`, err);
        }
    });

    // Save logs for "Dashboard Updated"
    try {
        const log = new AffiliateLog({
            eventType: 'Dashboard Updated',
            partnerId: data.partnerId,
            productId: data.productId,
            orderId: data.orderId,
            details: `Dashboard metrics update event broadcasted: type=${data.type}`
        });
        log.save();
    } catch (e) {
        console.error('Failed to log dashboard update activity:', e.message);
    }
}
exports.broadcastSSE = broadcastSSE;

/**
 * GET /api/affiliate/track
 * Handles click tracking and browser cookie setups.
 */
exports.trackClickGet = async (req, res) => {
    try {
        const affiliateCode = req.query.affiliate || req.query.ref;
        let productSlug = req.query.product || req.query.productSlug || 'general';

        if (!affiliateCode) {
            return res.status(400).json({ error: 'Affiliate code is required' });
        }

        // Validate partner
        const partner = await SalesPartner.findOne({ affiliateCode });
        if (!partner) {
            return res.status(400).json({ error: 'Invalid affiliate code' });
        }
        if (partner.status !== 'active') {
            return res.status(400).json({ error: 'Sales partner account is disabled' });
        }

        // Find product
        let product = null;
        if (productSlug !== 'general') {
            product = await Product.findOne({ slug: productSlug.toLowerCase() });
            if (!product) {
                // Try parsing referer for fallback matching
                const referer = req.headers.referer || '';
                if (referer.includes('efvframework')) productSlug = 'efv';
                else if (referer.includes('aimall24')) productSlug = 'aisa';
                else if (referer.includes('aisa-connect')) productSlug = 'aisa-connect';
                else if (referer.includes('ai-legal')) productSlug = 'ai-legal';
                product = await Product.findOne({ slug: productSlug.toLowerCase() });
            }
        }

        // Visitor Identification
        let visitorId = '';
        if (req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
                const [k, v] = c.trim().split('=');
                acc[k] = v;
                return acc;
            }, {});
            visitorId = cookies['uwo_visitor_id'];
        }
        if (!visitorId) {
            visitorId = 'vid_' + crypto.randomBytes(16).toString('hex');
        }

        const cookieOpts = {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
            sameSite: 'lax'
        };

        res.cookie('uwo_affiliate_code', affiliateCode, cookieOpts);
        res.cookie('uwo_visitor_id', visitorId, cookieOpts);
        if (product) {
            res.cookie('uwo_affiliate_product', product.slug, cookieOpts);
        }

        // Trigger existing tracking module
        const tracking = require('./tracking');
        const click = await tracking.trackClick(affiliateCode, product ? product.slug : 'general', {
            ip: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || '',
            visitorId,
            sessionId: 'sess_' + crypto.randomBytes(16).toString('hex'),
            landingUrl: req.originalUrl || ''
        });

        // Audit Log
        const log = new AffiliateLog({
            eventType: 'Affiliate Link Opened',
            partnerId: partner._id,
            productId: product ? product._id : undefined,
            details: `Affiliate Link Opened: code=${affiliateCode}, product=${productSlug}, visitorId=${visitorId}`,
            ip: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || ''
        });
        await log.save();

        broadcastSSE({
            type: 'Affiliate Link Opened',
            partnerId: partner._id,
            productId: product ? product._id : undefined
        });

        if (req.query.redirect) {
            return res.redirect(req.query.redirect);
        } else if (product && product.landingUrl) {
            return res.redirect(product.landingUrl);
        }

        return res.status(200).json({
            message: 'Affiliate tracked successfully',
            affiliateCode,
            visitorId,
            productSlug: product ? product.slug : 'general',
            clickId: click._id
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/affiliate/login
 * Tracks logins and enforces first-touch attribution mapping.
 */
exports.trackLogin = async (req, res) => {
    try {
        const { email, name } = req.body;
        let affiliateCode = req.body.affiliateCode || req.body.affiliate;
        let productSlug = req.body.productSlug || req.body.product || 'general';

        if (!email) {
            return res.status(400).json({ error: 'Customer email is required' });
        }

        if (!affiliateCode && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
                const [k, v] = c.trim().split('=');
                acc[k] = v;
                return acc;
            }, {});
            affiliateCode = cookies['uwo_affiliate_code'];
            if (!productSlug || productSlug === 'general') {
                productSlug = cookies['uwo_affiliate_product'] || 'general';
            }
        }

        let customer = await Customer.findOne({ email: email.toLowerCase() });
        const isNewReg = !customer;
        
        let partner = null;
        let product = null;

        if (affiliateCode) {
            partner = await SalesPartner.findOne({ affiliateCode });
            if (productSlug && productSlug !== 'general') {
                product = await Product.findOne({ slug: productSlug.toLowerCase() });
            }
        }

        if (!customer) {
            customer = new Customer({
                email: email.toLowerCase(),
                name: name || '',
                affiliateCode: affiliateCode || '',
                partnerId: partner ? partner._id : undefined,
                productId: product ? product._id : undefined,
                visitorId: req.body.visitorId || ''
            });
            await customer.save();
        } else {
            // First-touch attribution policy: do not overwrite existing affiliate details
            if (!customer.affiliateCode && affiliateCode) {
                customer.affiliateCode = affiliateCode;
                customer.partnerId = partner ? partner._id : undefined;
                customer.productId = product ? product._id : undefined;
                if (name && !customer.name) customer.name = name;
                await customer.save();
            }
        }

        // Set standard Login count records in database
        if (customer.affiliateCode) {
            const activePartner = await SalesPartner.findOne({ affiliateCode: customer.affiliateCode });
            if (activePartner && activePartner.status === 'active') {
                try {
                    const loginRecord = new AffiliateLogin({
                        partnerId: activePartner._id,
                        productId: customer.productId,
                        affiliateCode: customer.affiliateCode,
                        customerEmail: email.toLowerCase(),
                        customerName: name || customer.name || '',
                        visitorId: req.body.visitorId || customer.visitorId || '',
                        sessionId: req.body.sessionId || '',
                        browser: req.body.browser || '',
                        device: req.body.device || '',
                        ip: req.ip || ''
                    });
                    await loginRecord.save();
                } catch (dupError) {
                    console.log(`ℹ️ Duplicate unique logins check resolved: ${email}`);
                }
            }
        }

        const ev = isNewReg ? 'Customer Registered' : 'Customer Logged In';
        const log = new AffiliateLog({
            eventType: ev,
            partnerId: customer.partnerId,
            productId: customer.productId,
            customerId: customer._id,
            details: `${ev}: email=${email}, affiliate=${customer.affiliateCode || 'none'}`,
            ip: req.ip || '',
            userAgent: req.headers['user-agent'] || ''
        });
        await log.save();

        broadcastSSE({
            type: ev,
            partnerId: customer.partnerId,
            productId: customer.productId,
            customerId: customer._id
        });

        return res.status(200).json({
            message: 'Login processed successfully',
            customer
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/**
 * Helper to process successful payments, create orders and attribute affiliate sales.
 */
async function processSuccessfulPayment(pData) {
    // 1. Duplicate webhook transaction verification
    const existingPayment = await Payment.findOne({ paymentId: pData.paymentId });
    if (existingPayment) {
        console.log(`⚠️ Duplicate Payment ID ${pData.paymentId} skipped.`);
        return { order: null, payment: existingPayment, isDuplicate: true };
    }

    const payment = new Payment({
        paymentId: pData.paymentId,
        orderId: pData.orderId,
        gateway: pData.gateway,
        amount: pData.amount,
        currency: pData.currency || 'INR',
        status: pData.status || 'captured',
        rawPayload: pData.rawPayload ? JSON.stringify(pData.rawPayload) : '',
        signature: pData.signature || ''
    });
    await payment.save();

    // 2. Map Customer
    let customer = await Customer.findOne({ email: pData.customerEmail.toLowerCase() });
    if (!customer) {
        const loginRecord = await AffiliateLogin.findOne({ customerEmail: pData.customerEmail.toLowerCase() });
        customer = new Customer({
            email: pData.customerEmail.toLowerCase(),
            name: pData.customerName || '',
            affiliateCode: loginRecord ? loginRecord.affiliateCode : '',
            partnerId: loginRecord ? loginRecord.partnerId : undefined,
            productId: loginRecord ? loginRecord.productId : undefined
        });
        await customer.save();
    }

    // 3. Resolve Product
    let product = null;
    if (pData.productSlug) {
        product = await Product.findOne({ slug: pData.productSlug.toLowerCase() });
    }
    if (!product) {
        product = await Product.findOne({ slug: 'general' }) || await Product.findOne();
    }

    let order = await Order.findOne({ orderId: pData.orderId });
    if (!order) {
        order = new Order({
            orderId: pData.orderId,
            customerId: customer._id,
            productId: product ? product._id : undefined,
            affiliateCode: customer.affiliateCode || '',
            partnerId: customer.partnerId || undefined,
            paymentGateway: pData.gateway,
            paymentId: pData.paymentId,
            amount: pData.amount,
            currency: pData.currency || 'INR',
            paymentStatus: 'PAID',
            orderStatus: 'COMPLETED'
        });
        await order.save();
    } else {
        order.paymentStatus = 'PAID';
        order.orderStatus = 'COMPLETED';
        order.paymentId = pData.paymentId;
        await order.save();
    }

    // 4. Create AffiliateSale record
    if (order.affiliateCode && order.partnerId) {
        const existingSale = await AffiliateSale.findOne({ orderId: order.orderId });
        if (!existingSale) {
            const tracking = require('./tracking');
            const { partner, product: valProduct } = await tracking.validatePartnerAndProduct(order.affiliateCode, product.slug);

            let commRate = 10;
            if (valProduct) {
                const PartnerProduct = require('../models/PartnerProduct');
                const partProd = await PartnerProduct.findOne({
                    partnerId: partner._id,
                    productId: valProduct._id
                });
                commRate = partProd ? partProd.commission : valProduct.commissionValue;
            }
            const commissionEarned = order.amount * (commRate / 100);

            const sale = new AffiliateSale({
                partnerId: order.partnerId,
                productId: order.productId,
                affiliateCode: order.affiliateCode,
                orderId: order.orderId,
                customerName: customer.name || '',
                customerEmail: customer.email,
                amount: order.amount,
                currency: order.currency,
                paymentStatus: 'paid',
                orderStatus: 'completed',
                commissionRate: commRate,
                commissionEarned,
                purchaseDate: Date.now()
            });
            await sale.save();
        }
    }

    // Event Audit Logs
    const payLog = new AffiliateLog({
        eventType: 'Payment Success',
        partnerId: order.partnerId,
        productId: order.productId,
        customerId: customer._id,
        orderId: order.orderId,
        details: `Payment captured: Gateway=${pData.gateway}, Amount=${pData.amount}, Affiliate=${order.affiliateCode || 'none'}`
    });
    await payLog.save();

    const ordLog = new AffiliateLog({
        eventType: 'Order Created',
        partnerId: order.partnerId,
        productId: order.productId,
        customerId: customer._id,
        orderId: order.orderId,
        details: `Order created: ID=${order.orderId}, Status=${order.orderStatus}`
    });
    await ordLog.save();

    broadcastSSE({
        type: 'PAYMENT_SUCCESS',
        partnerId: order.partnerId,
        productId: order.productId,
        orderId: order.orderId
    });

    return { order, payment, isDuplicate: false };
}

/**
 * POST /api/webhooks/razorpay
 * Razorpay webhook signature verification and processing.
 */
exports.razorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mywebhooksecret123';
        const rawBody = req.rawBody;

        if (!signature) {
            return res.status(400).json({ error: 'Razorpay signature is required' });
        }

        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        if (signature !== expected) {
            console.error('❌ Razorpay webhook signature mismatch!');
            return res.status(400).json({ error: 'Signature verification failed' });
        }

        const payload = req.body;
        console.log(`✅ Razorpay webhook verified: ${payload.event}`);

        if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
            const payment = payload.payload.payment.entity;
            const amount = payment.amount / 100; // convert paise to INR
            const currency = payment.currency;
            const paymentId = payment.id;
            const orderId = payment.order_id || `ORD_RZP_${paymentId}`;
            const customerEmail = payment.email;
            const customerName = payment.contact || payment.notes?.name || '';
            const productSlug = payment.notes?.product || payment.notes?.productSlug || 'general';

            const result = await processSuccessfulPayment({
                paymentId,
                orderId,
                gateway: 'Razorpay',
                amount,
                currency,
                customerEmail,
                customerName,
                productSlug,
                rawPayload: payload,
                signature
            });

            return res.status(200).json({ message: 'Processed successfully', result });
        }

        return res.status(200).json({ message: 'Event ignored' });

    } catch (err) {
        console.error('Error in Razorpay webhook:', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/webhooks/cashfree
 * Cashfree webhook signature verification and processing.
 */
exports.cashfreeWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        const secret = process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY || 'mycashfreesecret123';
        const rawBody = req.rawBody;

        if (!signature || !timestamp) {
            return res.status(400).json({ error: 'Cashfree signature and timestamp are required' });
        }

        const expected = crypto.createHmac('sha256', secret).update(timestamp + rawBody).digest('base64');
        if (signature !== expected) {
            console.error('❌ Cashfree webhook signature mismatch!');
            return res.status(400).json({ error: 'Signature verification failed' });
        }

        const payload = req.body;
        console.log(`✅ Cashfree webhook verified: ${payload.type}`);

        if (payload.type === 'PAYMENT_SUCCESS') {
            const data = payload.data;
            const paymentId = data.payment.cf_payment_id;
            const orderId = data.order.order_id;
            const amount = data.order.order_amount;
            const currency = data.order.order_currency;
            const customerEmail = data.customer_details.customer_email;
            const customerName = data.customer_details.customer_name || '';
            const productSlug = data.order.order_tags?.product || data.order.order_tags?.productSlug || 'general';

            const result = await processSuccessfulPayment({
                paymentId,
                orderId,
                gateway: 'Cashfree',
                amount,
                currency,
                customerEmail,
                customerName,
                productSlug,
                rawPayload: payload,
                signature
            });

            return res.status(200).json({ message: 'Processed successfully', result });
        }

        return res.status(200).json({ message: 'Event ignored' });

    } catch (err) {
        console.error('Error in Cashfree webhook:', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/affiliate/dashboard
 * Simplified enterprise dashboard metrics.
 */
exports.getPartnerDashboard = async (req, res) => {
    try {
        const partner = req.partner;
        const PartnerProduct = require('../models/PartnerProduct');
        const assignments = await PartnerProduct.find({ partnerId: partner._id, status: 'active' }).populate('productId');

        const links = [];
        const productsList = [];

        let overallLogins = 0;
        let overallSales = 0;
        let overallRevenue = 0;
        let overallReturned = 0;
        let overallCancelled = 0;

        for (const ass of assignments) {
            const prod = ass.productId;
            if (!prod || prod.status !== 'active') continue;

            const base = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
            const separator = base.includes('?') ? '&' : '?';
            const affiliateUrl = `${base}${separator}affiliate=${partner.affiliateCode}`;

            links.push({
                productId: prod._id,
                productName: prod.name,
                productSlug: prod.slug,
                affiliateUrl
            });

            const logins = await AffiliateLogin.countDocuments({
                partnerId: partner._id,
                productId: prod._id
            });

            const salesOrders = await Order.find({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: { $in: ['PAID', 'COMPLETED', 'DELIVERED'] }
            });
            const sales = salesOrders.length;
            const revenue = salesOrders.reduce((sum, o) => sum + o.amount, 0);

            const returned = await Order.countDocuments({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: 'RETURNED'
            });

            const cancelled = await Order.countDocuments({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: 'CANCELLED'
            });

            overallLogins += logins;
            overallSales += sales;
            overallRevenue += revenue;
            overallReturned += returned;
            overallCancelled += cancelled;

            productsList.push({
                productId: prod._id,
                productName: prod.name,
                productSlug: prod.slug,
                totalLogins: logins,
                sales,
                revenue,
                returned,
                cancelled
            });
        }

        return res.json({
            partner: {
                _id: partner._id,
                name: partner.name,
                affiliateCode: partner.affiliateCode,
                permissions: partner.permissions
            },
            stats: {
                totalLogins: overallLogins,
                totalSales: overallSales,
                revenue: overallRevenue,
                returned: overallReturned,
                cancelled: overallCancelled
            },
            links,
            products: productsList
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/affiliate/partner/dashboard/:productId
 * Product specific simplified dashboard metrics.
 */
exports.getPartnerProductDashboard = async (req, res) => {
    try {
        const partner = req.partner;
        const { productId } = req.params;

        const prod = await Product.findById(productId);
        if (!prod) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const base = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
        const separator = base.includes('?') ? '&' : '?';
        const affiliateLink = `${base}${separator}affiliate=${partner.affiliateCode}`;

        const logins = await AffiliateLogin.countDocuments({
            partnerId: partner._id,
            productId: prod._id
        });

        const salesOrders = await Order.find({
            partnerId: partner._id,
            productId: prod._id,
            orderStatus: { $in: ['PAID', 'COMPLETED', 'DELIVERED'] }
        });
        const sales = salesOrders.length;
        const revenue = salesOrders.reduce((sum, o) => sum + o.amount, 0);

        const returned = await Order.countDocuments({
            partnerId: partner._id,
            productId: prod._id,
            orderStatus: 'RETURNED'
        });

        const cancelled = await Order.countDocuments({
            partnerId: partner._id,
            productId: prod._id,
            orderStatus: 'CANCELLED'
        });

        return res.json({
            product: {
                _id: prod._id,
                name: prod.name,
                slug: prod.slug
            },
            affiliateCode: partner.affiliateCode,
            affiliateLink,
            stats: {
                totalLogins: logins,
                totalSales: sales,
                revenue,
                returned,
                cancelled
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/sales-report
 * Admin tabular breakdown query endpoint.
 */
exports.getAdminSalesReport = async (req, res) => {
    try {
        const { search, sortBy, productId, partnerId } = req.query;

        let partnerCond = { status: { $in: ['active', 'disabled'] } };
        if (partnerId && partnerId !== 'all') {
            partnerCond._id = partnerId;
        }
        const partners = await SalesPartner.find(partnerCond);

        let productCond = { status: 'active' };
        if (productId && productId !== 'all') {
            productCond._id = productId;
        }
        const products = await Product.find(productCond);

        const PartnerProduct = require('../models/PartnerProduct');
        const report = [];

        for (const partner of partners) {
            for (const prod of products) {
                const assigned = await PartnerProduct.findOne({
                    partnerId: partner._id,
                    productId: prod._id
                });
                if (!assigned) continue;

                const logins = await AffiliateLogin.countDocuments({
                    partnerId: partner._id,
                    productId: prod._id
                });

                const salesOrders = await Order.find({
                    partnerId: partner._id,
                    productId: prod._id,
                    orderStatus: { $in: ['PAID', 'COMPLETED', 'DELIVERED'] }
                });
                const sales = salesOrders.length;
                const revenue = salesOrders.reduce((sum, o) => sum + o.amount, 0);

                const returned = await Order.countDocuments({
                    partnerId: partner._id,
                    productId: prod._id,
                    orderStatus: 'RETURNED'
                });

                const cancelled = await Order.countDocuments({
                    partnerId: partner._id,
                    productId: prod._id,
                    orderStatus: 'CANCELLED'
                });

                if (search) {
                    const term = search.toLowerCase();
                    const match = partner.name.toLowerCase().includes(term) || prod.name.toLowerCase().includes(term);
                    if (!match) continue;
                }

                report.push({
                    partnerId: partner._id,
                    partnerName: partner.name,
                    productId: prod._id,
                    productName: prod.name,
                    totalLogins: logins,
                    sales,
                    revenue,
                    returned,
                    cancelled
                });
            }
        }

        if (sortBy === 'sales') {
            report.sort((a, b) => b.sales - a.sales);
        } else if (sortBy === 'revenue') {
            report.sort((a, b) => b.revenue - a.revenue);
        } else if (sortBy === 'logins') {
            report.sort((a, b) => b.totalLogins - a.totalLogins);
        } else if (sortBy === 'returned') {
            report.sort((a, b) => b.returned - a.returned);
        } else if (sortBy === 'cancelled') {
            report.sort((a, b) => b.cancelled - a.cancelled);
        } else {
            report.sort((a, b) => a.partnerName.localeCompare(b.partnerName));
        }

        return res.json(report);

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/**
 * PUT /api/orders/:id/status
 * Manually updates an order status and recalibrates affiliate sales.
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!orderStatus) {
            return res.status(400).json({ error: 'orderStatus is required' });
        }

        const normalizedStatus = orderStatus.toUpperCase();
        const valid = ['PENDING', 'PAID', 'COMPLETED', 'DELIVERED', 'RETURNED', 'CANCELLED'];
        if (!valid.includes(normalizedStatus)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` });
        }

        const order = await Order.findOne({ $or: [{ orderId: id }, { _id: mongoose.isValidObjectId(id) ? id : undefined }] });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.orderStatus = normalizedStatus;
        if (['PAID', 'COMPLETED', 'DELIVERED'].includes(normalizedStatus)) {
            order.paymentStatus = 'PAID';
        }
        await order.save();

        // Sync with AffiliateSale
        const affiliateSale = await AffiliateSale.findOne({ orderId: order.orderId });
        if (affiliateSale) {
            if (['PAID', 'COMPLETED', 'DELIVERED'].includes(normalizedStatus)) {
                affiliateSale.orderStatus = 'completed';
                affiliateSale.paymentStatus = 'paid';
            } else if (normalizedStatus === 'RETURNED') {
                affiliateSale.orderStatus = 'returned';
            } else if (normalizedStatus === 'CANCELLED') {
                affiliateSale.orderStatus = 'cancelled';
            }
            await affiliateSale.save();
        }

        const ev = normalizedStatus === 'RETURNED' ? 'Order Returned' 
                 : normalizedStatus === 'CANCELLED' ? 'Order Cancelled' 
                 : 'Order Created';

        const log = new AffiliateLog({
            eventType: ev,
            partnerId: order.partnerId,
            productId: order.productId,
            orderId: order.orderId,
            details: `Order status manually updated to ${normalizedStatus} for orderId=${order.orderId}`
        });
        await log.save();

        broadcastSSE({
            type: `ORDER_${normalizedStatus}`,
            partnerId: order.partnerId,
            productId: order.productId,
            orderId: order.orderId
        });

        return res.json({ message: 'Order status updated successfully', order });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
