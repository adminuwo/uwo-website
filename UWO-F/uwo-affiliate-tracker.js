/**
 * UWO Affiliate Client Tracker (Production-Grade)
 * Automatically tracks immediate landing views, manages persistent visitor sessions,
 * and attaches affiliate parameters to all outgoing frontend API calls.
 */

(function () {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080/api/affiliate'
        : 'https://uwo-backend-977864306871.asia-south1.run.app/api/affiliate';

    // Cookie Utilities
    function setCookie(name, value, days = 30) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; ${isSecure ? 'SameSite=None; Secure' : 'SameSite=Lax'}`;
    }

    function getCookie(name) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    }

    // Helper: Generate persistent Visitor ID
    function getOrCreateVisitorId() {
        let vid = localStorage.getItem('uwo_visitor_id') || getCookie('visitor_id');
        if (!vid) {
            vid = 'vid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            localStorage.setItem('uwo_visitor_id', vid);
        }
        setCookie('visitor_id', vid, 30);
        return vid;
    }

    // Helper: Generate Session ID
    function getOrCreateSessionId() {
        let sid = sessionStorage.getItem('uwo_session_id');
        if (!sid) {
            sid = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            sessionStorage.setItem('uwo_session_id', sid);
        }
        return sid;
    }

    // Extract product slug from hostname or URL path
    function detectProductSlug() {
        const host = window.location.hostname.toLowerCase();
        if (host.includes('efv')) return 'efv';
        if (host.includes('aisa')) return 'aisa';
        if (host.includes('ailegal') || host.includes('legal')) return 'ailegal';
        if (host.includes('connect')) return 'aiconnect';

        const path = window.location.pathname.toLowerCase();
        if (path.includes('efv')) return 'efv';
        if (path.includes('aisa')) return 'aisa';
        if (path.includes('legal')) return 'ailegal';
        return 'general';
    }

    // Main tracking initialization
    async function initTracking() {
        const urlParams = new URLSearchParams(window.location.search);
        const affiliateCode = urlParams.get('affiliate') || urlParams.get('aff') || getCookie('affiliate_code') || localStorage.getItem('uwo_affiliate_code');

        const visitorId = getOrCreateVisitorId();
        const sessionId = getOrCreateSessionId();

        if (affiliateCode) {
            // Preserve affiliate information across navigations & logins
            localStorage.setItem('uwo_affiliate_code', affiliateCode);
            setCookie('affiliate_code', affiliateCode, 30);

            if (!localStorage.getItem('uwo_landing_time')) {
                localStorage.setItem('uwo_landing_time', Date.now().toString());
            }

            const product = detectProductSlug();

            // Track Immediate View (POST /api/affiliate/track-view)
            try {
                await fetch(`${API_BASE}/track-view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        affiliateCode: affiliateCode,
                        product: product,
                        productSlug: product,
                        page: window.location.pathname,
                        referrer: document.referrer || '',
                        userAgent: navigator.userAgent,
                        visitorId: visitorId,
                        sessionId: sessionId,
                        timestamp: Date.now()
                    })
                });
                console.log(`✅ UWO View Tracked: ${affiliateCode} | Visitor: ${visitorId}`);
            } catch (err) {
                console.error('⚠️ UWO Affiliate View tracking failed:', err);
            }
        }
    }

    // Shared Affiliate Sale Tracker (Razorpay / Cashfree / Gateway-Independent)
    async function trackAffiliateSale(saleDetails = {}) {
        try {
            const code = saleDetails.affiliateCode || saleDetails.affiliate_code || localStorage.getItem('uwo_affiliate_code') || getCookie('affiliate_code') || getCookie('uwo_affiliate_code') || '';
            const visitorId = saleDetails.visitorId || saleDetails.visitor_id || getOrCreateVisitorId();
            const product = saleDetails.product || saleDetails.productSlug || detectProductSlug();

            const payload = {
                affiliateCode: code,
                productSlug: product,
                product: product,
                orderId: saleDetails.orderId || saleDetails.order_id || saleDetails.paymentId || ('ord_' + Date.now()),
                paymentId: saleDetails.paymentId || saleDetails.payment_id || saleDetails.transactionId || '',
                customerName: saleDetails.customerName || saleDetails.name || '',
                customerEmail: saleDetails.customerEmail || saleDetails.email || '',
                amount: Number(saleDetails.amount) || 0,
                currency: saleDetails.currency || 'INR',
                paymentStatus: saleDetails.paymentStatus || 'paid',
                paymentGateway: saleDetails.paymentGateway || saleDetails.gateway || 'Razorpay',
                visitorId: visitorId
            };

            console.log('💳 [Affiliate Tracker] Submitting Common Affiliate Sale Attribution...', payload);

            const response = await fetch(`${API_BASE}/track-sale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ [Affiliate Tracker] Sale successfully attributed!', data);
                return data;
            } else {
                const err = await response.json();
                console.error('❌ [Affiliate Tracker] Sale attribution failed:', err);
                return err;
            }
        } catch (err) {
            console.error('⚠️ [Affiliate Tracker] Exception during trackAffiliateSale:', err);
        }
    }

    // Export global context helper for APIs & forms
    window.UWOAffiliate = {
        getAffiliateCode: () => localStorage.getItem('uwo_affiliate_code') || getCookie('affiliate_code') || '',
        getVisitorId: () => getOrCreateVisitorId(),
        getSessionId: () => getOrCreateSessionId(),
        trackSale: trackAffiliateSale,
        getContext: () => ({
            affiliateCode: localStorage.getItem('uwo_affiliate_code') || getCookie('affiliate_code') || '',
            visitorId: getOrCreateVisitorId(),
            sessionId: getOrCreateSessionId()
        })
    };

    window.trackAffiliateSale = trackAffiliateSale;

    // Run view tracking immediately on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }
})();
