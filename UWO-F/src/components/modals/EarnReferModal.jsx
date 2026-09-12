import React, { useState, useEffect } from 'react';
import { submitReferral, registerPortalUser, DASHBOARD_LOGIN_URL } from '../../services/api';
import { useAffiliate } from '../../context/AffiliateContext';

export default function EarnReferModal({ isOpen, onClose }) {
  const { affiliateCode } = useAffiliate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [portalLoginUrl, setPortalLoginUrl] = useState(DASHBOARD_LOGIN_URL);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError('');
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail) {
      setError('Please enter your full name and email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await submitReferral({
        name: cleanName,
        email: cleanEmail,
        affiliateCode: affiliateCode || ''
      });

      // Provision user dashboard credentials in background
      try {
        const portalData = await registerPortalUser(cleanName, cleanEmail);
        if (portalData && portalData.credentials && portalData.credentials.loginUrl) {
          setPortalLoginUrl(portalData.credentials.loginUrl);
        }
      } catch (pErr) {
        console.warn('Portal provision:', pErr);
      }

      setSuccessData({
        email: cleanEmail,
        referralCode: data.referralCode || 'UWO-REF-ACTIVE'
      });

      // Optional confetti trigger
      if (typeof window.confetti === 'function') {
        try {
          window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch (cErr) {}
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setError('');
    setSuccessData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      id="earnReferOverlay" 
      className="earn-refer-overlay active" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="earn-refer-card" role="dialog" aria-modal="true" aria-labelledby="earnReferTitle">
        {/* Close Button */}
        <button 
          type="button" 
          className="earn-refer-close" 
          onClick={onClose} 
          title="Close modal" 
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {!successData ? (
          /* Form View - EXACTLY TWO FIELDS: Name and Email */
          <div id="earnReferFormView">
            <div className="earn-badge">
              <i className="fa-solid fa-gift"></i> Earn &amp; Refer
            </div>
            <h2 className="earn-title" id="earnReferTitle">Join UWO™ Earn &amp; Refer</h2>
            <p className="earn-subtitle">
              Partner with us to refer revolutionary AI &amp; enterprise platforms and earn competitive commissions.
            </p>

            <form id="earnReferForm" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div className="earn-form-group">
                <label htmlFor="earnName">Full Name <span className="req">*</span></label>
                <div className="earn-input-wrap">
                  <input 
                    type="text" 
                    id="earnName" 
                    name="name" 
                    placeholder="e.g. Rahul Sharma" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                    autoComplete="name"
                  />
                  <i className="fa-solid fa-user"></i>
                </div>
              </div>

              {/* Email Field */}
              <div className="earn-form-group">
                <label htmlFor="earnEmail">Email Address <span className="req">*</span></label>
                <div className="earn-input-wrap">
                  <input 
                    type="email" 
                    id="earnEmail" 
                    name="email" 
                    placeholder="rahul@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    autoComplete="email"
                  />
                  <i className="fa-solid fa-envelope"></i>
                </div>
              </div>

              {error && (
                <div id="earnErrorMessage" style={{ display: 'block', color: '#ef4444', fontSize: '13px', fontWeight: '600', marginTop: '10px', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="earn-submit-btn" 
                id="earnSubmitBtn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Get My Referral Account</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Success View */
          <div id="earnReferSuccessView" className="earn-success-view" style={{ display: 'block' }}>
            <div className="earn-success-badge">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="earn-success-title">Thank you for submitting the form.</h2>
            <p className="earn-success-text">
              Your referral account has been created! A confirmation email with your <strong>User ID</strong>, <strong>password</strong>, and dashboard access instructions has been sent to <strong id="earnSuccessEmail" style={{ color: '#FABE56' }}>{successData.email}</strong>.
            </p>

            <div className="earn-success-info">
              Application Reference: <strong id="earnSuccessRefCode">{successData.referralCode}</strong>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '22px' }}>
              You can now log in to your personal User Referral Dashboard to generate referral links for all UWO products and track your clicks and downloads in real time.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                id="earnDashboardLink" 
                href={portalLoginUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="earn-done-btn" 
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Open User Dashboard</span>
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
              <button 
                type="button" 
                className="earn-done-btn" 
                style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)' }} 
                onClick={handleReset}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
