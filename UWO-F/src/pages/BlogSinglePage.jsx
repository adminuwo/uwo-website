import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getApiUrl, getBlogFallbackImage, resolveBlogImageUrl } from '../services/api';

export default function BlogSinglePage() {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const slug = routeSlug || searchParams.get('slug');
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        setScrollProgress((winScroll / height) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch article
  useEffect(() => {
    if (!slug) {
      navigate('/blogs');
      return;
    }

    let isMounted = true;
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = getApiUrl();
        // Increment view and fetch
        const res = await fetch(`${apiUrl}/blogs/views/${encodeURIComponent(slug)}`, {
          method: 'POST'
        });
        if (!res.ok) {
          throw new Error('Failed to load article details.');
        }
        const data = await res.json();
        if (isMounted) {
          setBlog(data);
          setLikes(data.likes || 0);
          document.title = `${data.seoTitle || data.title} | UWO™`;
          setLoading(false);

          // Fetch related articles
          if (data.category) {
            try {
              const relRes = await fetch(`${apiUrl}/blogs?category=${encodeURIComponent(data.category)}`);
              if (relRes.ok) {
                const relData = await relRes.json();
                const filtered = relData.filter(b => b.slug !== slug).slice(0, 3);
                if (isMounted) setRelatedBlogs(filtered);
              }
            } catch (relErr) {
              console.error('Related blogs error:', relErr);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError(err.message || 'Error loading insight.');
          setLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      isMounted = false;
      document.title = 'UWO™ | Intelligent Digital Platforms';
    };
  }, [slug, navigate]);

  const handleLike = async () => {
    if (liked || !blog) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/blogs/${encodeURIComponent(blog.slug)}/like`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated = await res.json();
        setLikes(updated.likes || likes + 1);
        setLiked(true);
      }
    } catch (err) {
      console.error('Failed to like article:', err);
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(blog ? blog.title : 'Check out this UWO Insight!');
    let shareUrl = '';
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    else if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    else if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    else if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;

    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="single-article-page" style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '80px' }}>
      {/* Reading Progress Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          background: 'linear-gradient(to right, #C9A66B, #E8C87A)',
          width: `${scrollProgress}%`,
          zIndex: 10000,
          transition: 'width 0.1s ease',
          boxShadow: '0 0 8px rgba(201, 166, 107, 0.4)'
        }}
      />

      <div className="container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '120px 0' }}>
            <i
              className="fa-solid fa-spinner fa-spin"
              style={{ fontSize: '42px', color: '#D6A559', marginBottom: '20px' }}
            ></i>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>
              Decrypting database records...
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '20px',
              maxWidth: '600px',
              margin: '60px auto'
            }}
          >
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ fontSize: '44px', color: '#ef4444', marginBottom: '15px' }}
            ></i>
            <h3 style={{ color: '#fff', fontSize: '1.4rem' }}>Insight Decryption Failed</h3>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>
              Check if the backend is connected or if this article slug is valid.
            </p>
            <Link
              to="/blogs"
              className="btn btn-primary"
              style={{
                marginTop: '22px',
                display: 'inline-block',
                padding: '10px 26px',
                background: 'linear-gradient(135deg, #D6A559, #FABE56)',
                color: '#0B1120',
                fontWeight: 700,
                borderRadius: '50px',
                textDecoration: 'none'
              }}
            >
              Return to Insights
            </Link>
          </div>
        )}

        {!loading && !error && blog && (
          <div className="article-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '50px' }}>
            {/* LEFT: Main Blog Details */}
            <main id="mainArticle">
              <Link
                to="/blogs"
                className="back-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#D6A559',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  marginBottom: '25px'
                }}
              >
                <i className="fa-solid fa-arrow-left-long"></i> Back to Insights
              </Link>

              <div className="article-header" style={{ marginBottom: '30px' }}>
                <span
                  className="blog-tag"
                  style={{
                    background: 'rgba(214, 165, 89, 0.15)',
                    color: '#D6A559',
                    border: '1px solid rgba(214, 165, 89, 0.3)',
                    padding: '6px 18px',
                    borderRadius: '50px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    display: 'inline-block',
                    marginBottom: '18px'
                  }}
                >
                  {blog.category}
                </span>

                <h1
                  className="article-title"
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: '#ffffff',
                    marginBottom: '20px'
                  }}
                >
                  {blog.title}
                </h1>

                <div
                  className="blog-meta"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    fontSize: '13px',
                    color: '#94a3b8',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '18px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-user" style={{ color: '#D6A559' }}></i> {blog.author || 'UWO Team'}
                  </div>
                  <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-calendar" style={{ color: '#D6A559' }}></i>{' '}
                    {new Date(blog.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-clock" style={{ color: '#D6A559' }}></i> {blog.readTime || 3} min read
                  </div>
                  <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-eye" style={{ color: '#D6A559' }}></i> {blog.views || 1} Views
                  </div>
                </div>
              </div>

              {/* Cover Banner */}
              <img
                src={resolveBlogImageUrl(blog)}
                alt={blog.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getBlogFallbackImage(blog.category, blog.title);
                }}
                className="article-banner-img"
                style={{
                  width: '100%',
                  height: '380px',
                  objectFit: 'cover',
                  borderRadius: '24px',
                  border: '1px solid rgba(214, 165, 89, 0.2)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                  marginBottom: '35px'
                }}
              />

              {/* HTML Content */}
              <div
                className="blog-content"
                style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                  color: '#e2e8f0',
                  marginBottom: '40px'
                }}
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {/* Like / Appreciate Bar */}
              <div
                className="like-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '20px 24px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(214, 165, 89, 0.2)',
                  borderRadius: '16px',
                  marginBottom: '35px'
                }}
              >
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={liked}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 22px',
                    borderRadius: '50px',
                    border: 'none',
                    background: liked
                      ? 'rgba(214, 165, 89, 0.3)'
                      : 'linear-gradient(135deg, #D6A559, #FABE56)',
                    color: '#000',
                    fontWeight: 800,
                    cursor: liked ? 'default' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="fa-solid fa-thumbs-up"></i>
                  {liked ? `Appreciated (${likes})` : `Appreciate ${likes}`}
                </button>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Loved this research? Appreciate or share with your network.
                </span>
              </div>

              {/* Author Bio */}
              <div
                className="author-bio"
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D6A559, #FABE56)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  {(blog.author || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '18px', fontWeight: 800 }}>
                    {blog.author || 'UWO Editorial'}
                  </h3>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
                    UWO’s core engineering and product design teams collaborate to research, develop, and share highly
                    technical insights about AI system architecture, enterprise automation, and universal scale platforms.
                  </p>
                </div>
              </div>
            </main>

            {/* RIGHT: Sidebar */}
            <aside className="share-sidebar" style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
              {/* Share Insight Widget */}
              <div
                className="sidebar-widget"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '30px'
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: '18px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  Share Insight
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => handleShare('twitter')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-brands fa-x-twitter"></i> Share on X
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(10, 102, 194, 0.2)',
                      border: '1px solid rgba(10, 102, 194, 0.4)',
                      color: '#60a5fa',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-brands fa-linkedin-in"></i> Share on LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(24, 119, 242, 0.2)',
                      border: '1px solid rgba(24, 119, 242, 0.4)',
                      color: '#93c5fd',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-brands fa-facebook-f"></i> Share on Facebook
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(37, 211, 102, 0.2)',
                      border: '1px solid rgba(37, 211, 102, 0.4)',
                      color: '#4ade80',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-brands fa-whatsapp"></i> WhatsApp Link
                  </button>
                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(214, 165, 89, 0.1)',
                      border: '1px solid rgba(214, 165, 89, 0.3)',
                      color: copied ? '#4ade80' : '#D6A559',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>{' '}
                    {copied ? 'Copied URL!' : 'Copy Article URL'}
                  </button>
                </div>
              </div>

              {/* Related Insights */}
              {relatedBlogs.length > 0 && (
                <div
                  className="sidebar-widget"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '24px'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#fff',
                      marginBottom: '18px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Related Insights
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {relatedBlogs.map((b) => (
                      <Link
                        key={b.slug || b._id}
                        to={`/blogs/${b.slug}`}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          textDecoration: 'none',
                          alignItems: 'center'
                        }}
                      >
                        <img
                          src={resolveBlogImageUrl(b)}
                          alt={b.title}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getBlogFallbackImage(b.category, b.title);
                          }}
                          style={{
                            width: '54px',
                            height: '54px',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        />
                        <div>
                          <h4
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#fff',
                              margin: 0,
                              lineHeight: 1.3
                            }}
                          >
                            {b.title}
                          </h4>
                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: '10px',
                              color: '#94a3b8',
                              fontWeight: 600
                            }}
                          >
                            {new Date(b.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
