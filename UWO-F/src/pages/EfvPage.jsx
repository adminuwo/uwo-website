import React, { useState } from 'react';
import { getApiUrl } from '../services/api';

export default function EfvPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setSubMessage('');
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'EFV Subscriber',
          email,
          message: 'Subscribed to EFV Framework updates',
          subject: 'EFV Framework Subscription'
        })
      });

      if (res.ok) {
        setSubMessage('Thank you for subscribing to EFV™ Framework updates!');
        setEmail('');
      } else {
        setSubMessage('Thank you for subscribing!');
        setEmail('');
      }
    } catch (err) {
      console.error(err);
      setSubMessage('Thank you for subscribing!');
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="efv-page" style={{ background: '#0B1120', color: '#f8fafc', minHeight: '100vh' }}>
      {/* HERO SECTION */}
      <section
        className="hero-section"
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: '160px 24px 100px',
          background: 'linear-gradient(to bottom, rgba(11, 17, 32, 0.7), rgba(11, 17, 32, 0.95))',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          className="hero-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(214, 165, 89, 0.15)',
            border: '1px solid rgba(214, 165, 89, 0.3)',
            padding: '10px 24px',
            borderRadius: '50px',
            fontSize: '0.9rem',
            color: '#D6A559',
            marginBottom: '25px',
            fontWeight: 700
          }}
        >
          Cognitive Intelligence Framework™
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            marginBottom: '20px',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            color: '#ffffff'
          }}
        >
          EFV™ Framework
        </h1>

        <p
          className="tagline"
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
            color: '#94a3b8',
            maxWidth: '700px',
            margin: '0 auto 40px',
            lineHeight: 1.6
          }}
        >
          The Blueprint of Cognitive Frequency &amp; Intelligent Growth Systems.
          A revolutionary approach to understanding consciousness and evolution.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#explore"
            style={{
              padding: '14px 34px',
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, #D6A559, #FABE56)',
              color: '#000',
              boxShadow: '0 10px 30px rgba(214, 165, 89, 0.3)'
            }}
          >
            Explore Framework™
          </a>
          <a
            href="https://www.amazon.in/dp/B0GKPT184H"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '14px 34px',
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'transparent',
              color: '#fff',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            Get the Book
          </a>
        </div>
      </section>

      {/* SECTION 1: The Origin Code */}
      <section id="explore" style={{ padding: '90px 24px', background: 'linear-gradient(180deg, #f7efd7 0%, #fff5e6 100%)', color: '#1e293b' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px' }}>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#B48E3D',
              display: 'block',
              marginBottom: '12px'
            }}
          >
            Foundation
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: '#000', marginBottom: '14px' }}>
            The Origin Code™
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.7 }}>
            Understanding the fundamental principles that govern cognitive frequency and the architecture of
            intelligent systems.
          </p>
        </div>
        <div
          style={{
            maxWidth: '950px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.08)',
            position: 'relative'
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #D6A559, #FABE56)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#000'
            }}
          >
            01
          </span>
          <img
            src="/images/1.jpeg"
            alt="EFV Framework Part 1 - The Origin Code"
            style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block' }}
          />
        </div>
      </section>

      {/* SECTION 2: The Growth Matrix */}
      <section style={{ padding: '90px 24px', background: 'linear-gradient(180deg, #fff5e6 0%, #e8dcc8 50%, #d4c4a8 100%)', color: '#1e293b' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px' }}>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#B48E3D',
              display: 'block',
              marginBottom: '12px'
            }}
          >
            Evolution
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: '#000', marginBottom: '14px' }}>
            The Growth Matrix
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.7 }}>
            Exploring the interconnected pathways of intelligent evolution and systematic cognitive development.
          </p>
        </div>
        <div
          style={{
            maxWidth: '950px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.08)',
            position: 'relative'
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #D6A559, #FABE56)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#000'
            }}
          >
            02
          </span>
          <img
            src="/images/2.svg"
            alt="EFV Framework Part 2 - The Growth Matrix"
            style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block' }}
          />
        </div>
      </section>

      {/* SECTION 3: The Integration Protocol */}
      <section style={{ padding: '90px 24px', background: 'linear-gradient(180deg, #d4c4a8 0%, #fdfbf7 100%)', color: '#1e293b' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px' }}>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#B48E3D',
              display: 'block',
              marginBottom: '12px'
            }}
          >
            Mastery
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: '#000', marginBottom: '14px' }}>
            The Integration Protocol
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.7 }}>
            Achieving harmonious integration of all framework components for complete cognitive mastery.
          </p>
        </div>
        <div
          style={{
            maxWidth: '950px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.08)',
            position: 'relative'
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #D6A559, #FABE56)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#000'
            }}
          >
            03
          </span>
          <img
            src="/images/3.jpeg"
            alt="EFV Framework Part 3 - The Integration Protocol"
            style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block' }}
          />
        </div>
      </section>

      {/* PLATFORMS & SUBSCRIBE FOOTER BANNER */}
      <section style={{ padding: '80px 24px', background: '#0a0f1a', textAlign: 'center' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto 40px' }}>
          <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px' }}>
            Subscribe for Updates
          </h3>
          <form
            onSubmit={handleSubscribe}
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '50px',
              padding: '6px',
              border: '1px solid rgba(214, 165, 89, 0.2)'
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '12px 24px',
                border: 'none',
                background: 'transparent',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 28px',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #D6A559, #FABE56)',
                color: '#000',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {submitting ? '...' : 'Subscribe'}
            </button>
          </form>
          {subMessage && (
            <p style={{ marginTop: '14px', color: '#D6A559', fontSize: '14px', fontWeight: 600 }}>{subMessage}</p>
          )}
        </div>

        {/* Platform links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <a
            href="https://efv.uwo.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '30px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px'
            }}
          >
            <img src="/images/EFV.png" alt="EFV" style={{ height: '22px' }} /> EFV Website
          </a>
          <a
            href="https://www.amazon.in/dp/B0GKPT184H"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '30px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px'
            }}
          >
            <img src="/images/Amazon.png" alt="Amazon" style={{ height: '22px' }} /> Amazon
          </a>
          <a
            href="https://notionpress.com/in/read/efv-canon-volume-1-the-origin-code-hindi-edition"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '30px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px'
            }}
          >
            <img src="/images/notion.png" alt="Notion" style={{ height: '22px' }} /> NotionPress
          </a>
          <a
            href="https://www.flipkart.com/efv-canon/p/itmd2a588b2f4fdf?pid=9798902318798"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '30px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px'
            }}
          >
            <img src="/images/flipcard.png" alt="Flipkart" style={{ height: '22px' }} /> Flipkart
          </a>
        </div>
      </section>
    </div>
  );
}
