import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs, resolveBlogImageUrl, getBlogFallbackImage, CLOUD_RUN_BACKEND } from '../services/api';

const DEFAULT_BLOGS = [
  {
    _id: '6a0c5f7890cf2101b6ae0352',
    slug: 'why-one-ai-assistant-is-better-than-ten-apps-a-practical-guide-to-working-smarter-with-aisa',
    title: 'Why One AI Assistant Is Better Than Ten Apps: A Practical Guide to Working Smarter with AISA™',
    category: 'AI & Automation',
    readTime: 3,
    views: 140,
    createdAt: '2026-08-06T12:17:39.508Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018463038-52f42a85.webp`,
    seoDescription: 'Every day, professionals switch between multiple apps just to complete one task. One tool to search for information, one to write, one to analyze data—the list goes on.',
    is_featured: true
  },
  {
    _id: '6a0c5f7890cf2101b6ae0353',
    slug: 'how-to-delete-your-aisa-account',
    title: 'How to Delete Your AISA™ Account',
    category: 'AISA™',
    readTime: 3,
    views: 98,
    createdAt: '2026-08-05T00:00:00Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018519262-5c172b24.webp`,
    seoDescription: 'A step-by-step guide to permanently removing your account, data, and associated credentials from the AISA™ platform.'
  },
  {
    _id: '6a0c5f7890cf2101b6ae0354',
    slug: 'the-problem-every-professional-student-and-business-owner-faces-today',
    title: 'The Problem Every Professional, Student, and Business Owner Faces Today',
    category: 'AI & Automation',
    readTime: 5,
    views: 74,
    createdAt: '2026-07-22T00:00:00Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018046106-7b841386.webp`,
    seoDescription: 'How AI & Automation can save time, reduce stress, and boost productivity across modern professional workflows.'
  },
  {
    _id: '6a0c5f7890cf2101b6ae0355',
    slug: 'one-vision-five-powerful-brands-india-s-first-ai-ecosystem-has-arrived',
    title: "One Vision. Five Powerful Brands. India's First AI Ecosystem Has Arrived.",
    category: 'Technology & AI',
    readTime: 8,
    views: 38,
    createdAt: '2026-05-19T13:02:48.786Z',
    coverImage: `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018657975-b245bfc3.webp`,
    seoDescription: "What if one company could give you the AI tools to create, automate, connect, empower, and transform - all under a single ecosystem? That is exactly what UWO™ has built from the heart of Madhya Pradesh."
  }
];

