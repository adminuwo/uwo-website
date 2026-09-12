import React, { useState, useEffect } from 'react';

export default function CookieConsent({ onOpenPrivacy }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('uwo_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('uwo_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('uwo_cookie_consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent-overlay active">
      <div className="cookie-consent-popup">
        <div className="cookie-popup-icon-container">
          <i className="fa-solid fa-cookie-bite"></i>
        </div>
        <div className="cookie-popup-content">
          <h3 className="cookie-popup-title">Cookie &amp; Privacy Choices</h3>
          <p className="cookie-popup-desc">
            We use cookies to personalize your experience, analyze web traffic, and optimize our AI digital platforms. By clicking "Accept All", you consent to our use of cookies as outlined in our{' '}
            <a 
              href="#privacy" 
              onClick={(e) => { 
                e.preventDefault(); 
                if (onOpenPrivacy) onOpenPrivacy(); 
              }}
            >
              Privacy Policy
            </a>.
          </p>
        </div>
        <div className="cookie-popup-actions">
          <button type="button" className="cookie-btn cookie-btn-accept" onClick={handleAccept}>
            Accept All
          </button>
          <button type="button" className="cookie-btn cookie-btn-reject" onClick={handleReject}>
            Reject Non-Essential
          </button>
        </div>
      </div>
    </div>
  );
}
