import React, { useState } from 'react';
import { submitContact } from '../services/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    purpose: 'Business',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setStatus({ type: 'error', message: 'Please enter your name and email address.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await submitContact(formData);
      setStatus({ 
        type: 'success', 
        message: 'Thank you for your message! Our team will get back to you shortly.' 
      });
      setFormData({ name: '', email: '', purpose: 'Business', message: '' });
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.message || 'Failed to send your message. Please try again or email admin@uwo24.com.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ================= HERO ================= */}
      <section 
        className="hero hero-centered" 
        style={{ 
          minHeight: '50vh', 
          backgroundImage: "url('/images/contact-bg..webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="hero-content-centered">
          <h1>Get in Touch</h1>
          <p>
            Whether you are exploring partnerships, platforms, or opportunities &trade;
            we&trade;d love to hear from you.
          </p>
        </div>
      </section>

      {/* ================= CONTACT FORM ================= */}
      <section 
        className="section section-gold" 
        style={{ borderTop: '4px solid var(--primary)', borderBottom: '4px solid var(--primary)' }}
      >
        <div className="container">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="section-title-left">Contact Form</h2>

            <form className="contact-form" style={{ maxWidth: '100%' }} onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="contactName">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    id="contactName"
                    name="name" 
                    placeholder="Your name" 
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="email" 
                    id="contactEmail"
                    name="email" 
                    placeholder="your@email.com" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactPurpose">Purpose</label>
                  <select 
                    id="contactPurpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(214,165,89,0.3)',
                      background: '#f8f8f8',
                      color: '#1e293b',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    <option value="Business">Business Engagement</option>
                    <option value="Partnership">Partnership &amp; Integration</option>
                    <option value="Earn & Refer">Earn &amp; Refer Network</option>
                    <option value="Media">Media &amp; Press</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contactMessage">Message</label>
                  <textarea 
                    rows="4" 
                    id="contactMessage"
                    name="message" 
                    placeholder="Write your message..." 
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {status.message && (
                <div 
                  style={{ 
                    marginTop: '15px', 
                    padding: '12px 18px', 
                    borderRadius: '8px', 
                    fontWeight: 600, 
                    textAlign: 'center',
                    background: status.type === 'success' ? '#10b98126' : '#ef444426',
                    color: status.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`
                  }}
                >
                  {status.message}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '20px' }}
                disabled={loading}
              >
                {loading ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ================= FOOTPRINT CTA ================= */}
      <section className="section flagship-white">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Have an idea or challenge in mind?</h2>
          <p className="section-subtitle">
            Our team collaborates seamlessly to design, build, and scale digital solutions.
          </p>

          <a 
            href="https://wa.me/918358990909" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-glow"
          >
            Start a Project
          </a>
        </div>
      </section>
    </>
  );
}
