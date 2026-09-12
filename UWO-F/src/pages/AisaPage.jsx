import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../services/api';

export default function AisaPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const canvasRef = useRef(null);

  // Canvas particle neural animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || 700);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
        height = canvas.height = canvas.parentElement.clientHeight || 700;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: i % 2 === 0 ? 'rgba(96, 165, 250, 0.6)' : 'rgba(168, 85, 247, 0.6)'
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(147, 197, 253, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setDemoSubmitting(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `[AISA Demo Request - ${formData.company || 'Individual'}] ${formData.message}`,
          subject: 'AISA Demo Request'
        })
      });

      if (res.ok) {
        setDemoSuccess(true);
        setTimeout(() => {
          setDemoModalOpen(false);
          setDemoSuccess(false);
          setFormData({ name: '', email: '', phone: '', company: '', message: '' });
        }, 2500);
      } else {
        alert('Could not submit demo request right now. Please try again.');
      }
    } catch (err) {
      console.error('Demo request error:', err);
      // Fallback optimistic message
      setDemoSuccess(true);
      setTimeout(() => {
        setDemoModalOpen(false);
        setDemoSuccess(false);
      }, 2500);
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <div className="aisa-page" style={{ background: '#020617', color: '#fff', overflow: 'hidden' }}>
      {/* HERO SECTION */}
      <section
        className="aisa-hero"
        style={{
          position: 'relative',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '120px 20px 60px'
        }}
      >
        {/* Immersive Glowing Lights */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '5%',
              left: '10%',
              width: '45vw',
              height: '45vw',
              background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 75%)',
              filter: 'blur(80px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '5%',
              right: '10%',
              width: '50vw',
              height: '50vw',
              background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 75%)',
              filter: 'blur(100px)'
            }}
          />
        </div>

        {/* 3D Neural Canvas */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        </div>

        {/* Foreground Content */}
        <div
          className="aisa-hero-content"
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          <div
            className="hero-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 22px',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '2rem',
              letterSpacing: '0.1em'
            }}
          >
            <i className="fa-solid fa-sparkles" style={{ color: '#818cf8' }}></i> Powered by UWO™
          </div>

          <h1
            className="hero-heading"
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1.8rem'
            }}
          >
            Meet AISA™ <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 50%, #e879f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              your AI Super Assistant
            </span>
          </h1>

          <p
            className="subtitle"
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              color: 'rgba(203, 213, 225, 0.85)',
              maxWidth: '720px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.7
            }}
          >
            The AI Super Assistant that unifies your entire digital world into one intelligent platform.
          </p>

          <div
            className="aisa-cta-group"
            style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <a
              href="https://aisa24.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '16px 42px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 20px 50px rgba(99, 102, 241, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none'
              }}
            >
              Get Early Access <i className="fa-solid fa-arrow-right"></i>
            </a>
            <button
              type="button"
              onClick={() => setDemoModalOpen(true)}
              style={{
                padding: '16px 42px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: 'pointer',
                backdropFilter: 'blur(20px)'
              }}
            >
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section style={{ background: '#010d1a', position: 'relative', padding: '100px 20px' }}>
        <div className="container">
          <div className="section-head" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 800 }}>
              Unlock <span style={{ color: '#D6A559' }}>Unprecedented</span>
              <br />
              Efficiency &amp; Creativity.
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '30px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}
          >
            <div
              className="problem-card"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '40px 30px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <i className="fa-solid fa-clock" style={{ fontSize: '36px', color: '#D6A559', marginBottom: '20px' }}></i>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Reclaim Your Time</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Cut hours from your workday. AISA™ handles the heavy lifting, giving you back precious time for what truly
                matters.
              </p>
            </div>

            <div
              className="problem-card"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '40px 30px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <i
                className="fa-solid fa-rocket"
                style={{ fontSize: '36px', color: '#60a5fa', marginBottom: '20px' }}
              ></i>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Amplify Your Productivity</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Boost your output and achieve more with less effort, every single day, across every complex task.
              </p>
            </div>

            <div
              className="problem-card"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '40px 30px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <i
                className="fa-solid fa-wand-magic-sparkles"
                style={{ fontSize: '36px', color: '#c084fc', marginBottom: '20px' }}
              ></i>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Simplify Your Digital Life</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                One intuitive interface for every AI need means less fragmentation, zero complexity, and elevated clarity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section style={{ background: '#020617', position: 'relative', overflow: 'hidden', padding: '100px 20px' }}>
        <div className="container" style={{ position: 'relative', zIndex: 5, textAlign: 'center', maxWidth: '850px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(214,165,89,0.1)',
              border: '1px solid rgba(214,165,89,0.3)',
              borderRadius: '50px',
              padding: '10px 24px',
              marginBottom: '30px'
            }}
          >
            <i className="fa-solid fa-shield-halved" style={{ color: '#D6A559' }}></i>
            <span style={{ color: '#D6A559', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '1px' }}>
              TRUSTED INNOVATION
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', lineHeight: 1.2, marginBottom: '25px', fontWeight: 800 }}>
            Innovation You Can Trust,
            <br />
            <span style={{ color: '#D6A559' }}>Backed by Proven Expertise.</span>
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
            AISA™ is the flagship AI innovation from <strong style={{ color: '#fff' }}>UWO™ (Unified Web Options &amp; Services Pvt. Ltd.)</strong>,
            an IT-registered technology company founded in 2020 in Jabalpur, India. As pioneers in AI solutions and business automation, we’re
            building a future where AI empowers everyone, simply and securely.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          textAlign: 'center',
          background: 'linear-gradient(180deg, #020617 0%, #080e22 100%)',
          padding: '100px 20px',
          position: 'relative'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 5 }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, fontWeight: 900, marginBottom: '20px' }}>
            Your Future of Productivity
            <br />
            <span style={{ color: '#D6A559' }}>Starts Now.</span>
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 auto 40px',
              maxWidth: '640px',
              lineHeight: 1.7
            }}
          >
            Ready to experience the future of work? Unify your potential, eliminate complexity, and redefine what's
            possible with AISA™.
          </p>
          <div>
            <a
              href="https://aisa24.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 36px',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #D6A559, #FABE56)',
                color: '#000',
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 10px 30px rgba(214, 165, 89, 0.3)'
              }}
            >
              Get Early Access <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </section>

      {/* DEMO MODAL */}
      {demoModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setDemoModalOpen(false)}
        >
          <div
            style={{
              background: '#0B1120',
              border: '1.5px solid rgba(214, 165, 89, 0.3)',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '540px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 25px 80px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDemoModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>

            {demoSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <i
                  className="fa-solid fa-check"
                  style={{
                    fontSize: '40px',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '20px',
                    borderRadius: '50%',
                    marginBottom: '20px'
                  }}
                ></i>
                <h3 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '10px' }}>Request Received!</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
                  Thank you! Our team will contact you shortly to schedule your personalized AISA™ walkthrough.
                </p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                  Request a Demo
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '25px' }}>
                  Experience the future of AI firsthand. Our specialists will guide you through the AISA™ ecosystem.
                </p>

                <form onSubmit={handleDemoSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '22px' }}>
                    <textarea
                      rows={3}
                      placeholder="How can we help? *"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={demoSubmitting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: demoSubmitting ? 'wait' : 'pointer'
                    }}
                  >
                    {demoSubmitting ? 'Submitting...' : 'Send Request'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
