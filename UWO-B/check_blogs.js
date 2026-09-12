const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
const Blog = require('./models/Blog');

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const blogs = await Blog.find().sort({ createdAt: -1 });
    console.log("Blogs sorted by createdAt desc:");
    blogs.forEach(b => {
      console.log(`- Title: "${b.title}"\n  Slug: "${b.slug}"\n  Status: "${b.status}"\n  Category: "${b.category}"\n  Created: ${b.createdAt.toISOString()}\n`);
    });
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}
run();
