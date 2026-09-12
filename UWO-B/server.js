const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Contact = require('./models/Contact');
const Website = require('./models/Website');
const Subscriber = require('./models/Subscriber');
const ChatLog = require('./models/ChatLog');
const Document = require('./models/Document');
const Blog = require('./models/Blog');
const Category = require('./models/Category');
const Settings = require('./models/Settings');
const LegalPage = require('./models/LegalPage');
const LegalPageVersion = require('./models/LegalPageVersion');
const AuditLog = require('./models/AuditLog');
const TeamMember = require('./models/TeamMember');
const Project = require('./models/Project');
const Product = require('./models/Product');
const SalesPartner = require('./models/SalesPartner');
const ReferralSubmission = require('./models/ReferralSubmission');
const affiliateRouter = require('./affiliate/routes');
const sanitizeHtml = require('sanitize-html');

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const dns = require('dns');
const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');
const { franc } = require('franc-min');
const knowledgeBase = require('./knowledge_base');

// Force DNS to use Google servers locally to fix Windows ISP MongoDB Atlas SRV lookup issue (skip on GCP Cloud Run)
if (!process.env.K_SERVICE) {
    try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
    } catch (e) {}
}

const app = express();
app.set('trust proxy', true); // Trust GCP Load Balancer
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Affiliate Context Middleware
const { attachAffiliateContext } = require('./affiliate/middleware');
app.use(attachAffiliateContext);

// Log all incoming requests for debugging purposes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health Check Route
app.get('/api', (req, res) => {
    res.send('<h2>UWO Backend is Active and Running</h2><p>Server connected securely to MongoDB & Vertex AI.</p>');
});

// Affiliate Module Router Mount with live reloading
app.use('/api/affiliate', (req, res, next) => {
    try { delete require.cache[require.resolve('./affiliate/routes')]; } catch (e) { }
    return require('./affiliate/routes')(req, res, next);
});
app.use('/affiliate', (req, res, next) => {
    try { delete require.cache[require.resolve('./affiliate/routes')]; } catch (e) { }
    return require('./affiliate/routes')(req, res, next);
});

// Enterprise Webhook & Orders Admin endpoints
const enterpriseController = require('./affiliate/enterpriseController');
const { authAdmin } = require('./affiliate/middleware');
app.post('/api/webhooks/razorpay', enterpriseController.razorpayWebhook);
app.post('/api/webhooks/cashfree', enterpriseController.cashfreeWebhook);
app.get('/api/admin/sales-report', authAdmin, enterpriseController.getAdminSalesReport);
app.put('/api/orders/:id/status', authAdmin, enterpriseController.updateOrderStatus);

// MongoDB Connection with enhanced error handling for Cloud Run
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';
console.log('🚀 Attempting to connect to MongoDB URI:', MONGO_URI.replace(/:[^@]+@/, ":****@"));

const mongoConnectOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    maxPoolSize: 10,
    retryWrites: true,
};

async function connectWithRetry(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(MONGO_URI, mongoConnectOptions);
            console.log('✅ MongoDB Connected successfully');
            await seedLegalPages();
            await seedProducts();
            await seedAdminUsers();
            return;
        } catch (err) {
            console.error(`❌ MongoDB Connection attempt ${i + 1} failed:`, err.message);
            if (i < retries - 1) {
                const delay = Math.pow(2, i) * 1000;
                console.log(`⏳ Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.log('⚠️ All MongoDB connection attempts failed. Server running with limited DB access.');
}

connectWithRetry();

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
    setTimeout(() => connectWithRetry(3), 5000);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});


async function seedProducts() {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            console.log('🌱 Seeding default products...');
            const defaultProducts = [
                { name: 'AISA', slug: 'aisa', status: 'active', landingUrl: 'https://uwo24.com/aisa', commissionType: 'percentage', commissionValue: 10 },
                { name: 'EFV', slug: 'efv', status: 'active', landingUrl: 'https://uwo24.com/efv', commissionType: 'percentage', commissionValue: 10 },
                { name: 'AISA CONNECT', slug: 'aisa-connect', status: 'active', landingUrl: 'https://uwo24.com/aisa-connect', commissionType: 'percentage', commissionValue: 10 },
                { name: 'AI LEGAL', slug: 'ai-legal', status: 'active', landingUrl: 'https://uwo24.com/ai-legal', commissionType: 'percentage', commissionValue: 10 }
            ];
            await Product.insertMany(defaultProducts);
            console.log('✅ Default products seeded successfully');
        }
    } catch (e) {
        console.error('❌ Error seeding default products:', e.message);
    }
}


async function seedLegalPages() {
    try {
        const count = await LegalPage.countDocuments();
        if (count === 0) {
            console.log('🌱 Seeding default legal pages...');

            const defaultPrivacy = {
                page_type: 'privacy',
                title: 'Privacy Policy',
                slug: 'privacy-policy',
                status: 'published',
                version: 1,
                seoTitle: 'Privacy Policy | UWO™',
                metaDescription: 'Read the Privacy Policy of Unified Web Options & Services Pvt. Ltd. (UWO™) to understand how we collect, use, and protect your information.',
                metaKeywords: 'privacy policy, UWO, privacy, data protection',
                robots: 'Index',
                content: `
      <h3>1. Introduction</h3>
      <p>UWO<sup>™</sup> (Unified Web Options & Services Pvt. Ltd.) operates AISA<sup>™</sup> and AI Mall<sup>™</sup> platforms. This Privacy Policy explains how we collect, use, and protect your information.</p>

      <h3>2. Information We Collect</h3>
      <p>We may collect:</p>
      <ul>
        <li>Personal Information (name, email, login details)</li>
        <li>Usage Data (interactions, queries, preferences)</li>
        <li>Technical Data (IP address, browser type, device info)</li>
      </ul>

      <h3>3. How We Use Your Information</h3>
      <p>We use data to:</p>
      <ul>
        <li>Provide and improve our services</li>
        <li>Personalize user experience</li>
        <li>Ensure security and prevent misuse</li>
        <li>Communicate updates and support</li>
      </ul>

      <h3>4. Data Sharing</h3>
      <p>We do not sell your personal data. Data may be shared with trusted third-party services (such as cloud providers, analytics tools) only for service operation.</p>

      <h3>5. Cookies</h3>
      <p>We use cookies to:</p>
      <ul>
        <li>Maintain sessions</li>
        <li>Improve performance</li>
        <li>Analyze usage</li>
      </ul>
      <p>Users can control cookies through browser settings.</p>

      <h3>6. Data Security</h3>
      <p>We implement industry-standard security measures including encryption and secure storage to protect your data.</p>

      <h3>7. User Rights</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Access your data</li>
        <li>Update or correct information</li>
        <li>Request deletion of your data</li>
      </ul>

      <h3>8. Data Retention</h3>
      <p>We retain data only as long as necessary for service operation or legal compliance.</p>

      <h3>9. Third-Party Services</h3>
      <p>Our platforms may use third-party integrations. We are not responsible for their privacy practices.</p>

      <h3>10. Changes to Policy</h3>
      <p>We may update this Privacy Policy. Continued use means acceptance of updates.</p>
                `
            };

            const defaultTerms = {
                page_type: 'terms',
                title: 'Terms & Conditions',
                slug: 'terms-and-conditions',
                status: 'published',
                version: 1,
                seoTitle: 'Terms & Conditions | UWO™',
                metaDescription: 'Read the Terms & Conditions of Unified Web Options & Services Pvt. Ltd. (UWO™) governing the use of AISA™ and AI Mall™.',
                metaKeywords: 'terms, conditions, terms of service, UWO, AISA, AI Mall',
                robots: 'Index',
                content: `
      <h3>1. Introduction</h3>
      <p>Welcome to UWO<sup>™</sup> (Unified Web Options & Services Pvt. Ltd.). UWO<sup>™</sup> is the parent company operating AI-based platforms including AISA<sup>™</sup> (AI Assistant Platform) and AI Mall<sup>™</sup> (AI Marketplace). By accessing or using our services, you agree to these Terms of Service.</p>

      <h3>2. Acceptance of Terms</h3>
      <p>By using our website, products, or services, you agree to comply with these terms. If you do not agree, please do not use our services.</p>

      <h3>3. Services Overview</h3>
      <p>UWO<sup>™</sup> provides digital platforms including:</p>
      <ul>
        <li>AISA<sup>™</sup>: AI-powered assistant for automation, legal, productivity, and analytics tasks.</li>
        <li>AI Mall<sup>™</sup>: A marketplace offering AI tools, integrations, and services.</li>
      </ul>

      <h3>4. User Responsibilities</h3>
      <p>You agree to:</p>
      <ul>
        <li>Provide accurate information</li>
        <li>Maintain account confidentiality</li>
        <li>Use services lawfully</li>
      </ul>

      <h3>5. Prohibited Activities</h3>
      <p>You may not:</p>
      <ul>
        <li>Use the platform for illegal purposes</li>
        <li>Attempt to hack, reverse engineer, or disrupt services</li>
        <li>Upload harmful or malicious content</li>
        <li>Violate intellectual property rights</li>
      </ul>

      <h3>6. Intellectual Property</h3>
      <p>All content, branding, and technology are owned by UWO<sup>™</sup> or its licensors. Unauthorized use is strictly prohibited.</p>

      <h3>7. AI Disclaimer</h3>
      <p>Our platforms use artificial intelligence. Outputs may not always be accurate or reliable. Users should verify important information before relying on it.</p>

      <h3>8. Limitation of Liability</h3>
      <p>UWO<sup>™</sup> is not liable for any damages, losses, or decisions made based on AI-generated content or use of our services.</p>

      <h3>9. Termination</h3>
      <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>

      <h3>10. Changes to Terms</h3>
      <p>We may update these Terms at any time. Continued use of services means you accept the updated terms.</p>
                `
            };

            const defaultCookies = {
                page_type: 'cookies',
                title: 'Cookies Policy',
                slug: 'cookies-policy',
                status: 'published',
                version: 1,
                seoTitle: 'Cookies Policy | UWO™',
                metaDescription: 'Read the Cookies Policy of UWO™ AISA™ platform to understand what cookies we use and how you can manage them.',
                metaKeywords: 'cookies policy, cookies, cookie preference, AISA, UWO',
                robots: 'Index',
                content: `
      <p>This Cookie Policy explains how AISA<sup>™</sup> uses cookies and similar technologies to enhance your experience. You can control cookie preferences anytime.</p>

      <h3>1. What Are Cookies?</h3>
      <ul>
        <li><strong>Definition:</strong> Small text files placed on your device when you visit AISA<sup>™</sup></li>
        <li><strong>Purpose:</strong> Recognize you and remember your preferences</li>
        <li><strong>Duration:</strong> Some expire when you close browser, others persist longer</li>
      </ul>

      <h3>2. Types of Cookies We Use</h3>
      <ul>
        <li><strong>Essential (Required):</strong> Authentication, session management, security</li>
        <li><strong>Preference:</strong> Language, theme (light/dark), notification settings</li>
        <li><strong>Analytics (Optional):</strong> Usage tracking with your consent to improve services</li>
        <li><strong>Functional:</strong> Chat history sync, AI agent selection, feature preferences</li>
      </ul>

      <h3>3. Local Storage & Session Storage</h3>
      <ul>
        <li><strong>Chat Sessions:</strong> Stored locally for quick access and offline capability</li>
        <li><strong>User Preferences:</strong> Settings like AI agent and interface customizations</li>
        <li><strong>Session Management:</strong> Active chat state, expires when browser closes</li>
        <li><strong>Data Control:</strong> Delete individual chats or clear all data anytime</li>
      </ul>

      <h3>4. Third-Party Cookies</h3>
      <ul>
        <li><strong>Analytics:</strong> Anonymized usage data to understand engagement</li>
        <li><strong>AI Providers:</strong> Secure query processing with encryption</li>
        <li><strong>Payment:</strong> Fraud prevention during transactions</li>
        <li><strong>Control:</strong> Review partner privacy policies for their practices</li>
      </ul>

      <h3>5. Your Cookie Choices</h3>
      <ul>
        <li><strong>Browser Controls:</strong> Block, delete, or get warnings about cookies</li>
        <li><strong>Opt-Out:</strong> Disable analytics from profile settings under Privacy & Data</li>
        <li><strong>Do Not Track:</strong> We respect DNT signals from your browser</li>
        <li><strong>Impact:</strong> Blocking may limit features like auto-login and preferences</li>
      </ul>

      <h3>Questions About Cookies?</h3>
      <p>Email: <a href="mailto:admin@uwo24.com" style="color: var(--primary); text-decoration: underline;">admin@uwo24.com</a></p>
      <p>Phone: <a href="tel:+918358990909" style="color: var(--primary); text-decoration: underline;">+91 83589 90909</a></p>
                `
            };

            const preparePage = (doc) => {
                doc.draftTitle = doc.title;
                doc.draftContent = doc.content;
                doc.draftSeoTitle = doc.seoTitle;
                doc.draftMetaDescription = doc.metaDescription;
                doc.draftMetaKeywords = doc.metaKeywords;
                doc.draftCanonicalUrl = doc.canonicalUrl || `https://uwo24.com/${doc.slug}`;
                doc.draftOpenGraphTitle = doc.openGraphTitle || doc.seoTitle;
                doc.draftOpenGraphDescription = doc.openGraphDescription || doc.metaDescription;
                doc.draftOpenGraphImage = doc.openGraphImage || '';
                doc.draftRobots = doc.robots || 'Index';
                return doc;
            };

            const privacyDoc = await LegalPage.create(preparePage(defaultPrivacy));
            const termsDoc = await LegalPage.create(preparePage(defaultTerms));
            const cookiesDoc = await LegalPage.create(preparePage(defaultCookies));

            // Also seed version history for initial values
            await LegalPageVersion.create({
                page_id: privacyDoc._id,
                page_type: 'privacy',
                title: privacyDoc.title,
                slug: privacyDoc.slug,
                content: privacyDoc.content,
                version: 1,
                seoTitle: privacyDoc.seoTitle,
                metaDescription: privacyDoc.metaDescription,
                metaKeywords: privacyDoc.metaKeywords,
                robots: privacyDoc.robots,
                notes: 'Initial Seeding'
            });

            await LegalPageVersion.create({
                page_id: termsDoc._id,
                page_type: 'terms',
                title: termsDoc.title,
                slug: termsDoc.slug,
                content: termsDoc.content,
                version: 1,
                seoTitle: termsDoc.seoTitle,
                metaDescription: termsDoc.metaDescription,
                metaKeywords: termsDoc.metaKeywords,
                robots: termsDoc.robots,
                notes: 'Initial Seeding'
            });

            await LegalPageVersion.create({
                page_id: cookiesDoc._id,
                page_type: 'cookies',
                title: cookiesDoc.title,
                slug: cookiesDoc.slug,
                content: cookiesDoc.content,
                version: 1,
                seoTitle: cookiesDoc.seoTitle,
                metaDescription: cookiesDoc.metaDescription,
                metaKeywords: cookiesDoc.metaKeywords,
                robots: cookiesDoc.robots,
                notes: 'Initial Seeding'
            });

            console.log('✅ Legal pages seeded successfully.');
        }
    } catch (e) {
        console.error('❌ Error seeding legal pages:', e.message);
    }
}

// Load Admin Credentials from .json file
const adminsPath = path.join(__dirname, '..', 'uwo', '.json');
let admins = [];

