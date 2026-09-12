const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const TeamMember = require('../models/TeamMember');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

const IMAGE_MAPPINGS = {
    'Abha Jatav': 'https://storage.googleapis.com/uwo-document/team/images/team-13..webp',
    'Sakshi Thakur': 'https://storage.googleapis.com/uwo-document/team/images/team-9..webp',
    'Sandeep Yadav': 'https://storage.googleapis.com/uwo-document/team/images/team-3..webp',
    'Sukhmani Kaur': 'https://storage.googleapis.com/uwo-document/team/images/team-10..webp',
    'Aman Kharare': 'https://storage.googleapis.com/uwo-document/team/images/team-11..webp'
};

async function fixImages() {
    await mongoose.connect(MONGO_URI);
    console.log('🔧 Fixing missing team member image URLs...');

    for (const [name, gcsUrl] of Object.entries(IMAGE_MAPPINGS)) {
        const member = await TeamMember.findOne({ name });
        if (member) {
            member.image = gcsUrl;
            await member.save();
            console.log(`  ✅ Fixed ${name} -> ${gcsUrl}`);
        }
    }

    await mongoose.disconnect();
    console.log('✅ All team member image URLs fixed!');
}

fixImages();
