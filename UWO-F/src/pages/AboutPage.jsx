import React from 'react';

export default function AboutPage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section 
        className="hero hero-centered" 
        style={{ 
          minHeight: '60vh', 
          backgroundImage: "url('/images/about-bg..webp')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat' 
        }}
      >
        <div className="hero-content-centered">
          <h1>About UWO<sup>&trade;</sup></h1>
          <p>
            UWO<sup>&trade;</sup> (Unified Web Options &amp; Services) is an AI-first global technology
            company focused on building scalable, intelligent digital platforms.
            We serve enterprises, creators, developers, and future-facing ecosystems
            by designing systems that prioritize intelligence, clarity, and long-term
            architectural thinking.
          </p>
        </div>
      </section>

      {/* ================= INCUBATION SPOTLIGHT SECTION ================= */}
      <section className="uwo-spotlight-section">
        <div className="container">
          <div className="uwo-spotlight-header">
            <span className="uwo-spotlight-subtitle">Empowering Next-Gen Tech with IIT Ropar</span>
            <h2 className="uwo-spotlight-title">INCUBATION <span className="gold-glow-text">SPOTLIGHT</span></h2>
          </div>
          
          <p className="uwo-spotlight-desc">
            UWO<sup>&trade;</sup> is officially incubated with <span className="gold-highlight">IIT Ropar &ndash; Technology Business Incubator Foundation (TBIF)</span>, empowering our vision to build intelligent digital platforms, AI-driven enterprise systems, and next-generation technology solutions.
          </p>

          <div className="uwo-spotlight-horizontal-divider"></div>

          <div className="uwo-spotlight-columns">
            {/* Left Column: IIT Ropar */}
            <div className="uwo-spotlight-column">
              <div className="uwo-spotlight-logo-container">
                <img 
                  src="/images/iit-ropar-logo.jpeg" 
                  alt="IIT Ropar Logo" 
                  className="uwo-spotlight-logo" 
                />
              </div>
              <h3 className="uwo-spotlight-col-title">IIT Institute</h3>
              <p className="uwo-spotlight-col-subtitle">Indian Institute of Technology</p>
            </div>

            {/* Vertical Divider */}
            <div className="uwo-spotlight-vertical-divider"></div>

            {/* Right Column: TBIF */}
            <div className="uwo-spotlight-column">
              <div className="uwo-spotlight-logo-container">
                <img 
                  src="/images/tbif-logo.png" 
                  alt="TBIF Logo" 
                  className="uwo-spotlight-logo" 
                />
              </div>
              <h3 className="uwo-spotlight-col-title gold-title">IIT Ropar &ndash; TBIF</h3>
              <p className="uwo-spotlight-col-subtitle">Technology Business Incubator</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHO WE ARE ================= */}
      <section 
        className="section section-gold" 
        style={{ 
          position: 'relative', 
          overflow: 'hidden', 
          backgroundImage: "url('/images/robot-bg..webp')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundBlendMode: 'soft-light' 
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(253, 251, 247, 0.92) 0%, rgba(226, 209, 195, 0.92) 100%)', zIndex: 1 }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="section-title">Who We Are ?</h2>
          <p className="section-subtitle">
            UWO<sup>&trade;</sup> (Unified Web Options &amp; Services) operates at the intersection of
            engineering, research, and applied intelligence. Our work focuses on
            building foundational technology &trade; not short-term tools &trade; by embedding
            intelligence into system architecture and research-led innovation.
          </p>
        </div>
      </section>

      {/* ================= VISION & MISSION ================= */}
      <section className="section flagship-white">
        <div className="container">
          <h2 className="section-title">Vision &amp; Mission</h2>

          <div className="features-grid" style={{ justifyContent: 'center' }}>
            {/* VISION CARD */}
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <img src="/images/vision..webp" alt="Our Vision" className="project-icon" style={{ width: '120px', height: '120px' }} />
              <h3>Our Vision</h3>
              <p>
                To design AI platforms and intelligence frameworks that are powerful,
                ethical, and human-centric &trade; enabling meaningful impact across
                industries and societies.
              </p>
            </div>

            {/* MISSION CARD */}
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <img src="/images/mission..webp" alt="Our Mission" className="project-icon" style={{ width: '120px', height: '120px' }} />
              <h3>Our Mission</h3>
              <p>
                To design AI platforms and intelligence frameworks that are powerful,
                ethical, and human-centric &trade; enabling meaningful impact across
                industries and societies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHILOSOPHY ================= */}
      <section className="section section-gold">
        <div className="container">
          <h2 className="section-title">Our Engineering Philosophy</h2>
          <p className="section-subtitle">
            Our work is guided by a clear set of principles that prioritize
            sustainability over speed and systems over fragmented tools.
          </p>

          <ul style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', color: 'var(--text-muted)' }}>
            <li style={{ marginBottom: '12px' }}>✅ <strong>Systems over tools</strong> &trade; We build foundations, not fragments</li>
            <li style={{ marginBottom: '12px' }}>✅ <strong>Clarity over complexity</strong> &trade; Intelligence should simplify, not confuse</li>
            <li style={{ marginBottom: '12px' }}>✅ <strong>Intelligence as infrastructure</strong> &trade; AI embedded at the core</li>
            <li>✅ <strong>Long-term architecture thinking</strong> &trade; Platforms designed for decades</li>
          </ul>
        </div>
      </section>
    </>
  );
}
