const mongoose = require('mongoose');
const dns = require('dns');

// Force DNS to use Google servers to fix SRV lookup issue
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
const path = require('path');
const Blog = require('./models/Blog');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

const authenticBlogs = [
  {
    title: "Why One AI Assistant Is Better Than Ten Apps: A Practical Guide to Working Smarter with AISA™",
    slug: "why-one-ai-assistant-is-better-than-ten-apps-a-practical-guide-to-working-smarter-with-aisa",
    coverImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018463038-52f42a85.webp",
    featuredImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018463038-52f42a85.webp",
    author: "UWO Team",
    category: "AI & Automation",
    tags: ["AISA", "Productivity", "AI Assistant"],
    seoTitle: "Why One AI Assistant Is Better Than Ten Apps: A Practical Guide to Working Smarter with AISA™",
    seoDescription: "Every day, professionals switch between multiple apps just to complete one task. One tool to search for information, one to write, one to analyze data—the list goes on.",
    content: `
      <p>Every day, professionals switch between multiple apps just to complete one task. One tool to search for information, one to write, one to analyze data, another to manage tasks—the list goes on. This constant context switching leads to cognitive fatigue, fragmented information, and significant time loss.</p>
      <h3>The Multitasking Illusion</h3>
      <p>Studies show that switching between applications can cost up to 40% of a worker's productive time. When your workflow is scattered across ten different software subscriptions, context is lost in translation, search is inefficient, and collaboration breaks down.</p>
      <h3>Enter AISA™: The Unified AI Operating System</h3>
      <p>AISA™ (AI Super Assistant) was engineered by UWO™ to solve this exact bottleneck. By integrating search, document creation, data synthesis, task management, and autonomous execution into a single cohesive interface, AISA™ eliminates the need for fragmented app silos.</p>
      <ul>
        <li><strong>Smart Deep Search:</strong> Query all your personal, workspace, and web data simultaneously.</li>
        <li><strong>Unified Workspace:</strong> Write, edit, and analyze without leaving your primary intelligence layer.</li>
        <li><strong>Autonomous Multi-Agent Systems:</strong> Delegate complex workflows directly to specialized background agents.</li>
      </ul>
      <h3>The Result: True Cognitive Focus</h3>
      <p>By bringing every essential tool into one unified AI assistant, professionals report saving over 12 hours every week while producing higher-quality, context-aware work.</p>
    `,
    status: "published",
    views: 140,
    likes: 54,
    readTime: 3,
    createdAt: new Date("2026-08-06T12:14:23.038Z")
  },
  {
    title: "How to Delete Your AISA™ Account",
    slug: "how-to-delete-your-aisa-account",
    coverImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018519262-5c172b24.webp",
    featuredImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018519262-5c172b24.webp",
    author: "UWO Support",
    category: "AISA™",
    tags: ["Support", "Privacy", "Account"],
    seoTitle: "How to Delete Your AISA™ Account | UWO Privacy Standards",
    seoDescription: "A step-by-step guide to deleting your AISA™ account and understanding your data rights under UWO privacy standards.",
    content: `
      <p>We believe in absolute data sovereignty and user privacy. If you ever decide to discontinue your journey with AISA™, we ensure the account deletion process is simple, transparent, and permanent.</p>
      <h3>Steps to Delete Your Account:</h3>
      <ol>
        <li>Open your AISA™ dashboard or navigate to Account Settings.</li>
        <li>Scroll down to the Security & Privacy section.</li>
        <li>Click on "Delete Account" and verify your password or OTP confirmation.</li>
        <li>Confirm the final deletion request. All your synced documents, chat histories, and API sessions will be purged in compliance with our data protection policies.</li>
      </ol>
      <p>If you need assistance, please contact our support team at admin@uwo24.com.</p>
    `,
    status: "published",
    views: 65,
    likes: 12,
    readTime: 2,
    createdAt: new Date("2026-08-06T12:15:19.262Z")
  },
  {
    title: "The Problem Every Professional, Student, and Business Owner Faces Today",
    slug: "the-problem-every-professional-student-and-business-owner-faces-today",
    coverImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018046106-7b841386.webp",
    featuredImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018046106-7b841386.webp",
    author: "UWO Team",
    category: "AI & Automation",
    tags: ["Workflows", "Automation", "Focus"],
    seoTitle: "The Problem Every Professional, Student, and Business Owner Faces Today",
    seoDescription: "Discover why digital tool fragmentation is eroding focus, and how unified AI architecture brings effortless clarity to daily operations.",
    content: `
      <p>Modern professionals and students spend up to 2.5 hours every day just searching for information scattered across disparate platforms. Notes are in one app, spreadsheets in another, research papers in browser tabs, and communication in yet another silo.</p>
      <h3>Why Tool Fragmentation Fails</h3>
      <p>More software subscriptions do not translate to higher productivity. Instead, tool fatigue sets in, creating friction at every step of execution.</p>
      <h3>Unified Cognitive Workspaces</h3>
      <p>By bringing unified semantic search, autonomous agent execution, and real-time generation together, UWO provides a cohesive environment where work flows naturally without distraction.</p>
    `,
    status: "published",
    views: 92,
    likes: 31,
    readTime: 5,
    createdAt: new Date("2026-08-06T12:10:46.106Z")
  },
  {
    title: "One Vision. Five Powerful Brands. India's First AI Ecosystem Has Arrived.",
    slug: "one-vision-five-powerful-brands-india-s-first-ai-ecosystem-has-arrived",
    coverImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018657975-b245bfc3.webp",
    featuredImage: "https://storage.googleapis.com/uwo-document/blogs/images/blog-1786018657975-b245bfc3.webp",
    author: "Gurumukh P. Ahuja, Founder — UWO™",
    category: "Technology & AI",
    tags: ["Ecosystem", "India AI", "Innovation"],
    seoTitle: "One Vision. Five Powerful Brands. India's First AI Ecosystem Has Arrived.",
    seoDescription: "What if one company could give you the AI tools to create, automate, connect, empower, and transform — all under a single ecosystem? That is exactly what UWO™ has built from the heart of Madhya Pradesh.",
    content: `
      <p>By Gurumukh P. Ahuja, Founder — UWO™</p>
      <p>What if one company could give you the AI tools to create, automate, connect, empower, and transform — all under a single ecosystem?<br/>
      That is exactly what UWO™ (Unified Web Options & Services Pvt Ltd) has built from the heart of Madhya Pradesh. This is not just another software company. This is India's most ambitious AI movement — and it started right here in Jabalpur.</p>
      <h3>The 5 Pillars of the UWO Ecosystem:</h3>
      <ul>
        <li><strong>AISA™:</strong> The AI Super Assistant combining personal and enterprise workflow execution.</li>
        <li><strong>AI Mall™:</strong> Decentralized marketplace connecting cognitive models to consumer apps.</li>
        <li><strong>EFV™:</strong> High-performance enterprise framework validation.</li>
        <li><strong>A-Series™:</strong> Proprietary hardware and edge computing systems.</li>
        <li><strong>AISA Connect:</strong> Seamless integration bridge for third-party business tools.</li>
      </ul>
    `,
    status: "published",
    views: 38,
    likes: 19,
    readTime: 8,
    createdAt: new Date("2026-05-19T13:02:48.786Z")
  }
];

async function seed() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Database connected");

    for (const blog of authenticBlogs) {
      await Blog.findOneAndUpdate(
        { slug: blog.slug },
        blog,
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`✅ Upserted blog: "${blog.title}"`);
    }

    const total = await Blog.countDocuments();
    console.log(`🎉 Seeding complete. Total active blogs in database: ${total}`);

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