try {
    const data = fs.readFileSync(adminsPath, 'utf8');
    admins = JSON.parse(data);
    console.log('✅ Admin credentials loaded from .json');
} catch (err) {
    console.warn('⚠️ Could not load admin .json, using fallback credentials');
    admins = [{
        email: process.env.ADMIN_EMAIL || "admin@uwo24.com",
        password: process.env.ADMIN_PASSWORD || "uwo@1234"
    }];
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// --- Vertex AI Config ---
const project = process.env.GOOGLE_PROJECT_ID || process.env.GCP_PROJECT_ID || process.env.GCS_PROJECT_ID || 'unified-web-options';
const location = process.env.GOOGLE_LOCATION || 'asia-south1';

console.log(`✅ Google Cloud initializing with project: ${project}`);
console.log(`📍 Location: ${location}`);

let vertexAI = null;
let generativeModel = null;
try {
    vertexAI = new VertexAI({ project: project, location: location });
} catch (vErr) {
    console.warn('⚠️ Vertex AI init warning:', vErr.message);
}

// --- Google Cloud Storage Init ---
const storageService = require('./services/storageService');
const bucketName = storageService.bucketName;
const bucket = storageService.bucket;
console.log(`🪣 Using GCS Bucket: ${bucketName}`);

// Models
const MODEL_NAME = 'gemini-2.5-flash'; // User-defined version
const knowledgeText = knowledgeBase.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');

try {
    if (vertexAI) {
        generativeModel = vertexAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: `You are UWO™ AI — an advanced intelligent digital assistant designed to help users explore AI solutions, automation, and digital transformation. Your responses must feel Futuristic, Intelligent, Clean, and Premium.

━━━━━━━━━━━━━━━━━━━━━━━
⚠️ STRICT FORMAT RULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━

1. ALWAYS start with a short engaging paragraph (2–3 lines). No bullet points at the beginning. Make it feel smart and human-like.

2. Structure the response using short paragraphs, clean sections, and LIMITED bullet points.

3. Bullet Rules:
   → Max 3–4 bullets per section.
   → Max 1–2 bullet sections total.
   → NEVER a full bullet response.

4. Structure format:
   [Intro Paragraph]
   [Section or short explanation]
   • Key point  
   • Key point  
   [Another short paragraph / explanation]
   [Optional small bullet section]
   [Closing line CTA]

5. Highlight important keywords using **bold text**.
   Examples: **AI Automation**, **Smart Integration**, **Scalable Systems**, **Enterprise Intelligence**.
   Also wrap UWO™, AISA™, and AI Mall™ in **bold**.

6. Tone Guidelines:
   → Smart & confident with a slight futuristic vibe.
   → Professional but friendly.
   → No over-complex jargon.
   → Short, clear, and impactful sentences.

7. Maintain spacing:
   → No large text blocks.
   → Clean readable output.

8. Closing:
   Always end with an intelligent CTA like:
   "Would you like me to guide you through the best AI solutions for your needs?"
   OR
   "I can help you explore the right AI tools or integrations—just let me know."`
        });
        console.log(`✅ Vertex AI initialized successfully`);
        console.log(`🤖 Model: ${MODEL_NAME}`);
        console.log(`🆔 Project: ${project}`);
    }
} catch (mErr) {
    console.warn('⚠️ Vertex AI model init warning:', mErr.message);
}

// Log Cloudinary Status
console.log(`[INFO] [Cloudinary Config] Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set'}`);
console.log(`[INFO] [Cloudinary Config] API Key: ${process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set'}`);
console.log(`[INFO] [Cloudinary Config] API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set'}`);

// --- Language Detection Helper ---
const detectLanguage = (text) => {
    const lower = text.toLowerCase().trim();

    // 1. Manual Language Overrides (Highest Priority)
    if (lower.includes("marathi") || /[\u0900-\u097F]/.test(text) && (lower.includes("येथे") || lower.includes("कसे"))) return "Marathi";
    if (lower.includes("hindi")) return "Hindi";
    if (lower.includes("hinglish")) return "Hinglish";
    if (lower.includes("sanskrit")) return "Sanskrit";

    // 2. Clear script check for Devanagari (Default to Hindi)
    if (/[\u0900-\u097F]/.test(text)) return "Hindi";

    // 3. Hinglish Keywords Check
    const hinglishKeywords = ["hai", "kya", "nhi", "btao", "kaise", "sab", "toh", "ka", "ki", "ko", "kar", "ho", "tu", "teri", "mera"];
    const words = lower.split(/\W+/);
    if (hinglishKeywords.some(kw => words.includes(kw))) return "Hinglish";

    // Default to English - NEVER random languages
    return "English";
};

// Helper: Get Embeddings (Vertex AI textembedding-gecko@003)
// Middleware for JWT Verification
// Accepts both "Bearer <token>" and raw "<token>" formats
const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'No token, authorization denied' });

    // Strip "Bearer " prefix if present
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
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
        'legal.view', 'legal.manage'
    ],
    SALES_ADMIN: [
        'sales.view', 'sales.create', 'sales.edit', 'sales.analytics', 'sales.approve', 'sales.reject'
    ]
};

// Middleware to check permission
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ message: 'Unauthorized: No administrator token' });
        }

        const role = req.admin.role;
        const permissions = RolePermissions[role] || [];

        if (!permissions.includes(permission)) {
            return res.status(403).json({ message: 'Forbidden: Access Denied' });
        }
        next();
    };
};

// Seed initial Admin Users in the DB
async function seedAdminUsers() {
    try {
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');

        const initialUsers = [
            { name: 'Super Admin', email: 'admin@uwo.com', password: 'uwo@1234', role: 'SUPER_ADMIN' },
            { name: 'Aditi Sales Admin', email: 'aditi@uwo24.com', password: 'Aditi2004@', role: 'SALES_ADMIN' },
            { name: 'Abha Sales Admin', email: 'abha@uwo24.com', password: 'Abha2004@', role: 'SALES_ADMIN' }
        ];

        for (const u of initialUsers) {
            const exists = await User.findOne({ email: u.email.toLowerCase() });
            if (!exists) {
                const hash = await bcrypt.hash(u.password, 10);
                const newUser = new User({
                    name: u.name,
                    email: u.email,
                    passwordHash: hash,
                    role: u.role,
                    status: 'active'
                });
                await newUser.save();
                console.log(`👤 Seeded admin user: ${u.email} (${u.role})`);
            }
        }
    } catch (err) {
        console.error("⚠️ Failed to seed admin users:", err);
    }
}


// Helper function to send notification to Admin
const sendAdminNotification = async (data) => {
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
        }
    });

    const adminMailOptions = {
        from: `"UWO System" <${process.env.EMAIL_USER}>`,
        to: 'admin@uwo24.com',
        subject: `New Lead: ${data.source || 'Contact Form'} Submission`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-top: 5px solid #162377;">
                <h2 style="color: #162377;">New ${data.source || 'Contact Form'} Submission</h2>
                <p><strong>Name:</strong> ${data.name || 'Not provided'}</p>
                <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
                <p><strong>Purpose:</strong> ${data.purpose || 'Not specified'}</p>
                <hr>
                <p><strong>Message:</strong></p>
                <p style="background: #f4f4f4; padding: 15px; border-radius: 5px;">${data.message || 'No message content'}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">This is an automated notification from your UWO website backend.</p>
            </div>
        `
    };

    try {
        console.log(`📤 Attempting to notify admin for lead: ${data.email} (${data.source || 'Contact Form'})`);
        const info = await transporter.sendMail(adminMailOptions);
        console.log('✅ Admin notified successfully: ' + info.response);
    } catch (err) {
        console.error('❌ Failed to notify admin via email:', err);
    }
};

// Helper function to send notification to Super Admin Webhook
const sendWebhookNotification = async (data) => {
    let webhookUrl = process.env.SUPER_ADMIN_WEBHOOK_URL;
    try {
        const settings = await Settings.findOne({ key: 'webhookUrl' });
        if (settings && settings.value) {
            webhookUrl = settings.value;
        }
    } catch (err) {
        console.error('⚠️ Could not fetch webhookUrl from DB:', err.message);
    }

    if (!webhookUrl) return;

    try {
        console.log(`📤 Attempting to send webhook for lead: ${data.email}`);
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-platform-id': 'uwo24-id',
                'x-api-key': 'uwo-api-key'
            },
            body: JSON.stringify({
                eventType: 'new_lead',
                data: {
                    source: data.source || 'UWO',
                    name: data.name,
                    email: data.email,
                    message: data.message || '',
                    purpose: data.purpose || ''
                }
            })
        });

        if (response.ok) {
            console.log('✅ Webhook sent successfully');
        } else {
            console.error('⚠️ Webhook returned status:', response.status);
        }
    } catch (err) {
        console.error('❌ Failed to send webhook:', err.message);
    }
};

// --- ADMIN SETTINGS ROUTES ---
app.get('/api/admin/settings', auth, checkPermission('settings.view'), async (req, res) => {
    try {
        const webhookSetting = await Settings.findOne({ key: 'webhookUrl' });
        const expirySetting = await Settings.findOne({ key: 'affiliate_session_expiry' });
        res.json({
            webhookUrl: webhookSetting ? webhookSetting.value : '',
            affiliateSessionExpiry: expirySetting && !isNaN(expirySetting.value) ? Number(expirySetting.value) : 24
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/settings', auth, checkPermission('settings.edit'), async (req, res) => {
    try {
        const { webhookUrl, affiliateSessionExpiry } = req.body;

        if (webhookUrl !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'webhookUrl' },
                { value: webhookUrl || '' },
                { upsert: true, new: true }
            );
        }

        if (affiliateSessionExpiry !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'affiliate_session_expiry' },
                { value: String(affiliateSessionExpiry) },
                { upsert: true, new: true }
            );
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EXTERNAL WEBHOOK RECEIVER ---
app.post('/api/webhook/receive', async (req, res) => {
    // 1. Authenticate request
    const platformId = req.headers['x-platform-id'];
    const apiKey = req.headers['x-api-key'];

    if (platformId !== 'uwo24-id' || apiKey !== 'uwo-api-key') {
        return res.status(401).json({ error: 'Unauthorized webhook request' });
    }

    try {
        const { eventType, data } = req.body;

        if (eventType === 'new_lead') {
            // Save to Contact model so it shows up in Admin dashboard
            const newContact = new Contact({
                name: data.name || 'Incoming Webhook User',
                email: data.email || 'no-email-provided@webhook.com',
                message: data.message || 'Data received from external webhook',
                purpose: data.purpose || 'External Webhook Lead',
                source: data.source || 'External Webhook'
            });
            await newContact.save();

            console.log(`✅ Webhook data received and saved from ${data.source}`);
            return res.status(200).json({ message: 'Webhook received and processed successfully' });
        }

        if (eventType === 'payment_success') {
            // Track Affiliate Sale if applicable
            try {
                const affiliateCode = data.affiliateCode || (req.affiliate && req.affiliate.code);
                if (affiliateCode) {
                    const { trackSale } = require('./affiliate/tracking');
                    const productSlug = data.productSlug || 'general';
                    const sale = await trackSale(affiliateCode, productSlug, {
                        orderId: data.orderId || `ord_${Date.now()}`,
                        customerName: data.name || data.customerName,
                        customerEmail: data.email || data.customerEmail,
                        amount: data.amount,
                        currency: data.currency || 'INR',
                        paymentStatus: 'paid',
                        transactionId: data.transactionId || '',
                        visitorId: data.visitorId || (req.affiliate && req.affiliate.visitorId)
                    });

                    // Update Sales Partner Wallet (Earnings)
                    if (sale) {
                        const SalesPartner = require('./models/SalesPartner');
                        await SalesPartner.findByIdAndUpdate(sale.partnerId, {
                            $inc: { totalEarnings: sale.commissionEarned, unpaidEarnings: sale.commissionEarned }
                        });
                        console.log(`✅ Affiliate Sale Tracked and Wallet Updated for ${affiliateCode}`);
                    }
                }
            } catch (saleErr) {
                console.error('⚠️ Affiliate Sale tracking error in webhook:', saleErr.message);
            }
            return res.status(200).json({ message: 'Payment webhook processed successfully' });
        }

        return res.status(400).json({ error: 'Unknown event type' });
    } catch (err) {
        console.error('❌ Error processing incoming webhook:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- RAZORPAY WEBHOOK RECEIVER ---
app.post('/api/webhook/razorpay', async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (!secret) {
            console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET is not set in .env');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }
        if (!signature) {
            return res.status(401).json({ error: 'Missing Razorpay signature' });
        }

        // Verify Signature using crypto
        const expectedSignature = crypto.createHmac('sha256', secret)
            .update(req.rawBody || JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('❌ Invalid Razorpay Webhook Signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const { event, payload } = req.body;
        console.log(`✅ Razorpay Webhook received event: ${event}`);

        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payment ? payload.payment.entity : (payload.order ? payload.order.entity : null);

            if (paymentEntity) {
                // Extract affiliate details from notes
                const notes = paymentEntity.notes || {};
                const affiliateCode = notes.affiliateCode || '';
                const visitorId = notes.visitorId || '';
                const productSlug = notes.productSlug || 'general';

                if (affiliateCode) {
                    const { trackSale } = require('./affiliate/tracking');
                    // Amount from Razorpay is in paise (e.g. 100000 = Rs 1000)
                    const amountInRupees = paymentEntity.amount / 100;
                    const orderId = paymentEntity.order_id || paymentEntity.id;

                    const AffiliateSale = require('./models/AffiliateSale');
                    // Prevent double processing if webhook is called multiple times
                    const existingSale = await AffiliateSale.findOne({ orderId: orderId });

                    if (!existingSale) {
                        const sale = await trackSale(affiliateCode, productSlug, {
                            orderId: orderId,
                            customerName: notes.customerName || paymentEntity.email || 'Razorpay Customer',
                            customerEmail: paymentEntity.email,
                            amount: amountInRupees,
                            currency: paymentEntity.currency || 'INR',
                            paymentStatus: 'paid',
                            transactionId: paymentEntity.id,
                            visitorId: visitorId
                        });

                        // Update Sales Partner Wallet (Earnings)
                        if (sale) {
                            const SalesPartner = require('./models/SalesPartner');
                            await SalesPartner.findByIdAndUpdate(sale.partnerId, {
                                $inc: { totalEarnings: sale.commissionEarned, unpaidEarnings: sale.commissionEarned }
                            });
                            console.log(`✅ Affiliate Sale Tracked via Razorpay Webhook for ${affiliateCode}`);
                        }
                    } else {
                        console.log(`ℹ️ Razorpay Sale already tracked for order ${orderId}`);
                    }
                }
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('❌ Error processing Razorpay webhook:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- RAG (Document Handling) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
        cb(null, './uploads');
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- Subscription Pricing Documents ---
app.get('/api/admin/pricing-docs', authAdmin, checkPermission('legal.view'), async (req, res) => {
    try {
        const settings = await Settings.find({ key: { $regex: /^pricing_sections_/ } });
        const docs = {};
        settings.forEach(s => docs[s.key] = s.value);
        res.json(docs);
    } catch (err) {
        console.error("❌ Fetch Pricing Docs Error:", err);
        res.status(500).json({ message: "Server Error fetching pricing docs" });
    }
});

app.post('/api/admin/pricing-docs/sections', authAdmin, checkPermission('legal.manage'), async (req, res) => {
    try {
        const { planKey, sections } = req.body;
        if (!planKey || !Array.isArray(sections)) {
            return res.status(400).json({ message: "planKey and sections array required" });
        }
        const keyName = `pricing_sections_${planKey}`;
        await Settings.findOneAndUpdate(
            { key: keyName },
            { key: keyName, value: JSON.stringify(sections) },
            { upsert: true, new: true }
        );
        res.json({ message: "Sections saved successfully!" });
    } catch (err) {
        console.error("❌ Pricing Sections Save Error:", err);
        res.status(500).json({ message: "Server Error saving sections" });
    }
});

app.get('/api/public/pricing-docs/:planKey', async (req, res) => {
    try {
        const { planKey } = req.params;
        
        let sectionsKey = `pricing_sections_${planKey}`;
        let metaKey = `pricing_meta_${planKey}`;

        // Ensure PDF actually exists before returning any sections (consistent with Admin Portal)
        let metaSetting = await Settings.findOne({ key: metaKey });
        if (!metaSetting || !metaSetting.value) {
            let fallbackPlanKey;
            if (planKey.startsWith('wa_')) {
                fallbackPlanKey = planKey.replace('wa_', 'ac_');
            } else if (planKey.startsWith('ac_')) {
                fallbackPlanKey = planKey.replace('ac_', 'wa_');
            }
            if (fallbackPlanKey) {
                metaKey = `pricing_meta_${fallbackPlanKey}`;
                sectionsKey = `pricing_sections_${fallbackPlanKey}`;
                metaSetting = await Settings.findOne({ key: metaKey });
            }
            if (!metaSetting || !metaSetting.value) {
                return res.status(404).json({ message: "Agreement unavailable for this plan" });
            }
        }
        
        const url = `/api/public/pricing-docs/${planKey}/view`;
        let sections = null;

        const setting = await Settings.findOne({ key: sectionsKey });
        if (setting && setting.value) {
            try {
                sections = JSON.parse(setting.value);
            } catch(e) {}
        }

        res.json({ sections: sections || [], url });
    } catch (err) {
        console.error("Public Pricing Docs Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

app.get('/api/public/pricing-docs/:planKey/view', async (req, res) => {
    try {
        const { planKey } = req.params;
        const keyName = `pricing_doc_${planKey}`;
        let setting = await Settings.findOne({ key: keyName });
        if (!setting || !setting.value) {
            let fallbackKeyName;
            if (planKey.startsWith('wa_')) {
                fallbackKeyName = `pricing_doc_${planKey.replace('wa_', 'ac_')}`;
            } else if (planKey.startsWith('ac_')) {
                fallbackKeyName = `pricing_doc_${planKey.replace('ac_', 'wa_')}`;
            }
            if (fallbackKeyName) {
                setting = await Settings.findOne({ key: fallbackKeyName });
            }
            if (!setting || !setting.value) {
                return res.status(404).send('Document not found');
            }
        }
        
        if (setting.value.startsWith('/uploads/')) {
            const localPath = path.join(__dirname, setting.value);
            if (fs.existsSync(localPath)) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="Service_Agreement.pdf"');
                return res.sendFile(localPath);
            }
            return res.status(404).send('Document not found locally');
        }

        const storageService = require('./services/storageService');
        if (!storageService.bucket) {
            return res.status(500).send('Storage service unavailable');
        }

        const objectPath = storageService.extractObjectPath(setting.value);
        if (!objectPath) return res.status(404).send('Invalid document path');

        const file = storageService.bucket.file(objectPath);
        const [exists] = await file.exists();
        if (!exists) return res.status(404).send('Document does not exist in storage');

        const [metadata] = await file.getMetadata();
        res.setHeader('Content-Type', metadata.contentType || 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="Service_Agreement.pdf"');
        
        file.createReadStream().pipe(res).on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                res.status(500).end();
            }
        });
    } catch (err) {
        console.error("❌ Document stream error:", err);
        res.status(500).send("Server Error reading document");
    }
});

app.post('/api/public/pricing-docs/:planKey/email', async (req, res) => {
    try {
        const { planKey } = req.params;
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const keyName = `pricing_doc_${planKey}`;
        let setting = await Settings.findOne({ key: keyName });
        if (!setting || !setting.value) {
            let fallbackKeyName;
            if (planKey.startsWith('wa_')) {
                fallbackKeyName = `pricing_doc_${planKey.replace('wa_', 'ac_')}`;
            } else if (planKey.startsWith('ac_')) {
                fallbackKeyName = `pricing_doc_${planKey.replace('ac_', 'wa_')}`;
            }
            if (fallbackKeyName) {
                setting = await Settings.findOne({ key: fallbackKeyName });
            }
            if (!setting || !setting.value) {
                return res.status(404).json({ message: "Document not found" });
            }
        }
        
        let fileBuffer;
        if (setting.value.startsWith('/uploads/')) {
            const localPath = path.join(__dirname, setting.value);
            if (!fs.existsSync(localPath)) return res.status(404).json({ message: "Document not found locally" });
            fileBuffer = fs.readFileSync(localPath);
        } else {
            const storageService = require('./services/storageService');
            if (!storageService.bucket) {
                return res.status(500).json({ message: "Storage service unavailable" });
            }

            const objectPath = storageService.extractObjectPath(setting.value);
            if (!objectPath) return res.status(404).json({ message: "Invalid document path" });

            const file = storageService.bucket.file(objectPath);
            const [exists] = await file.exists();
            if (!exists) return res.status(404).json({ message: "Document does not exist in storage" });

            [fileBuffer] = await file.download();
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
            }
        });

        await transporter.sendMail({
            from: `"AISA Connect" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your AISA Connect Service Agreement",
            text: `Hello,\n\nPlease find attached your AISA Connect Service Agreement.\n\nIMPORTANT: It is mandatory to fill out the following form. All future work and setup will be done based strictly on the information provided in this form.\n\nForm Link: https://docs.google.com/spreadsheets/d/113SOBqkdmgCaaXs8W0UUCj349ktooHdkEXHkkz5xVBE/edit?resourcekey=&gid=1094037838#gid=1094037838\n\nBest regards,\nAISA Connect Team`,
            html: `
                <p>Hello,</p>
                <p>Please find attached your AISA Connect Service Agreement.</p>
                <p><strong>IMPORTANT:</strong> It is <strong>mandatory</strong> to fill out the following form. All future work and setup will be done based strictly on the information provided in this form.</p>
                <p>👉 <a href="https://docs.google.com/spreadsheets/d/113SOBqkdmgCaaXs8W0UUCj349ktooHdkEXHkkz5xVBE/edit?resourcekey=&gid=1094037838#gid=1094037838">Click here to fill out the mandatory form</a></p>
                <p>Best regards,<br>AISA Connect Team</p>
            `,
            attachments: [
                {
                    filename: 'Service_Agreement.pdf',
                    content: fileBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        res.json({ message: "Agreement sent successfully" });
    } catch (err) {
        console.error("❌ Error emailing document:", err);
        res.status(500).json({ message: "Server Error emailing document" });
    }
});