export default function BlogsPage() {
  const [blogs, setBlogs] = useState(DEFAULT_BLOGS);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    document.title = 'Insights & News | UWO™';

    async function load() {
      try {
        const data = await fetchBlogs();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Sort so "Why One AI Assistant" is first, matching uwo24.com/blogs.html
          const sorted = [...data].sort((a, b) => {
            const aIsFeatured = a.slug?.includes('why-one-ai-assistant') || a.title?.includes('Why One AI Assistant');
            const bIsFeatured = b.slug?.includes('why-one-ai-assistant') || b.title?.includes('Why One AI Assistant');
            if (aIsFeatured) return -1;
            if (bIsFeatured) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          setBlogs(sorted);
        } else if (isMounted) {
          setBlogs(DEFAULT_BLOGS);
        }
      } catch (err) {
        if (isMounted) setBlogs(DEFAULT_BLOGS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const resolveImage = (blog) => {
    if (!blog) return getBlogFallbackImage();
    try {
      const img = resolveBlogImageUrl(blog);
      return img || getBlogFallbackImage(blog.category, blog.title);
    } catch {
      return getBlogFallbackImage(blog?.category, blog?.title);
    }
  };

  const getExcerpt = (blog, maxLen = 160) => {
    if (blog.seoDescription) return blog.seoDescription;
    if (blog.content_preview) return blog.content_preview;
    if (blog.content) {
      const stripped = blog.content.replace(/<[^>]*>/g, '').trim();
      return stripped.length > maxLen ? stripped.substring(0, maxLen) + '...' : stripped;
    }
    return 'Click to read the full article, expert insights, and architectural breakdown.';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const categories = ['All', 'AI & Automation', 'Tech Insights', 'Digital Commerce', 'Research'];

  // Filter list
  const filtered = blogs.filter(b => {
    const matchesCategory = currentCategory === 'All' ||
      (b.category || '').toLowerCase().includes(currentCategory.toLowerCase()) ||
      currentCategory.toLowerCase().includes((b.category || '').toLowerCase());
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      (b.title || '').toLowerCase().includes(query) ||
      getExcerpt(b, 300).toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  // Feature the latest blog if no active search query and on 'All' category
  const hasFeatured = !searchQuery && currentCategory === 'All' && filtered.length > 0;
  const featBlog = hasFeatured ? filtered[0] : null;
  const gridBlogs = hasFeatured ? filtered.slice(1) : filtered;

  return (
    <div className="blogs-theme-page">
      <style>{`
        /* ============================================
           UWO™ BLOGS — PREMIUM WARM EDITORIAL PALETTE
        ============================================ */
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        .blogs-theme-page {
          --ivory: #F5F1E8;
          --beige: #EDE5D4;
          --beige-card: #F0EAD8;
          --beige-border: #DDD0B8;
          --champagne: #C9A66B;
          --gold: #B8955A;
          --gold-light: rgba(201, 166, 107, 0.15);
          --sand: #D8C1A0;
          --espresso: #1F1A17;
          --brown-muted: #6E6257;
          --brown-light: #8C7B6E;

          background: var(--ivory) !important;
          background-image:
            radial-gradient(ellipse at 0% 0%, rgba(201, 166, 107, 0.12) 0px, transparent 55%),
            radial-gradient(ellipse at 100% 80%, rgba(216, 193, 160, 0.18) 0px, transparent 55%) !important;
          color: var(--espresso) !important;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          padding-top: 130px;
          padding-bottom: 90px;
        }

        .blogs-theme-page .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ---- FEATURED CARD ---- */
        .blogs-theme-page .featured-container {
          margin-bottom: 60px;
          width: 100%;
        }

        .blogs-theme-page .featured-card {
          background: var(--beige-card);
          border: 1px solid var(--beige-border);
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 0;
          box-shadow: 0 24px 60px rgba(110, 98, 87, 0.10), 0 4px 16px rgba(110, 98, 87, 0.05);
          transition: all 0.4s ease;
          position: relative;
          min-height: 320px;
          text-decoration: none;
          color: inherit;
        }

        .blogs-theme-page .featured-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 28px;
          box-shadow: inset 0 0 0 1px rgba(201, 166, 107, 0.12);
          pointer-events: none;
        }

        .blogs-theme-page .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 32px 80px rgba(110, 98, 87, 0.14), 0 8px 24px rgba(201, 166, 107, 0.10);
        }

        .blogs-theme-page .featured-img-wrapper {
          position: relative;
          height: 100%;
          min-height: 320px;
          overflow: hidden;
        }

        .blogs-theme-page .featured-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.9s ease;
        }

        .blogs-theme-page .featured-card:hover .featured-img {
          transform: scale(1.04);
        }

        .blogs-theme-page .featured-img-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent 60%, var(--beige-card));
        }

        .blogs-theme-page .featured-content {
          padding: 36px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--beige-card);
        }

        /* ---- TAGS ---- */
        .blogs-theme-page .blog-tag {
          align-self: flex-start;
          background: var(--gold-light);
          color: var(--gold);
          border: 1px solid rgba(184, 149, 90, 0.25);
          padding: 5px 16px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 14px;
          display: inline-block;
        }

        .blogs-theme-page .featured-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 12px;
          color: var(--espresso);
        }

        .blogs-theme-page .featured-desc {
          color: var(--brown-muted);
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 20px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blogs-theme-page .blog-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 12px;
          color: var(--brown-light);
          margin-bottom: 24px;
        }

        .blogs-theme-page .meta-item {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .blogs-theme-page .featured-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--gold);
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          transition: gap 0.25s;
        }

        .blogs-theme-page .featured-card:hover .featured-cta {
          gap: 14px;
        }

        /* ---- FILTERS BAR ---- */
        .blogs-theme-page .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 18px;
          border-bottom: 1px solid var(--beige-border);
          padding-bottom: 24px;
        }

        .blogs-theme-page .categories {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .blogs-theme-page .category-btn {
          background: var(--beige-card);
          border: 1px solid var(--beige-border);
          color: var(--brown-muted);
          padding: 9px 20px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.25s;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(110, 98, 87, 0.04);
          font-family: inherit;
        }

        .blogs-theme-page .category-btn:hover {
          background: var(--ivory);
          border-color: var(--champagne);
          color: var(--gold);
          box-shadow: 0 4px 14px rgba(201, 166, 107, 0.12);
        }

        .blogs-theme-page .category-btn.active {
          background: var(--champagne);
          color: #fff;
          border-color: var(--champagne);
          box-shadow: 0 6px 18px rgba(201, 166, 107, 0.28);
          font-weight: 700;
        }

        /* ---- SEARCH ---- */
        .blogs-theme-page .search-box {
          position: relative;
          width: 320px;
        }

        .blogs-theme-page .search-box input {
          background: var(--beige-card) !important;
          border: 1px solid var(--beige-border) !important;
          border-radius: 50px !important;
          padding: 11px 20px 11px 44px !important;
          color: var(--espresso) !important;
          font-size: 14px;
          margin-bottom: 0 !important;
          width: 100%;
          outline: none !important;
          transition: border 0.2s, box-shadow 0.2s !important;
          font-family: inherit;
        }

        .blogs-theme-page .search-box input:focus {
          border-color: var(--champagne) !important;
          box-shadow: 0 0 0 3px rgba(201, 166, 107, 0.15) !important;
          outline: none !important;
        }

        .blogs-theme-page .search-box input::placeholder {
          color: var(--brown-light);
        }

        .blogs-theme-page .search-box i {
          position: absolute;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--champagne);
        }

        /* ---- BLOG CARDS ---- */
        .blogs-theme-page .blogs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 30px;
          margin-bottom: 80px;
        }

        .blogs-theme-page .blog-card {
          background: var(--beige-card);
          border: 1px solid var(--beige-border);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(110, 98, 87, 0.07);
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .blogs-theme-page .blog-card:hover {
          transform: translateY(-10px);
          border-color: rgba(201, 166, 107, 0.4);
          box-shadow: 0 20px 50px rgba(110, 98, 87, 0.12), 0 4px 16px rgba(201, 166, 107, 0.08);
        }

        .blogs-theme-page .card-img-wrapper {
          position: relative;
          height: 220px;
          overflow: hidden;
        }

        .blogs-theme-page .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.55s ease;
        }

        .blogs-theme-page .blog-card:hover .card-img {
          transform: scale(1.07);
        }

        .blogs-theme-page .card-img-wrapper::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(to top, var(--beige-card), transparent);
        }

        .blogs-theme-page .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .blogs-theme-page .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 10px;
          color: var(--espresso);
          transition: color 0.25s;
        }

        .blogs-theme-page .blog-card:hover .card-title {
          color: var(--gold);
        }

        .blogs-theme-page .card-desc {
          color: var(--brown-muted);
          font-size: 0.9rem;
          line-height: 1.55;
          margin-bottom: 18px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blogs-theme-page .card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--beige-border);
          padding-top: 16px;
        }

        .blogs-theme-page .read-more-btn {
          color: var(--gold);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: gap 0.2s;
        }

        .blogs-theme-page .blog-card:hover .read-more-btn {
          gap: 12px;
        }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 992px) {
          .blogs-theme-page .featured-card {
            grid-template-columns: 1fr;
            height: auto;
            min-height: auto;
          }

          .blogs-theme-page .featured-img-wrapper {
            height: 200px;
            min-height: 200px;
          }

          .blogs-theme-page .featured-img-wrapper::after {
            background: linear-gradient(to top, var(--beige-card) 5%, transparent) !important;
          }

          .blogs-theme-page .featured-content {
            padding: 28px 24px;
          }

          .blogs-theme-page .featured-title {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 768px) {
          .blogs-theme-page {
            padding-top: 100px;
          }

          .blogs-theme-page .featured-title {
            font-size: 1.45rem;
          }

          .blogs-theme-page .featured-desc {
            font-size: 0.9rem;
            margin-bottom: 14px;
          }

          .blogs-theme-page .filters-bar {
            flex-direction: column-reverse;
            align-items: stretch;
            gap: 16px;
          }

          .blogs-theme-page .search-box {
            width: 100%;
          }

          .blogs-theme-page .categories {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
          }

          .blogs-theme-page .category-btn {
            flex-shrink: 0;
            padding: 8px 16px;
            font-size: 12px;
          }

          .blogs-theme-page .blogs-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        @media (max-width: 480px) {
          .blogs-theme-page .container {
            padding: 0 16px;
          }

          .blogs-theme-page .featured-card {
            border-radius: 20px;
          }

          .blogs-theme-page .featured-card::before {
            border-radius: 20px;
          }

          .blogs-theme-page .featured-content {
            padding: 22px 16px;
          }

          .blogs-theme-page .blog-card {
            border-radius: 20px;
          }

          .blogs-theme-page .card-body {
            padding: 20px 16px;
          }
        }
      `}</style>

      <div className="container">

        {/* Featured Blog Banner */}
        {featBlog && (
          <div className="featured-container">
            <Link
              to={`/blogs/${featBlog.slug || featBlog._id}`}
              className="featured-card"
            >
              <div className="featured-img-wrapper">
                <img
                  src={resolveImage(featBlog)}
                  alt={featBlog.title}
                  className="featured-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    const directUrl = `${CLOUD_RUN_BACKEND}/api/media/blogs/images/blog-1786018463038-52f42a85.webp`;
                    if (e.currentTarget.src !== directUrl) {
                      e.currentTarget.src = directUrl;
                    } else {
                      e.currentTarget.src = getBlogFallbackImage(featBlog.category, featBlog.title);
                    }
                  }}
                />
              </div>
              <div className="featured-content">
                <span className="blog-tag">{featBlog.category}</span>
                <h2 className="featured-title">{featBlog.title}</h2>
                <p className="featured-desc">{getExcerpt(featBlog, 180)}</p>

                <div className="blog-meta">
                  <div className="meta-item">
                    <i className="fa-regular fa-calendar"></i>
                    {formatDate(featBlog.createdAt)}
                  </div>
                  <div className="meta-item">
                    <i className="fa-regular fa-clock"></i>
                    {featBlog.readTime || featBlog.read_time || 3} min read
                  </div>
                  <div className="meta-item">
                    <i className="fa-regular fa-eye"></i>
                    {featBlog.views || 0} views
                  </div>
                </div>

                <span className="featured-cta">
                  Read Featured Article <i className="fa-solid fa-arrow-right-long"></i>
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Filters & Search */}
        <div className="filters-bar">
          <div className="categories" id="categoriesBox">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-btn${currentCategory === cat ? ' active' : ''}`}
                onClick={() => setCurrentCategory(cat)}
              >
                {cat === 'All' ? 'All Insights' : cat}
              </button>
            ))}
          </div>

          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="searchInput"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Blog Grid */}
        <div className="blogs-grid" id="blogsGrid">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6E6257' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '30px', marginBottom: '15px', color: '#B8955A' }}></i>
              <p>Retrieving expert insights...</p>
            </div>
          ) : gridBlogs.length === 0 && !featBlog ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#6E6257' }}>
              <i className="fa-solid fa-box-open" style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.3, display: 'block' }}></i>
              <p>No articles match your search or filter options.</p>
            </div>
          ) : (
            gridBlogs.map((b) => (
              <Link
                key={b._id || b.slug}
                to={`/blogs/${b.slug || b._id}`}
                className="blog-card"
              >
                <div className="card-img-wrapper">
                  <img
                    src={resolveImage(b)}
                    alt={b.title}
                    className="card-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      // Fallback directly to Cloud Run if image path had issue
                      const gcsMatch = (b.coverImage || '').match(/blog-\d+-[a-f0-9]+\.webp/);
                      if (gcsMatch) {
                        e.currentTarget.src = `${CLOUD_RUN_BACKEND}/api/media/blogs/images/${gcsMatch[0]}`;
                      } else {
                        e.currentTarget.src = getBlogFallbackImage(b.category, b.title);
                      }
                    }}
                  />
                </div>
                <div className="card-body">
                  <span className="blog-tag" style={{ marginBottom: '12px' }}>{b.category}</span>
                  <h3 className="card-title">{b.title}</h3>
                  <p className="card-desc">{getExcerpt(b, 120)}</p>

                  <div className="card-footer">
                    <div className="blog-meta" style={{ marginBottom: 0, gap: '12px', fontSize: '11px' }}>
                      <div className="meta-item">
                        <i className="fa-regular fa-calendar"></i>
                        {formatDate(b.createdAt)}
                      </div>
                      <div className="meta-item">
                        <i className="fa-regular fa-eye"></i>
                        {b.views || 0}
                      </div>
                    </div>
                    <span className="read-more-btn" style={{ fontSize: '11px' }}>
                      Read <i className="fa-solid fa-arrow-right-long"></i>
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
