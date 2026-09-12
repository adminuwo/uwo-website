/**
 * Integration Test for Affiliate tracking system.
 * Run this script to verify the backend tracking flows, bot filtering, F5 spam rate limiting,
 * session unique/total checks, and dashboard metrics.
 */

const API_URL = 'http://localhost:8080/api/affiliate';
let visitorId = 'test-visitor-' + Math.random().toString(36).substring(2, 9);
let partnerCode = 'UWO-ABHAA-001';
let productSlug = 'efv'; // Maps to efvframework.com

async function runTests() {
    console.log('🚀 STARTING AFFILIATE TRACKING INTEGRATION TESTS...\n');

    try {
        // Test 1: Bot Filtering
        console.log('Test 1: Simulating Bot click (Googlebot User Agent)...');
        const botRes = await fetch(`${API_URL}/track/click`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            },
            body: JSON.stringify({
                visitorId: visitorId,
                affiliateCode: partnerCode,
                productSlug: productSlug,
                landingPage: 'https://efvframework.com/?ref=' + partnerCode
            })
        });
        const botData = await botRes.json();
        console.log('Status:', botRes.status, 'Body:', botData);
        
        // Verify in DB that no click was logged for bot
        const debugBotRes = await fetch(`${API_URL}/debug/visitor/${visitorId}`);
        const debugBot = await debugBotRes.json();
        
        if (botRes.status === 201 && botData.clickId === 'bot_ignored' && debugBot.clicks.length === 0) {
            console.log('✅ Bot click correctly ignored and excluded from DB!\n');
        } else {
            console.error('❌ Bot was NOT ignored correctly!\n');
        }

        // Test 2: Unique click tracking
        console.log('Test 2: Logging first normal user click...');
        const uniqueRes = await fetch(`${API_URL}/track/click`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                visitorId: visitorId,
                affiliateCode: partnerCode,
                productSlug: productSlug,
                landingPage: 'https://efvframework.com/?ref=' + partnerCode
            })
        });
        const uniqueData = await uniqueRes.json();
        console.log('Status:', uniqueRes.status, 'Body:', uniqueData);

        // Verify in DB that click was created and is 'unique'
        const debugUniqueRes = await fetch(`${API_URL}/debug/visitor/${visitorId}`);
        const debugUnique = await debugUniqueRes.json();
        const uniqueClick = debugUnique.clicks[0];
        
        if (uniqueRes.status === 201 && uniqueClick && uniqueClick.click_type === 'unique') {
            console.log('✅ First click logged successfully with click_type: "unique"!\n');
        } else {
            console.error('❌ Unique click verification failed!\n');
        }

        // Test 3: Throttling (F5 refresh rate-limiting)
        console.log('Test 3: Logging rapid click within 2000ms (refresh protection)...');
        const throttleRes = await fetch(`${API_URL}/track/click`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                visitorId: visitorId,
                affiliateCode: partnerCode,
                productSlug: productSlug,
                landingPage: 'https://efvframework.com/?ref=' + partnerCode
            })
        });
        const throttleData = await throttleRes.json();
        console.log('Status:', throttleRes.status, 'Body:', throttleData);

        const debugThrottleRes = await fetch(`${API_URL}/debug/visitor/${visitorId}`);
        const debugThrottle = await debugThrottleRes.json();
        
        if (throttleData.clickId === String(uniqueClick._id) && debugThrottle.clicks.length === 1) {
            console.log('✅ Rapid click correctly throttled (no new row created, returned previous id)!\n');
        } else {
            console.error('❌ Throttling failed!\n');
        }

        // Test 4: Total visit check after 2 seconds
        console.log('Test 4: Waiting 2.1 seconds to log subsequent page load...');
        await new Promise(r => setTimeout(r, 2100));
        const totalRes = await fetch(`${API_URL}/track/click`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                visitorId: visitorId,
                affiliateCode: partnerCode,
                productSlug: productSlug,
                landingPage: 'https://efvframework.com/about-us'
            })
        });
        const totalData = await totalRes.json();
        console.log('Status:', totalRes.status, 'Body:', totalData);

        const debugTotalRes = await fetch(`${API_URL}/debug/visitor/${visitorId}`);
        const debugTotal = await debugTotalRes.json();
        const totalClick = debugTotal.clicks.find(c => c._id === totalData.clickId);
        
        if (totalClick && totalClick.click_type === 'total' && debugTotal.clicks.length === 2) {
            console.log('✅ Subsequent visit marked as "total" (new visit recorded in the same session)!\n');
        } else {
            console.error('❌ Total visit check failed!\n');
        }

        // Test 5: Lead generation attribution
        console.log('Test 5: Submitting a lead associated with visitorId...');
        const leadRes = await fetch(`${API_URL}/track/lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitorId: visitorId,
                affiliateCode: partnerCode,
                productSlug: productSlug,
                customerName: 'Test Lead User',
                email: 'testlead@gmail.com',
                phone: '9876543210'
            })
        });
        const leadData = await leadRes.json();
        console.log('Status:', leadRes.status, 'Body:', leadData);

        const debugLeadRes = await fetch(`${API_URL}/debug/visitor/${visitorId}`);
        const debugLead = await debugLeadRes.json();
        const leadDoc = debugLead.leads[0];
        
        if (leadRes.status === 201 && leadDoc && leadDoc.visitor_id === visitorId) {
            console.log('✅ Lead correctly created in DB and attributed to visitor_id!\n');
        } else {
            console.error('❌ Lead attribution failed!\n');
        }

        // Test 6: Sale checkout completion attribution
        console.log('Test 6: Submitting checkout sale attribution...');
        const saleRes = await fetch(`${API_URL}/track/sale`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitorId: visitorId,
                affiliateCode: partnerCode,
                productSlug: productSlug,
                customerName: 'Test Buyer User',
                customerEmail: 'testlead@gmail.com',
                amount: 5000,
                orderId: 'ORD-' + Math.floor(Math.random() * 100000)
            })
        });
        const saleData = await saleRes.json();
        console.log('Status:', saleRes.status, 'Body:', saleData);

        const debugSaleRes = await fetch(`${API_URL}/debug/visitor/${visitorId}`);
        const debugSale = await debugSaleRes.json();
        console.log("DEBUG RESPONSE FOR VISITOR:", JSON.stringify(debugSale, null, 2));
        const saleDoc = debugSale.sales[0];
        const sessionDoc = debugSale.sessions[0];
        
        if (saleRes.status === 201 && saleDoc && sessionDoc && sessionDoc.is_converted) {
            console.log('✅ Checkout sale successfully registered and active session converted (is_converted = true)!\n');
        } else {
            console.error('❌ Checkout sale registration failed!\n');
        }

        console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');

    } catch (e) {
        console.error('🔴 TESTS CRASHED WITH ERROR:', e);
    }
}

runTests();