app.post('/api/admin/upload-pricing-doc/:planKey', upload.single('document'), async (req, res) => {
    try {
        const { planKey } = req.params;
        if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });
        if (req.file.mimetype !== 'application/pdf') {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Only PDF files are supported" });
        }

        const filePath = req.file.path;
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        const text = pdfData.text;

        // Parse sections from text
        const sections = [];
        const lines = text.split('\n');
        let currentSection = null;
        let currentContent = [];
        let preamble = [];
        let inPreamble = true;
        const sectionRegex = /^\s*(\d+)\.\s+(.*)$/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(sectionRegex);
            // Check if it's a heading (less than 150 chars usually, and not just a numbered list item inside a sentence)
            // We assume a heading is relatively short and stands alone.
            if (match && match[2].length < 150 && (i === 0 || lines[i-1].trim() === '' || !inPreamble)) {
                if (currentSection) {
                    sections.push({
                        id: parseInt(currentSection.id),
                        title: currentSection.title,
                        shortTitle: currentSection.shortTitle,
                        content: currentContent.join('\n').trim()
                    });
                }
                inPreamble = false;
                currentSection = {
                    id: match[1],
                    title: line.trim(),
                    shortTitle: match[2].trim()
                };
                currentContent = [line.trim()]; // old format included the title in content
            } else {
                if (inPreamble) preamble.push(line);
                else if (currentSection) currentContent.push(line);
            }
        }
        if (currentSection) {
            sections.push({
                id: parseInt(currentSection.id),
                title: currentSection.title,
                shortTitle: currentSection.shortTitle,
                content: currentContent.join('\n').trim()
            });
        }

        // Bypass GCS upload due to local dev credentials issue.
        // File is already in the /uploads folder thanks to multer.
        const fileUrl = `/${filePath.replace(/\\/g, '/')}`;
        const uploadRes = { url: fileUrl };

        // Save to MongoDB Settings
        await Settings.findOneAndUpdate(
            { key: `pricing_sections_${planKey}` },
            { value: JSON.stringify(sections) },
            { upsert: true, new: true }
        );

        await Settings.findOneAndUpdate(
            { key: `pricing_doc_${planKey}` },
            { value: uploadRes.url },
            { upsert: true, new: true }
        );

        const meta = {
            fileName: req.file.originalname,
            uploadDate: new Date().toISOString()
        };
        await Settings.findOneAndUpdate(
            { key: `pricing_meta_${planKey}` },
            { value: JSON.stringify(meta) },
            { upsert: true, new: true }
        );

        // fs.unlinkSync(filePath); // Kept locally

        res.json({ message: "Agreement parsed and uploaded successfully", meta, sectionsCount: sections.length });
    } catch (err) {
        console.error("Upload Pricing Doc Error:", err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Server Error during upload and parsing" });
    }
});

app.get('/api/admin/pricing-docs/:planKey', async (req, res) => {
    try {
        const { planKey } = req.params;
        const metaSetting = await Settings.findOne({ key: `pricing_meta_${planKey}` });
        if (metaSetting && metaSetting.value) {
            const meta = JSON.parse(metaSetting.value);
            return res.json({ status: 'uploaded', ...meta });
        }
        res.json({ status: 'not_uploaded' });
    } catch (err) {
        console.error("Get Pricing Doc Meta Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

app.delete('/api/admin/pricing-docs/:planKey', async (req, res) => {
    try {
        const { planKey } = req.params;
        await Settings.deleteOne({ key: `pricing_sections_${planKey}` });
        await Settings.deleteOne({ key: `pricing_doc_${planKey}` });
        await Settings.deleteOne({ key: `pricing_meta_${planKey}` });
        res.json({ message: "Agreement deleted successfully" });
    } catch (err) {
        console.error("Delete Pricing Doc Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/api/admin/upload-doc', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const filePath = req.file.path;
        let extractedText = "";

        // 1. Extract Text for RAG context
        if (req.file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdf(dataBuffer);
            extractedText = pdfData.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const docResult = await mammoth.extractRawText({ path: filePath });
            extractedText = docResult.value;
        } else if (req.file.mimetype === 'text/plain' || req.file.mimetype === 'text/markdown') {
            extractedText = fs.readFileSync(filePath, 'utf8');
        } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ message: "Unsupported file type: " + req.file.mimetype });
        }

        // 2. Upload to GCS Bucket via StorageService under rag/documents/
        const uploadRes = await storageService.uploadFile({
            filePath,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            folder: storageService.FOLDERS.RAG,
            prefix: 'rag',
            options: { uploadedBy: 'admin' }
        });

        // 3. Save to MongoDB
        const newDoc = new Document({
            fileName: req.file.originalname,
            extractedText: extractedText,
            fileType: req.file.mimetype,
            fileUrl: uploadRes.url
        });

        await newDoc.save();

        // 4. Cleanup local temp file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ message: "Document uploaded to Cloud and indexed successfully!", url: uploadRes.url, doc: newDoc });
    } catch (err) {
        console.error("❌ RAG Upload Error:", err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Error processing document: " + err.message });
    }
});

app.get('/api/admin/list-docs', async (req, res) => {
    try {
        const docs = await Document.find().sort({ uploadedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: "Error fetching documents" });
    }
});

app.delete('/api/admin/delete-doc/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: "Document not found" });

        // Delete object from GCS bucket
        if (doc.fileUrl) {
            await storageService.deleteFile(doc.fileUrl);
        }

        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: "Document deleted from Cloud and DB" });
    } catch (err) {
        console.error("❌ Delete Error:", err);
        res.status(500).json({ message: "Error deleting document" });
    }
});

// --- ROUTES ---

