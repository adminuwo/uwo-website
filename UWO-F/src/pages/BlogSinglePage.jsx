import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getApiUrl, getBlogFallbackImage, resolveBlogImageUrl, CLOUD_RUN_BACKEND } from '../services/api';

const DEFAULT_FALLBACK_BLOGS = [
  {
    _id: '6a0c5f7890cf2101b6ae0352',
    slug: 'why-one-ai-assistant-is-better-than-ten-apps-a-practical-guide-to-working-smarter-with-aisa',
    title: 'Why One AI Assistant Is Better Than Ten Apps: A Practical Guide to Working Smarter with AISA™',
    category: 'AI & Automation',
    readTime: 3,
    views: 140,
    likes: 12,
    createdAt: '2026-08-06T12:17:39.508Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018463038-52f42a85.webp`,
    seoDescription: 'Every day, professionals switch between multiple apps just to complete one task. One tool to search for information, one to write, one to analyze data—the list goes on.',
    content: `
      <p>Every day, professionals switch between multiple apps just to complete one task. One tool to search for information, one to write, one to analyze data, another to manage tasks—the list goes on. This constant context switching leads to cognitive fatigue, fragmented information, and significant time loss.</p>
      
      <h2>The Multitasking Illusion</h2>
      <p>Studies show that switching between applications can cost up to 40% of a worker's productive time. When your workflow is scattered across ten different software subscriptions, context is lost in translation, search is inefficient, and collaboration breaks down.</p>
      
      <blockquote>
        "The future of software is not adding more siloed tools to your dock, but creating an ambient intelligence layer that orchestrates them all seamlessly."
      </blockquote>

      <h2>Enter AISA™: The Unified AI Operating System</h2>
      <p>AISA™ (AI Super Assistant) was engineered by UWO™ to solve this exact bottleneck. By integrating search, document creation, data synthesis, task management, and autonomous execution into a single cohesive interface, AISA™ eliminates the need for fragmented app silos.</p>
      
      <ul>
        <li><strong>Smart Deep Search:</strong> Query all your personal, workspace, and web data simultaneously without leaving your workspace.</li>
        <li><strong>Unified Workspace:</strong> Write, edit, and analyze without jumping between third-party apps.</li>
        <li><strong>Autonomous Multi-Agent Systems:</strong> Delegate complex multi-step workflows directly to specialized background agents.</li>
      </ul>
      
      <h2>The Result: True Cognitive Focus</h2>
      <p>By bringing every essential tool into one unified AI assistant, professionals report saving over 12 hours every week while producing higher-quality, context-aware work.</p>
    `,
    author: 'UWO Intelligence Desk'
  },
  {
    _id: '6a0c5f7890cf2101b6ae0353',
    slug: 'how-to-delete-your-aisa-account',
    title: 'How to Delete Your AISA™ Account',
    category: 'AISA™',
    readTime: 3,
    views: 98,
    likes: 8,
    createdAt: '2026-08-05T00:00:00Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018519262-5c172b24.webp`,
    seoDescription: 'A step-by-step guide to permanently removing your account, data, and associated credentials from the AISA™ platform.',
    content: `
      <p>Managing your data privacy and digital footprint is a core principle at UWO™. If you need to deactivate or permanently delete your AISA™ account, follow this streamlined verification workflow.</p>
      
      <h2>Step 1: Export Your Workspace Assets</h2>
      <p>Before initiating deletion, export any saved agent workflows, custom prompt templates, and synthesized document histories from your settings dashboard.</p>
      
      <h2>Step 2: Confirm Account Deletion</h2>
      <p>Navigate to Settings &gt; Security &gt; Delete Account. Re-enter your master credentials to securely purge all personal cognitive embeddings and billing profiles.</p>
    `,
    author: 'AISA Security Team'
  },
  {
    _id: '6a0c5f7890cf2101b6ae0354',
    slug: 'the-problem-every-professional-student-and-business-owner-faces-today',
    title: 'The Problem Every Professional, Student, and Business Owner Faces Today',
    category: 'AI & Automation',
    readTime: 5,
    views: 74,
    likes: 6,
    createdAt: '2026-07-22T00:00:00Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018046106-7b841386.webp`,
    seoDescription: 'How AI & Automation can save time, reduce stress, and boost productivity across modern professional workflows.',
    content: `
      <p>Modern professionals, students, and enterprise founders face an unprecedented avalanche of unstructured data, fragmented communication, and SaaS subscription overload.</p>
      
      <h2>Cognitive Overload in the Digital Era</h2>
      <p>The friction of switching between 15 different applications daily drains mental energy and causes critical errors. Single-pane cognitive environments replace disjointed interfaces with contextual intelligence that adapts to your workflow.</p>
    `,
    author: 'UWO Product Research'
  },
  {
    _id: '6a0c5f7890cf2101b6ae0355',
    slug: 'one-vision-five-powerful-brands-india-s-first-ai-ecosystem-has-arrived',
    title: "One Vision. Five Powerful Brands. India's First AI Ecosystem Has Arrived.",
    category: 'Technology & AI',
    readTime: 8,
    views: 38,
    likes: 15,
    createdAt: '2026-05-19T13:02:48.786Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018657975-b245bfc3.webp`,
    seoDescription: "What if one company could give you the AI tools to create, automate, connect, empower, and transform - all under a single ecosystem? That is exactly what UWO™ has built from the heart of Madhya Pradesh.",
    content: `
      <p>What if one company could give you the AI tools to create, automate, connect, empower, and transform - all under a single ecosystem?</p>
      <p>That is exactly what UWO™ (Unified Web Options & Services Pvt Ltd) has built from the heart of Madhya Pradesh. This is not just another software company. This is India's most ambitious AI movement.</p>
      
      <h2>The Five Pillars of the UWO™ Ecosystem</h2>
      <ul>
        <li><strong>AISA™:</strong> Next-generation AI Super Assistant powering cognitive productivity.</li>
        <li><strong>AISA Connect:</strong> Decentralized networking connecting businesses and AI capabilities.</li>
        <li><strong>AI Mall™:</strong> The unified digital marketplace for enterprise intelligence models.</li>
        <li><strong>EFV™:</strong> High-performance architecture framework for scalable intelligent systems.</li>
        <li><strong>A-Series™:</strong> Enterprise-grade intelligence appliances tailored for emerging industry verticals.</li>
      </ul>
    `,
    author: 'Gurumukh P. Ahuja'
  }
];

