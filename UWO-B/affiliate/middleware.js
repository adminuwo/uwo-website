const jwt = require('jsonwebtoken');
const SalesPartner = require('../models/SalesPartner');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware for Sales Partner authentication
const authPartner = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find partner in database to ensure they still exist and are active
        const partner = await SalesPartner.findById(decoded.partnerId);
        if (!partner) {
            return res.status(401).json({ message: 'Sales partner account not found' });
        }
        if (partner.status !== 'active') {
            return res.status(403).json({ message: 'Sales partner account is disabled' });
        }

        req.partner = partner;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Centralized Role-Based Permissions
const RolePermissions = {
    SUPER_ADMIN: [
        'messages.view', 'messages.delete',
        'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.delete',
        'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
        'team.view', 'team.create', 'team.edit', 'team.delete',
        'settings.view', 'settings.edit',
        'knowledge.view', 'knowledge.manage',
        'legal.view', 'legal.manage',
        'sales.view', 'sales.create', 'sales.edit', 'sales.analytics', 'sales.approve', 'sales.reject'
    ],
    SALES_ADMIN: [
        'sales.view', 'sales.create', 'sales.edit', 'sales.analytics', 'sales.approve', 'sales.reject'
    ]
};

// Middleware for Admin authentication
const authAdmin = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("DECODED TOKEN IN MIDDLEWARE:", decoded);
        
        // Admins are signed with { id, email, role } in server.js
        if (!decoded.role) {
            return res.status(403).json({ message: 'Access denied: not an administrator' });
        }

        const permissions = RolePermissions[decoded.role] || [];
        if (!permissions.includes('sales.view')) {
            return res.status(403).json({ message: 'Forbidden: Access Denied' });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Middleware to attach affiliate context from cookies or headers
const attachAffiliateContext = (req, res, next) => {
    let affiliateCode = req.headers['x-uwo-affiliate-code'] || req.headers['X-UWO-Affiliate-Code'];
    let visitorId = req.headers['x-uwo-visitor-id'] || req.headers['X-UWO-Visitor-Id'];

    if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) {
                const key = parts[0];
                const value = parts.slice(1).join('=');
                acc[key] = value;
            }
            return acc;
        }, {});
        
        if (!affiliateCode) affiliateCode = cookies['affiliate_code'] || cookies['uwo_affiliate_code'];
        if (!visitorId) visitorId = cookies['uwo_visitor_id'];
    }

    if (affiliateCode || visitorId) {
        req.affiliate = {
            code: affiliateCode || null,
            visitorId: visitorId || null
        };
    }

    next();
};

module.exports = {
    authPartner,
    authAdmin,
    attachAffiliateContext
};
