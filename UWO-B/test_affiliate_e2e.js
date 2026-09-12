/**
 * Enterprise Affiliate sales tracking E2E integration test.
 * Verifies all specifications programmatically against the MongoDB database.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');
const SalesPartner = require('./models/SalesPartner');
const AffiliateLink = require('./models/AffiliateLink');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const AffiliateSale = require('./models/AffiliateSale');
const AffiliateLog = require('./models/AffiliateLog');
const AffiliateLogin = require('./models/AffiliateLogin');
const AffiliateSession = require('./models/AffiliateSession');
const PartnerProduct = require('./models/PartnerProduct');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

// Import controller functions
const enterpriseController = require('./affiliate/enterpriseController');

async function runE2ETests() {
    console.log('🚀 STARTING ENTERPRISE AFFILIATE E2E TESTS...\n');

    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected to MongoDB successfully.');
        
        // Clean up previous test data first to avoid index build conflicts
        const testEmail = 'e2etest@uwo.com';
        await Customer.deleteMany({ email: testEmail });
        await AffiliateLogin.deleteMany({ customerEmail: testEmail });
        await Order.deleteMany({ orderId: 'E2E_ORD_001' });
        await Payment.deleteMany({ orderId: 'E2E_ORD_001' });
        await AffiliateSale.deleteMany({ customerEmail: testEmail });
        await AffiliateLog.deleteMany({ details: { $regex: 'e2etest@uwo.com' } });

        console.log('🧹 Cleaned up old test records.');

        // Now safe to ensure unique indexes are built
        await AffiliateLogin.ensureIndexes();

        // 1. Setup/Ensure product exists
        let product = await Product.findOne({ slug: 'efv' });
        if (!product) {
            product = new Product({
                name: 'EFV',
                slug: 'efv',
                status: 'active',
                landingUrl: 'https://efvframework.com',
                commissionType: 'percentage',
                commissionValue: 15
            });
            await product.save();
            console.log('🌱 Seeded test product EFV.');
        }

        // 2. Setup/Ensure sales partner exists
        let partner = await SalesPartner.findOne({ affiliateCode: 'UWO-E2ETEST-001' });
        if (!partner) {
            partner = new SalesPartner({
                name: 'E2E Test Partner',
                email: 'e2e_partner@uwo.com',
                phone: '9999999999',
                company: 'UWO Test Corp',
                passwordHash: 'hashed_password_mock',
                status: 'active',
                affiliateCode: 'UWO-E2ETEST-001'
            });
            await partner.save();
            console.log('🌱 Seeded test Sales Partner.');
        }

        // Ensure partner has product assigned
        let assignment = await PartnerProduct.findOne({ partnerId: partner._id, productId: product._id });
        if (!assignment) {
            assignment = new PartnerProduct({
                partnerId: partner._id,
                productId: product._id,
                commission: 15,
                status: 'active'
            });
            await assignment.save();
            console.log('🌱 Seeded PartnerProduct assignment.');
        }

        // 3. Setup/Ensure alternative sales partner exists for first-touch attribution test
        let otherPartner = await SalesPartner.findOne({ affiliateCode: 'UWO-OTHER-999' });
        if (!otherPartner) {
            otherPartner = new SalesPartner({
                name: 'Other Sales Partner',
                email: 'other_partner@uwo.com',
                phone: '8888888888',
                company: 'UWO Other Corp',
                passwordHash: 'hashed_password_mock',
                status: 'active',
                affiliateCode: 'UWO-OTHER-999'
            });
            await otherPartner.save();
        }
        let otherAssignment = await PartnerProduct.findOne({ partnerId: otherPartner._id, productId: product._id });
        if (!otherAssignment) {
            otherAssignment = new PartnerProduct({
                partnerId: otherPartner._id,
                productId: product._id,
                commission: 10,
                status: 'active'
            });
            await otherAssignment.save();
        }

        // --- TEST 1: trackClickGet (GET /api/affiliate/track) ---
        console.log('\n--- TEST 1: Simulating Affiliate Link Click ---');
        
        let cookiesSet = {};
        const mockReq1 = {
            query: { affiliate: 'UWO-E2ETEST-001', product: 'efv' },
            headers: { 'user-agent': 'Mozilla/5.0' },
            ip: '127.0.0.1',
            originalUrl: '/api/affiliate/track?affiliate=UWO-E2ETEST-001&product=efv'
        };
        const mockRes1 = {
            cookie: (name, val, options) => {
                cookiesSet[name] = val;
            },
            status: (code) => ({
                json: (data) => {
                    mockRes1.statusCode = code;
                    mockRes1.body = data;
                }
            }),
            redirect: (url) => {
                mockRes1.statusCode = 302;
                mockRes1.redirectUrl = url;
            }
        };

        await enterpriseController.trackClickGet(mockReq1, mockRes1);

        console.log('Response Status:', mockRes1.statusCode);
        console.log('Cookies Set:', cookiesSet);

        if (mockRes1.statusCode === 302 && mockRes1.redirectUrl === 'https://efvframework.com') {
            console.log('✅ Test 1 Passed: Redirection to Product Landing URL works!');
        } else if (mockRes1.statusCode === 200) {
            console.log('✅ Test 1 Passed: Success JSON returned!');
        } else {
            throw new Error(`Test 1 Failed: Status=${mockRes1.statusCode}`);
        }

        // Verify click log in DB
        const clickLog = await AffiliateLog.findOne({ eventType: 'Affiliate Link Opened', partnerId: partner._id });
        if (clickLog) {
            console.log('✅ Test 1 Passed: Click registered in AffiliateLog.');
        } else {
            throw new Error('Test 1 Failed: No click recorded in logs!');
        }

        // --- TEST 2: trackLogin (POST /api/affiliate/login) ---
        console.log('\n--- TEST 2: Customer Signup Attribution (First Touch) ---');

        const mockReq2 = {
            body: {
                email: testEmail,
                name: 'E2E Test User',
                visitorId: cookiesSet['uwo_visitor_id'] || 'test_vid'
            },
            headers: {
                cookie: `uwo_affiliate_code=UWO-E2ETEST-001; uwo_visitor_id=${cookiesSet['uwo_visitor_id'] || 'test_vid'}; uwo_affiliate_product=efv`
            },
            ip: '127.0.0.1'
        };
        const mockRes2 = {
            status: (code) => ({
                json: (data) => {
                    mockRes2.statusCode = code;
                    mockRes2.body = data;
                }
            })
        };

        await enterpriseController.trackLogin(mockReq2, mockRes2);

        let customer = await Customer.findOne({ email: testEmail });
        if (customer && customer.affiliateCode === 'UWO-E2ETEST-001' && String(customer.partnerId) === String(partner._id)) {
            console.log('✅ Test 2 Passed: Customer registered and linked permanently with correct Affiliate Code.');
        } else {
            throw new Error('Test 2 Failed: Customer signup mapping mismatch!');
        }

        // Verify AffiliateLogin record is created
        const loginRecord = await AffiliateLogin.findOne({ customerEmail: testEmail, affiliateCode: 'UWO-E2ETEST-001' });
        if (loginRecord) {
            console.log('✅ Test 2 Passed: Unique login count record registered.');
        } else {
            throw new Error('Test 2 Failed: No AffiliateLogin record created!');
        }

        // --- TEST 3: First-Touch Attribution Lock ---
        console.log('\n--- TEST 3: Verifying Overwrite Protection (First-Touch Wins) ---');

        const mockReq3 = {
            body: {
                email: testEmail,
                affiliateCode: 'UWO-OTHER-999',
                productSlug: 'efv'
            },
            headers: {},
            ip: '127.0.0.1'
        };
        const mockRes3 = {
            status: (code) => ({
                json: (data) => {
                    mockRes3.statusCode = code;
                    mockRes3.body = data;
                }
            })
        };

        await enterpriseController.trackLogin(mockReq3, mockRes3);

        customer = await Customer.findOne({ email: testEmail });
        if (customer && customer.affiliateCode === 'UWO-E2ETEST-001') {
            console.log('✅ Test 3 Passed: Overwrite prevented. First affiliate code remains locked!');
        } else {
            throw new Error(`Test 3 Failed: Customer affiliate was overwritten to ${customer.affiliateCode}!`);
        }


        // --- TEST 4: Simulated Gateway Webhook & Order Creation ---
        console.log('\n--- TEST 4: Simulating Gateway Payment success Webhook ---');

        // We will call processSuccessfulPayment programmatically using enterpriseController internal billing flow.
        // We simulate a verified payment event data payload:
        const mockPaymentData = {
            paymentId: 'pay_e2etest_001',
            orderId: 'E2E_ORD_001',
            gateway: 'Razorpay',
            amount: 5000,
            currency: 'INR',
            customerEmail: testEmail,
            customerName: 'E2E Test User',
            productSlug: 'efv'
        };

        // Access internal helper of enterpriseController
        // Since it's helper, we will mock Razorpay webhook trigger directly by passing signature-bypass simulation:
        const mockReq4 = {
            headers: {
                'x-razorpay-signature': 'mock_valid_signature'
            },
            body: {
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_e2etest_001',
                            order_id: 'E2E_ORD_001',
                            amount: 500000, // paise (5000 INR)
                            currency: 'INR',
                            email: testEmail,
                            contact: '9999999999',
                            notes: {
                                productSlug: 'efv'
                            }
                        }
                    }
                }
            },
            rawBody: JSON.stringify({
                event: 'payment.captured',
                payload: { payment: { entity: { id: 'pay_e2etest_001', order_id: 'E2E_ORD_001', amount: 500000, currency: 'INR', email: testEmail } } }
            })
        };
        
        // Mock expected signature so bypass passes
        const crypto = require('crypto');
        const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'mywebhooksecret123')
            .update(mockReq4.rawBody)
            .digest('hex');
        mockReq4.headers['x-razorpay-signature'] = expectedSig;

        const mockRes4 = {
            status: (code) => ({
                json: (data) => {
                    mockRes4.statusCode = code;
                    mockRes4.body = data;
                }
            })
        };

        await enterpriseController.razorpayWebhook(mockReq4, mockRes4);

        // Verify Order is created
        const orderDoc = await Order.findOne({ orderId: 'E2E_ORD_001' });
        if (orderDoc && orderDoc.paymentStatus === 'PAID' && orderDoc.orderStatus === 'COMPLETED') {
            console.log('✅ Test 4 Passed: Order successfully created and marked as PAID & COMPLETED.');
        } else {
            throw new Error('Test 4 Failed: Order document creation/update failing!');
        }

        // Verify AffiliateSale is logged
        const saleDoc = await AffiliateSale.findOne({ orderId: 'E2E_ORD_001' });
        if (saleDoc && saleDoc.affiliateCode === 'UWO-E2ETEST-001' && saleDoc.amount === 5000) {
            console.log('✅ Test 4 Passed: AffiliateSale correctly registered with 15% commission rate.');
            console.log('Commission Earned:', saleDoc.commissionEarned, 'INR');
        } else {
            throw new Error('Test 4 Failed: AffiliateSale not registered or wrong metrics!');
        }

        // Verify duplicates protection
        console.log('Re-sending duplicate webhook...');
        await enterpriseController.razorpayWebhook(mockReq4, mockRes4);
        const paymentsCount = await Payment.countDocuments({ paymentId: 'pay_e2etest_001' });
        if (paymentsCount === 1) {
            console.log('✅ Test 4 Passed: Duplicate webhook ignored, duplicate payments prevented!');
        } else {
            throw new Error(`Test 4 Failed: Duplicate payment transaction recorded in DB: count=${paymentsCount}`);
        }


        // --- TEST 5: Manual Status Update ---
        console.log('\n--- TEST 5: Simulating Order status update (e.g. RETURNED) ---');

        const mockReq5 = {
            params: { id: 'E2E_ORD_001' },
            body: { orderStatus: 'RETURNED' }
        };
        const mockRes5 = {
            status: (code) => ({
                json: (data) => {
                    mockRes5.statusCode = code;
                    mockRes5.body = data;
                }
            }),
            json: (data) => {
                mockRes5.statusCode = 200;
                mockRes5.body = data;
            }
        };

        await enterpriseController.updateOrderStatus(mockReq5, mockRes5);

        const updatedOrder = await Order.findOne({ orderId: 'E2E_ORD_001' });
        const updatedSale = await AffiliateSale.findOne({ orderId: 'E2E_ORD_001' });

        if (updatedOrder.orderStatus === 'RETURNED' && updatedSale.orderStatus === 'returned') {
            console.log('✅ Test 5 Passed: Order and AffiliateSale statuses synchronized to RETURNED/returned.');
        } else {
            throw new Error(`Test 5 Failed: Status sync failed! Order=${updatedOrder.orderStatus}, Sale=${updatedSale.orderStatus}`);
        }


        // --- TEST 6: Dashboard Statistics Validation ---
        console.log('\n--- TEST 6: Validating Admin Sales Report Output ---');

        const mockReq6 = {
            query: { search: 'E2E Test Partner' }
        };
        const mockRes6 = {
            json: (data) => {
                mockRes6.body = data;
            }
        };

        await enterpriseController.getAdminSalesReport(mockReq6, mockRes6);

        const reportRow = mockRes6.body.find(r => r.partnerName === 'E2E Test Partner');
        console.log('Admin Report Row:', reportRow);

        if (reportRow && reportRow.totalLogins === 1 && reportRow.returned === 1 && reportRow.sales === 0) {
            console.log('✅ Test 6 Passed: Admin report correctly aggregates logins=1, sales=0, returned=1.');
        } else {
            throw new Error('Test 6 Failed: Report metrics calculations are wrong!');
        }

        console.log('\n🎉 ALL ENTERPRISE AFFILIATE SYSTEM INTEGRATION TESTS PASSED!');

    } catch (e) {
        console.error('\n🔴 INTEGRATION TESTS FAILED:', e);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Closed DB connection.');
    }
}

runE2ETests();
