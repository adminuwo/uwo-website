// 🔹 DYNAMIC BACKEND API URL
const TRACKING_API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8080/api/affiliate"
  : "https://uwo-backend-977864306871.asia-south1.run.app/api/affiliate";

// ================= GLOBAL REQUEST INTERCEPTORS =================
// Automatically attaches affiliate headers & enables credentials for cross-origin cookies

function isBackendRequest(url) {
    if (!url) return false;
    const urlStr = typeof url === 'string' ? url : (url.url || '');
    return urlStr.includes('/api/') || urlStr.startsWith('http://localhost:8080') || urlStr.includes('asia-south1.run.app');
}

// 1. Intercept Fetch API
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
    const url = (typeof input === 'string') ? input : (input instanceof Request ? input.url : '');
    
    if (isBackendRequest(url)) {
        init = init || {};
        init.credentials = 'include';
        
        if (!init.headers) {
            init.headers = {};
        }
        
        const code = window.getAffiliateCode();
        const visitorId = window.getVisitorId();
        
        if (code) {
            if (init.headers instanceof Headers) {
                if (!init.headers.has('x-uwo-affiliate-code')) {
                    init.headers.set('x-uwo-affiliate-code', code);
                }
            } else {
                if (!init.headers['x-uwo-affiliate-code'] && !init.headers['X-UWO-Affiliate-Code']) {
                    init.headers['x-uwo-affiliate-code'] = code;
                }
            }
        }
        
        if (visitorId) {
            if (init.headers instanceof Headers) {
                if (!init.headers.has('x-uwo-visitor-id')) {
                    init.headers.set('x-uwo-visitor-id', visitorId);
                }
            } else {
                if (!init.headers['x-uwo-visitor-id'] && !init.headers['X-UWO-Visitor-Id']) {
                    init.headers['x-uwo-visitor-id'] = visitorId;
                }
            }
        }
    }
    
    return originalFetch.apply(this, arguments);
};

// 2. Intercept XMLHttpRequest API
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    this._url = url;
    const res = originalOpen.apply(this, arguments);
    if (isBackendRequest(url)) {
        this.withCredentials = true;
    }
    return res;
};

const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (body) {
    if (isBackendRequest(this._url)) {
        const code = window.getAffiliateCode();
        const visitorId = window.getVisitorId();
        
        if (code) {
            this.setRequestHeader('x-uwo-affiliate-code', code);
        }
        if (visitorId) {
            this.setRequestHeader('x-uwo-visitor-id', visitorId);
        }
    }
    return originalSend.apply(this, arguments);
};

// Helper to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Helper to set cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

// Helper to determine the device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "Tablet";
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
        return "Mobile";
    }
    return "Desktop";
}

// Helper to determine browser name
function getBrowserName() {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    if (ua.indexOf("Firefox") > -1) {
        browser = "Mozilla Firefox";
    } else if (ua.indexOf("SamsungBrowser") > -1) {
        browser = "Samsung Internet";
    } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
        browser = "Opera";
    } else if (ua.indexOf("Trident") > -1) {
        browser = "Microsoft Internet Explorer";
    } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
        browser = "Microsoft Edge";
    } else if (ua.indexOf("Chrome") > -1) {
        browser = "Google Chrome";
    } else if (ua.indexOf("Safari") > -1) {
        browser = "Apple Safari";
    }
    return browser;
}

// Resolve the product slug from the current URL path or hostname
function getProductSlugFromUrl() {
    const hostname = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    
    // Hostname checks
    if (hostname.includes('efvframework')) return 'efv';
    if (hostname.includes('aimall24')) return 'aisa';
    
    // Path checks
    if (path.includes('aisa-connect')) return 'aisa-connect';
    if (path.includes('aisa')) return 'aisa';
    if (path.includes('efv')) return 'efv';
    if (path.includes('ai-legal')) return 'ai-legal';
    
    return 'general';
}

// Generate deterministic browser fingerprint as a visitor identification fallback
function generateFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        window.screen.width + 'x' + window.screen.height,
        window.screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.platform
    ];
    const fpString = components.join('||');
    
    let hash = 0;
    for (let i = 0; i < fpString.length; i++) {
        const char = fpString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'fp_' + Math.abs(hash).toString(36);
}

// Retrieve or generate Visitor ID based on Cookie -> Local Storage -> Fingerprint priority
function getOrGenerateVisitorId() {
    // 1. Cookie
    let visitorId = getCookie('uwo_visitor_id');
    if (visitorId) {
        localStorage.setItem('uwo_visitor_id', visitorId);
        return visitorId;
    }

    // 2. Local Storage
    visitorId = localStorage.getItem('uwo_visitor_id');
    if (visitorId) {
        setCookie('uwo_visitor_id', visitorId, 365);
        return visitorId;
    }

    // 3. Browser Fingerprint
    visitorId = generateFingerprint();
    if (visitorId) {
        setCookie('uwo_visitor_id', visitorId, 365);
        localStorage.setItem('uwo_visitor_id', visitorId);
        return visitorId;
    }

    // Fallback: Random token
    visitorId = 'uid_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setCookie('uwo_visitor_id', visitorId, 365);
    localStorage.setItem('uwo_visitor_id', visitorId);
    return visitorId;
}