export default function BlogSinglePage() {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const slug = routeSlug || searchParams.get('slug') || '';

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('Copy Article URL');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reading progress bar listener
  useEffect(() => {
    const onScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        const scrolled = (winScroll / height) * 100;
        setScrollProgress(Math.min(100, Math.max(0, scrolled)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch article details
  useEffect(() => {
    if (!slug) {
      navigate('/blogs', { replace: true });
      return;
    }

    let isMounted = true;
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      let data = null;

      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/blogs/views/${encodeURIComponent(slug)}`, {
          method: 'POST'
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn('Backend fetch failed, checking local fallbacks:', err);
      }

      // Check fallback list
      if (!data) {
        data = DEFAULT_FALLBACK_BLOGS.find(
          (b) => b.slug === slug || b._id === slug || (b.title && b.title.toLowerCase().includes(slug.toLowerCase()))
        );
      }

      if (isMounted) {
        if (data) {
          setBlog(data);
          setLikes(data.likes || 0);
          document.title = `${data.seoTitle || data.title} | UWO™`;
          setLoading(false);

          // Fetch related articles
          try {
            const apiUrl = getApiUrl();
            const relRes = await fetch(`${apiUrl}/blogs?category=${encodeURIComponent(data.category || '')}`);
            if (relRes.ok) {
              const relData = await relRes.json();
              const filtered = relData.filter((b) => b.slug !== slug && b._id !== slug).slice(0, 3);
              setRelatedBlogs(filtered.length > 0 ? filtered : DEFAULT_FALLBACK_BLOGS.filter((b) => b.slug !== slug).slice(0, 3));
            } else {
              setRelatedBlogs(DEFAULT_FALLBACK_BLOGS.filter((b) => b.slug !== slug).slice(0, 3));
            }
          } catch {
            setRelatedBlogs(DEFAULT_FALLBACK_BLOGS.filter((b) => b.slug !== slug).slice(0, 3));
          }
        } else {
          setError('Article not found.');
          setLoading(false);
        }
      }
    };

    fetchArticle();
    return () => { isMounted = false; };
  }, [slug, navigate]);

  const handleLike = async () => {
    if (hasLiked || !blog) return;
    setLikes(prev => prev + 1);
    setHasLiked(true);

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/blogs/${encodeURIComponent(blog.slug || blog._id)}/like`, {
        method: 'POST'
      });
    } catch {
      // Ignored for offline grace
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(blog ? blog.title : 'Check out this UWO Insight!');

    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${title}%20${url}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback('Copied URL!');
    setTimeout(() => setCopyFeedback('Copy Article URL'), 3000);
  };

  const resolveImage = (b) => {
    if (!b) return getBlogFallbackImage();
    try {
      const img = resolveBlogImageUrl(b);
      return img || getBlogFallbackImage(b.category, b.title);
    } catch {
      return getBlogFallbackImage(b?.category, b?.title);
    }
  };

  const avatarInitial = (blog?.author || 'UWO').charAt(0).toUpperCase();

  return (
    <div className="single-theme-page">
      {/* Reading Progress Bar */}
      <div id="progress-bar" style={{ width: `${scrollProgress}%` }} />

      <style>{`
        /* ============================================
           UWO™ ARTICLE — PREMIUM WARM EDITORIAL PALETTE
        ============================================ */
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Inter:wght@400;500;600;700;800&display=swap');

        .single-theme-page {
          --ivory: #F5F1E8;
          --beige: #EDE5D4;
          --beige-card: #F0EAD8;
          --beige-border: #DDD0B8;
          --champagne: #C9A66B;
          --gold: #B8955A;
          --gold-light: rgba(201, 166, 107, 0.15);
          --espresso: #1F1A17;
          --brown-muted: #6E6257;
          --brown-light: #8C7B6E;

          background: var(--ivory) !important;
          background-image:
            radial-gradient(ellipse at 0% 0%, rgba(201, 166, 107, 0.10) 0px, transparent 55%),
            radial-gradient(ellipse at 100% 80%, rgba(216, 193, 160, 0.16) 0px, transparent 55%) !important;
          color: var(--espresso) !important;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          padding-top: 130px;
          padding-bottom: 90px;
        }

        #progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(to right, #C9A66B, #E8C87A);
          z-index: 10000;
          transition: width 0.1s ease;
          box-shadow: 0 0 8px rgba(201, 166, 107, 0.4);
        }

        .single-theme-page .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .single-theme-page .article-wrapper {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 50px;
          margin-bottom: 80px;
        }

        .single-theme-page .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--gold);
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 30px;
          cursor: pointer;
          text-decoration: none;
          transition: gap 0.2s;
        }

        .single-theme-page .back-btn:hover {
          gap: 15px;
          color: var(--champagne);
        }

        .single-theme-page .article-header {
          margin-bottom: 36px;
        }

        .single-theme-page .blog-tag {
          background: var(--gold-light);
          color: var(--gold);
          border: 1px solid rgba(184, 149, 90, 0.25);
          padding: 5px 16px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: inline-block;
          margin-bottom: 18px;
        }

        .single-theme-page .article-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.8rem;
          font-weight: 800;
          line-height: 1.2;
          color: var(--espresso);
          margin-bottom: 22px;
        }

        .single-theme-page .blog-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 13px;
          color: var(--brown-light);
          border-bottom: 1px solid var(--beige-border);
          padding-bottom: 18px;
          flex-wrap: wrap;
        }

        .single-theme-page .meta-item {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .single-theme-page .article-banner-img {
          width: 100%;
          height: 380px;
          object-fit: cover;
          border-radius: 28px;
          border: 1px solid var(--beige-border);
          box-shadow: 0 24px 60px rgba(110, 98, 87, 0.12);
          margin-bottom: 40px;
        }

        .single-theme-page .blog-content {
          font-size: 1.1rem;
          line-height: 1.65;
          color: #3D3530;
        }

        .single-theme-page .blog-content p {
          margin-top: 0;
          margin-bottom: 18px;
        }

        .single-theme-page .blog-content h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem;
          font-weight: 700;
          color: var(--espresso);
          margin-top: 36px;
          margin-bottom: 14px;
        }

        .single-theme-page .blog-content h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--espresso);
          margin-top: 26px;
          margin-bottom: 10px;
        }

        .single-theme-page .blog-content blockquote {
          border-left: 4px solid var(--champagne);
          background: linear-gradient(135deg, rgba(201, 166, 107, 0.08), rgba(240, 234, 216, 0.6));
          padding: 24px 28px;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 1.25rem;
          color: var(--espresso);
          border-radius: 0 20px 20px 0;
          margin: 30px 0;
          line-height: 1.55;
        }

        .single-theme-page .blog-content ul,
        .single-theme-page .blog-content ol {
          margin-bottom: 20px;
          padding-left: 24px;
        }

        .single-theme-page .blog-content li {
          margin-bottom: 8px;
          color: #3D3530;
        }

        .single-theme-page .blog-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 18px;
          margin: 24px 0;
          border: 1px solid var(--beige-border);
          box-shadow: 0 12px 32px rgba(110, 98, 87, 0.10);
        }

        /* ---- LIKE BAR ---- */
        .single-theme-page .like-bar {
          margin-top: 40px;
          padding: 24px 0;
          border-top: 1px solid var(--beige-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .single-theme-page .like-btn {
          background: var(--gold-light);
          border: 1px solid rgba(184, 149, 90, 0.25);
          color: var(--gold);
          padding: 10px 24px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
          font-family: inherit;
        }

        .single-theme-page .like-btn:hover {
          background: var(--champagne);
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(201, 166, 107, 0.25);
        }

        .single-theme-page .like-btn.liked {
          background: var(--champagne);
          color: #fff;
          opacity: 0.85;
          cursor: default;
        }

        /* ---- AUTHOR BIO ---- */
        .single-theme-page .author-bio {
          background: linear-gradient(135deg, var(--beige-card), #EDE5D4);
          border: 1px solid var(--beige-border);
          border-radius: 22px;
          padding: 32px;
          margin-top: 50px;
          display: flex;
          gap: 24px;
          align-items: center;
          box-shadow: 0 12px 36px rgba(110, 98, 87, 0.09);
        }

        .single-theme-page .author-avatar {
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--champagne), #E8C87A);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 900;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(201, 166, 107, 0.25);
        }

        /* ---- SIDEBAR ---- */
        .single-theme-page .share-sidebar {
          position: sticky;
          top: 120px;
          height: fit-content;
        }

        .single-theme-page .sidebar-widget {
          background: var(--beige-card);
          border: 1px solid var(--beige-border);
          border-radius: 22px;
          padding: 24px;
          margin-bottom: 28px;
          box-shadow: 0 10px 30px rgba(110, 98, 87, 0.07);
        }

        .single-theme-page .widget-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--espresso);
          margin-bottom: 18px;
          border-left: 3px solid var(--champagne);
          padding-left: 12px;
        }

        .single-theme-page .share-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .single-theme-page .share-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          color: var(--espresso);
          border: 1px solid var(--beige-border);
          background: var(--ivory);
          transition: all 0.25s;
          cursor: pointer;
          font-family: inherit;
        }

        .single-theme-page .share-btn:hover {
          transform: translateY(-2px);
          color: #fff;
        }

        .single-theme-page .share-btn.twitter:hover {
          background: #000;
          border-color: #333;
        }

        .single-theme-page .share-btn.linkedin:hover {
          background: #0077b5;
          border-color: #0077b5;
        }

        .single-theme-page .share-btn.facebook:hover {
          background: #1877f2;
          border-color: #1877f2;
        }

        .single-theme-page .share-btn.whatsapp:hover {
          background: #25d366;
          border-color: #25d366;
        }

        .single-theme-page .share-btn.copy-link:hover {
          background: var(--champagne);
          color: #fff;
          border-color: var(--champagne);
        }

        /* ---- RELATED ITEMS ---- */
        .single-theme-page .related-blog-item {
          display: flex;
          gap: 14px;
          margin-bottom: 18px;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .single-theme-page .related-blog-img {
          width: 76px;
          height: 58px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid var(--beige-border);
          flex-shrink: 0;
        }

        .single-theme-page .related-blog-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--espresso);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
        }

        .single-theme-page .related-blog-item:hover .related-blog-title {
          color: var(--gold);
        }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 992px) {
          .single-theme-page .article-wrapper {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .single-theme-page .article-banner-img {
            height: 300px;
          }

          .single-theme-page .share-sidebar {
            position: static;
          }

          .single-theme-page .share-buttons {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .single-theme-page .share-btn {
            width: calc(50% - 5px);
          }
        }

        @media (max-width: 768px) {
          .single-theme-page {
            padding-top: 100px;
          }

          .single-theme-page .article-title {
            font-size: 2rem;
          }

          .single-theme-page .article-banner-img {
            height: 240px;
            border-radius: 18px;
          }

          .single-theme-page .author-bio {
            flex-direction: column;
            text-align: center;
            padding: 22px;
          }

          .single-theme-page .share-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#6E6257' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '40px', color: '#B8955A', marginBottom: '20px' }}></i>
            <p style={{ fontSize: '1.1rem' }}>Decrypting database records...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--beige-card)',
            border: '1px solid var(--beige-border)',
            borderRadius: '24px',
            maxWidth: '600px',
            margin: '40px auto',
            boxShadow: '0 12px 36px rgba(110, 98, 87, 0.08)'
          }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '44px', color: '#ef4444', marginBottom: '15px' }}></i>
            <h3 style={{ fontSize: '1.4rem', color: '#1F1A17' }}>Insight Decryption Failed</h3>
            <p style={{ color: '#6E6257', marginTop: '8px' }}>Check if backend is connected or if this article slug is valid.</p>
            <Link
              to="/blogs"
              className="like-btn"
              style={{
                marginTop: '22px',
                display: 'inline-flex',
                background: '#C9A66B',
                color: '#fff',
                textDecoration: 'none'
              }}
            >
              Return to Insights
            </Link>
          </div>
        )}

        {!loading && !error && blog && (
          <div className="article-wrapper">
            {/* Main Article Content */}
            <main id="mainArticle">
              <Link to="/blogs" className="back-btn">
                <i className="fa-solid fa-arrow-left-long"></i> Back to Insights
              </Link>

              <header className="article-header">
                <span className="blog-tag">{blog.category}</span>
                <h1 className="article-title">{blog.title}</h1>

                <div className="blog-meta">
                  <div className="meta-item">
                    <i className="fa-regular fa-user"></i>
                    <span>{blog.author || 'UWO Intelligence Desk'}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fa-regular fa-calendar"></i>
                    <span>{new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fa-regular fa-clock"></i>
                    <span>{blog.readTime || 3} min read</span>
                  </div>
                  <div className="meta-item">
                    <i className="fa-regular fa-eye"></i>
                    <span>{blog.views || 1} views</span>
                  </div>
                </div>
              </header>

              <img
                src={resolveImage(blog)}
                alt={blog.title}
                className="article-banner-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getBlogFallbackImage(blog.category, blog.title);
                }}
              />

              {/* Render article body */}
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: blog.content || `<p>${blog.seoDescription || ''}</p>` }}
              />

              {/* Like / Appreciate Bar */}
              <div className="like-bar">
                <button
                  type="button"
                  className={`like-btn${hasLiked ? ' liked' : ''}`}
                  onClick={handleLike}
                >
                  <i className={`fa-${hasLiked ? 'solid' : 'regular'} fa-thumbs-up`}></i>
                  <span>{hasLiked ? 'Appreciated' : 'Appreciate'}</span> ({likes})
                </button>

                <span style={{ fontSize: '13px', color: '#6E6257' }}>
                  Loved this? Appreciate or share with your team.
                </span>
              </div>

              {/* Author Biography */}
              <div className="author-bio">
                <div className="author-avatar">{avatarInitial}</div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1F1A17', fontSize: '18px', fontWeight: 800 }}>
                    {blog.author || 'UWO Intelligence Desk'}
                  </h3>
                  <p style={{ margin: 0, color: '#6E6257', fontSize: '14px', lineHeight: 1.6 }}>
                    UWO's core engineering and product research teams collaborate to analyze and publish deep insights on autonomous intelligence architectures, decentralized digital commerce, and universal scale systems.
                  </p>
                </div>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="share-sidebar">
              {/* Share Widget */}
              <div className="sidebar-widget">
                <h3 className="widget-title">Share Insight</h3>
                <div className="share-buttons">
                  <button type="button" className="share-btn twitter" onClick={() => handleShare('twitter')}>
                    <i className="fa-brands fa-x-twitter"></i> Share on X
                  </button>
                  <button type="button" className="share-btn linkedin" onClick={() => handleShare('linkedin')}>
                    <i className="fa-brands fa-linkedin-in"></i> Share on LinkedIn
                  </button>
                  <button type="button" className="share-btn facebook" onClick={() => handleShare('facebook')}>
                    <i className="fa-brands fa-facebook-f"></i> Share on Facebook
                  </button>
                  <button type="button" className="share-btn whatsapp" onClick={() => handleShare('whatsapp')}>
                    <i className="fa-brands fa-whatsapp"></i> WhatsApp Link
                  </button>
                  <button type="button" className="share-btn copy-link" onClick={handleCopyLink}>
                    <i className="fa-regular fa-copy"></i> <span>{copyFeedback}</span>
                  </button>
                </div>
              </div>

              {/* Related Insights Widget */}
              <div className="sidebar-widget">
                <h3 className="widget-title">Related Insights</h3>
                <div className="related-blogs-list">
                  {relatedBlogs.length === 0 ? (
                    <p style={{ color: '#6E6257', fontSize: '12px' }}>No other articles in this category.</p>
                  ) : (
                    relatedBlogs.map((rel) => (
                      <Link
                        key={rel._id || rel.slug}
                        to={`/blogs/${rel.slug || rel._id}`}
                        className="related-blog-item"
                      >
                        <img
                          src={resolveImage(rel)}
                          alt={rel.title}
                          className="related-blog-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getBlogFallbackImage(rel.category, rel.title);
                          }}
                        />
                        <div>
                          <h4 className="related-blog-title">{rel.title}</h4>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#8C7B6E', fontWeight: 600 }}>
                            {new Date(rel.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