// 1. Submit Contact Form
// Dynamic Media Proxy for Google Cloud Storage (handles non-public buckets)
app.get(/^\/api\/media\/(.+)$/, async (req, res) => {
    try {
        const filePath = req.params[0];
        if (!filePath) {
            return res.status(400).json({ message: "File path is required" });
        }

        // 1. Attempt direct GCS streaming if bucket is available & valid
        if (bucketName && bucket) {
            try {
                const file = bucket.file(filePath);
                const [exists] = await file.exists();
                if (exists) {
                    const [metadata] = await file.getMetadata();
                    res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

                    return file.createReadStream()
                        .on('error', (err) => {
                            console.error("Error reading file stream:", err);
                            if (!res.headersSent) {
                                res.status(500).json({ message: "Error streaming file" });
                            }
                        })
                        .pipe(res);
                }
            } catch (gcsErr) {
                console.warn(`Local GCS stream failed for ${filePath}, falling back to Cloud Run media proxy:`, gcsErr.message);
            }
        }

        // 2. Fallback: Proxy directly from production Cloud Run backend
        try {
            const prodUrl = `https://uwo-backend-977864306871.asia-south1.run.app/api/media/${filePath}`;
            const prodRes = await fetch(prodUrl);
            if (prodRes.ok) {
                res.setHeader('Content-Type', prodRes.headers.get('content-type') || 'application/octet-stream');
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

                const arrayBuffer = await prodRes.arrayBuffer();
                return res.send(Buffer.from(arrayBuffer));
            } else {
                return res.status(prodRes.status).json({ message: "File not found" });
            }
        } catch (proxyErr) {
            console.error("Cloud Run media fallback proxy failed:", proxyErr);
            return res.status(404).json({ message: "File not found" });
        }
    } catch (err) {
        console.error("Media proxy error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.send('Hello World!');
});
app.post('/api/contacts', async (req, res) => {
    try {
        const { name, email, message, purpose, source } = req.body;
        const newContact = new Contact({
            name,
            email,
            message,
            purpose,
            source: source || 'UWO'
        });
        await newContact.save();

        // Attribute Lead if affiliateCode is present
        const affiliateCode = req.body.affiliateCode || (req.affiliate && req.affiliate.code);
        if (affiliateCode) {
            try {
                const { trackLead } = require('./affiliate/tracking');
                let productSlug = req.body.productSlug;
                if (!productSlug) {
                    const purpLower = (purpose || '').toLowerCase();
                    if (purpLower.includes('aisa connect')) productSlug = 'aisa-connect';
                    else if (purpLower.includes('aisa')) productSlug = 'aisa';
                    else if (purpLower.includes('efv')) productSlug = 'efv';
                    else if (purpLower.includes('legal')) productSlug = 'ai-legal';
                    else productSlug = 'general';
                }
                await trackLead(affiliateCode, productSlug, {
                    name,
                    email,
                    phone: req.body.phone || '',
                    leadSource: 'contact',
                    visitorId: req.body.visitorId || (req.affiliate && req.affiliate.visitorId)
                });
            } catch (leadErr) {
                console.error('⚠️ Lead tracking error in contacts API:', leadErr.message);
            }
        }

        // Notify Admin
        await sendAdminNotification({
            name,
            email,
            message,
            purpose,
            source: source || 'Web Contact Form'
        });
        await sendWebhookNotification({
            name,
            email,
            message,
            purpose,
            source: source || 'Web Contact Form'
        });

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= EARN & REFER PROGRAM ENDPOINTS =================
app.post('/api/referrals', async (req, res) => {
    try {
        const { name, email, phone, upiId, preferredProgram, message, affiliateCode } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        // Generate unique referral application ID (e.g. UWO-REF-XXXXXX)
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

        // Attribute Lead if affiliateCode is present
        if (affiliateCode) {
            try {
                const { trackLead } = require('./affiliate/tracking');
                await trackLead(affiliateCode, 'earn-and-refer', {
                    name,
                    email,
                    phone,
                    leadSource: 'earn-and-refer-form',
                    visitorId: req.body.visitorId || ''
                });
            } catch (leadErr) {
                console.error('⚠️ Lead tracking error in referrals API:', leadErr.message);
            }
        }

        // ================= CREATE REFERRAL-USER ACCOUNT IN USER DASHBOARD =================
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
            console.log(`✅ Referral user account linked: User ID "${userDashboardUserId}" for ${email}`);
        } catch (regErr) {
            console.warn('⚠️ Could not connect to user-dashboard auth API:', regErr.message);
        }

        // Nodemailer Transporter
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

        // 1. Send Confirmation Email to Applicant
        const userMailOptions = {
            from: `"UWO™ Ecosystem" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎉 Welcome to UWO™ Earn & Refer Program - Application Received (${referralCode})`,
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: auto; background: #0b1120; border-radius: 20px; overflow: hidden; border: 1.5px solid rgba(214, 165, 89, 0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.8); color: #f8fafc;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #162377 0%, #0b1120 100%); padding: 36px 30px; text-align: center; border-bottom: 2px solid #D6A559;">
                    <h1 style="margin: 0; color: #D6A559; font-size: 26px; font-weight: 800; letter-spacing: 1px;">UWO™ EARN &amp; REFER</h1>
                    <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Partner &amp; Referral Network</p>
                </div>

                <!-- Body -->
                <div style="padding: 32px 30px; background: #0e172a;">
                    <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Hi ${name},</h2>
                    <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
                        Thank you for applying to the <strong>UWO™ Earn &amp; Refer Program</strong>. We are thrilled to welcome you to our network of growth partners and creators!
                    </p>

                    ${userDashboardUserId && userDashboardPassword ? `
                    <!-- Referral Dashboard Login Box -->
                    <div style="background: rgba(214, 165, 89, 0.12); border: 1.5px solid #D6A559; border-radius: 14px; padding: 22px; margin: 24px 0;">
                        <h3 style="margin: 0 0 10px; color: #FABE56; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">🔐 Your Referral Dashboard Login Credentials</h3>
                        <p style="margin: 0 0 14px; color: #cbd5e1; font-size: 13.5px;">Your personal referral dashboard is ready. Log in to generate custom referral links for all UWO products (AISA, AI Legal, AI Ads, AI CashFlow, AI Mall, AISA Connect, EFV, etc.) and track clicks &amp; downloads in real time.</p>
                        <table style="width: 100%; font-size: 14px; border-collapse: collapse; color: #f1f5f9;">
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8; width: 45%;"><strong>User ID:</strong></td>
                                <td style="padding: 6px 0; color: #FABE56; font-weight: bold; font-family: monospace;">${userDashboardUserId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;"><strong>Email:</strong></td>
                                <td style="padding: 6px 0; font-family: monospace;">${email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;"><strong>Password:</strong></td>
                                <td style="padding: 6px 0; color: #ffffff; font-weight: bold; font-family: monospace;">${userDashboardPassword}</td>
                            </tr>
                        </table>
                        <div style="text-align: center; margin-top: 18px;">
                            <a href="${userDashboardLoginUrl}" style="display: inline-block; background: linear-gradient(135deg, #D6A559 0%, #FABE56 100%); color: #0b1120; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px;" target="_blank">Login to Referral Dashboard →</a>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Application Info Box -->
                    <div style="background: rgba(214, 165, 89, 0.08); border: 1px solid rgba(214, 165, 89, 0.3); border-radius: 14px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 14px; color: #D6A559; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Application Summary</h3>
                        <table style="width: 100%; font-size: 14px; border-collapse: collapse; color: #f1f5f9;">
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8; width: 45%;"><strong>Application ID:</strong></td>
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

                    <!-- How it Works Steps -->
                    <h3 style="color: #D6A559; font-size: 17px; margin: 28px 0 14px;">How It Works:</h3>
                    <div style="display: grid; gap: 12px; margin-bottom: 24px;">
                        <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 16px; border-left: 3px solid #D6A559;">
                            <strong style="color: #ffffff;">1. Login to Referral Dashboard:</strong>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13.5px;">Sign in with your User ID or Email to access your personalized portal.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 16px; border-left: 3px solid #D6A559;">
                            <strong style="color: #ffffff;">2. Generate Links for Any UWO Product:</strong>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13.5px;">Create smart referral links for AISA, AI Legal, AI Ads, AI CashFlow, AI Mall, AISA Connect, EFV, or UWO corporate solutions.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 16px; border-left: 3px solid #D6A559;">
                            <strong style="color: #ffffff;">3. Track Clicks, Downloads &amp; Payouts:</strong>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13.5px;">Monitor live visitor clicks and verified mobile app installs with real-time attribution.</p>
                        </div>
                    </div>

                    <p style="color: #94a3b8; font-size: 13.5px; line-height: 1.5; margin-top: 25px;">
                        If you have questions or want to collaborate directly, reply to this email or write to <a href="mailto:admin@uwo24.com" style="color: #D6A559;">admin@uwo24.com</a>.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #050811; padding: 22px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b;">
                    <p style="margin: 0 0 6px;">UWO™ - Unified Web Options &amp; Services Pvt. Ltd. &copy; 2026</p>
                    <p style="margin: 0;">Building Intelligent Digital Platforms for a Connected World</p>
                </div>
            </div>
            `
        };

        // 2. Send Admin Notification Email
        const adminMailOptions = {
            from: `"UWO System" <${process.env.EMAIL_USER}>`,
            to: 'admin@uwo24.com',
            subject: `🎁 New Earn & Refer Application: ${name} (${referralCode})`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-top: 5px solid #D6A559;">
                <h2 style="color: #162377;">🎁 New Earn &amp; Refer Application Received</h2>
                <p><strong>Application ID:</strong> ${referralCode}</p>
                <p><strong>User ID:</strong> ${userDashboardUserId || 'Created'}</p>
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

        // Send confirmation email to applicant
        try {
            await transporter.sendMail(userMailOptions);
            console.log(`✅ Earn & Refer confirmation email sent to ${email}`);
        } catch (emailErr) {
            console.error('⚠️ Failed to send user confirmation email:', emailErr.message);
        }

        // Send admin notification
        try {
            await transporter.sendMail(adminMailOptions);
            console.log(`✅ Earn & Refer admin notification sent`);
        } catch (adminEmailErr) {
            console.error('⚠️ Failed to send admin notification email:', adminEmailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for submitting the form.',
            referralCode,
            userId: userDashboardUserId || referralCode
        });
    } catch (err) {
        console.error('❌ Error processing referral submission:', err);
        res.status(500).json({ error: err.message || 'Server error processing referral' });
    }
});

// Admin endpoint to view referral submissions
app.get('/api/referrals', auth, checkPermission('messages.view'), async (req, res) => {
    try {
        const referrals = await ReferralSubmission.find().sort({ createdAt: -1 });
        res.json(referrals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Role-Based Login (Admin & Sales Partner)
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (role === 'partner') {
        // Authenticate Sales Partner only
        try {
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

            partner.lastLoginAt = new Date();
            await partner.save();

            return res.json({ token, role: 'partner' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } else {
        // Authenticate Admin only (SUPER_ADMIN and SALES_ADMIN)
        try {
            const User = require('./models/User');
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ message: 'Your account is disabled. Contact administrator.' });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({ token, role: user.role });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
});

// Get Admin profile & permissions (RBAC)
app.get('/api/admin/profile', auth, (req, res) => {
    const role = req.admin.role;
    res.json({
        email: req.admin.email,
        role: role,
        permissions: RolePermissions[role] || []
    });
});

// 3. Get All Messages (Protected)
app.get('/api/contacts', auth, checkPermission('messages.view'), async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ created_at: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3.1 Get All Messages (PUBLIC - For Testing)
app.get('/api/contacts/test', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ created_at: -1 });
        res.json({ total: contacts.length, data: contacts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete Message (Protected)
app.delete('/api/contacts/:id', auth, checkPermission('messages.delete'), async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Website Routes (Created as per request)
app.post('/api/aisa-demo', async (req, res) => {
    try {
        const { name, email, phone, company, message } = req.body;

        // Save to Database
        const newLead = new Contact({
            name,
            email,
            purpose: 'AISA Demo Request',
            message: `Company: ${company || 'N/A'}\nPhone: ${phone || 'N/A'}\n\nMessage: ${message}`,
            source: 'AISA Landing Page'
        });
        await newLead.save();

        // Attribute Lead if affiliateCode is present
        const affiliateCode = req.body.affiliateCode || (req.affiliate && req.affiliate.code);
        if (affiliateCode) {
            try {
                const { trackLead } = require('./affiliate/tracking');
                await trackLead(affiliateCode, 'aisa', {
                    name,
                    email,
                    phone: phone || '',
                    leadSource: 'demo',
                    visitorId: req.body.visitorId || (req.affiliate && req.affiliate.visitorId)
                });
            } catch (leadErr) {
                console.error('⚠️ Lead tracking error in aisa-demo API:', leadErr.message);
            }
        }

        // Send Email Notification
        await sendAdminNotification({
            name,
            email,
            purpose: 'AISA Demo Request',
            message: `Company: ${company || 'N/A'}\nPhone: ${phone || 'N/A'}\n\nMessage: ${message}`,
            source: 'AISA Landing Page'
        });
        await sendWebhookNotification({
            name,
            email,
            purpose: 'AISA Demo Request',
            message: `Company: ${company || 'N/A'}\nPhone: ${phone || 'N/A'}\n\nMessage: ${message}`,
            source: 'AISA Landing Page'
        });

        res.status(201).json({ message: 'Demo request sent successfully' });
    } catch (err) {
        console.error('❌ AISA Demo Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/website', async (req, res) => {
    try {
        const items = await Website.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Subscriber Route
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email, source, message } = req.body;

        // Attribute Lead if affiliateCode is present
        const affiliateCode = req.body.affiliateCode || (req.affiliate && req.affiliate.code);
        if (affiliateCode) {
            try {
                const { trackLead } = require('./affiliate/tracking');
                const productSlug = req.body.productSlug || 'general';
                await trackLead(affiliateCode, productSlug, {
                    name: 'Subscriber Lead',
                    email,
                    phone: '',
                    leadSource: 'subscribe',
                    visitorId: req.body.visitorId || (req.affiliate && req.affiliate.visitorId)
                });
            } catch (leadErr) {
                console.error('⚠️ Lead tracking error in subscribe API:', leadErr.message);
            }
        }

        // 1. Save to DB (Only if new)
        const existing = await Subscriber.findOne({ email });
        if (!existing) {
            const newSubscriber = new Subscriber({ email });
            await newSubscriber.save();

            // Also save to Contact collection to show in Admin Panel
            const newContact = new Contact({
                name: 'New Chat User',
                email: email,
                purpose: 'Chatbot Lead',
                message: message || 'User provided email via Chatbot.',
                source: source || 'UWO'
            });
            await newContact.save();

            // Notify Admin of the new Chatbot Lead
            await sendAdminNotification({
                name: 'New Chat User',
                email: email,
                purpose: 'Chatbot Lead',
                message: message || 'User provided email via Chatbot.',
                source: source || 'UWO AI Chatbot'
            });
            await sendWebhookNotification({
                name: 'New Chat User',
                email: email,
                purpose: 'Chatbot Lead',
                message: message || 'User provided email via Chatbot.',
                source: source || 'UWO AI Chatbot'
            });
        } else {
            console.log(`♻️ User ${email} already exists, resending welcome email...`);
        }

        // 2. Send Welcome Email (Always)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587, // Use 587 for TLS
            secure: false, // false for 587 (STARTTLS), true for 465 (SSL)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 60000,
            socketTimeout: 60000
        });

        const mailOptions = {
            from: `"EFV™ World" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to the EFV™ World',
            html: `
                <!-- Main Wrapper Table -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#050811" style="background-color: #050811; margin: 0; padding: 0; width: 100% !important;">
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 10px;">
                            
                            <!-- Main Email Card (600px Width) -->
                            <table border="0" cellpadding="0" cellspacing="0" width="600" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #0b1120; background-image: url('cid:herobg'); background-size: cover; background-position: center; border-radius: 24px; overflow: hidden; box-shadow: 0 50px 120px rgba(0,0,0,0.9), 0 0 15px rgba(214, 165, 89, 0.12); border: 1.5px solid rgba(214, 165, 89, 0.45);">
                                <tr>
                                    <td align="center" valign="top" style="padding: 0; background-color: rgba(11, 17, 32, 0.82);">
                                        
                                        <!-- Unified Inner Content Table -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%;">
                                            
                                            <!-- Row: Header Section -->
                                            <tr>
                                                <td align="center" style="padding: 60px 30px 40px 30px;">
                                                    <img src="cid:efvlogo" width="110" style="display: block; border: 0;" alt="EFV™ Logo">
                                                    <div style="color: #D6A559; font-size: 22px; font-weight: 800; margin-top: 15px; letter-spacing: 5px; text-transform: uppercase;">EFV™</div>
                                                </td>
                                            </tr>

                                            <!-- Row: Hero Content Section -->
                                            <tr>
                                                <td align="center" style="padding: 0 30px 50px 30px;">
                                                    <div style="margin-bottom: 40px;">
                                                        <a href="https://www.amazon.in/dp/B0GKPT184H" style="display: inline-block; background-color: #000; color: #FABE56; border: 1.5px solid #FABE56; padding: 12px 36px; text-decoration: none; font-weight: 800; font-size: 11px; letter-spacing: 2px; border-radius: 100px; box-shadow: 0 8px 20px rgba(0,0,0,0.5);">
                                                            THE BIG OPPORTUNITY IS HERE →
                                                        </a>
                                                    </div>
                                                    <img src="cid:efvbook" alt="EFV™ Book" width="280" style="width: 280px; height: auto; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 40px 80px rgba(0,0,0,0.9); display: block;">
                                                </td>
                                            </tr>

                                            <!-- Row: Descriptive Content Section -->
                                            <tr>
                                                <td align="center" style="padding: 0 40px 60px 40px;">
                                                    <div style="text-align: center; margin-bottom: 40px;">
                                                        <h2 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0; letter-spacing: 3px; text-transform: uppercase;">THE ORIGIN CODE™</h2>
                                                        <div style="margin: 20px auto; height: 1px; width: 50px; background-color: #D6A559;"></div>
                                                    </div>
                                                    
                                                    <div style="color: #94a3b8; font-size: 15px; line-height: 1.6; font-weight: 400; text-align: center;">
                                                        <p style="margin-bottom: 25px;">Welcome to the <span style="color: #ffffff; font-weight: 700;">EFV™ Intelligent Ecosystem</span>. You are now part of an elite global frequency dedicated to architecting universal growth.</p>
                                                        <p style="margin-bottom: 25px;"><span style="color: #FABE56; font-weight: 700;">Volume 1: The Origin Code</span> is officially live. This foundational work serves as the blueprint for understanding cognitive evolution and the mechanics of deep intelligent frameworks.</p>
                                                        <p style="margin-bottom: 40px;">Your access is now <span style="color: #FABE56; font-weight: 800; letter-spacing: 1px;">ACTIVE</span>. Take the first step into the new era of cognitive dominance today.</p>
                                                    </div>

                                                    <a href="https://www.amazon.in/dp/B0GKPT184H" style="display: inline-block; background-color: #000; color: #FABE56; border: 2.2px solid #FABE56; padding: 16px 50px; text-decoration: none; font-weight: 900; font-size: 15px; letter-spacing: 1.5px; border-radius: 100px; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
                                                        Claim Access Now
                                                    </a>
                                                </td>
                                            </tr>

                                            <!-- Row: Phase/Roadmap Section -->
                                            <tr>
                                                <td align="center" style="padding: 0 40px 60px 40px;">
                                                    <div style="background-color: rgba(250, 190, 86, 0.03); border: 1.8px solid #FABE56; border-radius: 20px; padding: 45px 30px; text-align: center;">
                                                        <div style="display: inline-block; padding: 10px 22px; background-color: #FABE56; border-radius: 6px; margin-bottom: 25px;">
                                                            <span style="color: #000; font-size: 11px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">COMING SOON</span>
                                                        </div>
                                                        <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">NEXT PHASE: VOLUME 2</h3>
                                                        <p style="margin: 0; color: #D6A559; font-size: 14px; font-weight: 600; opacity: 0.9;">Exclusive Early Access Reservation Pending.</p>
                                                    </div>
                                                </td>
                                            </tr>

                                            <!-- Row: Retail Channels Section -->
                                            <tr>
                                                <td align="center" style="padding: 0 30px 60px 30px;">
                                                    <div style="margin-bottom: 30px; color: #FABE56; font-size: 11px; letter-spacing: 5px; text-transform: uppercase; font-weight: 800;">RETAIL CHANNELS</div>
                                                    
                                                    <!-- Buttons Sub-Table -->
                                                    <table border="0" cellpadding="0" cellspacing="0" align="center" style="border-collapse: collapse;">
                                                        <tr>
                                                            <td align="center" style="padding: 6px;">
                                                                <a href="https://efvworld.online" style="text-decoration: none; display: block; background-color: #0f172a; border: 1.2px solid rgba(214, 165, 89, 0.35); border-radius: 12px; padding: 12px 18px; min-width: 145px;">
                                                                    <table border="0" cellpadding="0" cellspacing="0" align="center">
                                                                        <tr>
                                                                            <td valign="middle" style="padding-right: 10px; line-height: 1;">
                                                                                <img src="cid:efvicon" width="18" style="display: block; border: 0;" alt="">
                                                                            </td>
                                                                            <td valign="middle" style="color: #D6A559; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap; line-height: 1;">
                                                                                EFV™ Site
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </a>
                                                            </td>
                                                            <td align="center" style="padding: 6px;">
                                                                <a href="https://amazon.in" style="text-decoration: none; display: block; background-color: #0f172a; border: 1.2px solid rgba(214, 165, 89, 0.35); border-radius: 12px; padding: 12px 18px; min-width: 135px;">
                                                                    <table border="0" cellpadding="0" cellspacing="0" align="center">
                                                                        <tr>
                                                                            <td valign="middle" style="padding-right: 10px; line-height: 1;">
                                                                                <img src="cid:amazonicon" width="16" style="display: block; border: 0;" alt="">
                                                                            </td>
                                                                            <td valign="middle" style="color: #D6A559; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap; line-height: 1;">
                                                                                Amazon
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </a>
                                                            </td>
                                                            <td align="center" style="padding: 6px;">
                                                                <a href="https://notionpress.com" style="text-decoration: none; display: block; background-color: #0f172a; border: 1.2px solid rgba(214, 165, 89, 0.35); border-radius: 12px; padding: 12px 18px; min-width: 155px;">
                                                                    <table border="0" cellpadding="0" cellspacing="0" align="center">
                                                                        <tr>
                                                                            <td valign="middle" style="padding-right: 10px; line-height: 1;">
                                                                                <img src="cid:notionicon" width="18" style="display: block; border: 0;" alt="">
                                                                            </td>
                                                                            <td valign="middle" style="color: #D6A559; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap; line-height: 1;">
                                                                                NotionPress
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <!-- Buttons Row 2 -->
                                                    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin-top: 5px; border-collapse: collapse;">
                                                        <tr>
                                                            <td align="center" style="padding: 6px;">
                                                                <a href="https://flipkart.com" style="text-decoration: none; display: block; background-color: #0f172a; border: 1.2px solid rgba(214, 165, 89, 0.35); border-radius: 12px; padding: 12px 25px; min-width: 135px;">
                                                                    <table border="0" cellpadding="0" cellspacing="0" align="center">
                                                                        <tr>
                                                                            <td valign="middle" style="padding-right: 10px; line-height: 1;">
                                                                                <img src="cid:flipkarticon" width="18" style="display: block; border: 0;" alt="">
                                                                            </td>
                                                                            <td valign="middle" style="color: #D6A559; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap; line-height: 1;">
                                                                                Flipkart
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Row: Footer Logo and Legal -->








                                            <tr>
                                                <td align="center"
                                                    style="padding:60px 40px;
                                                    background-color: rgba(11, 17, 32, 0.82);
                                                    border-top: 1px solid rgba(255,255,255,0.05);">

                                                    <div style="color:#D6A559;
                                                    font-size:22px;
                                                    font-weight:900;
                                                    letter-spacing:8px;
                                                    margin-bottom:25px;
                                                    text-transform:uppercase;">
                                                    UWO™
                                                    </div>

                                                    <p style="color:#D6A559;
                                                    font-size:10px;
                                                    text-transform:uppercase;
                                                    letter-spacing:5px;
                                                    line-height:2.2;
                                                    margin:0;
                                                    font-weight:700;
                                                    opacity:0.9;">
                                                    Architecting Universal Growth. © 2024 UWO Pvt. Ltd.
                                                    </p>

                                                </td>
                                            </tr>   


                                        </table>
                                        <!-- End Unified Inner Content Table -->

                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>
            `,
            attachments: [
                {
                    filename: 'EFV_Book.png',
                    path: path.join(__dirname, '../images/EFVBOOK.png'),
                    cid: 'efvbook'
                },
                {
                    filename: 'hero-bg.png',
                    path: path.join(__dirname, '../images/ChatGPT Image Feb 9, 2026, 09_09_27 PM.png'),
                    cid: 'herobg'
                },
                {
                    filename: 'EFV.png',
                    path: path.join(__dirname, '../images/EFV.png'),
                    cid: 'efvlogo'
                },
                {
                    filename: 'EFV_Icon.png',
                    path: path.join(__dirname, '../images/EFV.png'),
                    cid: 'efvicon'
                },
                {
                    filename: 'Amazon_Icon.png',
                    path: path.join(__dirname, '../images/amazon.png'),
                    cid: 'amazonicon'
                },
                {
                    filename: 'Notion_Icon.png',
                    path: path.join(__dirname, '../images/notion.png'),
                    cid: 'notionicon'
                },
                {
                    filename: 'Flipkart_Icon.png',
                    path: path.join(__dirname, '../images/flipcard.png'),
                    cid: 'flipkarticon'
                }
            ]
        };

        try {
            console.log(`📤 Attempting to send welcome email to: ${email} `);
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent: ' + info.response);
            res.status(201).json({ message: 'Subscribed successfully! Welcome email sent.' });
        } catch (emailError) {
            console.error('❌ Error sending email:', emailError);
            // Return success since the user is subscribed in the database
            res.status(201).json({
                message: 'Subscribed successfully!',
                warning: 'Failed to send welcome email.',
                error: emailError.message
            });
        }
    } catch (err) {
        console.error('❌ Server Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 7. Get All Subscribers (Protected)
app.get('/api/subscribers', auth, checkPermission('messages.view'), async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ created_at: -1 });
        res.json(subscribers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Delete Subscriber (Protected)
app.delete('/api/subscribers/:id', auth, checkPermission('messages.delete'), async (req, res) => {
    try {
        const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
        if (!subscriber) {
            return res.status(404).json({ message: 'Subscriber not found' });
        }
        res.json({ message: 'Subscriber removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8.1 Register Email (Chatbot Specific)
app.post('/api/register-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        // 1. Save to Subscriber collection (Only if new)
        let subscriber = await Subscriber.findOne({ email });
        if (!subscriber) {
            subscriber = new Subscriber({ email });
            await subscriber.save();

            // Attribute Lead if affiliateCode is present
            const affiliateCode = req.body.affiliateCode || (req.affiliate && req.affiliate.code);
            if (affiliateCode) {
                try {
                    const { trackLead } = require('./affiliate/tracking');
                    const productSlug = req.body.productSlug || 'general';
                    await trackLead(affiliateCode, productSlug, {
                        name: 'Chatbot Lead',
                        email,
                        phone: '',
                        leadSource: 'chatbot',
                        visitorId: req.body.visitorId || (req.affiliate && req.affiliate.visitorId)
                    });
                } catch (leadErr) {
                    console.error('⚠️ Lead tracking error in register-email API:', leadErr.message);
                }
            }

            // Save the lead details into Contacts for Admin panel visibility
            const newLead = new Contact({
                name: 'New Chat User',
                email: email,
                purpose: 'Chatbot Lead',
                message: 'User registered via UWO AI Chatbot.',
                source: 'UWO AI'
            });
            await newLead.save();

            // Notify Admin via email (as requested)
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

            const timestamp = new Date().toLocaleString();
            const adminMailOptions = {
                from: `"UWO AI Bot" <${process.env.EMAIL_USER}>`,
                to: 'admin@uwo24.com',
                subject: 'New User Interaction - UWO AI Bot',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #162377;">New User Interaction - UWO AI Bot</h2>
                        <p style="font-size: 16px; color: #475569;">A new user has started a conversation on the UWO platform.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Email:</strong> <span style="color: #162377;">${email}</span></p>
                            <p><strong>Time:</strong> ${timestamp}</p>
                        </div>
                        <p style="font-size: 14px; color: #94a3b8;">This lead has been archived in the system database.</p>
                    </div>
                `
            };

            await transporter.sendMail(adminMailOptions);
            console.log(`✅ Admin notified of new chatbot user: ${email}`);
        }

        res.status(200).json({ message: 'Registered successfully', registered: true });
    } catch (err) {
        console.error("❌ Register Email Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 9. Chat (Public)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, email } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });

        // Step 1: Detect Language
        const detectedLang = detectLanguage(message);
        console.log(`💬 User Message (${email || 'Anonymous'}): "${message}" | Detected: ${detectedLang}`);

        // Step 2: Fetch RAG context (from DB + knowledge_base.js) -- Truncated to avoid 128k Context Limit Error
        const allDocs = await Document.find();
        let docsContext = allDocs.map(d => `--- FILE: ${d.fileName} ---\n${d.extractedText}`).join("\n\n");

        // Safety truncation: 60,000 chars is approx 50,000 tokens maximum with complex unicode (Safe for 131,072 limit)
        if (docsContext.length > 60000) {
            docsContext = docsContext.substring(0, 60000) + "\n\n...[ADDITIONAL CONTENT TRUNCATED TO FIT MEMORY LIMIT]...";
        }

        const contextText = `### CORE KNOWLEDGE:\n${knowledgeText}\n\n### UPLOADED DOCUMENTS:\n${docsContext}`;

        // Step 3: Generate Dynamic System Prompt (Updated for UWO)
        const dynamicSystemInstruction = `You are UWO AI Assistant, a professional AI assistant for the UWO (Unified Web Options) digital platform. 

### ‼️ CRITICAL RULES - DO NOT IGNORE ‼️
1. **NO "ONLY POINTS" RESPONSES:** You are strictly forbidden from just listing points. A list only response is a failure.
2. **MANDATORY 3-SECTION STRUCTURE:** Every response MUST have these 3 sections in this order:

[PARAGRAPH SECTION]
Write a clear, smooth, and professional explanation in 3-5 complete sentences. Do NOT use any bullet points or symbols in this section.

[POINTS SECTION]
Break down the specific details into exactly 3 bullet points using the "•" character.

[KEY HIGHLIGHTS]
Summarize the 3 most important takeaways. Use **bold text** for the labels (e.g., - **Innovation:** Details here).

### 🎨 VISUAL STYLE:
- **Bold Important Words:** Use **double asterisks** to highlight keywords inside the paragraphs.
- **Brand Names:** Always wrap <strong>UWO™</strong>, <strong>AISA™</strong>, and <strong>AI Mall™</strong> in <strong> tags.
- Use emojis sparingly only if they add value.
- Respond ONLY in the user's language.

### KNOWLEDGE CONTEXT:
${contextText}

### RAG RULES:
- Use the context above to answer accurately.
- If not in context, use professional general knowledge.
- NO apologies about "not found in context."`;

        // Initialize model with history support
        const chatModel = vertexAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: dynamicSystemInstruction
        });

        // Use history for multi-turn conversation
        const chat = chatModel.startChat({
            history: req.body.history || []
        });

        console.log(`🤖 LLM Called | Model: ${MODEL_NAME} | Language Detection: ${detectedLang}`);
        let result;
        try {
            result = await chat.sendMessage(message);
        } catch (aiErr) {
            console.error("❌ Vertex AI Error:", JSON.stringify(aiErr?.message || aiErr));
            return res.status(500).json({ error: 'AI generation failed', details: aiErr?.message });
        }
        let responseText = result.response.candidates[0].content.parts[0].text;
        console.log(`✨ AI Response received [Length: ${responseText.length}]`);

        // Step 5: Hard Language Enforcement (Fallback)
        const isActuallyDevanagari = /[\u0900-\u097F]/.test(responseText);
        if ((detectedLang === "Hindi" || detectedLang === "Marathi") && !isActuallyDevanagari && !message.toLowerCase().includes("english")) {
            console.log("⚠️ Incorrect language detected in AI response. Enforcing rewrite...");
            const rewriteResult = await chatModel.generateContent(`Your previous response was not in ${detectedLang}. Rewrite the following response strictly in ${detectedLang} script only: \n\n${responseText}`);
            responseText = rewriteResult.response.candidates[0].content.parts[0].text;
        }

        // Log to database if user is registered
        if (email) {
            try {
                const newLog = new ChatLog({ email, message, reply: responseText });
                await newLog.save();
            } catch (logErr) {
                console.error("⚠️ Failed to log chat:", logErr);
            }
        }

        res.json({ reply: responseText });
    } catch (err) {
        console.error("❌ Chat Error Details:", err);
        res.status(500).json({ error: err.message || "I'm having trouble connecting to AI right now." });
    }
});

// ==========================================
// 🏷️ UWO™ CATEGORY ENDPOINTS
// ==========================================

// Seed default categories on startup
const DEFAULT_CATEGORIES = ['AI & Automation', 'Tech Insights', 'Digital Commerce', 'Research'];
(async () => {
    try {
        for (const name of DEFAULT_CATEGORIES) {
            const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
            await Category.findOneAndUpdate(
                { slug },
                { name, slug },
                { upsert: true, new: true }
            );
        }
        console.log('✅ Default categories seeded.');
    } catch (e) {
        console.warn('⚠️ Category seed skipped:', e.message);
    }
})();

// GET /api/categories — Public: fetch all categories sorted by usage
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ usageCount: -1, name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories', details: err.message });
    }
});

// POST /api/categories/create — Admin: create new category
app.post('/api/categories/create', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
        jwt.verify(authHeader, JWT_SECRET);
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
        const trimmed = name.trim();
        const slug = trimmed.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        // Case-insensitive duplicate check
        const existing = await Category.findOne({ slug });
        if (existing) return res.json(existing); // return existing silently
        const category = await Category.create({ name: trimmed, slug });
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create category', details: err.message });
    }
});

// DELETE /api/categories/:idOrSlug — Admin: delete a category
app.delete('/api/categories/:idOrSlug', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
        jwt.verify(authHeader, JWT_SECRET);
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
    try {
        const { idOrSlug } = req.params;
        let deleted;
        // Try by MongoDB _id first, then by slug
        if (idOrSlug.match(/^[a-f\d]{24}$/i)) {
            deleted = await Category.findByIdAndDelete(idOrSlug);
        } else {
            deleted = await Category.findOneAndDelete({ slug: idOrSlug });
        }
        if (!deleted) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted', deleted });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete category', details: err.message });
    }
});

// ==========================================
// 📚 UWO™ BLOG REST ENDPOINTS
// ==========================================

// Helper to ensure coverImage and featuredImage are synchronized on API responses
function formatBlog(blog) {
    if (!blog) return blog;
    const obj = blog.toObject ? blog.toObject({ getters: true, virtuals: true }) : { ...blog };
    const img = obj.coverImage || obj.featuredImage || '';
    obj.coverImage = img;
    obj.featuredImage = img;
    return obj;
}

// 1. Get All Published Blogs (Public)
app.get('/api/blogs', async (req, res) => {
    try {
        const { category, search, tag } = req.query;
        let query = { status: 'published' };

        if (category && category !== 'All') {
            query.category = { $regex: new RegExp('^' + category + '$', 'i') };
        }
        if (tag) {
            query.tags = { $in: [tag] };
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { seoDescription: { $regex: search, $options: 'i' } }
            ];
        }

        const blogs = await Blog.find(query).sort({ createdAt: -1 });
        const formatted = blogs.map(formatBlog);
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blogs', details: err.message });
    }
});

// 2. Get Single Blog by Slug (Public) - Increments views
app.post('/api/blogs/views/:slug', async (req, res) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            { slug: req.params.slug, status: 'published' },
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(formatBlog(blog));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blog details', details: err.message });
    }
});

app.get('/api/blogs/:slug', async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(formatBlog(blog));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blog', details: err.message });
    }
});

