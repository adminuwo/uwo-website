const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');

// Force DNS to use Google servers to fix Reliance Jio SRV lookup issue
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

function makePathRelative(absolutePath) {
    if (!absolutePath) return absolutePath;
    const mediaToken = '/api/media/';
    const index = absolutePath.indexOf(mediaToken);
    if (index !== -1) {
        return absolutePath.substring(index);
    }
    return absolutePath;
}

async function run() {
    try {
        console.log("🚀 Connecting to database...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected successfully");

        const TeamMember = require('./models/TeamMember');
        const Project = require('./models/Project');

        // 1. Update Team Members
        const members = await TeamMember.find({ deletedAt: null });
        console.log(`🔍 Found ${members.length} team members. Processing images...`);
        let membersUpdated = 0;
        for (const member of members) {
            if (member.image && member.image.includes('/api/media/')) {
                const relativeImage = makePathRelative(member.image);
                if (relativeImage !== member.image) {
                    console.log(`   Updating team member ${member.name}: ${member.image} -> ${relativeImage}`);
                    member.image = relativeImage;
                    await member.save();
                    membersUpdated++;
                }
            }
        }
        console.log(`✅ Updated ${membersUpdated} team member image paths.`);

        // 2. Update Projects
        const projects = await Project.find({ deleted_at: null });
        console.log(`\n🔍 Found ${projects.length} projects. Processing logos...`);
        let projectsUpdated = 0;
        for (const project of projects) {
            if (project.logo && project.logo.includes('/api/media/')) {
                const relativeLogo = makePathRelative(project.logo);
                if (relativeLogo !== project.logo) {
                    console.log(`   Updating project ${project.name}: ${project.logo} -> ${relativeLogo}`);
                    project.logo = relativeLogo;
                    await project.save();
                    projectsUpdated++;
                }
            }
        }
        console.log(`✅ Updated ${projectsUpdated} project logo paths.`);

        mongoose.connection.close();
        console.log("\n🎉 Database cleanup complete!");
    } catch (err) {
        console.error("❌ Database cleanup failed:", err);
        process.exit(1);
    }
}

run();
