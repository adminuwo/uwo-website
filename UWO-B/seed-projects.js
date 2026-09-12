require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Fix Jio DNS SRV issue
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const count = await Project.countDocuments({ deleted_at: null });
    if (count > 0) {
        console.log(`ℹ️ Projects already exist (${count} found). Deleting and re-seeding...`);
        await Project.deleteMany({});
    }

    const projects = [
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

    await Project.insertMany(projects);
    console.log('✅ AI Mall, AISA, EFV — all 3 projects inserted successfully!');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
