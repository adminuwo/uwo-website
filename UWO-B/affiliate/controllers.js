const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SalesPartner = require('../models/SalesPartner');
const Product = require('../models/Product');
const AffiliateLink = require('../models/AffiliateLink');
const AffiliateClick = require('../models/AffiliateClick');
const AffiliateLead = require('../models/AffiliateLead');
const AffiliateSale = require('../models/AffiliateSale');
const PartnerProduct = require('../models/PartnerProduct');
const AffiliateSession = require('../models/AffiliateSession');
const AffiliateLogin = require('../models/AffiliateLogin');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Helper to construct date queries based on filters
function getDateFilterQuery(filterName, startDateStr, endDateStr, dateField = 'createdAt') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    let match = {};

    switch (filterName) {
        case 'today':
            match[dateField] = { $gte: startOfToday, $lte: endOfToday };
            break;
        case 'yesterday':
            const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
            const endOfYesterday = new Date(endOfToday.getTime() - 24 * 60 * 60 * 1000);
            match[dateField] = { $gte: startOfYesterday, $lte: endOfYesterday };
            break;
        case 'last7days':
            const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
            match[dateField] = { $gte: sevenDaysAgo, $lte: endOfToday };
            break;
        case 'last30days':
            const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
            match[dateField] = { $gte: thirtyDaysAgo, $lte: endOfToday };
            break;
        case 'thismonth':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            match[dateField] = { $gte: startOfMonth, $lte: endOfToday };
            break;
        case 'custom':
            if (startDateStr && endDateStr) {
                match[dateField] = { 
                    $gte: new Date(startDateStr), 
                    $lte: new Date(new Date(endDateStr).setHours(23, 59, 59, 999)) 
                };
            }
            break;
        default:
            // No date filter
            break;
    }
    return match;
}