// Initialize Tracking
async function initAffiliateTracking() {
    try {
        console.log('📊 [Affiliate Tracker] Initializing...');
        const urlParams = new URLSearchParams(window.location.search);
        let affiliateCode = urlParams.get('ref') || urlParams.get('affiliate');
        let currentProduct = getProductSlugFromUrl();
        const visitorId = getOrGenerateVisitorId();

        if (affiliateCode) {
            console.log(`🔗 Affiliate referral detected from URL: ${affiliateCode} for product: ${currentProduct}`);
            
            // Validate code via backend track/click call first!
            const payload = {
                affiliateCode,
                productSlug: currentProduct || 'general',
                visitorId,
                referrer: document.referrer || '',
                landingPage: window.location.href,
                browser: getBrowserName(),
                device: getDeviceType()
            };

            console.log('📊 [Affiliate Tracker] Validating and tracking click...', payload);

            const response = await fetch(`${TRACKING_API_URL}/track/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Affiliate code validated and tracked successfully. ID:', data.clickId);
                
                // Store code in local storage and cookies because it is VALID
                localStorage.setItem('uwo_affiliate_code', affiliateCode);
                setCookie('uwo_affiliate_code', affiliateCode, 30);
                
                if (currentProduct) {
                    localStorage.setItem('uwo_affiliate_product', currentProduct);
                    setCookie('uwo_affiliate_product', currentProduct, 30);
                }

                // Clean the URL parameters to prevent re-validation / duplicate click counting
                const url = new URL(window.location.href);
                url.searchParams.delete('affiliate');
                url.searchParams.delete('ref');
                window.history.replaceState({}, document.title, url.pathname + url.search);
            } else {
                const err = await response.json();
                console.error('❌ Affiliate validation failed. Code will not be stored:', err.error || err.message);
            }
        } else {
            // Retrieve existing code from cookies or storage (No API call on refresh/subsequent page load!)
            affiliateCode = localStorage.getItem('uwo_affiliate_code') || getCookie('uwo_affiliate_code');
            if (affiliateCode) {
                console.log(`🔗 Affiliate code restored from storage: ${affiliateCode} | Product: ${currentProduct}`);
            } else {
                console.log('📊 [Affiliate Tracker] No affiliate code found. Skipping.');
            }
        }
    } catch (err) {
        console.error('⚠️ Affiliate tracking initialization error:', err);
    }
}

// Expose getters globally
window.getAffiliateCode = () => localStorage.getItem('uwo_affiliate_code') || getCookie('uwo_affiliate_code');
window.getAffiliateProduct = () => localStorage.getItem('uwo_affiliate_product') || getCookie('uwo_affiliate_product');
window.getVisitorId = () => getOrGenerateVisitorId();

// Track user login and signup attributed to affiliate
async function trackAffiliateLogin(email, customerName = '') {
    try {
        const affiliateCode = window.getAffiliateCode();
        const currentProduct = window.getAffiliateProduct() || 'general';
        const visitorId = window.getVisitorId();

        if (!affiliateCode || !email) {
            console.log('📊 [Affiliate Tracker] No active affiliate code or email. Skipping login tracking.');
            return;
        }

        const payload = {
            affiliateCode,
            productSlug: currentProduct,
            customerName,
            email,
            visitorId,
            browser: getBrowserName(),
            device: getDeviceType()
        };

        console.log('📊 [Affiliate Tracker] Sending login tracking request...', payload);

        const response = await fetch(`${TRACKING_API_URL}/track/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ Affiliate login tracked successfully');
        } else {
            const err = await response.json();
            console.error('❌ Affiliate login tracking failed:', err.error || err.message);
        }
    } catch (err) {
        console.error('⚠️ Affiliate login tracking error:', err);
    }
}

// Track sale attributed to affiliate (Razorpay / Cashfree / Common)
async function trackAffiliateSale(saleDetails = {}) {
    try {
        const affiliateCode = saleDetails.affiliateCode || saleDetails.affiliate_code || window.getAffiliateCode() || getCookie('affiliate_code');
        const currentProduct = saleDetails.product || saleDetails.productSlug || window.getAffiliateProduct() || getProductSlugFromUrl();
        const visitorId = saleDetails.visitorId || window.getVisitorId();

        const payload = {
            affiliateCode,
            productSlug: currentProduct,
            product: currentProduct,
            orderId: saleDetails.orderId || saleDetails.order_id || saleDetails.paymentId || ('ord_' + Date.now()),
            paymentId: saleDetails.paymentId || saleDetails.payment_id || saleDetails.transactionId || '',
            customerName: saleDetails.customerName || saleDetails.name || '',
            customerEmail: saleDetails.customerEmail || saleDetails.email || '',
            amount: Number(saleDetails.amount) || 0,
            currency: saleDetails.currency || 'INR',
            paymentStatus: saleDetails.paymentStatus || 'paid',
            paymentGateway: saleDetails.paymentGateway || saleDetails.gateway || 'Razorpay',
            visitorId
        };

        console.log('💳 [Affiliate Tracker] Sending sale tracking request...', payload);

        const response = await fetch(`${TRACKING_API_URL}/track-sale`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const resData = await response.json();
            console.log('✅ Affiliate sale tracked successfully:', resData);
            return resData;
        } else {
            const err = await response.json();
            console.error('❌ Affiliate sale tracking failed:', err.error || err.message);
            return err;
        }
    } catch (err) {
        console.error('⚠️ Affiliate sale tracking error:', err);
    }
}

window.trackAffiliateLogin = trackAffiliateLogin;
window.trackAffiliateSale = trackAffiliateSale;

// Run tracker automatically on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAffiliateTracking);
} else {
    initAffiliateTracking();
}
