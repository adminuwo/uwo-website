const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
const Blog = require('./models/Blog');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

async function run() {
  try {
    console.log("Connecting to:", MONGO_URI.replace(/:[^@]+@/, ":****@"));
    await mongoose.connect(MONGO_URI);
    
    const TeamMember = require('./models/TeamMember');
    const count = await TeamMember.countDocuments();
    console.log(`Total team members found in collection: ${count}`);
    
    const members = await TeamMember.find({ deletedAt: null });
    console.log("Team members list:");
    members.forEach(m => {
      console.log(`- Name: ${m.name}, Image: ${m.image}`);
    });
    
    mongoose.connection.close();
  } catch (err) {
    console.error("Query failed:", err);
  }
}

run();