// 3. Like Blog (Public)
app.post('/api/blogs/:slug/like', async (req, res) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { likes: 1 } },
            { new: true }
        );
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(formatBlog(blog));
    } catch (err) {
        res.status(500).json({ error: 'Failed to like blog', details: err.message });
    }
});

// 4. Admin - Get All Blogs (Draft + Published)
app.get('/api/admin/blogs', auth, checkPermission('blogs.view'), async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        const formatted = blogs.map(formatBlog);
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin blogs', details: err.message });
    }
});

// 5. Admin - Create Blog
app.post('/api/blogs', auth, checkPermission('blogs.create'), async (req, res) => {
    try {
        const { title, content, featuredImage, coverImage, category, tags, seoTitle, seoDescription, status, readTime, author } = req.body;
        const imageToSave = featuredImage || coverImage || '';

        let slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        // Ensure slug is unique
        let slugExists = await Blog.findOne({ slug });
        let counter = 1;
        while (slugExists) {
            slug = `${slug}-${counter}`;
            slugExists = await Blog.findOne({ slug });
            counter++;
        }

        const newBlog = new Blog({
            title,
            slug,
            content,
            featuredImage: imageToSave,
            coverImage: imageToSave,
            category: category || 'AI & Automation',
            tags: tags || [],
            seoTitle: seoTitle || title,
            seoDescription: seoDescription || '',
            status: status || 'published',
            readTime: readTime || 3,
            author: author || 'UWO Team'
        });

        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create blog', details: err.message });
    }
});

// 6. Admin - Update Blog (Preserves coverImage unless explicitly updated)
app.put('/api/blogs/:id', auth, checkPermission('blogs.edit'), async (req, res) => {
    try {
        const { title, content, featuredImage, coverImage, category, tags, seoTitle, seoDescription, status, readTime, author } = req.body;

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        blog.title = title || blog.title;
        blog.content = content !== undefined ? content : blog.content;

        // Only update coverImage/featuredImage if a non-null image value is provided
        const newImage = featuredImage !== undefined ? featuredImage : (coverImage !== undefined ? coverImage : undefined);
        if (newImage !== undefined && newImage !== null && newImage !== '') {
            blog.featuredImage = newImage;
            blog.coverImage = newImage;
        }

        blog.category = category || blog.category;
        blog.tags = tags || blog.tags;
        blog.seoTitle = seoTitle || blog.seoTitle;
        blog.seoDescription = seoDescription !== undefined ? seoDescription : blog.seoDescription;
        blog.status = status || blog.status;
        blog.readTime = readTime || blog.readTime;
        blog.author = author || blog.author;

        await blog.save();
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update blog', details: err.message });
    }
});

// 7. Admin - Delete Blog
app.delete('/api/blogs/:id', auth, checkPermission('blogs.delete'), async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete blog', details: err.message });
    }
});

