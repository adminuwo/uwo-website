import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs, resolveBlogImageUrl } from '../services/api';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchBlogs();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setBlogs(data);
        } else if (isMounted) {
          setBlogs(getDefaultBlogs());
        }
      } catch (err) {
        if (isMounted) setBlogs(getDefaultBlogs());
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  function getDefaultBlogs() {
    return [
      {
        _id: '1',
        slug: 'why-one-ai-assistant-is-better-than-ten-apps',
        title: 'Why One AI Assistant Is Better Than Ten Apps: A Practical Guide to Working Smarter with AISA\u2122',
        category: 'AI & Automation',
        readTime: 3,
        views: 139,
        createdAt: '2026-08-06T00:00:00Z',
        coverImage: 'https://uwo-backend-977864306871.asia-south1.run.app/api/media/blogs/cover_why-one-ai-assistant.webp',
        seoDescription: 'Every day, professionals switch between multiple apps just to complete one task. One tool to search for information, one to write, one to analyze data\u2014the list goes on.',
        is_featured: true
      },
      {
        _id: '2',
        slug: 'how-aisa-works',
        title: 'How to Use AISA\u2122 to Work Smarter, Not Harder',
        category: 'AI & Automation',
        readTime: 4,
        views: 98,
        createdAt: '2026-08-01T00:00:00Z',
        coverImage: 'https://uwo-backend-977864306871.asia-south1.run.app/api/media/blogs/cover_how-aisa-works.webp',
        seoDescription: 'AISA\u2122 is your all-in-one AI workspace \u2014 search, write, analyze, create and achieve with one powerful assistant.'
      },
      {
        _id: '3',
        slug: 'the-problem-with-fragmented-tools',
        title: 'The Problem with Fragmented Digital Tools and How AI Solves It',
        category: 'Tech Insights',
        readTime: 5,
        views: 74,
        createdAt: '2026-07-22T00:00:00Z',
        coverImage: 'https://uwo-backend-977864306871.asia-south1.run.app/api/media/blogs/cover_fragmented-tools.webp',
        seoDescription: 'Professionals waste hours switching between apps. Discover how unified AI platforms are changing the game.'
      },
      {
        _id: '4',
        slug: 'one-vision-five-powerful-features',
        title: 'One Vision. Five Powerful Features: The AISA\u2122 Ecosystem Explained',
        category: 'AI & Automation',
        readTime: 6,
        views: 112,
        createdAt: '2026-07-15T00:00:00Z',
        coverImage: 'https://uwo-backend-977864306871.asia-south1.run.app/api/media/blogs/cover_aisa-vision.webp',
        seoDescription: 'From smart search to AI writing, AISA\u2122 brings five transformative capabilities into one seamless experience.'
      },
      {
        _id: '5',
        slug: 'future-of-enterprise-ai',
        title: 'The Future of Enterprise AI: Multi-Agent Intelligence and Autonomy',
        category: 'Research',
        readTime: 7,
        views: 203,
        createdAt: '2026-07-05T00:00:00Z',
        coverImage: 'https://uwo-backend-977864306871.asia-south1.run.app/api/media/blogs/cover_enterprise-ai.webp',
        seoDescription: 'How next-generation multi-agent systems are transforming business operations from static automation to adaptive autonomy.'
      },
      {
        _id: '6',
        slug: 'decentralized-ai-marketplaces',
        title: 'Decentralized AI Marketplaces: The Architecture of AI Mall\u2122',
        category: 'Digital Commerce',
        readTime: 6,
        views: 87,
        createdAt: '2026-06-28T00:00:00Z',
        coverImage: 'https://uwo-backend-977864306871.asia-south1.run.app/api/media/blogs/cover_ai-mall.webp',
        seoDescription: 'Connecting specialized cognitive models directly to consumer workflows through microservices and verified licensing.'
      }
    ];
  }

  const resolveImage = (blog) => {
    if (!blog) return '/images/uwo-logo.png';
    try { return resolveBlogImageUrl(blog); } catch { return '/images/uwo-logo.png'; }
  };

  const getExcerpt = (blog) => {
    if (blog.seoDescription) return blog.seoDescription;
    if (blog.content_preview) return blog.content_preview;
    if (blog.content) return blog.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';
    return 'Click to read the full article, insights and expert analysis.';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const categories = ['All', 'AI & Automation', 'Tech Insights', 'Digital Commerce', 'Research'];

  const filteredBlogs = blogs.filter((b) => {
    const matchCat = selectedCategory === 'All' || (b.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch = !searchTerm ||
      (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getExcerpt(b).toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const showFeatured = selectedCategory === 'All' && !searchTerm;
  const featured = showFeatured ? (filteredBlogs.find(b => b.is_featured) || filteredBlogs[0]) : null;
  const gridBlogs = featured
    ? filteredBlogs.filter(b => b._id !== featured._id && b.slug !== featured.slug)
    : filteredBlogs;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        .blogs-page-wrap {
          background: #F5F1E8;
          background-image: radial-gradient(ellipse at 0% 0%, rgba(201,166,107,0.12) 0px, transparent 55%), radial-gradient(ellipse at 100% 80%, rgba(216,193,160,0.18) 0px, transparent 55%);
          min-height: 100vh;
          padding-top: 110px;
          padding-bottom: 80px;
          font-family: 'Inter', sans-serif;
          color: #1F1A17;
        }
        .blogs-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        /* Featured */
        .bp-featured-card {
          background: #F0EAD8; border: 1px solid #DDD0B8; border-radius: 28px; overflow: hidden;
          display: grid; grid-template-columns: 1.2fr 1fr; margin-bottom: 60px;
          box-shadow: 0 24px 60px rgba(110,98,87,0.10), 0 4px 16px rgba(110,98,87,0.05);
          transition: all 0.4s ease; position: relative; min-height: 320px;
          text-decoration: none; color: inherit;
        }
        .bp-featured-card:hover { transform: translateY(-4px); box-shadow: 0 32px 80px rgba(110,98,87,0.14), 0 8px 24px rgba(201,166,107,0.10); }
        .bp-feat-img-wrap { position: relative; height: 100%; min-height: 320px; overflow: hidden; }
        .bp-feat-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.9s ease; }
        .bp-featured-card:hover .bp-feat-img { transform: scale(1.04); }
        .bp-feat-img-wrap::after { content:''; position:absolute; inset:0; background: linear-gradient(to right, transparent 60%, #F0EAD8); }
        .bp-feat-content { padding: 36px 40px; display: flex; flex-direction: column; justify-content: center; background: #F0EAD8; }
        /* Tags */
        .bp-tag {
          align-self: flex-start; background: rgba(201,166,107,0.15); color: #B8955A;
          border: 1px solid rgba(184,149,90,0.25); padding: 5px 16px; border-radius: 50px;
          font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 14px;
        }
        .bp-feat-title { font-family:'Playfair Display',serif; font-size:1.9rem; font-weight:700; line-height:1.25; margin-bottom:12px; color:#1F1A17; }
        .bp-feat-desc { color:#6E6257; font-size:0.95rem; line-height:1.6; margin-bottom:20px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .bp-meta { display:flex; align-items:center; gap:20px; font-size:12px; color:#8C7B6E; margin-bottom:24px; }
        .bp-meta-item { display:flex; align-items:center; gap:7px; }
        .bp-feat-cta { display:inline-flex; align-items:center; gap:8px; color:#B8955A; font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; transition:gap 0.25s; }
        .bp-featured-card:hover .bp-feat-cta { gap:14px; }
        /* Filters */
        .bp-filters-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; flex-wrap:wrap; gap:18px; border-bottom:1px solid #DDD0B8; padding-bottom:24px; }
        .bp-categories { display:flex; gap:10px; flex-wrap:wrap; }
        .bp-cat-btn { background:#F0EAD8; border:1px solid #DDD0B8; color:#6E6257; padding:9px 20px; border-radius:50px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.25s; box-shadow:0 2px 8px rgba(110,98,87,0.04); font-family:'Inter',sans-serif; }
        .bp-cat-btn:hover { background:#F5F1E8; border-color:#C9A66B; color:#B8955A; }
        .bp-cat-btn.active { background:#C9A66B; color:#fff; border-color:#C9A66B; box-shadow:0 6px 18px rgba(201,166,107,0.28); font-weight:700; }
        .bp-search-wrap { position:relative; width:320px; }
        .bp-search-wrap i { position:absolute; left:17px; top:50%; transform:translateY(-50%); color:#C9A66B; font-size:14px; }
        .bp-search-input { background:#F0EAD8 !important; border:1px solid #DDD0B8 !important; border-radius:50px !important; padding:11px 20px 11px 44px !important; color:#1F1A17 !important; font-size:14px; width:100%; outline:none; transition:border 0.2s,box-shadow 0.2s; font-family:'Inter',sans-serif; }
        .bp-search-input:focus { border-color:#C9A66B !important; box-shadow:0 0 0 3px rgba(201,166,107,0.15) !important; }
        .bp-search-input::placeholder { color:#8C7B6E; }
        /* Grid */
        .bp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:30px; margin-bottom:80px; }
        .bp-card { background:#F0EAD8; border:1px solid #DDD0B8; border-radius:24px; overflow:hidden; display:flex; flex-direction:column; transition:all 0.35s cubic-bezier(0.4,0,0.2,1); box-shadow:0 8px 24px rgba(110,98,87,0.07); text-decoration:none; color:inherit; }
        .bp-card:hover { transform:translateY(-10px); border-color:rgba(201,166,107,0.4); box-shadow:0 20px 50px rgba(110,98,87,0.12),0 4px 16px rgba(201,166,107,0.08); }
        .bp-card-img-wrap { position:relative; height:220px; overflow:hidden; }
        .bp-card-img { width:100%; height:100%; object-fit:cover; transition:transform 0.55s ease; }
        .bp-card:hover .bp-card-img { transform:scale(1.07); }
        .bp-card-img-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:60px; background:linear-gradient(to top,#F0EAD8,transparent); }
        .bp-card-body { padding:24px; display:flex; flex-direction:column; flex:1; }
        .bp-card-title { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; line-height:1.35; margin-bottom:10px; color:#1F1A17; transition:color 0.25s; }
        .bp-card:hover .bp-card-title { color:#B8955A; }
        .bp-card-desc { color:#6E6257; font-size:0.9rem; line-height:1.55; margin-bottom:18px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; flex:1; }
        .bp-card-footer { margin-top:auto; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #DDD0B8; padding-top:16px; }
        .bp-read-btn { color:#B8955A; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px; transition:gap 0.2s; }
        .bp-card:hover .bp-read-btn { gap:12px; }
        .bp-empty { grid-column:1/-1; text-align:center; padding:60px; color:#6E6257; }
        .bp-empty i { font-size:40px; margin-bottom:15px; opacity:0.3; display:block; }
        /* Responsive */
        @media(max-width:992px){
          .bp-featured-card{grid-template-columns:1fr;min-height:auto;}
          .bp-feat-img-wrap{height:200px;min-height:200px;}
          .bp-feat-img-wrap::after{background:linear-gradient(to top,#F0EAD8 5%,transparent)!important;}
          .bp-feat-content{padding:28px 24px;}
          .bp-feat-title{font-size:1.6rem;}
        }
        @media(max-width:768px){
          .bp-feat-title{font-size:1.45rem;}
          .bp-filters-bar{flex-direction:column-reverse;align-items:stretch;gap:16px;}
          .bp-search-wrap{width:100%;}
          .bp-categories{overflow-x:auto;flex-wrap:nowrap;padding-bottom:8px;}
          .bp-cat-btn{flex-shrink:0;padding:8px 16px;font-size:12px;}
          .bp-grid{grid-template-columns:1fr;gap:20px;}
        }
        @media(max-width:480px){
          .blogs-container{padding:0 16px;}
          .bp-featured-card,.bp-card{border-radius:20px;}
          .bp-feat-content,.bp-card-body{padding:22px 16px;}
        }
      `}</style>

      <div className="blogs-page-wrap">
        <div className="blogs-container">

          {/* Featured Banner */}
          {featured && (
            <Link to={`/blogs/${featured.slug || featured._id}`} className="bp-featured-card">
              <div className="bp-feat-img-wrap">
                <img
                  src={resolveImage(featured)}
                  alt={featured.title}
                  className="bp-feat-img"
                  onError={e => { e.target.onerror = null; e.target.src = '/images/uwo-logo.png'; }}
                />
              </div>
              <div className="bp-feat-content">
                <span className="bp-tag">{featured.category}</span>
                <h2 className="bp-feat-title">{featured.title}</h2>
                <p className="bp-feat-desc">{getExcerpt(featured)}</p>
                <div className="bp-meta">
                  <div className="bp-meta-item">
                    <i className="fa-regular fa-calendar"></i>
                    {formatDate(featured.createdAt)}
                  </div>
                  <div className="bp-meta-item">
                    <i className="fa-regular fa-clock"></i>
                    {featured.readTime || featured.read_time || 3} min read
                  </div>
                  {featured.views !== undefined && (
                    <div className="bp-meta-item">
                      <i className="fa-regular fa-eye"></i>
                      {featured.views} views
                    </div>
                  )}
                </div>
                <span className="bp-feat-cta">
                  Read Featured Article <i className="fa-solid fa-arrow-right-long"></i>
                </span>
              </div>
            </Link>
          )}

          {/* Filters & Search */}
          <div className="bp-filters-bar">
            <div className="bp-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`bp-cat-btn${selectedCategory === cat ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'All' ? 'All Insights' : cat}
                </button>
              ))}
            </div>
            <div className="bp-search-wrap">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="bp-search-input"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Blog Grid */}
          {loading ? (
            <div className="bp-grid">
              <div className="bp-empty">
                <i className="fa-solid fa-spinner fa-spin" style={{ opacity: 1, color: '#C9A66B' }}></i>
                <p>Retrieving expert insights...</p>
              </div>
            </div>
          ) : gridBlogs.length === 0 && !featured ? (
            <div className="bp-grid">
              <div className="bp-empty">
                <i className="fa-solid fa-box-open"></i>
                <p>No articles match your search or filter options.</p>
              </div>
            </div>
          ) : (
            <div className="bp-grid">
              {gridBlogs.map(b => (
                <Link key={b._id || b.slug} to={`/blogs/${b.slug || b._id}`} className="bp-card">
                  <div className="bp-card-img-wrap">
                    <img
                      src={resolveImage(b)}
                      alt={b.title}
                      className="bp-card-img"
                      onError={e => { e.target.onerror = null; e.target.src = '/images/uwo-logo.png'; }}
                    />
                  </div>
                  <div className="bp-card-body">
                    <span className="bp-tag" style={{ marginBottom: '12px' }}>{b.category}</span>
                    <h3 className="bp-card-title">{b.title}</h3>
                    <p className="bp-card-desc">{getExcerpt(b)}</p>
                    <div className="bp-card-footer">
                      <div className="bp-meta" style={{ marginBottom: 0, gap: '12px', fontSize: '11px' }}>
                        <div className="bp-meta-item">
                          <i className="fa-regular fa-calendar"></i>
                          {formatDate(b.createdAt)}
                        </div>
                        {b.views !== undefined && (
                          <div className="bp-meta-item">
                            <i className="fa-regular fa-eye"></i>
                            {b.views}
                          </div>
                        )}
                      </div>
                      <span className="bp-read-btn">
                        Read <i className="fa-solid fa-arrow-right-long"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}


