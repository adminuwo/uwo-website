import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { fetchProjects, API_URL } from '../services/api';

export default function HomePage() {
  const { openEarnRefer } = useOutletContext() || {};
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const data = await fetchProjects();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProjects(data);
        } else if (isMounted) {
          // Default flagship projects
          setProjects(getDefaultProjects());
        }
      } catch (err) {
        if (isMounted) {
          setProjects(getDefaultProjects());
        }
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    }
    loadProjects();
    return () => { isMounted = false; };
  }, []);

  const PROJECT_LOGO_FALLBACKS = {
    'aisa': '/images/aisa-logo.svg',
    'aisa connect': '/images/aisa-logo.svg',
    'ai mall': '/images/AIMALLL..webp',
    'efv': '/images/EFV.png',
  };

  function getProjectFallbackLogo(name) {
    return PROJECT_LOGO_FALLBACKS[(name || '').toLowerCase()] || '/images/uwo-logo.png';
  }

  function getDefaultProjects() {
    return [
      {
        name: 'AISA',
        is_featured: true,
        project_url: 'https://aisa24.com/',
        logo: '/images/aisa-logo.svg',
        short_description: 'Next-generation AI Operating System for autonomous enterprise agents and intelligent workflow orchestration.'
      },
      {
        name: 'AI Mall',
        is_featured: true,
        project_url: 'https://aimall24.com/',
        logo: '/images/AIMALLL..webp',
        short_description: 'Universal decentralized marketplace for specialized AI models, enterprise agents, and cognitive microservices.'
      },
      {
        name: 'EFV',
        is_featured: true,
        project_url: 'https://efvframework.com/index.html',
        logo: '/images/EFV.png',
        short_description: 'Enterprise Functional Visualizer - high-performance real-time visual modeling and enterprise architecture engine.'
      }
    ];
  }

  const getLogoUrl = (logo) => {
    if (!logo) return '/images/uwo-logo.png';
    const cloudRunBase = 'https://uwo-backend-977864306871.asia-south1.run.app';
    if (logo.includes('storage.googleapis.com/uwo-document/')) {
      const objectPath = logo.split('storage.googleapis.com/uwo-document/')[1];
      return `${cloudRunBase}/api/media/${objectPath.replace(/^\/+/, '')}`;
    }
    if (logo.includes('/api/media/')) {
      const mediaPath = logo.split('/api/media/')[1];
      return `${cloudRunBase}/api/media/${mediaPath.replace(/^\/+/, '')}`;
    }
    return logo.startsWith('http') || logo.startsWith('/') ? logo : `${API_URL}/${logo}`;
  };

  return (
    <>
      {/* ================= HERO SECTION ================= */}
      <section className="hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src="/images/WhatsApp Video 2026-01-02 at 5.19.31 PM.mp4" type="video/mp4" />
        </video>
        <div className="hero-content">
          <h1>
            Building <span className="text-gradient">Intelligent Digital Platforms</span> for a Connected World
          </h1>

          <p>
            UWO<sup>&trade;</sup> (Unified Web Options &amp; Services) designs AI-driven platforms, enterprise systems,
            and next-generation intelligence frameworks that scale across industries.
          </p>

          <div className="hero-cta-wrapper">
            <Link to="/about" className="btn btn-primary">
              Explore Our Platforms
            </Link>

            <Link to="/contact" className="btn btn-primary">
              Partner With Us
            </Link>
          </div>
        </div>
      </section>

      {/* ================= WHAT WE BUILD ================= */}
      <section className="section section-gold">
        <div className="container">
          <h2 className="section-title">Technology That Scales With Intelligence</h2>
          <p className="section-subtitle">
            We build platforms where intelligence is embedded at the system level &trade; enabling scalability, adaptability, and long-term relevance.
          </p>

          <div className="features-grid">
            {/* CARD 1 */}
            <div className="feature-card">
              <h3>AI Platforms &amp; Ecosystems</h3>
              <h4>Multi-Agent Intelligence</h4>
              <p>
                UWO<sup>&trade;</sup> designs AI-native platforms powered by adaptive intelligence models.
                Seamless interaction between users, vendors, and AI systems.
              </p>
              <ul>
                <li>Multi-agent system design</li>
                <li>AI orchestration layers</li>
                <li>Platform-level intelligence</li>
              </ul>
            </div>

            {/* CARD 2 */}
            <div className="feature-card">
              <h3>Enterprise Digital Solutions</h3>
              <h4>Intelligent Automation</h4>
              <p>
                We build enterprise-grade digital solutions combining automation,
                analytics, and system integration for real-world impact.
              </p>
              <ul>
                <li>Workflow automation</li>
                <li>Intelligent analytics</li>
                <li>Secure enterprise systems</li>
              </ul>
            </div>

            {/* CARD 3 */}
            <div className="feature-card">
              <h3>Research-Driven Incubation</h3>
              <h4>AI&trade;Human Interaction</h4>
              <p>
                Investigating proprietary research frameworks that explore intelligence,
                cognition, and human-system interaction.
              </p>
              <ul>
                <li>Cognitive intelligence research</li>
                <li>Experimental frameworks</li>
                <li>Long-horizon product vision</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FLAGSHIP PROJECTS ================= */}
      <section className="section flagship-white" id="projects">
        <div className="container">
          <h2 className="section-title">Our Flagship Projects</h2>
          <p className="section-subtitle">
            Pioneering the future of digital commerce, enterprise intelligence, and cognitive modeling.
          </p>

          <div className="project-cards" id="dynamic-project-cards">
            {loadingProjects ? (
              <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#94a3b8' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#D6A559' }}></i>
                <p style={{ marginTop: '15px', fontWeight: 600 }}>Loading Flagship Projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <p style={{ textAlign: 'center', width: '100%', color: '#94a3b8' }}>New projects coming soon...</p>
            ) : (
              projects.map((project, index) => (
                <a 
                  key={index} 
                  href={project.project_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="project-card"
                >
                  <img 
                    src={getLogoUrl(project.logo)} 
                    alt={project.name} 
                    className="project-icon" 
                    crossOrigin="anonymous" 
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getProjectFallbackLogo(project.name); }} 
                  />
                  <h3>
                    {project.name}
                    {project.is_featured && <sup>&trade;</sup>}
                  </h3>
                  <p>{project.short_description}</p>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ================= GLOBAL TRUST ================= */}
      <section className="section trust-section">
        <div className="container">
          <h2 className="section-title">Built for Global Scale</h2>
          <p className="section-subtitle">
            Designed with security, extensibility, and compliance in mind.
          </p>

          <div className="trust-grid">
            <div className="trust-item"><span>✦</span> Cloud-native Architecture</div>
            <div className="trust-item"><span>✦</span> Enterprise Security</div>
            <div className="trust-item"><span>✦</span> API-first Design</div>
            <div className="trust-item"><span>✦</span> Modular Scalability</div>
          </div>
        </div>
      </section>
    </>
  );
}