app.post('/api/blogs/upload-media', auth, checkPermission('blogs.edit'), upload.single('media'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No media file uploaded' });

        const uploadRes = await storageService.uploadFile({
            filePath: req.file.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            folder: storageService.FOLDERS.BLOGS,
            prefix: 'blog',
            options: { uploadedBy: req.user ? req.user.email : 'admin' }
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({
            message: 'Media uploaded successfully',
            url: uploadRes.url,
            coverImage: uploadRes.url,
            featuredImage: uploadRes.url,
            fileName: uploadRes.originalName,
            fileType: uploadRes.mimeType,
            bucketPath: uploadRes.bucketPath
        });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("❌ Media upload error:", err);
        res.status(500).json({ error: 'Media upload failed', details: err.message });
    }
});

// ==========================================
// 🛡️ DYNAMIC LEGAL PAGES MODULE
// ==========================================

// In-memory cache for published legal pages
const legalCache = {};

function cleanHTML(htmlContent) {
    if (!htmlContent) return '';

    if (typeof sanitizeHtml === 'function') {
        return sanitizeHtml(htmlContent, {
            allowedTags: [
                'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4',
                'h5', 'h6', 'hgroup', 'main', 'nav', 'section', 'blockquote', 'dd', 'div',
                'dl', 'dt', 'figcaption', 'figure', 'hr', 'li', 'main', 'ol', 'p', 'pre',
                'ul', 'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
                'em', 'i', 'kbd', 'mark', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp',
                'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'caption',
                'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
                'img', 'iframe'
            ],
            allowedAttributes: {
                a: ['href', 'name', 'target', 'style', 'class'],
                img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'style', 'class'],
                iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'style', 'class'],
                div: ['style', 'class'],
                span: ['style', 'class'],
                p: ['style', 'class'],
                h1: ['style', 'class'],
                h2: ['style', 'class'],
                h3: ['style', 'class'],
                h4: ['style', 'class'],
                h5: ['style', 'class'],
                h6: ['style', 'class'],
                table: ['style', 'class', 'border', 'cellpadding', 'cellspacing'],
                tr: ['style', 'class'],
                td: ['style', 'class', 'colspan', 'rowspan'],
                th: ['style', 'class', 'colspan', 'rowspan']
            },
            allowedStyles: {
                '*': {
                    'color': [/^#(?:[0-9a-fA-F]{3,4}){1,2}$/, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/, /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d\.]+)\s*\)$/, /^[a-zA-Z]+$/],
                    'background-color': [/^#(?:[0-9a-fA-F]{3,4}){1,2}$/, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/, /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d\.]+)\s*\)$/, /^[a-zA-Z]+$/],
                    'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
                    'font-weight': [/^[a-zA-Z0-9]+$/],
                    'text-decoration': [/^[a-zA-Z\-]+$/],
                    'padding': [/^[\d\.]+(px|em|%)?$/],
                    'margin': [/^[\d\.]+(px|em|%)?$/],
                    'border': [/^[^;]+$/],
                    'width': [/^[^;]+$/],
                    'height': [/^[^;]+$/],
                    'font-size': [/^[^;]+$/],
                    'font-family': [/^[^;]+$/],
                    'line-height': [/^[^;]+$/],
                    'list-style-type': [/^[^;]+$/]
                }
            }
        });
    }

    // Fallback manual sanitization
    let clean = htmlContent;
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/ \bon[a-z]+=["'][^"']*["']/gi, '');
    clean = clean.replace(/ \bon[a-z]+=[^\s>]+/gi, '');
    clean = clean.replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');
    return clean;
}

// 1. GET /api/legal/:slug (Public - Fetch published page content and SEO settings)
app.get('/api/legal/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        let pageType = '';
        if (slug === 'privacy-policy') pageType = 'privacy';
        else if (['terms-and-conditions', 'terms-of-service', 'terms'].includes(slug)) pageType = 'terms';
        else if (['cookies-policy', 'cookie-policy'].includes(slug)) pageType = 'cookies';
        else return res.status(404).json({ error: 'Page not found' });

        // Check Cache
        const cached = legalCache[pageType];
        if (cached) {
            return res.json(cached);
        }

        const page = await LegalPage.findOne({ page_type: pageType, status: 'published' });
        if (!page) {
            return res.status(404).json({ error: 'Content is currently unavailable.' });
        }

        // Cache response
        legalCache[pageType] = page;
        res.json(page);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch legal page', details: err.message });
    }
});

// 2. GET /api/admin/legal/page/:page_type (Admin - Get current work page details)
app.get('/api/admin/legal/page/:page_type', auth, checkPermission('legal.view'), async (req, res) => {
    try {
        const { page_type } = req.params;
        if (!['privacy', 'terms', 'cookies'].includes(page_type)) {
            return res.status(400).json({ error: 'Invalid page type' });
        }
        const page = await LegalPage.findOne({ page_type });
        if (!page) {
            return res.status(404).json({ error: 'Legal page document not found' });
        }
        res.json(page);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch legal page metadata', details: err.message });
    }
});

// 3. POST /api/admin/legal/draft (Admin - Save work page as draft)
app.post('/api/admin/legal/draft', auth, checkPermission('legal.manage'), async (req, res) => {
    try {
        const {
            page_type, title, content, seoTitle, metaDescription, metaKeywords,
            canonicalUrl, openGraphTitle, openGraphDescription, openGraphImage, robots
        } = req.body;

        if (!['privacy', 'terms', 'cookies'].includes(page_type)) {
            return res.status(400).json({ error: 'Invalid page type' });
        }

        const sanitized = cleanHTML(content);

        let slug = 'privacy-policy';
        if (page_type === 'terms') slug = 'terms-and-conditions';
        else if (page_type === 'cookies') slug = 'cookies-policy';

        const page = await LegalPage.findOneAndUpdate(
            { page_type },
            {
                draftTitle: title,
                slug,
                draftContent: sanitized,
                draftSeoTitle: seoTitle,
                draftMetaDescription: metaDescription,
                draftMetaKeywords: metaKeywords,
                draftCanonicalUrl: canonicalUrl,
                draftOpenGraphTitle: openGraphTitle,
                draftOpenGraphDescription: openGraphDescription,
                draftOpenGraphImage: openGraphImage,
                draftRobots: robots,
                updated_by: req.admin?.email || 'Admin',
                updated_at: Date.now()
            },
            { new: true, upsert: true }
        );

        // Audit Log
        await AuditLog.create({
            action: 'SAVE_DRAFT',
            page_type,
            performed_by: req.admin?.email || 'Admin',
            details: `Saved draft for ${title}.`
        });

        res.json({ message: 'Draft saved successfully', page });
    } catch (err) {
        console.error('❌ Error saving draft:', err);
        res.status(500).json({ error: 'Failed to save draft', details: err.message });
    }
});

// 4. PUT /api/admin/legal/update (Admin - Save/update current draft/content)
app.put('/api/admin/legal/update', auth, checkPermission('legal.manage'), async (req, res) => {
    try {
        const {
            page_type, title, content, seoTitle, metaDescription, metaKeywords,
            canonicalUrl, openGraphTitle, openGraphDescription, openGraphImage, robots
        } = req.body;

        if (!['privacy', 'terms', 'cookies'].includes(page_type)) {
            return res.status(400).json({ error: 'Invalid page type' });
        }

        const sanitized = cleanHTML(content);

        const page = await LegalPage.findOneAndUpdate(
            { page_type },
            {
                draftTitle: title,
                draftContent: sanitized,
                draftSeoTitle: seoTitle,
                draftMetaDescription: metaDescription,
                draftMetaKeywords: metaKeywords,
                draftCanonicalUrl: canonicalUrl,
                draftOpenGraphTitle: openGraphTitle,
                draftOpenGraphDescription: openGraphDescription,
                draftOpenGraphImage: openGraphImage,
                draftRobots: robots,
                updated_by: req.admin?.email || 'Admin',
                updated_at: Date.now()
            },
            { new: true }
        );

        await AuditLog.create({
            action: 'UPDATE',
            page_type,
            performed_by: req.admin?.email || 'Admin',
            details: `Updated draft contents for ${title}.`
        });

        res.json({ message: 'Content updated successfully', page });
    } catch (err) {
        console.error('❌ Error updating content:', err);
        res.status(500).json({ error: 'Failed to update content', details: err.message });
    }
});

// 5. POST /api/admin/legal/publish (Admin - Publish current content)
app.post('/api/admin/legal/publish', auth, checkPermission('legal.manage'), async (req, res) => {
    try {
        const { page_type, notes } = req.body;
        if (!['privacy', 'terms', 'cookies'].includes(page_type)) {
            return res.status(400).json({ error: 'Invalid page type' });
        }

        const page = await LegalPage.findOne({ page_type });
        if (!page) {
            return res.status(404).json({ error: 'Legal page not found' });
        }

        const newVersionNumber = (page.version || 0) + 1;

        // Copy draft fields to active fields
        page.title = page.draftTitle || page.title;
        page.content = page.draftContent || page.content;
        page.seoTitle = page.draftSeoTitle || page.seoTitle;
        page.metaDescription = page.draftMetaDescription || page.metaDescription;
        page.metaKeywords = page.draftMetaKeywords || page.metaKeywords;
        page.canonicalUrl = page.draftCanonicalUrl || page.canonicalUrl;
        page.openGraphTitle = page.draftOpenGraphTitle || page.openGraphTitle;
        page.openGraphDescription = page.draftOpenGraphDescription || page.openGraphDescription;
        page.openGraphImage = page.draftOpenGraphImage || page.openGraphImage;
        page.robots = page.draftRobots || page.robots;

        page.status = 'published';
        page.version = newVersionNumber;
        page.published_at = Date.now();
        page.updated_by = req.admin?.email || 'Admin';
        page.updated_at = Date.now();

        await page.save();

        // Create version entry
        const versionEntry = await LegalPageVersion.create({
            page_id: page._id,
            page_type: page.page_type,
            title: page.title,
            slug: page.slug,
            content: page.content,
            version: newVersionNumber,
            seoTitle: page.seoTitle,
            metaDescription: page.metaDescription,
            metaKeywords: page.metaKeywords,
            canonicalUrl: page.canonicalUrl,
            openGraphTitle: page.openGraphTitle,
            openGraphDescription: page.openGraphDescription,
            openGraphImage: page.openGraphImage,
            robots: page.robots,
            notes: notes || '',
            updated_by: req.admin?.email || 'Admin'
        });

        // Invalidate cache
        delete legalCache[page_type];

        // Audit Log
        await AuditLog.create({
            action: 'PUBLISH',
            page_type,
            performed_by: req.admin?.email || 'Admin',
            details: `Published version ${newVersionNumber} (${notes || 'no notes'}).`
        });

        res.json({ message: 'Page published successfully', page, version: versionEntry });
    } catch (err) {
        console.error('❌ Error publishing legal page:', err);
        res.status(500).json({ error: 'Failed to publish legal page', details: err.message });
    }
});

// 6. POST /api/admin/legal/unpublish (Admin - Unpublish legal page)
app.post('/api/admin/legal/unpublish', auth, checkPermission('legal.manage'), async (req, res) => {
    try {
        const { page_type } = req.body;
        if (!['privacy', 'terms', 'cookies'].includes(page_type)) {
            return res.status(400).json({ error: 'Invalid page type' });
        }

        const page = await LegalPage.findOne({ page_type });
        if (!page) {
            return res.status(404).json({ error: 'Legal page not found' });
        }

        page.status = 'draft';
        page.updated_by = req.admin?.email || 'Admin';
        page.updated_at = Date.now();

        await page.save();

        // Invalidate cache
        delete legalCache[page_type];

        // Audit Log
        await AuditLog.create({
            action: 'UNPUBLISH',
            page_type,
            performed_by: req.admin?.email || 'Admin',
            details: `Unpublished legal page.`
        });

        res.json({ message: 'Page unpublished successfully', page });
    } catch (err) {
        console.error('❌ Error unpublishing page:', err);
        res.status(500).json({ error: 'Failed to unpublish page', details: err.message });
    }
});

// 7. GET /api/admin/legal/versions/:page_type (Admin - Get version history)
app.get('/api/admin/legal/versions/:page_type', auth, checkPermission('legal.view'), async (req, res) => {
    try {
        const { page_type } = req.params;
        if (!['privacy', 'terms', 'cookies'].includes(page_type)) {
            return res.status(400).json({ error: 'Invalid page type' });
        }

        const versions = await LegalPageVersion.find({ page_type }).sort({ version: -1 });
        res.json(versions);
    } catch (err) {
        console.error('❌ Error fetching versions:', err);
        res.status(500).json({ error: 'Failed to load version history', details: err.message });
    }
});

// 8. POST /api/admin/legal/restore (Admin - Restore previous version)
app.post('/api/admin/legal/restore', auth, checkPermission('legal.manage'), async (req, res) => {
    try {
        const { page_type, version_id } = req.body;
        if (!['privacy', 'terms', 'cookies'].includes(page_type)) {
            return res.status(400).json({ error: 'Invalid page type' });
        }

        const targetVersion = await LegalPageVersion.findById(version_id);
        if (!targetVersion) {
            return res.status(404).json({ error: 'Version not found' });
        }

        const page = await LegalPage.findOne({ page_type });
        if (!page) {
            return res.status(404).json({ error: 'Legal page not found' });
        }

        const nextVersionNumber = (page.version || 0) + 1;

        // Restore version fields to BOTH active and draft
        page.title = targetVersion.title;
        page.content = targetVersion.content;
        page.seoTitle = targetVersion.seoTitle;
        page.metaDescription = targetVersion.metaDescription;
        page.metaKeywords = targetVersion.metaKeywords;
        page.canonicalUrl = targetVersion.canonicalUrl;
        page.openGraphTitle = targetVersion.openGraphTitle;
        page.openGraphDescription = targetVersion.openGraphDescription;
        page.openGraphImage = targetVersion.openGraphImage;
        page.robots = targetVersion.robots;

        page.draftTitle = targetVersion.title;
        page.draftContent = targetVersion.content;
        page.draftSeoTitle = targetVersion.seoTitle;
        page.draftMetaDescription = targetVersion.metaDescription;
        page.draftMetaKeywords = targetVersion.metaKeywords;
        page.draftCanonicalUrl = targetVersion.canonicalUrl;
        page.draftOpenGraphTitle = targetVersion.openGraphTitle;
        page.draftOpenGraphDescription = targetVersion.openGraphDescription;
        page.draftOpenGraphImage = targetVersion.openGraphImage;
        page.draftRobots = targetVersion.robots;

        page.status = 'published';
        page.version = nextVersionNumber;
        page.published_at = Date.now();
        page.updated_by = req.admin?.email || 'Admin';
        page.updated_at = Date.now();

        await page.save();

        // Create new version entry in history
        const newVersionEntry = await LegalPageVersion.create({
            page_id: page._id,
            page_type: page.page_type,
            title: page.title,
            slug: page.slug,
            content: page.content,
            version: nextVersionNumber,
            seoTitle: page.seoTitle,
            metaDescription: page.metaDescription,
            metaKeywords: page.metaKeywords,
            canonicalUrl: page.canonicalUrl,
            openGraphTitle: page.openGraphTitle,
            openGraphDescription: page.openGraphDescription,
            openGraphImage: page.openGraphImage,
            robots: page.robots,
            notes: `Restored from Version ${targetVersion.version}`,
            updated_by: req.admin?.email || 'Admin'
        });

        // Invalidate cache
        delete legalCache[page_type];

        // Audit Log
        await AuditLog.create({
            action: 'RESTORE',
            page_type,
            performed_by: req.admin?.email || 'Admin',
            details: `Restored to version ${targetVersion.version} (created new version ${nextVersionNumber}).`
        });

        res.json({ message: 'Version restored successfully', page, version: newVersionEntry });
    } catch (err) {
        console.error('❌ Error restoring version:', err);
        res.status(500).json({ error: 'Failed to restore version', details: err.message });
    }
});

// 9. GET /api/admin/legal/audit-logs (Admin - Get recent audit logs)
app.get('/api/admin/legal/audit-logs', auth, checkPermission('legal.view'), async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
    }
});

const PORT = process.env.PORT || 8080;

// 9. Webhook Receiver (Super Admin Connector)
app.post('/api/connector', async (req, res) => {
    const signature = req.headers['x-super-admin-signature'];
    if (!signature) return res.status(401).json({ error: 'Missing signature' });

    const secret = process.env.SUPER_ADMIN_WEBHOOK_SECRET || 'uwo-secret';
    const payloadString = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('[Webhook] Received command from Super Admin:', req.body);

    // Execute command based on action...
    // (This is where UWO would handle specific Super Admin actions like sync)

    res.json({ success: true, message: 'Command received successfully' });
});

// ==========================================
// 👥 DYNAMIC TEAM MEMBERS MODULE
// ==========================================

// Team member image upload with validation
const teamImageUpload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, WEBP images are allowed'), false);
        }
    }
});

