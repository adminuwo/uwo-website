const mongoose = require('mongoose');
const dns = require('dns');

// Force DNS to use Google servers to fix SRV lookup issue
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
const path = require('path');
const Blog = require('./models/Blog');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

const mockBlogs = [
  {
    title: "The Shift to Autonomous Enterprise: Navigating Multi-Agent Orchestration",
    slug: "autonomous-enterprise-multi-agent-orchestration",
    category: "AI & Automation",
    author: "UWO Engineering",
    readTime: 5,
    featuredImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p>In the evolving landscape of enterprise software, the transition from simple automated workflows to autonomous agent-driven ecosystems marks the beginning of a new industrial revolution. Rather than following rigid, pre-defined scripts, modern enterprises are deploying multi-agent swarms that dynamically collaborate, coordinate, and execute highly complex business requirements.</p>
      
      <h2>1. Defining the Autonomous Swarm Architecture</h2>
      <p>Unlike single-agent systems which are restricted to narrow-focus tasks, a multi-agent orchestration layer allows for specialization. Agents are assigned discrete roles—such as Data Analysts, Quality Reviewers, Compliance Officers, and Code Execution engines—and coordinate dynamically via semantic consensus mechanisms.</p>
      
      <blockquote>"Autonomous orchestration does not replace human ingenuity; it scales it at a factor of thousands, freeing engineers and designers to focus strictly on creative direction."</blockquote>

      <h2>2. Consensus and Decision Frameworks</h2>
      <p>To orchestrate multiple intelligent entities seamlessly, we utilize hierarchical prompt routing combined with vector-based memory pipelines. When a high-level corporate objective is received, the router agent breaks down the problem, delegates sub-tasks to specialized sub-agents, and verifies output accuracy before compilation.</p>
      
      <ul>
        <li><b>Semantic Validation:</b> Checking generated outputs against organizational policies using fast embedding engines.</li>
        <li><b>Dynamic Memory Retrieval:</b> Supplying agents with real-time contextual indexes through GCS vector embeddings.</li>
        <li><b>Feedback Loops:</b> Enabling self-correction where failure prompts automatically trigger corrective sub-routines.</li>
      </ul>

      <pre><code>// Example orchestration route snippet
const consensusScore = await orchestrator.evaluateConsensus([
  agentA.generateResponse(context),
  agentB.generateResponse(context)
]);
if (consensusScore < 0.85) {
  await orchestrator.triggerFeedbackCorrectionLoop();
}</code></pre>

      <h2>3. Moving Forward with UWO™ and AISA™</h2>
      <p>Through our dedicated cognitive engines inside UWO™ and AISA™, we are bridging the gap between legacy infrastructure and intelligent autonomous layers, driving operational overhead down by up to 80% while scaling output speed globally.</p>
    `,
    seoTitle: "Autonomous Enterprise: Multi-Agent Orchestration Guide | UWO™",
    seoDescription: "An in-depth look at how multi-agent swarms coordinate to execute complex corporate objectives, driving efficiency and scaling intelligent outputs.",
    status: "published",
    views: 142,
    likes: 48,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3) // 3 days ago
  },
  {
    title: "Building Universal Scale Architecture for Real-Time Decision Engines",
    slug: "universal-scale-architecture-real-time-decision",
    category: "Tech Insights",
    author: "Aditi Sharma",
    readTime: 4,
    featuredImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p>As micro-seconds dictate the success of modern SaaS portals, building data pipelines capable of ingesting millions of telemetry signals per second is no longer optional. This article details the universal scale architecture developed at UWO to route and compute telemetry in real-time.</p>
      
      <h2>1. The Micro-Frontend Data Density Problem</h2>
      <p>When serving thousands of clients simultaneously, telemetry and event ingestion pipelines often bottleneck. We overcome this by utilizing edge-cached event queues, grouping events into high-density binary arrays before routing them to our central Node clusters.</p>
      
      <blockquote>"By treating network packets as continuous streams rather than discrete, heavy transactions, we reduce payload delivery overhead by 65%."</blockquote>

      <h2>2. Sharding Strategies in Atlas Clusters</h2>
      <p>Standard horizontal partitions are highly inefficient for high-density transactional platforms. We implement geographic sharding combined with primary-key hashing, ensuring that telemetry signals are routed to the nearest regional database node for instant write operations.</p>
    `,
    seoTitle: "Real-Time Universal Scale Data Architecture | UWO™",
    seoDescription: "Discover UWO's technical approach to real-time event streaming, micro-frontend sharding strategies, and multi-region MongoDB Atlas performance.",
    status: "published",
    views: 89,
    likes: 31,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1) // 1 day ago
  },
  {
    title: "Redefining High-Conversion E-Commerce Interfaces with Generative Search",
    slug: "redefining-high-conversion-ecommerce-generative-search",
    category: "Digital Commerce",
    author: "Sreshthi Sen",
    readTime: 3,
    featuredImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p>The traditional e-commerce search bar is dead. Today's hyper-active buyers don't search using exact keywords—they ask descriptive questions, look for curated solutions, and expect highly personalized, conversational layouts. In this piece, we explore how UWO's AI Mall™ integrates generative search for peak conversion.</p>
      
      <h2>1. The Death of the Keyword Filter</h2>
      <p>Standard database queries often miss high-intent customer requests because of simple spelling variations or different synonyms. By migrating to semantic search, we map customer intent rather than characters, yielding a 35% increase in user retention.</p>
    `,
    seoTitle: "Generative Search & E-Commerce Conversions | UWO™",
    seoDescription: "How semantic query processing and generative interfaces are replacing legacy keyword filtering to skyrocket customer conversion rates.",
    status: "published",
    views: 65,
    likes: 22,
    createdAt: new Date()
  }
];

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Seed database connected");

    // Clear existing mock data with matching slugs to avoid duplicate keys
    const slugs = mockBlogs.map(b => b.slug);
    await Blog.deleteMany({ slug: { $in: slugs } });
    console.log("🗑️ Cleaned up existing sample entries");

    // Insert new seeds
    await Blog.insertMany(mockBlogs);
    console.log("🎉 Successfully seeded 3 futuristic UWO blog publications!");
    
    mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
