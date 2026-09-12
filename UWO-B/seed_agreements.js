/**
 * Seed Agreement Sections into the Settings collection
 * 
 * This script reads the agreement data from the UWOWEBF/aisa-connect/aisa_full_agreements.json file
 * and inserts the sections into MongoDB Settings with the keys that the public API expects:
 *   pricing_sections_ac_starter_launch
 *   pricing_sections_ac_growth_engine
 *   pricing_sections_ac_enterprise
 */

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Fix DNS for local dev
if (!process.env.K_SERVICE) {
    try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}
}

const Settings = require('./models/Settings');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

// Map from JSON key (plan name) -> Settings key
const PLAN_KEY_MAP = {
    'Starter Launch': 'ac_starter_launch',
    'Growth Engine': 'ac_growth_engine',
    'Enterprise': 'ac_enterprise'
};

async function seedAgreements() {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected');

    // Read the agreements JSON
    const jsonPath = path.resolve(__dirname, '..', 'UWOWEBF', 'aisa-connect', 'aisa_full_agreements.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Agreement JSON not found at:', jsonPath);
        process.exit(1);
    }

    const agreements = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const [planName, planData] of Object.entries(agreements)) {
        const planKey = PLAN_KEY_MAP[planName];
        if (!planKey) {
            console.log(`⏭️  Skipping unknown plan: "${planName}"`);
            continue;
        }

        const sections = planData.sections;
        if (!sections || !Array.isArray(sections) || sections.length === 0) {
            console.log(`⚠️  No sections found for plan: "${planName}"`);
            continue;
        }

        const settingsKey = `pricing_sections_${planKey}`;

        await Settings.findOneAndUpdate(
            { key: settingsKey },
            { key: settingsKey, value: JSON.stringify(sections) },
            { upsert: true, new: true }
        );

        console.log(`✅ Seeded ${sections.length} sections for "${planName}" → key: "${settingsKey}"`);
    }

    console.log('\n🎉 All agreement sections seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
}

seedAgreements().catch(err => {
    console.error('❌ Seed script error:', err);
    process.exit(1);
});