// Seed existing team members on first run
async function seedTeamMembers() {
    try {
        // Clean out legacy team members without a category field
        await TeamMember.deleteMany({ category: { $exists: false } });

        // Explicitly remove excluded members: Bhumika Patel, Sakshi Jain, Aman Patel
        await TeamMember.deleteMany({
            name: { $in: [/Bhumika Patel/i, /Sakshi Jain/i, /Aman Patel/i] }
        });

        // Ensure MR. Prateek Sharma and team members exist
        const specialMembers = [
            {
                name: 'MR. Prateek Sharma',
                designation: 'Human Resources',
                image: 'images/prateek-sharma..webp',
                display_order: 2,
                status: 'active',
                is_leadership: false,
                category: 'Finance',
                short_description: 'Strategic HR leader managing talent lifecycle, compliance, and employee success.',
                full_biography: '<p>The Human Resources (HR) department plays a strategic role in building a skilled, engaged, and high-performing workforce. HR oversees the complete employee lifecycle—from talent acquisition and onboarding to performance management, learning &amp; development, payroll coordination, policy compliance, and employee relations. By fostering a culture of collaboration, transparency, and continuous growth, HR ensures that both employees and the organization achieve long-term success.</p>',
                skills: ['Human Resources', 'Talent Acquisition', 'Employee Relations', 'Performance Management'],
                experience: ['HR Management', 'Policy Compliance & Culture'],
                achievements: [],
                linkedin: 'https://linkedin.com'
            },
            {
                name: 'Ayush Dubey',
                designation: 'Business Development Associate',
                image: 'images/ayush-dubey..webp',
                display_order: 14,
                status: 'active',
                is_leadership: false,
                category: 'Business Development',
                short_description: 'Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
                full_biography: '<p>Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>',
                skills: ['Lead Generation', 'Client Relations', 'Sales Strategy', 'Market Expansion'],
                experience: ['Business Development', 'Sales Execution'],
                achievements: [],
                linkedin: 'https://linkedin.com'
            },
            {
                name: 'Sandeep Yadav',
                designation: 'Business Development Associate',
                image: 'images/sandeep-yadav..webp',
                display_order: 15,
                status: 'active',
                is_leadership: false,
                category: 'Business Development',
                short_description: 'Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
                full_biography: '<p>Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>',
                skills: ['Client Outreach', 'B2B Partnerships', 'Lead Conversion', 'Sales Pipeline'],
                experience: ['Business Outreach', 'Client Growth'],
                achievements: [],
                linkedin: 'https://linkedin.com'
            },
            {
                name: 'Sukhmani Kaur',
                designation: 'Marketing Designer',
                image: 'images/sukhmani-kaur..webp',
                display_order: 16,
                status: 'active',
                is_leadership: false,
                category: 'Design',
                short_description: 'Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.',
                full_biography: '<p>Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.</p>',
                skills: ['Visual Design', 'Brand Identity', 'Marketing Collateral', 'Digital Assets'],
                experience: ['Graphic Design', 'Brand Marketing'],
                achievements: [],
                linkedin: 'https://linkedin.com'
            },
            {
                name: 'Aman Kharare',
                designation: 'Business Development Associate',
                image: 'images/aman-kharare..webp',
                display_order: 17,
                status: 'active',
                is_leadership: false,
                category: 'Business Development',
                short_description: 'Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.',
                full_biography: '<p>Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.</p>',
                skills: ['Strategic Partnerships', 'Client Acquisition', 'Business Growth', 'Negotiations'],
                experience: ['Corporate Partnerships', 'Business Development'],
                achievements: [],
                linkedin: 'https://linkedin.com'
            }
        ];

        for (const sm of specialMembers) {
            const existing = await TeamMember.findOne({ name: new RegExp(sm.name, 'i') });
            if (!existing) {
                await TeamMember.create(sm);
                console.log(`✅ ${sm.name} added to database`);
            } else {
                existing.status = 'active';
                existing.deletedAt = null;
                existing.designation = sm.designation;
                existing.image = sm.image;
                existing.category = sm.category;
                existing.display_order = sm.display_order;
                existing.short_description = sm.short_description;
                existing.full_biography = sm.full_biography;
                existing.skills = sm.skills;
                existing.experience = sm.experience;
                await existing.save();
                console.log(`✅ ${sm.name} updated in database`);
            }
        }

        const count = await TeamMember.countDocuments();
        if (count === 0) {
            console.log('🌱 Seeding default team members with new schema...');
            const defaultMembers = [
                {
                    name: 'Gurumukh P. Ahuja',
                    designation: 'Founder & Director',
                    image: 'images/founder..webp',
                    display_order: 1,
                    status: 'active',
                    is_leadership: true,
                    category: 'Leadership',
                    short_description: 'Visionary tech entrepreneur guiding the long-term strategic and architectural roadmap of UWO.',
                    full_biography: '<p>Gurumukh P. Ahuja is the visionary Founder & Director of Unified Web Options & Services Pvt. Ltd. (UWO).</p><p>Under his leadership, the company has pioneered high-end AI research and software ecosystems. He drives the long-term technical architecture and corporate strategy at UWO, ensuring the delivery of state-of-the-art platforms like AISA™ and AI Mall™.</p><p>With years of experience in enterprise development and technological leadership, he leads a world-class team of developers and researchers in building products that redefine efficiency and user engagement.</p>',
                    linkedin: 'https://linkedin.com',
                    email: 'admin@uwo24.com'
                },
                {
                    name: 'Anjali Ahuja',
                    designation: 'Co-founder',
                    image: 'images/team-3..webp',
                    display_order: 2,
                    status: 'active',
                    is_leadership: true,
                    category: 'Leadership',
                    short_description: 'Orchestrates core corporate planning, business alignment, and standard operations at UWO.',
                    full_biography: '<p>Anjali Ahuja is the Co-founder of Unified Web Options & Services Pvt. Ltd. (UWO).</p><p>With extensive leadership in business operations, she leads structural organization, corporate compliance, and team alignment at UWO.</p><p>Her work forms the operational foundation of the company, ensuring collaborative success across diverse technical and business divisions.</p>',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Sonali Jain',
                    designation: 'Business Development Manager',
                    image: 'images/team-7..webp',
                    display_order: 1,
                    status: 'active',
                    is_leadership: false,
                    category: 'Business Development',
                    short_description: 'Responsible for driving business growth, client partnerships, and market expansion.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'MR. Prateek Sharma',
                    designation: 'Human Resources',
                    image: 'images/prateek-sharma..webp',
                    display_order: 2,
                    status: 'active',
                    is_leadership: false,
                    category: 'Finance',
                    short_description: 'Strategic HR leader managing talent lifecycle, compliance, and employee success.',
                    full_biography: '<p>The Human Resources (HR) department plays a strategic role in building a skilled, engaged, and high-performing workforce. HR oversees the complete employee lifecycle—from talent acquisition and onboarding to performance management, learning &amp; development, payroll coordination, policy compliance, and employee relations. By fostering a culture of collaboration, transparency, and continuous growth, HR ensures that both employees and the organization achieve long-term success.</p>',
                    skills: ['Human Resources', 'Talent Acquisition', 'Employee Relations', 'Performance Management'],
                    experience: ['HR Management', 'Policy Compliance & Culture'],
                    achievements: [],
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Sreshthi Sunpal',
                    designation: 'Marketing Manager',
                    image: 'images/team-8..webp',
                    display_order: 3,
                    status: 'active',
                    is_leadership: false,
                    category: 'Marketing',
                    short_description: 'Heads marketing campaigns, brand positioning, and customer engagement strategy.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Ritesh Shrivastav',
                    designation: 'Product Manager',
                    image: 'images/team-4..webp',
                    display_order: 4,
                    status: 'active',
                    is_leadership: false,
                    category: 'Operations',
                    short_description: 'Coordinates product development lifecycles and manages operational execution.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Vishal Vashani',
                    designation: 'Accounts Executive',
                    image: 'images/team-2..webp',
                    display_order: 5,
                    status: 'active',
                    is_leadership: false,
                    category: 'Finance',
                    short_description: 'Manages financial records, budgets, and corporate accounting processes.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Sakshi Thakur',
                    designation: 'Full Stack Developer',
                    image: 'images/team-10..webp',
                    display_order: 6,
                    status: 'active',
                    is_leadership: false,
                    category: 'Technology',
                    short_description: 'Develops robust frontend interfaces and scalable server-side features.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Sanskar Sahu',
                    designation: 'Mern Stack Developer',
                    image: 'images/team-6..webp',
                    display_order: 7,
                    status: 'active',
                    is_leadership: false,
                    category: 'Technology',
                    short_description: 'Specializes in MongoDB, Express, React, and Node.js backend development.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Gauhar Iftekhar',
                    designation: 'Web Developer',
                    image: 'images/team-5..webp',
                    display_order: 8,
                    status: 'active',
                    is_leadership: false,
                    category: 'Technology',
                    short_description: 'Builds responsive website layouts and interactive web applications.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Aditi Lakhera',
                    designation: 'Software Developer',
                    image: 'images/aditi.jpeg',
                    display_order: 9,
                    status: 'active',
                    is_leadership: false,
                    category: 'Technology',
                    short_description: 'Implements efficient system logic and modern user interfaces.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Abha Jatav',
                    designation: 'Software Engineer',
                    image: 'images/team-13..webp',
                    display_order: 6,
                    status: 'active',
                    is_leadership: false,
                    category: 'Technology',
                    short_description: 'Focuses on scalable design patterns and algorithmic optimization.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                },
                {
                    name: 'Devansh Tantway',
                    designation: 'Python Developer',
                    image: 'images/team-14..webp',
                    display_order: 7,
                    status: 'active',
                    is_leadership: false,
                    category: 'Technology',
                    short_description: 'Engineers automation pipelines and intelligence integration engines.',
                    full_biography: '',
                    linkedin: 'https://linkedin.com'
                }
            ];
            await TeamMember.insertMany(defaultMembers);
            console.log('✅ Default team members seeded successfully');
        }
    } catch (err) {
        console.error('❌ Error seeding team members:', err.message);
    }
}

async function syncTeamCategories() {
    try {
        const teamCategories = await TeamMember.distinct('category', { deletedAt: null });
        const defaultDepts = [
            'Business Development', 'HR', 'Engineering', 'Marketing',
            'Operations', 'Research', 'Finance', 'AI Research', 'Legal', 'Sales', 'Technology', 'Design'
        ];
        const allDepts = Array.from(new Set([...teamCategories, ...defaultDepts]));

        for (const deptName of allDepts) {
            if (!deptName) continue;
            const slug = deptName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
            const count = await TeamMember.countDocuments({ category: deptName, deletedAt: null });
            await Category.findOneAndUpdate(
                { name: deptName },
                { name: deptName, slug: slug, usageCount: count },
                { upsert: true, new: true }
            );
        }
        console.log('✅ Team Categories synced successfully');
    } catch (err) {
        console.error('❌ Error syncing categories:', err.message);
    }
}

// Call seed after DB connection
mongoose.connection.once('open', async () => {
    await seedTeamMembers();
    await syncTeamCategories();
});

// 1. GET /api/team-members - Admin: paginated list with search, filter, sort
app.get('/api/team-members', auth, checkPermission('team.view'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, sort = 'order' } = req.query;
        const query = { deletedAt: null };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (status && (status === 'active' || status === 'inactive')) {
            query.status = status;
        }

        let sortOption = {};
        switch (sort) {
            case 'name': sortOption = { name: 1 }; break;
            case 'order': sortOption = { is_leadership: -1, display_order: 1 }; break; // leadership first
            case 'latest': sortOption = { createdAt: -1 }; break;
            case 'oldest': sortOption = { createdAt: 1 }; break;
            default: sortOption = { is_leadership: -1, display_order: 1 };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [members, total] = await Promise.all([
            TeamMember.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
            TeamMember.countDocuments(query)
        ]);

        res.json({
            members,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch team members', details: err.message });
    }
});

// 2. GET /api/team-members/public - Public: active members sorted by display_order
app.get('/api/team-members/public', async (req, res) => {
    try {
        let members = await TeamMember.find({
            status: 'active',
            deletedAt: null,
            name: { $nin: [/Bhumika Patel/i, /Sakshi Jain/i, /Aman Patel/i] }
        }).sort({ is_leadership: -1, display_order: 1 });

        // Filter out in-memory as double safety
        members = members.filter(m => {
            const n = (m.name || '').toLowerCase().trim();
            return n !== 'bhumika patel' && n !== 'sakshi jain' && n !== 'aman patel';
        });

        // Required members list to guarantee presence
        const requiredMembers = [
            {
                _id: '6a5e00699ddaa85d98cb10de',
                name: 'MR. Prateek Sharma',
                designation: 'Human Resources',
                image: 'images/prateek-sharma..webp',
                display_order: 2,
                status: 'active',
                is_leadership: false,
                category: 'Finance',
                short_description: 'Strategic HR leader managing talent lifecycle, compliance, and employee success.',
                full_biography: '<p>The Human Resources (HR) department plays a strategic role in building a skilled, engaged, and high-performing workforce. HR oversees the complete employee lifecycle—from talent acquisition and onboarding to performance management, learning &amp; development, payroll coordination, policy compliance, and employee relations. By fostering a culture of collaboration, transparency, and continuous growth, HR ensures that both employees and the organization achieve long-term success.</p>',
                skills: ['Human Resources', 'Talent Acquisition', 'Employee Relations', 'Performance Management'],
                experience: ['HR Management', 'Policy Compliance & Culture'],
                achievements: []
            },
            {
                _id: '6a55e1f67caa872f2ef0c81b',
                name: 'Ayush Dubey',
                designation: 'Business Development Associate',
                image: 'images/ayush-dubey..webp',
                display_order: 14,
                status: 'active',
                is_leadership: false,
                category: 'Business Development',
                short_description: 'Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
                full_biography: '<p>Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>',
                skills: ['Lead Generation', 'Client Relations', 'Sales Strategy', 'Market Expansion'],
                experience: ['Business Development', 'Sales Execution'],
                achievements: []
            },
            {
                _id: '6a5e02f43a8cb2dea9839937',
                name: 'Sandeep Yadav',
                designation: 'Business Development Associate',
                image: 'images/sandeep-yadav..webp',
                display_order: 15,
                status: 'active',
                is_leadership: false,
                category: 'Business Development',
                short_description: 'Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
                full_biography: '<p>Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>',
                skills: ['Client Outreach', 'B2B Partnerships', 'Lead Conversion', 'Sales Pipeline'],
                experience: ['Business Outreach', 'Client Growth'],
                achievements: []
            },
            {
                _id: '6a5e0f0c806e7889e3ea1c1d',
                name: 'Sukhmani Kaur',
                designation: 'Marketing Designer',
                image: 'images/sukhmani-kaur..webp',
                display_order: 16,
                status: 'active',
                is_leadership: false,
                category: 'Design',
                short_description: 'Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.',
                full_biography: '<p>Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.</p>',
                skills: ['Visual Design', 'Brand Identity', 'Marketing Collateral', 'Digital Assets'],
                experience: ['Graphic Design', 'Brand Marketing'],
                achievements: []
            },
            {
                _id: '6a5e0f46806e7889e3ea1c26',
                name: 'Aman Kharare',
                designation: 'Business Development Associate',
                image: 'images/aman-kharare..webp',
                display_order: 17,
                status: 'active',
                is_leadership: false,
                category: 'Business Development',
                short_description: 'Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.',
                full_biography: '<p>Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.</p>',
                skills: ['Strategic Partnerships', 'Client Acquisition', 'Business Growth', 'Negotiations'],
                experience: ['Corporate Partnerships', 'Business Development'],
                achievements: []
            }
        ];

        requiredMembers.forEach(reqMem => {
            const idx = members.findIndex(m => (m.name || '').toLowerCase().includes(reqMem.name.toLowerCase()));
            if (idx === -1) {
                members.push(reqMem);
            } else {
                // Ensure photo is local and clean
                members[idx].image = reqMem.image;
                if (!members[idx].designation) members[idx].designation = reqMem.designation;
            }
        });

        res.json(members);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public team members', details: err.message });
    }
});

// 3. GET /api/team-members/:id - Admin: get single member
app.get('/api/team-members/:id', auth, checkPermission('team.view'), async (req, res) => {
    try {
        const member = await TeamMember.findOne({ _id: req.params.id, deletedAt: null });
        if (!member) return res.status(404).json({ message: 'Team member not found' });
        res.json(member);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch team member', details: err.message });
    }
});

// 4. POST /api/team-members - Admin: create member
app.post('/api/team-members', auth, checkPermission('team.create'), (req, res, next) => {
            teamImageUpload.single('image')(req, res, (err) => {
                if (err) {
                    console.error('❌ Multer upload error (Team Member Create):', err.message);
                    return res.status(400).json({ message: 'Image upload error: ' + err.message });
                }
                next();
            });
        }, async (req, res) => {
            try {
                const {
                    name, designation, short_description, full_biography,
                    category, is_leadership, display_order,
                    linkedin, twitter, github, website, email, status,
                    skills, experience, achievements
                } = req.body;

                if (!name || name.trim().length < 3) {
                    return res.status(400).json({ message: 'Name is required and must be at least 3 characters' });
                }
                if (!designation || !designation.trim()) {
                    return res.status(400).json({ message: 'Designation is required' });
                }
                if (short_description && short_description.length > 250) {
                    return res.status(400).json({ message: 'Short description must be 250 characters or less' });
                }
                if (!display_order || isNaN(parseInt(display_order))) {
                    return res.status(400).json({ message: 'Display order is required and must be a number' });
                }

                const parseArrayField = (val, isSkills = false) => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) { }
                    const delimiter = isSkills ? /,/ : /\r?\n/;
                    return val.split(delimiter).map(s => s.trim()).filter(Boolean);
                };

                let imageUrl = '';
                if (req.file) {
                    const uploadRes = await storageService.uploadFile({
                        filePath: req.file.path,
                        originalName: req.file.originalname,
                        mimeType: req.file.mimetype,
                        folder: storageService.FOLDERS.TEAM,
                        prefix: 'team',
                        options: { uploadedBy: 'admin' }
                    });
                    imageUrl = uploadRes.url;
                    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                }

                const member = new TeamMember({
                    name: name.trim(),
                    designation: designation.trim(),
                    short_description: short_description ? short_description.trim() : '',
                    full_biography: full_biography ? full_biography.trim() : '',
                    category: category || 'Technology',
                    is_leadership: is_leadership === 'true' || is_leadership === true,
                    image: imageUrl,
                    display_order: parseInt(display_order),
                    linkedin: linkedin ? linkedin.trim() : '',
                    twitter: twitter ? twitter.trim() : '',
                    github: github ? github.trim() : '',
                    website: website ? website.trim() : '',
                    email: email ? email.trim() : '',
                    skills: parseArrayField(skills, true),
                    experience: parseArrayField(experience, false),
                    achievements: parseArrayField(achievements, false),
                    status: status || 'active'
                });

                await member.save();
                await syncTeamCategories();
                res.status(201).json({ message: 'Team member created successfully', member });
            } catch (err) {
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                res.status(500).json({ error: 'Failed to create team member', details: err.message });
            }
        });

        // 5. PUT /api/team-members/:id - Admin: update member
        app.put('/api/team-members/:id', auth, checkPermission('team.edit'), teamImageUpload.single('image'), async (req, res) => {
            try {
                const member = await TeamMember.findOne({ _id: req.params.id, deletedAt: null });
                if (!member) return res.status(404).json({ message: 'Team member not found' });

                const {
                    name, designation, short_description, full_biography,
                    category, is_leadership, display_order,
                    linkedin, twitter, github, website, email, status,
                    skills, experience, achievements
                } = req.body;

                const parseArrayField = (val, isSkills = false) => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) { }
                    const delimiter = isSkills ? /,/ : /\r?\n/;
                    return val.split(delimiter).map(s => s.trim()).filter(Boolean);
                };

                if (name !== undefined) {
                    if (name.trim().length < 3) return res.status(400).json({ message: 'Name must be at least 3 characters' });
                    member.name = name.trim();
                }
                if (designation !== undefined) {
                    if (!designation.trim()) return res.status(400).json({ message: 'Designation is required' });
                    member.designation = designation.trim();
                }
                if (short_description !== undefined) {
                    if (short_description.length > 250) return res.status(400).json({ message: 'Short description must be 250 characters or less' });
                    member.short_description = short_description.trim();
                }
                if (full_biography !== undefined) {
                    member.full_biography = full_biography.trim();
                }
                if (category !== undefined) {
                    member.category = category;
                }
                if (is_leadership !== undefined) {
                    member.is_leadership = is_leadership === 'true' || is_leadership === true;
                }
                if (display_order !== undefined) {
                    if (isNaN(parseInt(display_order))) return res.status(400).json({ message: 'Display order must be a number' });
                    member.display_order = parseInt(display_order);
                }
                if (linkedin !== undefined) member.linkedin = linkedin.trim();
                if (twitter !== undefined) member.twitter = twitter.trim();
                if (github !== undefined) member.github = github.trim();
                if (website !== undefined) member.website = website.trim();
                if (email !== undefined) member.email = email.trim();
                if (status !== undefined) member.status = status;
                if (skills !== undefined) member.skills = parseArrayField(skills, true);
                if (experience !== undefined) member.experience = parseArrayField(experience, false);
                if (achievements !== undefined) member.achievements = parseArrayField(achievements, false);
                if (req.file) {
                    const uploadRes = await storageService.replaceFile({
                        oldUrlOrPath: member.image,
                        filePath: req.file.path,
                        originalName: req.file.originalname,
                        mimeType: req.file.mimetype,
                        folder: storageService.FOLDERS.TEAM,
                        prefix: 'team',
                        options: { uploadedBy: 'admin' }
                    });
                    member.image = uploadRes.url;
                    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                }

                await member.save();
                res.json({ message: 'Team member updated successfully', member });
            } catch (err) {
                res.status(500).json({ error: 'Failed to update team member', details: err.message });
            }
        });

        // 6. DELETE /api/team-members/:id - Admin: soft delete
        app.delete('/api/team-members/:id', auth, checkPermission('team.delete'), async (req, res) => {
            try {
                const member = await TeamMember.findOne({ _id: req.params.id, deletedAt: null });
                if (!member) return res.status(404).json({ message: 'Team member not found' });

                if (member.image) {
                    await storageService.deleteFile(member.image);
                }

                member.deletedAt = new Date();
                await member.save();
                res.json({ message: 'Team member deleted successfully' });
            } catch (err) {
                res.status(500).json({ error: 'Failed to delete team member', details: err.message });
            }
        });

        // 7. PATCH /api/team-members/:id/status - Admin: toggle status
        app.patch('/api/team-members/:id/status', auth, checkPermission('team.edit'), async (req, res) => {
            try {
                const member = await TeamMember.findOne({ _id: req.params.id, deletedAt: null });
                if (!member) return res.status(404).json({ message: 'Team member not found' });

                member.status = member.status === 'active' ? 'inactive' : 'active';
                await member.save();
                res.json({ message: `Team member ${member.status === 'active' ? 'activated' : 'deactivated'} successfully`, member });
            } catch (err) {
                res.status(500).json({ error: 'Failed to update team member status', details: err.message });
            }
        });

        // 🚀 DYNAMIC FLAGSHIP PROJECTS MODULE
        // ==========================================

        const projectLogoUpload = multer({
            storage: storage,
            limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
            fileFilter: (req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
                if (allowed.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Only JPG, PNG, WEBP, SVG images are allowed'), false);
                }
            }
        });

        // Seed default projects (AI Mall, AISA, EFV) if collection is empty
        (async () => {
            try {
                const count = await Project.countDocuments({ deleted_at: null });
                if (count === 0) {
                    console.log('🌱 Seeding default flagship projects...');
                    const defaultProjects = [
                        {
                            name: 'AI Mall',
                            logo: '/uploads/aimall-logo.webp',
                            short_description: "UWO™'s flagship AI platform built to enable the deployment, orchestration, and global distribution of AI agents at scale. Launching with the first 100 AI applications as the foundation of its global ecosystem.",
                            project_url: 'https://aimall24.com/',
                            button_label: 'Visit AI Mall',
                            display_order: 1,
                            is_featured: true,
                            status: 'active'
                        },
                        {
                            name: 'AISA',
                            logo: '/uploads/aisa-logo.svg',
                            short_description: "UWO™'s immersive AI Super Assistant designed to unify your entire digital world into a single cohesive, intelligent platform.",
                            project_url: 'https://aisa24.com/',
                            button_label: 'Visit AISA',
                            display_order: 2,
                            is_featured: true,
                            status: 'active'
                        },
                        {
                            name: 'EFV',
                            logo: '/uploads/efv-logo.png',
                            short_description: 'A research-driven intelligence framework exploring the intersection of cognitive science, frequency systems, and AI.',
                            project_url: 'https://efvframework.com/index.html',
                            button_label: 'Visit EFV',
                            display_order: 3,
                            is_featured: true,
                            status: 'active'
                        }
                    ];
                    await Project.insertMany(defaultProjects);
                    console.log('✅ Default flagship projects seeded.');
                }
            } catch (e) {
                console.warn('⚠️ Project seed skipped:', e.message);
            }
        })();

        // 1. GET /api/projects/public - Public: get active projects
        app.get('/api/projects/public', async (req, res) => {
            try {
                const projects = await Project.find({ status: 'active', deleted_at: null })
                    .sort({ display_order: 1 });
                res.json(projects);
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch public projects', details: err.message });
            }
        });

        // 2. GET /api/projects - Admin: get all projects with search/filter
        app.get('/api/projects', auth, checkPermission('projects.view'), async (req, res) => {
            try {
                const { search, status, page = 1, limit = 10 } = req.query;
                let query = { deleted_at: null };

                if (search) {
                    query.name = { $regex: search, $options: 'i' };
                }
                if (status) {
                    query.status = status;
                }

                const skip = (parseInt(page) - 1) * parseInt(limit);
                const projects = await Project.find(query)
                    .sort({ display_order: 1, created_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit));

                const total = await Project.countDocuments(query);

                res.json({
                    projects,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProjects: total
                });
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
            }
        });

        // 3. GET /api/projects/:id - Admin: get single project
        app.get('/api/projects/:id', auth, checkPermission('projects.view'), async (req, res) => {
            try {
                const project = await Project.findOne({ _id: req.params.id, deleted_at: null });
                if (!project) return res.status(404).json({ message: 'Project not found' });
                res.json(project);
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch project', details: err.message });
            }
        });

        // 4. POST /api/projects - Admin: create new project
        app.post('/api/projects', auth, checkPermission('projects.create'), (req, res, next) => {
            projectLogoUpload.single('logo')(req, res, (err) => {
                if (err) {
                    console.error('Multer upload error:', err);
                    return res.status(400).json({ error: 'Upload error', details: err.message });
                }
                next();
            });
        }, async (req, res) => {
            try {
                const { name, short_description, project_url, button_label, display_order, is_featured, status } = req.body;

                if (!name || !short_description || !project_url) {
                    return res.status(400).json({ message: 'Name, short description, and project URL are required' });
                }

                if (!req.file) {
                    return res.status(400).json({ message: 'Project logo is required' });
                }

                let logoUrl = '';
                if (req.file) {
                    const uploadRes = await storageService.uploadFile({
                        filePath: req.file.path,
                        originalName: req.file.originalname,
                        mimeType: req.file.mimetype,
                        folder: storageService.FOLDERS.PRODUCTS,
                        prefix: 'project-logo',
                        options: { uploadedBy: 'admin' }
                    });
                    logoUrl = uploadRes.url;
                    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                }

                const project = new Project({
                    name: name.trim(),
                    logo: logoUrl,
                    short_description: short_description.trim(),
                    project_url: project_url.trim(),
                    button_label: button_label ? button_label.trim() : 'Visit Project',
                    display_order: parseInt(display_order) || 0,
                    is_featured: is_featured === 'true' || is_featured === true,
                    status: status || 'active'
                });

                await project.save();
                res.status(201).json({ message: 'Project created successfully', project });
            } catch (err) {
                console.error('Project create error:', err);
                res.status(500).json({ error: 'Failed to create project', details: err.message });
            }
        });

        // 5. PUT /api/projects/:id - Admin: update project
        app.put('/api/projects/:id', auth, checkPermission('projects.edit'), (req, res, next) => {
            projectLogoUpload.single('logo')(req, res, (err) => {
                if (err) {
                    console.error('Multer upload error:', err);
                    return res.status(400).json({ error: 'Upload error', details: err.message });
                }
                next();
            });
        }, async (req, res) => {
            try {
                const project = await Project.findOne({ _id: req.params.id, deleted_at: null });
                if (!project) return res.status(404).json({ message: 'Project not found' });

                const { name, short_description, project_url, button_label, display_order, is_featured, status } = req.body;

                if (name) project.name = name.trim();
                if (short_description) project.short_description = short_description.trim();
                if (project_url) project.project_url = project_url.trim();
                if (button_label !== undefined) project.button_label = button_label.trim();
                if (display_order !== undefined) project.display_order = parseInt(display_order);
                if (is_featured !== undefined) project.is_featured = is_featured === 'true' || is_featured === true;
                if (status) project.status = status;

                if (req.file) {
                    const uploadRes = await storageService.replaceFile({
                        oldUrlOrPath: project.logo,
                        filePath: req.file.path,
                        originalName: req.file.originalname,
                        mimeType: req.file.mimetype,
                        folder: storageService.FOLDERS.PRODUCTS,
                        prefix: 'project-logo',
                        options: { uploadedBy: 'admin' }
                    });
                    project.logo = uploadRes.url;
                    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                }

                await project.save();
                res.json({ message: 'Project updated successfully', project });
            } catch (err) {
                console.error('Project update error:', err);
                res.status(500).json({ error: 'Failed to update project', details: err.message });
            }
        });

        // 6. DELETE /api/projects/:id - Admin: soft delete
        app.delete('/api/projects/:id', auth, checkPermission('projects.delete'), async (req, res) => {
            try {
                const project = await Project.findOne({ _id: req.params.id, deleted_at: null });
                if (!project) return res.status(404).json({ message: 'Project not found' });

                if (project.logo) {
                    await storageService.deleteFile(project.logo);
                }

                project.deleted_at = new Date();
                await project.save();
                res.json({ message: 'Project deleted successfully' });
            } catch (err) {
                res.status(500).json({ error: 'Failed to delete project', details: err.message });
            }
        });

        // ==========================================
        // 🪣 CENTRALIZED STORAGE SERVICE API
        // ==========================================

        app.post('/api/storage/upload', upload.single('file'), async (req, res) => {
            try {
                if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

                const folderKey = (req.body.folder || req.query.folder || 'temp').toUpperCase();
                const targetFolder = storageService.FOLDERS[folderKey] || storageService.FOLDERS.TEMP;
                const prefix = req.body.prefix || req.query.prefix || folderKey.toLowerCase();

                const uploadRes = await storageService.uploadFile({
                    filePath: req.file.path,
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    folder: targetFolder,
                    prefix: prefix,
                    options: { uploadedBy: req.user ? req.user.email : 'system' }
                });

                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

                res.json({
                    message: 'File uploaded successfully to Google Cloud Storage',
                    ...uploadRes
                });
            } catch (err) {
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                console.error('❌ Storage API Upload Error:', err);
                res.status(500).json({ error: 'Upload to GCS failed', details: err.message });
            }
        });

        app.post('/api/storage/replace', upload.single('file'), async (req, res) => {
            try {
                if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
                const oldUrl = req.body.oldUrl || req.query.oldUrl;
                const folderKey = (req.body.folder || req.query.folder || 'temp').toUpperCase();
                const targetFolder = storageService.FOLDERS[folderKey] || storageService.FOLDERS.TEMP;

                const replaceRes = await storageService.replaceFile({
                    oldUrlOrPath: oldUrl,
                    filePath: req.file.path,
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    folder: targetFolder,
                    prefix: folderKey.toLowerCase()
                });

                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

                res.json({
                    message: 'File replaced successfully in Google Cloud Storage',
                    ...replaceRes
                });
            } catch (err) {
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                res.status(500).json({ error: 'Replace in GCS failed', details: err.message });
            }
        });

        app.delete('/api/storage/delete', async (req, res) => {
            try {
                const urlOrPath = req.body.url || req.query.url;
                if (!urlOrPath) return res.status(400).json({ error: 'Missing url parameter' });

                const deleted = await storageService.deleteFile(urlOrPath);
                res.json({ message: 'File deleted from GCS', success: deleted });
            } catch (err) {
                res.status(500).json({ error: 'Delete from GCS failed', details: err.message });
            }
        });

        app.get('/api/storage/list', async (req, res) => {
            try {
                const folderKey = (req.query.folder || '').toUpperCase();
                const prefix = storageService.FOLDERS[folderKey] || req.query.prefix || '';
                const files = await storageService.listFiles(prefix);
                res.json({ files, count: files.length, bucket: storageService.bucketName });
            } catch (err) {
                res.status(500).json({ error: 'Listing files failed', details: err.message });
            }
        });

        app.get('/api/storage/signed-url', async (req, res) => {
            try {
                const fileUrlOrPath = req.query.path || req.query.url;
                if (!fileUrlOrPath) return res.status(400).json({ error: 'Missing path or url parameter' });
                const signedUrl = await storageService.generateSignedUrl(fileUrlOrPath);
                res.json({ signedUrl });
            } catch (err) {
                res.status(500).json({ error: 'Signed URL generation failed', details: err.message });
            }
        });

        // 7. PATCH /api/projects/:id/status - Admin: toggle status
        app.patch('/api/projects/:id/status', auth, checkPermission('projects.edit'), async (req, res) => {
            try {
                const project = await Project.findOne({ _id: req.params.id, deleted_at: null });
                if (!project) return res.status(404).json({ message: 'Project not found' });

                project.status = project.status === 'active' ? 'inactive' : 'active';
                await project.save();
                res.json({ message: `Project ${project.status === 'active' ? 'activated' : 'deactivated'} successfully`, project });
            } catch (err) {
                res.status(500).json({ error: 'Failed to update project status', details: err.message });
            }
        });

        // Razorpay create order endpoint
        const Razorpay = require('razorpay');
        app.post('/api/payment/create-order', async (req, res) => {
            try {
                const { amount, planTitle } = req.body;
                if (!amount) return res.status(400).json({ error: 'Amount is required' });
                
                const instance = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID || 'TEST_KEY_ID',
                    key_secret: process.env.RAZORPAY_KEY_SECRET || 'TEST_KEY_SECRET',
                });

                const options = {
                    amount: Math.round(amount * 100),
                    currency: "INR",
                    receipt: "receipt_" + Date.now()
                };

                const order = await instance.orders.create(options);
                res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID || 'TEST_KEY_ID' });
            } catch (error) {
                console.error("Error creating Razorpay order:", error);
                res.status(500).json({ error: "Failed to create order", details: error.message });
            }
        });


        // Global Error Handler
        app.use((err, req, res, next) => {
            console.error("🔥 Global Error caught:", err);
            res.status(500).json({ error: "An internal server error occurred.", details: err.message });
        });

        app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