// Helper to generate a list of dates in range
function getDatesInRange(startDate, endDate) {
    const dates = [];
    let current = new Date(startDate.getTime());
    while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

// Helper to generate a unique affiliate code
async function generateAffiliateCode(partnerName) {
    const nameClean = partnerName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = `UWO-${nameClean}-`;
    
    let suffixNum = 1;
    let code = `${prefix}${String(suffixNum).padStart(3, '0')}`;
    let isUnique = false;

    while (!isUnique) {
        const existing = await SalesPartner.findOne({ affiliateCode: code });
        if (!existing) {
            isUnique = true;
        } else {
            suffixNum++;
            code = `${prefix}${String(suffixNum).padStart(3, '0')}`;
        }
    }
    return code;
}

// Helper to calculate conversion rates
function calculateConversionStats(clicks, leads, sales) {
    const clickToLead = clicks > 0 ? ((leads / clicks) * 100).toFixed(2) : '0.00';
    const leadToSale = leads > 0 ? ((sales / leads) * 100).toFixed(2) : '0.00';
    const overall = clicks > 0 ? ((sales / clicks) * 100).toFixed(2) : '0.00';

    return {
        clickToLeadPercentage: Number(clickToLead),
        leadToSalePercentage: Number(leadToSale),
        overallConversionPercentage: Number(overall)
    };
}

// ================= ADMIN CONTROLLERS =================

/**
 * Get list of all partners with basic details.
 */
exports.getPartners = async (req, res) => {
    try {
        const { filter, startDate, endDate, productId } = req.query;
        const partners = await SalesPartner.find({ status: { $in: ['active', 'disabled'] } }).select('-passwordHash').sort({ createdAt: -1 });

        const loginDateQuery = getDateFilterQuery(filter, startDate, endDate, 'loginTime');
        const saleDateQuery = getDateFilterQuery(filter, startDate, endDate, 'purchaseDate');
        
        let productFilter = {};
        if (productId && productId !== 'all') {
            if (productId === 'general') {
                productFilter = {
                    $or: [
                        { productId: null },
                        { productId: { $exists: false } }
                    ]
                };
            } else {
                productFilter = { productId };
            }
        }

        const partnersList = [];
        for (const partner of partners) {
            const mappings = await PartnerProduct.find({ partnerId: partner._id, status: 'active' }).populate('productId', 'name');
            const assignedProducts = mappings.map(m => m.productId ? m.productId.name : '').filter(Boolean);

            const totalLogins = await AffiliateLogin.countDocuments({
                partnerId: partner._id,
                ...productFilter,
                ...loginDateQuery
            });

            const completedSales = await AffiliateSale.find({
                partnerId: partner._id,
                ...productFilter,
                orderStatus: 'completed',
                paymentStatus: 'paid',
                ...saleDateQuery
            });
            const orders = completedSales.length;
            const revenue = completedSales.reduce((sum, s) => sum + s.amount, 0);

            const returned = await AffiliateSale.countDocuments({
                partnerId: partner._id,
                ...productFilter,
                orderStatus: 'returned',
                ...saleDateQuery
            });

            const cancelled = await AffiliateSale.countDocuments({
                partnerId: partner._id,
                ...productFilter,
                orderStatus: 'cancelled',
                ...saleDateQuery
            });

            partnersList.push({
                ...partner.toObject(),
                assignedProducts,
                totalLogins,
                orders,
                revenue,
                returned,
                cancelled
            });
        }
        res.json(partnersList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Create a new Sales Partner and generate their affiliate links.
 */
exports.createPartner = async (req, res) => {
    try {
        const { name, email, phone, company, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'Name, email, phone, and password are required' });
        }

        const existingPartner = await SalesPartner.findOne({ email: email.toLowerCase() });
        if (existingPartner) {
            return res.status(400).json({ message: 'A sales partner with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const affiliateCode = await generateAffiliateCode(name);

        const partner = new SalesPartner({
            name,
            email,
            phone,
            company: company || '',
            passwordHash,
            status: 'active',
            affiliateCode
        });

        await partner.save();

        // Automatically generate affiliate URLs for all active products
        const products = await Product.find({ status: 'active' });
        
        for (const prod of products) {
            const landingUrl = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
            const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';
            const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${affiliateCode}&product=${prod.slug}&redirect=${encodeURIComponent(landingUrl)}`;

            const affLink = new AffiliateLink({
                partnerId: partner._id,
                productId: prod._id,
                affiliateCode,
                generatedAffiliateUrl: generatedUrl
            });
            await affLink.save();
        }

        const partnerResponse = partner.toObject();
        delete partnerResponse.passwordHash;

        res.status(201).json({
            message: 'Sales partner created successfully',
            partner: partnerResponse
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update an existing Sales Partner.
 */
exports.updatePartner = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, company, status } = req.body;

        const partner = await SalesPartner.findById(id);
        if (!partner) {
            return res.status(404).json({ message: 'Sales partner not found' });
        }

        if (email && email.toLowerCase() !== partner.email) {
            const existingEmail = await SalesPartner.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email is already in use by another partner' });
            }
            partner.email = email.toLowerCase();
        }

        if (name) partner.name = name;
        if (phone) partner.phone = phone;
        if (company !== undefined) partner.company = company;
        if (status) partner.status = status;

        await partner.save();

        const partnerResponse = partner.toObject();
        delete partnerResponse.passwordHash;

        res.json({
            message: 'Sales partner updated successfully',
            partner: partnerResponse
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Reset a partner's password.
 */
exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'New password is required' });
        }

        const partner = await SalesPartner.findById(id);
        if (!partner) {
            return res.status(404).json({ message: 'Sales partner not found' });
        }

        partner.passwordHash = await bcrypt.hash(password, 10);
        await partner.save();

        res.json({ message: 'Sales partner password reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Delete a Sales Partner and their associated links.
 */
exports.deletePartner = async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await SalesPartner.findById(id);
        if (!partner) {
            return res.status(404).json({ message: 'Sales partner not found' });
        }

        await SalesPartner.findByIdAndDelete(id);
        await AffiliateLink.deleteMany({ partnerId: id });
        // NOTE: We preserve Click, Lead, and Sale history for analytics consistency.

        res.json({ message: 'Sales partner deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Fetch detailed analytics for Super Admin.
 */
exports.getAdminAnalytics = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const clickDateQuery = getDateFilterQuery(filter, startDate, endDate, 'created_at');
        const leadDateQuery = getDateFilterQuery(filter, startDate, endDate, 'createdAt');
        const saleDateQuery = getDateFilterQuery(filter, startDate, endDate, 'purchaseDate');
        const sessionDateQuery = getDateFilterQuery(filter, startDate, endDate, 'created_at');

        const partners = await SalesPartner.find();
        const products = await Product.find();

        // 1. Partner-wise report
        const partnerReports = [];
        for (const partner of partners) {
            if (!partner.affiliateCode) continue;

            const clickQuery = { partnerId: partner._id, ...clickDateQuery };
            const uniqueClicks = await AffiliateClick.countDocuments({ ...clickQuery, click_type: { $ne: 'total' } });
            const totalVisits = await AffiliateClick.countDocuments(clickQuery);
            const leads = await AffiliateLead.countDocuments({ partnerId: partner._id, ...leadDateQuery });
            const sales = await AffiliateSale.find({ partnerId: partner._id, paymentStatus: 'paid', ...saleDateQuery });
            
            const salesCount = sales.length;
            const revenue = sales.reduce((sum, s) => sum + s.amount, 0);
            
            let commission = 0;
            for (const s of sales) {
                if (s.commissionEarned !== undefined) {
                    commission += s.commissionEarned;
                } else {
                    const mappings = await PartnerProduct.find({ partnerId: partner._id, status: 'active' });
                    const partnerProd = mappings.find(m => String(m.productId) === String(s.productId));
                    const rate = partnerProd ? partnerProd.commission : 10;
                    commission += s.amount * (rate / 100);
                }
            }

            const uniqueVisitorsResult = await AffiliateClick.distinct('visitor_id', clickQuery);
            const visitors = uniqueVisitorsResult.length;

            const returningVisitorsResult = await AffiliateClick.aggregate([
                { $match: { partnerId: partner._id, ...clickDateQuery } },
                { $group: { _id: '$visitor_id', totalClicks: { $sum: 1 } } },
                { $match: { totalClicks: { $gt: 1 } } },
                { $count: 'count' }
            ]);
            const returningVisitors = returningVisitorsResult.length > 0 ? returningVisitorsResult[0].count : 0;

            const conversion = calculateConversionStats(uniqueClicks, leads, salesCount);

            partnerReports.push({
                partnerId: partner._id,
                name: partner.name,
                affiliateCode: partner.affiliateCode,
                status: partner.status,
                clicks: uniqueClicks,
                visits: totalVisits,
                visitors,
                returningVisitors,
                leads,
                sales: salesCount,
                revenue,
                commission,
                conversionRate: conversion.overallConversionPercentage
            });
        }

        // 2. Product-wise report
        const productReports = [];
        for (const prod of products) {
            const clickQuery = { productId: prod._id, ...clickDateQuery };
            const uniqueClicks = await AffiliateClick.countDocuments({ ...clickQuery, click_type: { $ne: 'total' } });
            const totalVisits = await AffiliateClick.countDocuments(clickQuery);
            const leads = await AffiliateLead.countDocuments({ productId: prod._id, ...leadDateQuery });
            const sales = await AffiliateSale.find({ productId: prod._id, paymentStatus: 'paid', ...saleDateQuery });

            const salesCount = sales.length;
            const revenue = sales.reduce((sum, s) => sum + s.amount, 0);
            const conversion = calculateConversionStats(uniqueClicks, leads, salesCount);

            productReports.push({
                productId: prod._id,
                name: prod.name,
                slug: prod.slug,
                clicks: uniqueClicks,
                visits: totalVisits,
                leads,
                sales: salesCount,
                revenue,
                conversionRate: conversion.overallConversionPercentage
            });
        }

        // 3. Trends compiler (Daily)
        let startLimit = new Date();
        startLimit.setDate(startLimit.getDate() - 30);
        let endLimit = new Date();
        if (clickDateQuery.created_at) {
            startLimit = clickDateQuery.created_at.$gte;
            endLimit = clickDateQuery.created_at.$lte;
        }

        const dates = getDatesInRange(startLimit, endLimit);
        const dailyTrends = [];
        
        const clicks = await AffiliateClick.find({ created_at: { $gte: startLimit, $lte: endLimit } });
        const sales = await AffiliateSale.find({ purchaseDate: { $gte: startLimit, $lte: endLimit }, paymentStatus: 'paid' });

        const dailyMap = {};
        dates.forEach(d => {
            const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            dailyMap[dateStr] = {
                date: dateStr,
                uniqueClicks: 0,
                totalVisits: 0,
                visitors: new Set(),
                orders: 0,
                revenue: 0
            };
        });

        clicks.forEach(c => {
            const dateStr = new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            if (dailyMap[dateStr]) {
                dailyMap[dateStr].totalVisits++;
                if (c.click_type !== 'total') {
                    dailyMap[dateStr].uniqueClicks++;
                }
                if (c.visitor_id) {
                    dailyMap[dateStr].visitors.add(c.visitor_id);
                }
            }
        });

        sales.forEach(s => {
            const dateStr = new Date(s.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            if (dailyMap[dateStr]) {
                dailyMap[dateStr].orders++;
                dailyMap[dateStr].revenue += s.amount;
            }
        });

        dates.forEach(d => {
            const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const day = dailyMap[dateStr];
            dailyTrends.push({
                date: day.date,
                uniqueClicks: day.uniqueClicks,
                totalVisits: day.totalVisits,
                visitors: day.visitors.size,
                orders: day.orders,
                revenue: day.revenue,
                conversionRate: day.uniqueClicks > 0 ? Number(((day.orders / day.uniqueClicks) * 100).toFixed(2)) : 0
            });
        });

        // 4. Landing Page Analytics
        const landingPageStats = [];
        const allSessions = await AffiliateSession.find(sessionDateQuery);

        const pageGroups = {};
        allSessions.forEach(s => {
            let page = s.landing_page || '/';
            try {
                const url = new URL(page);
                page = url.pathname + url.search;
            } catch (e) {
                // Keep page as is
            }
            if (!pageGroups[page]) {
                pageGroups[page] = [];
            }
            pageGroups[page].push(s);
        });

        for (const [page, pageSessions] of Object.entries(pageGroups)) {
            const totalSessions = pageSessions.length;
            const uniqueVisitors = new Set(pageSessions.map(s => s.visitor_id)).size;
            const conversions = pageSessions.filter(s => s.is_converted).length;

            let bounceSessions = 0;
            let totalSessionTime = 0;

            for (const s of pageSessions) {
                const clicksCount = await AffiliateClick.countDocuments({ session_id: s.session_id });
                if (clicksCount <= 1) {
                    bounceSessions++;
                }
                const duration = new Date(s.last_activity).getTime() - new Date(s.created_at).getTime();
                totalSessionTime += duration;
            }

            const bounceRate = totalSessions > 0 ? Number(((bounceSessions / totalSessions) * 100).toFixed(2)) : 0;
            const avgSessionTime = totalSessions > 0 ? Math.round((totalSessionTime / totalSessions) / 1000) : 0;

            landingPageStats.push({
                landingPage: page,
                visits: totalSessions,
                uniqueVisitors,
                bounceRate,
                avgSessionTime,
                conversions
            });
        }
        landingPageStats.sort((a, b) => b.visits - a.visits);

        res.json({
            partners: partnerReports,
            products: productReports,
            trends: dailyTrends,
            landingPages: landingPageStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ================= PARTNER CONTROLLERS =================

/**
 * Handle Earn & Refer registration from website.
 */
exports.submitReferral = async (req, res) => {
    try {
        const { name, email, phone, upiId, preferredProgram, message, affiliateCode } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        const crypto = require('crypto');
        const nodemailer = require('nodemailer');
        const ReferralSubmission = require('../models/ReferralSubmission');

        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        const referralCode = `UWO-REF-${randomHex}`;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

        const newReferral = new ReferralSubmission({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: (phone || '').trim(),
            upiId: (upiId || '').trim(),
            preferredProgram: preferredProgram || 'All Platforms',
            message: (message || '').trim(),
            referralCode,
            affiliateCode: affiliateCode || '',
            ip
        });
        await newReferral.save();

        let userDashboardUserId = '';
        let userDashboardPassword = '';
        let userDashboardLoginUrl = process.env.REFERRAL_DASHBOARD_URL || 'http://localhost:5173/login';

        try {
            const userDashApiUrl = process.env.REFERRAL_API_URL || 'http://localhost:5000/api/auth/register';
            const registerRes = await fetch(userDashApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() })
            });
            const regData = await registerRes.json();
            if (regData.credentials) {
                userDashboardUserId = regData.credentials.userId;
                userDashboardPassword = regData.credentials.password;
                if (regData.credentials.loginUrl) {
                    userDashboardLoginUrl = regData.credentials.loginUrl;
                }
            } else if (regData.userId) {
                userDashboardUserId = regData.userId;
            }
        } catch (regErr) {
            console.warn('⚠️ user-dashboard registration fallback:', regErr.message);
        }

        // Send confirmation email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: { rejectUnauthorized: false }
        });

        const userMailOptions = {
            from: `"UWO™ Ecosystem" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎉 Welcome to UWO™ Earn & Refer Program - Application Received (${referralCode})`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0b1120; border-radius: 16px; padding: 30px; color: #f8fafc; border: 1.5px solid #D6A559;">
                <h1 style="color: #D6A559; margin-top: 0;">UWO™ EARN &amp; REFER</h1>
                <h2>Hi ${name},</h2>
                <p style="color: #cbd5e1;">Thank you for applying to the UWO™ Earn &amp; Refer Program.</p>
                ${userDashboardUserId && userDashboardPassword ? `
                <div style="background: rgba(214, 165, 89, 0.15); border: 1px solid #D6A559; border-radius: 10px; padding: 18px; margin: 20px 0;">
                    <h3 style="color: #FABE56; margin-top: 0;">🔐 Your Referral Dashboard Credentials</h3>
                    <p style="margin: 4px 0;"><strong>User ID:</strong> <span style="color:#FABE56; font-family:monospace;">${userDashboardUserId}</span></p>
                    <p style="margin: 4px 0;"><strong>Password:</strong> <span style="font-family:monospace;">${userDashboardPassword}</span></p>
                    <p style="margin-top: 14px;"><a href="${userDashboardLoginUrl}" style="background: #D6A559; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;" target="_blank">Login to Dashboard →</a></p>
                </div>
                ` : ''}
                <p><strong>Application Ref:</strong> ${referralCode}</p>
            </div>
            `
        };

        try {
            await transporter.sendMail(userMailOptions);
        } catch (e) {
            console.error('Email error:', e.message);
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for submitting the form.',
            referralCode,
            userId: userDashboardUserId || referralCode
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Authenticate a sales partner and issue a JWT token.
 */
exports.partnerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const partner = await SalesPartner.findOne({ email: email.toLowerCase() });
        if (!partner) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (partner.status === 'pending') {
            return res.status(403).json({ message: 'Your registration request is pending approval.' });
        }
        if (partner.status === 'rejected') {
            return res.status(403).json({ message: 'Your registration request has been rejected.' });
        }
        if (partner.status !== 'active') {
            return res.status(403).json({ message: 'Your account is disabled. Contact administrator.' });
        }

        const isMatch = await bcrypt.compare(password, partner.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { partnerId: partner._id, email: partner.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            partner: {
                id: partner._id,
                name: partner.name,
                email: partner.email,
                affiliateCode: partner.affiliateCode
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Load dashboard statistics and copyable links for the logged-in partner.
 */
exports.getPartnerDashboard = async (req, res) => {
    try {
        const partner = req.partner;
        const { filter, startDate, endDate } = req.query;

        // Fetch active product assignments
        const mappings = await PartnerProduct.find({ partnerId: partner._id, status: 'active' }).populate('productId');
        const assignedProductIds = mappings.map(m => m.productId ? m.productId._id : null).filter(Boolean);

        // Build date queries
        const clickDateQuery = getDateFilterQuery(filter, startDate, endDate, 'created_at');
        const loginDateQuery = getDateFilterQuery(filter, startDate, endDate, 'loginTime');
        const leadDateQuery = getDateFilterQuery(filter, startDate, endDate, 'createdAt');
        const saleDateQuery = getDateFilterQuery(filter, startDate, endDate, 'purchaseDate');

        // Overall metric counting
        const productFilter = {
            $or: [
                { productId: { $in: assignedProductIds } },
                { productId: null },
                { productId: { $exists: false } }
            ]
        };

        const totalViews = await AffiliateClick.countDocuments({ 
            partnerId: partner._id, 
            click_type: { $ne: 'total' },
            ...clickDateQuery 
        });

        const completedSales = await AffiliateSale.find({ 
            partnerId: partner._id, 
            orderStatus: 'completed',
            paymentStatus: 'paid',
            ...saleDateQuery 
        });
        const totalSales = completedSales.length;
        const revenue = completedSales.reduce((sum, s) => sum + s.amount, 0);

        const returned = await AffiliateSale.countDocuments({
            partnerId: partner._id,
            orderStatus: 'returned',
            ...saleDateQuery
        });

        const cancelled = await AffiliateSale.countDocuments({
            partnerId: partner._id,
            orderStatus: 'cancelled',
            ...saleDateQuery
        });

        // Build product-wise breakdown
        const productStats = [];
        const linksList = [];

        for (const mapping of mappings) {
            const prod = mapping.productId;
            if (!prod || prod.status !== 'active') continue;

            const prodClickQuery = { partnerId: partner._id, productId: prod._id, click_type: { $ne: 'total' }, ...clickDateQuery };
            let prodViews = await AffiliateClick.countDocuments(prodClickQuery);

            const prodLeadQuery = { partnerId: partner._id, productId: prod._id, ...leadDateQuery };
            const prodLeads = await AffiliateLead.countDocuments(prodLeadQuery);
            
            const prodSalesList = await AffiliateSale.find({ 
                partnerId: partner._id, 
                productId: prod._id, 
                orderStatus: 'completed',
                paymentStatus: 'paid', 
                ...saleDateQuery 
            });
            const prodSales = prodSalesList.length;
            const prodRevenue = prodSalesList.reduce((sum, s) => sum + s.amount, 0);

            const prodReturned = await AffiliateSale.countDocuments({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: 'returned',
                ...saleDateQuery
            });

            const prodCancelled = await AffiliateSale.countDocuments({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: 'cancelled',
                ...saleDateQuery
            });

            // Conversion formula: (Sales / Views) * 100
            const conversionRate = prodViews > 0 
                ? Number(((prodSales / prodViews) * 100).toFixed(1)) 
                : 0;

            productStats.push({
                productId: prod._id,
                productName: prod.name,
                slug: prod.slug,
                clicks: prodViews,
                views: prodViews,
                totalViews: prodViews,
                logins: prodViews,
                totalLogins: prodViews,
                leads: prodLeads,
                sales: prodSales,
                revenue: prodRevenue,
                returned: prodReturned,
                cancelled: prodCancelled,
                conversionRate: conversionRate
            });

            // Fetch and process generated links
            let affLink = await AffiliateLink.findOne({ partnerId: partner._id, productId: prod._id });
            const landingUrl = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
            const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';
            const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${partner.affiliateCode}&product=${prod.slug}&redirect=${encodeURIComponent(landingUrl)}`;

            if (!affLink) {
                affLink = new AffiliateLink({
                    partnerId: partner._id,
                    productId: prod._id,
                    affiliateCode: partner.affiliateCode,
                    generatedAffiliateUrl: generatedUrl
                });
                await affLink.save();
            } else {
                let hasChanges = false;
                if (!affLink.affiliateCode) {
                    affLink.affiliateCode = partner.affiliateCode;
                    hasChanges = true;
                }
                if (affLink.generatedAffiliateUrl !== generatedUrl) {
                    affLink.generatedAffiliateUrl = generatedUrl;
                    hasChanges = true;
                }
                if (hasChanges) {
                    await affLink.save();
                }
            }

            linksList.push({
                productId: prod._id,
                productName: prod.name,
                slug: prod.slug,
                affiliateUrl: affLink.generatedAffiliateUrl
            });
        }

        // Fetch Recent Product Activity across all products for overall dashboard view
        const recentClicks = await AffiliateClick.find({ partnerId: partner._id, ...clickDateQuery }).sort({ created_at: -1 }).limit(10).populate('productId');
        const recentLogins = await AffiliateLogin.find({ partnerId: partner._id, ...loginDateQuery }).sort({ loginTime: -1 }).limit(10).populate('productId');
        const recentLeads = await AffiliateLead.find({ partnerId: partner._id, ...leadDateQuery }).sort({ createdAt: -1 }).limit(10).populate('productId');
        const recentSales = await AffiliateSale.find({ partnerId: partner._id, ...saleDateQuery }).sort({ purchaseDate: -1 }).limit(10).populate('productId');

        const activities = [];

        recentClicks.forEach(c => {
            activities.push({
                date: c.created_at || c.clickedAt,
                productName: (c.productId && c.productId.name) || (c.productSlug ? c.productSlug.toUpperCase() : 'General'),
                productSlug: c.productSlug || '',
                visitor: c.visitor_id ? `Visitor (${c.visitor_id.substring(0, 8)})` : `Visitor (IP: ${c.ip || 'Unknown'})`,
                action: 'Viewed Landing Page',
                amount: '—',
                status: 'Success'
            });
        });

        recentLogins.forEach(l => {
            activities.push({
                date: l.loginTime || l.createdAt,
                productName: (l.productId && l.productId.name) || (l.productSlug ? l.productSlug.toUpperCase() : 'General'),
                productSlug: l.productSlug || '',
                visitor: l.userName || l.userEmail || 'User',
                action: 'Login',
                amount: '—',
                status: 'Success'
            });
        });

        recentLeads.forEach(l => {
            activities.push({
                date: l.createdAt,
                productName: (l.productId && l.productId.name) || (l.productSlug ? l.productSlug.toUpperCase() : 'General'),
                productSlug: l.productSlug || '',
                visitor: l.customerName || l.email || 'Prospect',
                action: 'Lead',
                amount: '—',
                status: 'New'
            });
        });

        recentSales.forEach(s => {
            let statusStr = 'Paid';
            if (s.orderStatus === 'returned') statusStr = 'Refunded';
            if (s.orderStatus === 'cancelled') statusStr = 'Cancelled';
            
            let actionStr = 'Sale';
            if (s.orderStatus === 'returned') actionStr = 'Returned';
            if (s.orderStatus === 'cancelled') actionStr = 'Cancelled';

            activities.push({
                date: s.purchaseDate || s.createdAt,
                productName: (s.productId && s.productId.name) || (s.productSlug ? s.productSlug.toUpperCase() : 'General'),
                productSlug: s.productSlug || '',
                visitor: s.customerName || s.customerEmail || 'Customer',
                action: actionStr,
                amount: `₹${(s.amount || 0).toLocaleString('en-IN')}`,
                status: statusStr
            });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        const finalActivity = activities.slice(0, 15);

        res.json({
            partner: {
                name: partner.name,
                email: partner.email,
                affiliateCode: partner.affiliateCode,
                permissions: partner.permissions || {
                    allowGenerateLink: true,
                    allowViewAnalytics: true,
                    allowDownloadReports: true,
                    allowWithdrawEarnings: true
                }
            },
            stats: {
                totalViews,
                views: totalViews,
                totalLogins: totalViews,
                totalSales,
                revenue,
                returned,
                cancelled
            },
            products: productStats,
            links: linksList,
            recentActivity: finalActivity
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ================= SELF-REGISTRATION & APPROVALS =================

/**
 * Handle self-registration request from a new partner.
 */
exports.partnerRegister = async (req, res) => {
    try {
        const { name, email, phone, company, city, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'Name, email, phone, and password are required' });
        }

        const existingPartner = await SalesPartner.findOne({ email: email.toLowerCase() });
        if (existingPartner) {
            return res.status(400).json({ message: 'A sales partner with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const partner = new SalesPartner({
            name,
            email,
            phone,
            company: company || '',
            city: city || '',
            passwordHash,
            status: 'pending' // pending approval
        });

        await partner.save();

        res.status(201).json({
            message: 'Registration request submitted successfully. Account pending approval.'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Handle Earn & Refer form submission.
 */
exports.submitReferral = async (req, res) => {
    try {
        const crypto = require('crypto');
        const nodemailer = require('nodemailer');
        const ReferralSubmission = require('../models/ReferralSubmission');

        const { name, email, phone, upiId, preferredProgram, message, affiliateCode } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        const referralCode = `UWO-REF-${randomHex}`;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

        const newReferral = new ReferralSubmission({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: (phone || '').trim(),
            upiId: (upiId || '').trim(),
            preferredProgram: preferredProgram || 'All Platforms',
            message: (message || '').trim(),
            referralCode,
            affiliateCode: affiliateCode || '',
            ip
        });

        await newReferral.save();

        if (affiliateCode) {
            try {
                const { trackLead } = require('./tracking');
                await trackLead(affiliateCode, 'earn-and-refer', {
                    name,
                    email,
                    phone,
                    leadSource: 'earn-and-refer-form',
                    visitorId: req.body.visitorId || ''
                });
            } catch (leadErr) {
                console.error('⚠️ Lead tracking error in referrals:', leadErr.message);
            }
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 20000,
            greetingTimeout: 20000,
            socketTimeout: 20000
        });

        const userMailOptions = {
            from: `"UWO™ Ecosystem" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎉 Welcome to UWO™ Earn & Refer Program - Application Received (${referralCode})`,
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: auto; background: #0b1120; border-radius: 20px; overflow: hidden; border: 1.5px solid rgba(214, 165, 89, 0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.8); color: #f8fafc;">
                <div style="background: linear-gradient(135deg, #162377 0%, #0b1120 100%); padding: 36px 30px; text-align: center; border-bottom: 2px solid #D6A559;">
                    <h1 style="margin: 0; color: #D6A559; font-size: 26px; font-weight: 800; letter-spacing: 1px;">UWO™ EARN &amp; REFER</h1>
                    <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Partner &amp; Affiliate Network</p>
                </div>
                <div style="padding: 32px 30px; background: #0e172a;">
                    <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Hi ${name},</h2>
                    <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
                        Thank you for applying to the <strong>UWO™ Earn &amp; Refer Program</strong>. We are thrilled to welcome you to our network of growth partners, creators, and professionals!
                    </p>
                    <div style="background: rgba(214, 165, 89, 0.08); border: 1px solid rgba(214, 165, 89, 0.3); border-radius: 14px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 14px; color: #D6A559; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Application Summary</h3>
                        <table style="width: 100%; font-size: 14px; border-collapse: collapse; color: #f1f5f9;">
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8; width: 45%;"><strong>Referral ID:</strong></td>
                                <td style="padding: 6px 0; color: #FABE56; font-weight: bold;">${referralCode}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;"><strong>Full Name:</strong></td>
                                <td style="padding: 6px 0;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;"><strong>Registered Email:</strong></td>
                                <td style="padding: 6px 0;">${email}</td>
                            </tr>
                            ${phone ? `
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;"><strong>Phone:</strong></td>
                                <td style="padding: 6px 0;">${phone}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;"><strong>Platform Preference:</strong></td>
                                <td style="padding: 6px 0;">${preferredProgram || 'All Platforms'}</td>
                            </tr>
                            ${upiId ? `
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;"><strong>Payout UPI / Info:</strong></td>
                                <td style="padding: 6px 0;">${upiId}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    <h3 style="color: #D6A559; font-size: 17px; margin: 28px 0 14px;">How It Works:</h3>
                    <div style="display: grid; gap: 12px; margin-bottom: 24px;">
                        <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 16px; border-left: 3px solid #D6A559;">
                            <strong style="color: #ffffff;">1. Partner Onboarding:</strong>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13.5px;">Our partnership desk will review your details and issue your dedicated referral links.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 16px; border-left: 3px solid #D6A559;">
                            <strong style="color: #ffffff;">2. Share &amp; Refer:</strong>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13.5px;">Share UWO's intelligent digital solutions (AISA™, AI Mall™, EFV™, and Enterprise Platforms) with your network.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 16px; border-left: 3px solid #D6A559;">
                            <strong style="color: #ffffff;">3. Earn Rewards &amp; Payouts:</strong>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13.5px;">Receive transparent commissions and direct payouts straight to your account upon verified client engagements.</p>
                        </div>
                    </div>
                    <p style="color: #94a3b8; font-size: 13.5px; line-height: 1.5; margin-top: 25px;">
                        If you have questions or want to collaborate directly, reply to this email or write to <a href="mailto:admin@uwo24.com" style="color: #D6A559;">admin@uwo24.com</a>.
                    </p>
                </div>
                <div style="background: #050811; padding: 22px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b;">
                    <p style="margin: 0 0 6px;">UWO™ - Unified Web Options &amp; Services Pvt. Ltd. &copy; 2024</p>
                    <p style="margin: 0;">Building Intelligent Digital Platforms for a Connected World</p>
                </div>
            </div>
            `
        };

        const adminMailOptions = {
            from: `"UWO System" <${process.env.EMAIL_USER}>`,
            to: 'admin@uwo24.com',
            subject: `🎁 New Earn & Refer Application: ${name} (${referralCode})`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-top: 5px solid #D6A559;">
                <h2 style="color: #162377;">🎁 New Earn &amp; Refer Application Received</h2>
                <p><strong>Referral ID:</strong> ${referralCode}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Preferred Platform:</strong> ${preferredProgram || 'All Platforms'}</p>
                <p><strong>UPI / Payout ID:</strong> ${upiId || 'Not provided'}</p>
                <p><strong>Message / Notes:</strong> ${message || 'None'}</p>
                <p><strong>Affiliate Code:</strong> ${affiliateCode || 'Direct'}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">This is an automated notification from your UWO website backend.</p>
            </div>
            `
        };

        try {
            await transporter.sendMail(userMailOptions);
            console.log(`✅ Earn & Refer confirmation email sent to ${email}`);
        } catch (emailErr) {
            console.error('⚠️ Failed to send user confirmation email:', emailErr.message);
        }

        try {
            await transporter.sendMail(adminMailOptions);
            console.log(`✅ Earn & Refer admin notification sent`);
        } catch (adminEmailErr) {
            console.error('⚠️ Failed to send admin notification email:', adminEmailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for submitting the form.',
            referralCode
        });
    } catch (err) {
        console.error('❌ Error processing referral submission:', err);
        res.status(500).json({ error: err.message || 'Server error processing referral' });
    }
};

/**
 * List all pending registration requests for Super Admin.
 */
exports.getPendingRequests = async (req, res) => {
    try {
        const pending = await SalesPartner.find({ status: 'pending' }).select('-passwordHash').sort({ createdAt: -1 });
        res.json(pending);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Approve a pending sales partner registration request.
 */
exports.approvePartnerRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedProducts, permissions } = req.body;

        const partner = await SalesPartner.findById(id);

        if (!partner) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        if (partner.status !== 'pending') {
            return res.status(400).json({ message: 'Partner request is not pending' });
        }

        // Generate permanent unique affiliate code
        const affiliateCode = await generateAffiliateCode(partner.name);

        partner.affiliateCode = affiliateCode;
        partner.status = 'active';
        if (permissions) {
            partner.permissions = {
                allowGenerateLink: permissions.allowGenerateLink !== false,
                allowViewAnalytics: permissions.allowViewAnalytics !== false,
                allowDownloadReports: permissions.allowDownloadReports !== false,
                allowWithdrawEarnings: permissions.allowWithdrawEarnings !== false
            };
        }
        await partner.save();

        // Save PartnerProduct mappings and generate affiliate links
        if (assignedProducts && Array.isArray(assignedProducts)) {
            for (const item of assignedProducts) {
                const prod = await Product.findById(item.productId);
                if (!prod) continue;

                // Save PartnerProduct mapping
                const partnerProd = new PartnerProduct({
                    partnerId: partner._id,
                    productId: prod._id,
                    commission: Number(item.commission) || 0,
                    status: item.status || 'active'
                });
                await partnerProd.save();

                // If active, generate AffiliateLink
                if (item.status !== 'disabled') {
                    const landingUrl = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
                    const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';
                    const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${affiliateCode}&product=${prod.slug}&redirect=${encodeURIComponent(landingUrl)}`;

                    const affLink = new AffiliateLink({
                        partnerId: partner._id,
                        productId: prod._id,
                        affiliateCode,
                        generatedAffiliateUrl: generatedUrl
                    });
                    await affLink.save();
                }
            }
        }

        res.json({
            message: 'Sales partner request approved and links generated successfully',
            partner: {
                id: partner._id,
                name: partner.name,
                email: partner.email,
                affiliateCode: partner.affiliateCode,
                status: partner.status
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Reject a pending sales partner registration request.
 */
exports.rejectPartnerRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await SalesPartner.findById(id);

        if (!partner) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        if (partner.status !== 'pending') {
            return res.status(400).json({ message: 'Partner request is not pending' });
        }

        partner.status = 'rejected';
        await partner.save();

        res.json({
            message: 'Sales partner request rejected successfully',
            partner: {
                id: partner._id,
                name: partner.name,
                status: partner.status
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Load dashboard statistics, link, and activity for a specific product.
 */
exports.getPartnerProductDashboard = async (req, res) => {
    try {
        const partner = req.partner;
        const { productId } = req.params;
        const { filter, startDate, endDate } = req.query;
        const mongoose = require('mongoose');

        // Find the product by ID or Slug
        let product;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            product = await Product.findById(productId);
        }
        if (!product) {
            product = await Product.findOne({ slug: productId });
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Verify or auto-create partner product mapping if active
        let partnerProd = await PartnerProduct.findOne({ partnerId: partner._id, productId: product._id });
        if (!partnerProd || partnerProd.status !== 'active') {
            if (product.status === 'active') {
                partnerProd = new PartnerProduct({
                    partnerId: partner._id,
                    productId: product._id,
                    commission: product.commissionValue || 10,
                    status: 'active'
                });
                await partnerProd.save();
            } else {
                return res.status(403).json({ message: 'Access Denied: Product not assigned to your account' });
            }
        }
        const commissionRate = partnerProd.commission || 10;

        const clickDateQuery = getDateFilterQuery(filter, startDate, endDate, 'created_at');
        const leadDateQuery = getDateFilterQuery(filter, startDate, endDate, 'createdAt');
        const saleDateQuery = getDateFilterQuery(filter, startDate, endDate, 'purchaseDate');
        const loginDateQuery = getDateFilterQuery(filter, startDate, endDate, 'loginTime');

        // Build robust product click query (handles both camelCase & snake_case schemas + productSlug matching)
        const prodClickMatch = {
            $or: [
                { partnerId: partner._id },
                { partner_id: partner._id }
            ],
            $and: [
                {
                    $or: [
                        { productId: product._id },
                        { product_id: product._id },
                        { productSlug: new RegExp('^' + product.slug + '$', 'i') }
                    ]
                }
            ],
            ...clickDateQuery
        };

        // Fetch product-specific stats: logins, clicks, leads, sales, revenue, returned, cancelled
        const loginsCount = await AffiliateLogin.countDocuments({ partnerId: partner._id, productId: product._id, ...loginDateQuery });
        const totalVisits = await AffiliateClick.countDocuments(prodClickMatch);
        const uniqueClicks = await AffiliateClick.countDocuments({ ...prodClickMatch, click_type: { $ne: 'total' } });
        const leadsCount = await AffiliateLead.countDocuments({ partnerId: partner._id, productId: product._id, ...leadDateQuery });
        
        const sales = await AffiliateSale.find({ 
            partnerId: partner._id, 
            productId: product._id, 
            orderStatus: 'completed',
            paymentStatus: 'paid', 
            ...saleDateQuery 
        });

        const salesCount = sales.length;
        const revenue = sales.reduce((sum, s) => sum + s.amount, 0);

        const returnedCount = await AffiliateSale.countDocuments({
            partnerId: partner._id,
            productId: product._id,
            orderStatus: 'returned',
            ...saleDateQuery
        });

        const cancelledCount = await AffiliateSale.countDocuments({
            partnerId: partner._id,
            productId: product._id,
            orderStatus: 'cancelled',
            ...saleDateQuery
        });

        let totalCommission = 0;
        for (const s of sales) {
            if (s.commissionEarned !== undefined) {
                totalCommission += s.commissionEarned;
            } else {
                totalCommission += s.amount * (commissionRate / 100);
            }
        }

        const conversion = calculateConversionStats(uniqueClicks, leadsCount, salesCount);

        // Fetch or auto-generate affiliate link
        let affLink = await AffiliateLink.findOne({ partnerId: partner._id, productId: product._id });
        const landingUrl = product.landingUrl || `https://uwo24.com/${product.slug}`;
        const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';
        const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${partner.affiliateCode}&product=${product.slug}&redirect=${encodeURIComponent(landingUrl)}`;

        if (!affLink) {
            affLink = new AffiliateLink({
                partnerId: partner._id,
                productId: product._id,
                affiliateCode: partner.affiliateCode,
                generatedAffiliateUrl: generatedUrl
            });
            await affLink.save();
        } else {
            let hasChanges = false;
            if (!affLink.affiliateCode) {
                affLink.affiliateCode = partner.affiliateCode;
                hasChanges = true;
            }
            if (affLink.generatedAffiliateUrl !== generatedUrl) {
                affLink.generatedAffiliateUrl = generatedUrl;
                hasChanges = true;
            }
            if (hasChanges) {
                await affLink.save();
            }
        }

        // Fetch product-specific Recent Activity
        const recentClicks = await AffiliateClick.find(prodClickMatch).sort({ created_at: -1 }).limit(10);
        const recentLogins = await AffiliateLogin.find({ partnerId: partner._id, productId: product._id, ...loginDateQuery }).sort({ loginTime: -1 }).limit(10);
        const recentLeads = await AffiliateLead.find({ partnerId: partner._id, productId: product._id, ...leadDateQuery }).sort({ createdAt: -1 }).limit(10);
        const recentSales = await AffiliateSale.find({ partnerId: partner._id, productId: product._id, ...saleDateQuery }).sort({ purchaseDate: -1 }).limit(10);

        const activities = [];

        recentClicks.forEach(c => {
            activities.push({
                date: c.created_at || c.clickedAt,
                productName: product.name,
                productSlug: product.slug,
                visitor: c.visitor_id ? `Visitor (${c.visitor_id.substring(0, 8)})` : `Visitor (IP: ${c.ip || 'Unknown'})`,
                action: 'Viewed Landing Page',
                amount: '—',
                status: 'Success'
            });
        });

        recentLogins.forEach(l => {
            activities.push({
                date: l.loginTime || l.createdAt,
                productName: product.name,
                productSlug: product.slug,
                visitor: l.userName || l.userEmail || 'User',
                action: 'Logged In',
                amount: '—',
                status: 'Success'
            });
        });

        recentLeads.forEach(l => {
            activities.push({
                date: l.createdAt,
                productName: product.name,
                productSlug: product.slug,
                visitor: l.customerName || l.email || 'Prospect',
                action: 'Registered',
                amount: '—',
                status: 'New'
            });
        });

        recentSales.forEach(s => {
            let statusStr = 'Paid';
            if (s.orderStatus === 'returned') statusStr = 'Refunded';
            if (s.orderStatus === 'cancelled') statusStr = 'Cancelled';
            
            let actionStr = 'Purchased';
            if (s.orderStatus === 'returned') actionStr = 'Returned';
            if (s.orderStatus === 'cancelled') actionStr = 'Cancelled';

            activities.push({
                date: s.purchaseDate || s.createdAt,
                productName: product.name,
                productSlug: product.slug,
                visitor: s.customerName || s.customerEmail || 'Customer',
                action: actionStr,
                amount: `₹${(s.amount || 0).toLocaleString('en-IN')}`,
                status: statusStr
            });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        const finalActivity = activities.slice(0, 15);

        // Fetch aggregated product analytics trend data
        let startLimit = new Date();
        startLimit.setDate(startLimit.getDate() - 30);
        let endLimit = new Date();
        if (clickDateQuery.created_at) {
            startLimit = clickDateQuery.created_at.$gte;
            endLimit = clickDateQuery.created_at.$lte;
        }

        const dates = getDatesInRange(startLimit, endLimit);
        const dailyClicks = [];
        const weeklySales = [];
        const revenueTrend = [];

        const prodClicks = await AffiliateClick.find({ partnerId: partner._id, productId: product._id, created_at: { $gte: startLimit, $lte: endLimit } });
        const prodSales = await AffiliateSale.find({ partnerId: partner._id, productId: product._id, purchaseDate: { $gte: startLimit, $lte: endLimit }, paymentStatus: 'paid' });

        const clicksMap = {};
        const salesMap = {};
        const revMap = {};

        dates.forEach(d => {
            const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            clicksMap[dateStr] = 0;
            salesMap[dateStr] = 0;
            revMap[dateStr] = 0;
        });

        prodClicks.forEach(c => {
            const dateStr = new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            if (clicksMap[dateStr] !== undefined) clicksMap[dateStr]++;
        });

        prodSales.forEach(s => {
            const dateStr = new Date(s.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            if (salesMap[dateStr] !== undefined) salesMap[dateStr]++;
            if (revMap[dateStr] !== undefined) revMap[dateStr] += s.amount;
        });

        dates.forEach(d => {
            const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            dailyClicks.push({ date: dateStr, count: clicksMap[dateStr] });
            weeklySales.push({ week: dateStr, count: salesMap[dateStr] });
            revenueTrend.push({ week: dateStr, amount: revMap[dateStr] });
        });

        const displayViews = uniqueClicks || totalVisits || loginsCount;

        res.json({
            product: {
                id: product._id,
                name: product.name,
                slug: product.slug,
                landingUrl: landingUrl
            },
            affiliate: {
                code: partner.affiliateCode,
                url: affLink.generatedAffiliateUrl
            },
            affiliateCode: partner.affiliateCode,
            affiliateLink: affLink.generatedAffiliateUrl,
            stats: {
                views: displayViews,
                totalViews: displayViews,
                logins: displayViews,
                totalLogins: displayViews,
                sales: salesCount,
                totalSales: salesCount,
                revenue: revenue,
                returned: returnedCount,
                cancelled: cancelledCount,
                clicks: uniqueClicks,
                totalVisits: totalVisits,
                leads: leadsCount,
                commissionRate: commissionRate,
                totalCommission: totalCommission,
                conversionRate: parseFloat(conversion.overallConversionPercentage)
            },
            recentActivity: finalActivity,
            analytics: {
                dailyClicks,
                weeklySales,
                revenueTrend
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get detailed profile, overall metrics, product-wise metrics, and recent sales for a specific Sales Partner.
 */
exports.getPartnerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { filter, startDate, endDate } = req.query;
        const partner = await SalesPartner.findById(id).select('-passwordHash');

        if (!partner) {
            return res.status(404).json({ message: 'Sales partner not found' });
        }

        const loginDateQuery = getDateFilterQuery(filter, startDate, endDate, 'loginTime');
        const saleDateQuery = getDateFilterQuery(filter, startDate, endDate, 'purchaseDate');

        // Fetch overall stats under date filter
        const overallLogins = await AffiliateLogin.countDocuments({ partnerId: partner._id, ...loginDateQuery });
        const overallSales = await AffiliateSale.find({ partnerId: partner._id, paymentStatus: 'paid', orderStatus: 'completed', ...saleDateQuery }).sort({ purchaseDate: -1 });

        const totalSalesCount = overallSales.length;
        const totalRevenue = overallSales.reduce((sum, s) => sum + s.amount, 0);

        const overallReturned = await AffiliateSale.countDocuments({ partnerId: partner._id, orderStatus: 'returned', ...saleDateQuery });
        const overallCancelled = await AffiliateSale.countDocuments({ partnerId: partner._id, orderStatus: 'cancelled', ...saleDateQuery });

        // Fetch all active products
        const products = await Product.find({ status: 'active' });
        const productStats = [];

        for (const prod of products) {
            const logins = await AffiliateLogin.countDocuments({ partnerId: partner._id, productId: prod._id, ...loginDateQuery });
            const salesList = await AffiliateSale.find({ partnerId: partner._id, productId: prod._id, paymentStatus: 'paid', orderStatus: 'completed', ...saleDateQuery });

            const sales = salesList.length;
            const revenue = salesList.reduce((sum, s) => sum + s.amount, 0);
            
            const returned = await AffiliateSale.countDocuments({ partnerId: partner._id, productId: prod._id, orderStatus: 'returned', ...saleDateQuery });
            const cancelled = await AffiliateSale.countDocuments({ partnerId: partner._id, productId: prod._id, orderStatus: 'cancelled', ...saleDateQuery });

            let affLink = await AffiliateLink.findOne({ partnerId: partner._id, productId: prod._id });
            const landingUrl = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
            const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';
            const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${partner.affiliateCode}&product=${prod.slug}&redirect=${encodeURIComponent(landingUrl)}`;

            if (!affLink) {
                if (partner.affiliateCode && partner.affiliateCode !== 'N/A') {
                    affLink = new AffiliateLink({
                        partnerId: partner._id,
                        productId: prod._id,
                        affiliateCode: partner.affiliateCode,
                        generatedAffiliateUrl: generatedUrl
                    });
                    await affLink.save();
                }
            } else {
                let hasChanges = false;
                if (!affLink.affiliateCode && partner.affiliateCode && partner.affiliateCode !== 'N/A') {
                    affLink.affiliateCode = partner.affiliateCode;
                    hasChanges = true;
                }
                if (affLink.generatedAffiliateUrl !== generatedUrl) {
                    affLink.generatedAffiliateUrl = generatedUrl;
                    hasChanges = true;
                }
                if (hasChanges) {
                    await affLink.save();
                }
            }

            productStats.push({
                productName: prod.name,
                productId: prod._id,
                slug: prod.slug,
                affiliateLink: affLink ? affLink.generatedAffiliateUrl : generatedUrl,
                logins,
                sales,
                revenue,
                returned,
                cancelled
            });
        }

        // Format recent sales
        const recentSalesList = await AffiliateSale.find({ partnerId: partner._id, ...saleDateQuery }).sort({ purchaseDate: -1 }).limit(100);
        const formattedSales = recentSalesList.map(s => {
            const matchingProd = products.find(p => String(p._id) === String(s.productId));
            return {
                id: s._id,
                customerName: s.customerName || 'Customer',
                productName: matchingProd ? matchingProd.name : (s.productSlug || 'Unknown'),
                orderId: s.orderId,
                amount: s.amount,
                status: s.orderStatus || s.paymentStatus || 'pending',
                date: s.purchaseDate || s.createdAt
            };
        });

        res.json({
            partner: {
                id: partner._id,
                name: partner.name,
                email: partner.email,
                phone: partner.phone,
                city: partner.city || '',
                company: partner.company || '',
                status: partner.status,
                affiliateCode: partner.affiliateCode || 'N/A',
                createdAt: partner.createdAt,
                lastLoginAt: partner.lastLoginAt || null
            },
            stats: {
                logins: overallLogins,
                sales: totalSalesCount,
                revenue: totalRevenue,
                returned: overallReturned,
                cancelled: overallCancelled
            },
            productStats,
            recentSales: formattedSales
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Product CRUD Controllers
 */

// Get all products (active and inactive)
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        let { name, slug, landingUrl, description, status, icon, themeColor } = req.body;

        if (!name || !landingUrl) {
            return res.status(400).json({ message: 'Product Name and Landing URL are required.' });
        }

        if (!slug) {
            slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        // Validate slug uniqueness
        const existingSlug = await Product.findOne({ slug: slug.toLowerCase() });
        if (existingSlug) {
            return res.status(400).json({ message: 'Product Slug is already in use.' });
        }

        const existingName = await Product.findOne({ name: name.trim() });
        if (existingName) {
            return res.status(400).json({ message: 'Product Name is already in use.' });
        }

        const product = new Product({
            name: name.trim(),
            slug: slug.toLowerCase().trim(),
            landingUrl: landingUrl.trim(),
            description: description ? description.trim() : '',
            status: status || 'active',
            icon: icon ? icon.trim() : '',
            themeColor: themeColor ? themeColor.trim() : '',
            commissionType: 'percentage',
            commissionValue: 10
        });

        await product.save();

        // Dynamically generate AffiliateLink records for all active partners
        if (product.status === 'active') {
            const partners = await SalesPartner.find({ affiliateCode: { $ne: null } });
            const landingUrl = product.landingUrl || `https://uwo24.com/${product.slug}`;
            const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';

            for (const partner of partners) {
                const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${partner.affiliateCode}&product=${product.slug}&redirect=${encodeURIComponent(landingUrl)}`;
                const affLink = new AffiliateLink({
                    partnerId: partner._id,
                    productId: product._id,
                    affiliateCode: partner.affiliateCode,
                    generatedAffiliateUrl: generatedUrl
                });
                await affLink.save();
            }
        }

        res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an existing product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, landingUrl, description, status, icon, themeColor } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        if (slug && slug.toLowerCase() !== product.slug) {
            const existingSlug = await Product.findOne({ slug: slug.toLowerCase() });
            if (existingSlug) {
                return res.status(400).json({ message: 'Product Slug is already in use.' });
            }
            product.slug = slug.toLowerCase().trim();
        }

        if (name && name.trim() !== product.name) {
            const existingName = await Product.findOne({ name: name.trim() });
            if (existingName) {
                return res.status(400).json({ message: 'Product Name is already in use.' });
            }
            product.name = name.trim();

            // Auto update slug if slug not explicitly provided/changed
            if (!slug) {
                const autoSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                if (autoSlug !== product.slug) {
                    const existingSlug = await Product.findOne({ slug: autoSlug, _id: { $ne: id } });
                    if (!existingSlug) {
                        product.slug = autoSlug;
                    }
                }
            }
        }

        if (landingUrl) product.landingUrl = landingUrl.trim();
        if (description !== undefined) product.description = description.trim();
        if (status) product.status = status;
        if (icon !== undefined) product.icon = icon.trim();
        if (themeColor !== undefined) product.themeColor = themeColor.trim();

        await product.save();

        // Update generated links for active partners
        const finalLandingUrl = product.landingUrl || `https://uwo24.com/${product.slug}`;
        const separator = finalLandingUrl.includes('?') ? '&' : '?';
        const partners = await SalesPartner.find({ affiliateCode: { $ne: null } });

        for (const partner of partners) {
            const generatedUrl = `${finalLandingUrl}${separator}affiliate=${partner.affiliateCode}`;
            await AffiliateLink.findOneAndUpdate(
                { partnerId: partner._id, productId: product._id },
                { 
                    affiliateCode: partner.affiliateCode,
                    generatedAffiliateUrl: generatedUrl 
                },
                { upsert: product.status === 'active' }
            );
        }

        res.json({ message: 'Product updated successfully', product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a product (blocks if tracking data exists)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Perform clean cascade delete of the product and all associated references
        await Product.findByIdAndDelete(id);
        await AffiliateLink.deleteMany({ productId: id });
        await PartnerProduct.deleteMany({ productId: id });
        await AffiliateClick.deleteMany({ productId: id });
        await AffiliateLead.deleteMany({ productId: id });
        await AffiliateSale.deleteMany({ productId: id });

        res.json({ message: 'Product and all associated affiliate analytics data deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Fetch overall recent activity across all products for a partner.
 */
exports.getPartnerActivity = async (req, res) => {
    try {
        const partner = req.partner;

        const recentClicks = await AffiliateClick.find({ partnerId: partner._id }).sort({ created_at: -1 }).limit(20).populate('productId');
        const recentLogins = await AffiliateLogin.find({ partnerId: partner._id }).sort({ loginTime: -1 }).limit(20).populate('productId');
        const recentLeads = await AffiliateLead.find({ partnerId: partner._id }).sort({ createdAt: -1 }).limit(20).populate('productId');
        const recentSales = await AffiliateSale.find({ partnerId: partner._id }).sort({ purchaseDate: -1 }).limit(20).populate('productId');

        const activities = [];

        recentClicks.forEach(c => {
            activities.push({
                date: c.created_at || c.clickedAt,
                productName: (c.productId && c.productId.name) || (c.productSlug ? c.productSlug.toUpperCase() : 'General'),
                productSlug: c.productSlug || '',
                visitor: c.visitor_id ? `Visitor (${c.visitor_id.substring(0, 8)})` : `Visitor (IP: ${c.ip || 'Unknown'})`,
                action: 'Click',
                amount: '—',
                status: 'Success'
            });
        });

        recentLogins.forEach(l => {
            activities.push({
                date: l.loginTime || l.createdAt,
                productName: (l.productId && l.productId.name) || 'General',
                productSlug: '',
                visitor: l.userName || l.userEmail || 'User',
                action: 'Login',
                amount: '—',
                status: 'Success'
            });
        });

        recentLeads.forEach(l => {
            activities.push({
                date: l.createdAt,
                productName: (l.productId && l.productId.name) || 'General',
                productSlug: '',
                visitor: l.customerName || l.email || 'Prospect',
                action: 'Lead',
                amount: '—',
                status: 'New'
            });
        });

        recentSales.forEach(s => {
            let statusStr = 'Paid';
            if (s.orderStatus === 'returned') statusStr = 'Refunded';
            if (s.orderStatus === 'cancelled') statusStr = 'Cancelled';
            
            let actionStr = 'Sale';
            if (s.orderStatus === 'returned') actionStr = 'Returned';
            if (s.orderStatus === 'cancelled') actionStr = 'Cancelled';

            activities.push({
                date: s.purchaseDate || s.createdAt,
                productName: (s.productId && s.productId.name) || (s.productSlug ? s.productSlug.toUpperCase() : 'General'),
                productSlug: s.productSlug || '',
                visitor: s.customerName || s.customerEmail || 'Customer',
                action: actionStr,
                amount: `₹${(s.amount || 0).toLocaleString('en-IN')}`,
                status: statusStr
            });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            activities: activities.slice(0, 30)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get assigned products details for a partner.
 */
exports.getPartnerAssignedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await SalesPartner.findById(id).select('-passwordHash');
        if (!partner) {
            return res.status(404).json({ message: 'Sales partner not found' });
        }

        const allProducts = await Product.find({});
        const mappings = await PartnerProduct.find({ partnerId: partner._id });

        const productsList = allProducts.map(prod => {
            const mapping = mappings.find(m => String(m.productId) === String(prod._id));
            return {
                productId: prod._id,
                name: prod.name,
                icon: prod.icon || 'fa-cube',
                themeColor: prod.themeColor || '#4F46E5',
                defaultCommission: prod.commissionValue,
                isAssigned: !!mapping,
                commission: mapping ? mapping.commission : prod.commissionValue,
                status: mapping ? mapping.status : 'active'
            };
        });

        res.json({
            partner,
            products: productsList
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update assigned products details and permissions for a partner.
 */
exports.updatePartnerAssignedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedProducts, permissions } = req.body;

        const partner = await SalesPartner.findById(id);
        if (!partner) {
            return res.status(404).json({ message: 'Sales partner not found' });
        }

        // Update permissions
        if (permissions) {
            partner.permissions = {
                allowGenerateLink: permissions.allowGenerateLink !== false,
                allowViewAnalytics: permissions.allowViewAnalytics !== false,
                allowDownloadReports: permissions.allowDownloadReports !== false,
                allowWithdrawEarnings: permissions.allowWithdrawEarnings !== false
            };
            await partner.save();
        }

        // Process product assignments
        const existingMappings = await PartnerProduct.find({ partnerId: partner._id });
        const existingProdIds = existingMappings.map(m => String(m.productId));
        const reqProdIds = (assignedProducts || []).map(p => String(p.productId));

        for (const item of (assignedProducts || [])) {
            const prod = await Product.findById(item.productId);
            if (!prod) continue;

            const existing = existingMappings.find(m => String(m.productId) === String(item.productId));
            if (existing) {
                existing.commission = Number(item.commission) || 0;
                existing.status = item.status || 'active';
                await existing.save();
            } else {
                const newMapping = new PartnerProduct({
                    partnerId: partner._id,
                    productId: prod._id,
                    commission: Number(item.commission) || 0,
                    status: item.status || 'active'
                });
                await newMapping.save();
            }

            if (item.status === 'active') {
                let affLink = await AffiliateLink.findOne({ partnerId: partner._id, productId: prod._id });
                const landingUrl = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
                const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';
                const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${partner.affiliateCode}&product=${prod.slug}&redirect=${encodeURIComponent(landingUrl)}`;

                if (!affLink) {
                    affLink = new AffiliateLink({
                        partnerId: partner._id,
                        productId: prod._id,
                        affiliateCode: partner.affiliateCode,
                        generatedAffiliateUrl: generatedUrl
                    });
                    await affLink.save();
                } else {
                    let hasChanges = false;
                    if (!affLink.affiliateCode) {
                        affLink.affiliateCode = partner.affiliateCode;
                        hasChanges = true;
                    }
                    if (affLink.generatedAffiliateUrl !== generatedUrl) {
                        affLink.generatedAffiliateUrl = generatedUrl;
                        hasChanges = true;
                    }
                    if (hasChanges) {
                        await affLink.save();
                    }
                }
            } else {
                await AffiliateLink.deleteOne({ partnerId: partner._id, productId: prod._id });
            }
        }

        const unassignedMappings = existingMappings.filter(m => !reqProdIds.includes(String(m.productId)));
        for (const mapping of unassignedMappings) {
            await PartnerProduct.deleteOne({ _id: mapping._id });
            await AffiliateLink.deleteOne({ partnerId: partner._id, productId: mapping.productId });
        }

        res.json({
            message: 'Assigned products and permissions updated successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/affiliate/admin/partner-details/:partnerId
 * Returns complete performance metrics, revenue breakdown, product cards, 
 * recent activity, and chart data for a single sales partner.
 */
exports.getAdminPartnerDetail = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const mongoose = require('mongoose');

        let partner = null;
        if (mongoose.Types.ObjectId.isValid(partnerId)) {
            partner = await SalesPartner.findById(partnerId);
        }
        if (!partner) {
            partner = await SalesPartner.findOne({ affiliateCode: partnerId });
        }

        if (!partner) {
            return res.status(404).json({ error: 'Sales partner not found' });
        }

        // Fetch assigned product mappings
        const mappings = await PartnerProduct.find({ partnerId: partner._id }).populate('productId');

        // Overall stats calculations
        const totalViews = await AffiliateClick.countDocuments({
            $or: [{ partnerId: partner._id }, { partner_id: partner._id }]
        });

        const totalLeads = await AffiliateLead.countDocuments({ partnerId: partner._id });

        const completedSales = await AffiliateSale.find({
            partnerId: partner._id,
            orderStatus: 'completed',
            paymentStatus: 'paid'
        });
        const totalSales = completedSales.length;
        const revenue = completedSales.reduce((sum, s) => sum + (s.amount || 0), 0);

        const returned = await AffiliateSale.countDocuments({
            partnerId: partner._id,
            orderStatus: 'returned'
        });

        const cancelled = await AffiliateSale.countDocuments({
            partnerId: partner._id,
            orderStatus: 'cancelled'
        });

        const conversionRate = totalViews > 0 
            ? Number(((totalSales / totalViews) * 100).toFixed(1)) 
            : 0;

        // Revenue Breakdown: Today, Week, Month, Lifetime
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayRevenue = 0;
        let weekRevenue = 0;
        let monthRevenue = 0;

        completedSales.forEach(s => {
            const pDate = new Date(s.purchaseDate || s.createdAt);
            const amt = s.amount || 0;
            if (pDate >= startOfToday) todayRevenue += amt;
            if (pDate >= startOfWeek) weekRevenue += amt;
            if (pDate >= startOfMonth) monthRevenue += amt;
        });

        const revenueBreakdown = {
            today: todayRevenue,
            week: weekRevenue,
            month: monthRevenue,
            lifetime: revenue
        };

        // Product-wise Performance Cards
        const productStats = [];
        const chartSalesByProduct = [];

        for (const mapping of mappings) {
            const prod = mapping.productId;
            if (!prod) continue;

            const prodClickMatch = {
                $or: [{ partnerId: partner._id }, { partner_id: partner._id }],
                $and: [
                    {
                        $or: [
                            { productId: prod._id },
                            { product_id: prod._id },
                            { productSlug: new RegExp('^' + prod.slug + '$', 'i') }
                        ]
                    }
                ]
            };

            const prodViews = await AffiliateClick.countDocuments(prodClickMatch);
            const prodLogins = await AffiliateLogin.countDocuments({ partnerId: partner._id, productId: prod._id });
            const prodLeads = await AffiliateLead.countDocuments({ partnerId: partner._id, productId: prod._id });
            const prodSalesList = await AffiliateSale.find({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: 'completed',
                paymentStatus: 'paid'
            });
            const prodSales = prodSalesList.length;
            const prodRevenue = prodSalesList.reduce((sum, s) => sum + (s.amount || 0), 0);

            const prodReturned = await AffiliateSale.countDocuments({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: 'returned'
            });
            const prodCancelled = await AffiliateSale.countDocuments({
                partnerId: partner._id,
                productId: prod._id,
                orderStatus: 'cancelled'
            });

            const prodConversion = prodViews > 0
                ? Number(((prodSales / prodViews) * 100).toFixed(1))
                : 0;

            let affLink = await AffiliateLink.findOne({ partnerId: partner._id, productId: prod._id });
            const landingUrl = prod.landingUrl || `https://uwo24.com/${prod.slug}`;
            const backendApiUrl = process.env.API_BASE_URL || 'https://uwo-backend-977864306871.asia-south1.run.app';
            const generatedUrl = `${backendApiUrl}/api/affiliate/track?affiliate=${partner.affiliateCode}&product=${prod.slug}&redirect=${encodeURIComponent(landingUrl)}`;

            productStats.push({
                productId: prod._id,
                productName: prod.name,
                slug: prod.slug,
                affiliateUrl: affLink ? affLink.generatedAffiliateUrl : generatedUrl,
                views: prodViews,
                logins: prodLogins,
                leads: prodLeads,
                sales: prodSales,
                revenue: prodRevenue,
                returned: prodReturned,
                cancelled: prodCancelled,
                conversionRate: prodConversion,
                status: mapping.status || 'active'
            });

            chartSalesByProduct.push({
                product: prod.name,
                sales: prodSales,
                revenue: prodRevenue,
                views: prodViews
            });
        }

        // Recent Activity Stream (last 20 items)
        const recentClicks = await AffiliateClick.find({
            $or: [{ partnerId: partner._id }, { partner_id: partner._id }]
        }).sort({ created_at: -1 }).limit(10).populate('productId');

        const recentLogins = await AffiliateLogin.find({ partnerId: partner._id }).sort({ loginTime: -1 }).limit(10).populate('productId');
        const recentLeads = await AffiliateLead.find({ partnerId: partner._id }).sort({ createdAt: -1 }).limit(10).populate('productId');
        const recentSales = await AffiliateSale.find({ partnerId: partner._id }).sort({ purchaseDate: -1 }).limit(10).populate('productId');

        const activities = [];

        recentClicks.forEach(c => {
            activities.push({
                date: c.created_at || c.clickedAt,
                productName: (c.productId && c.productId.name) || (c.productSlug ? c.productSlug.toUpperCase() : 'General'),
                productSlug: c.productSlug || '',
                visitor: c.visitor_id ? `Visitor (${c.visitor_id.substring(0, 8)})` : `Visitor (IP: ${c.ip || 'Unknown'})`,
                action: 'Viewed Landing Page',
                amount: '—',
                status: 'Success'
            });
        });

        recentLogins.forEach(l => {
            activities.push({
                date: l.loginTime || l.createdAt,
                productName: (l.productId && l.productId.name) || 'General',
                productSlug: '',
                visitor: l.userName || l.userEmail || 'User',
                action: 'Logged In',
                amount: '—',
                status: 'Success'
            });
        });

        recentLeads.forEach(l => {
            activities.push({
                date: l.createdAt,
                productName: (l.productId && l.productId.name) || 'General',
                productSlug: '',
                visitor: l.customerName || l.email || 'Prospect',
                action: 'Registered',
                amount: '—',
                status: 'New'
            });
        });

        recentSales.forEach(s => {
            let statusStr = 'Paid';
            if (s.orderStatus === 'returned') statusStr = 'Refunded';
            if (s.orderStatus === 'cancelled') statusStr = 'Cancelled';

            let actionStr = 'Purchased';
            if (s.orderStatus === 'returned') actionStr = 'Returned';
            if (s.orderStatus === 'cancelled') actionStr = 'Cancelled';

            activities.push({
                date: s.purchaseDate || s.createdAt,
                productName: (s.productId && s.productId.name) || 'General',
                productSlug: '',
                visitor: s.customerName || s.customerEmail || 'Customer',
                action: actionStr,
                amount: `₹${(s.amount || 0).toLocaleString('en-IN')}`,
                status: statusStr
            });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        const finalActivity = activities.slice(0, 20);

        // Fetch last login time
        const lastLoginRecord = await AffiliateLogin.findOne({ partnerId: partner._id }).sort({ loginTime: -1 });

        res.json({
            partner: {
                id: partner._id,
                name: partner.name,
                email: partner.email,
                phone: partner.phone || '-',
                company: partner.company || '-',
                city: partner.city || '-',
                affiliateCode: partner.affiliateCode,
                status: partner.status || 'active',
                createdAt: partner.createdAt,
                lastLogin: lastLoginRecord ? lastLoginRecord.loginTime : null,
                assignedProducts: productStats.map(p => p.productName),
                permissions: partner.permissions || {}
            },
            stats: {
                totalViews,
                totalLeads,
                totalSales,
                revenue,
                returned,
                cancelled,
                conversionRate,
                assignedProductsCount: productStats.length
            },
            revenueBreakdown,
            products: productStats,
            recentActivity: finalActivity,
            chartData: {
                salesByProduct: chartSalesByProduct
            }
        });
    } catch (err) {
        console.error('Error fetching admin partner details:', err);
        res.status(500).json({ error: err.message });
    }
};
