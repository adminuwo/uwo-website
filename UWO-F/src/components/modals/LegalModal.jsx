import React, { useEffect } from 'react';

export default function LegalModal({ isOpen, type, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';

  return (
    <div 
      className="uwo-legal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="uwo-legal-card" role="dialog" aria-modal="true">
        <div className="uwo-legal-header">
          <h2>{title}</h2>
          <button type="button" className="uwo-legal-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="uwo-legal-body">
          {isPrivacy ? (
            <>
              <h3>1. Introduction</h3>
              <p>
                Unified Web Options &amp; Services Pvt. Ltd. ("UWO", "we", "us", or "our") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website, apply to partner programs, or use our digital platforms (including AISA™, AI Mall™, and EFV™).
              </p>

              <h3>2. The Data We Collect</h3>
              <p>We may collect, use, store, and transfer different kinds of personal data about you, including:</p>
              <ul>
                <li><strong>Identity Data:</strong> Full name, title, professional credentials.</li>
                <li><strong>Contact Data:</strong> Email address, telephone numbers, business communications.</li>
                <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, operating system, and platform.</li>
                <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
              </ul>

              <h3>3. How We Use Your Data</h3>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to:</p>
              <ul>
                <li>Process your Earn &amp; Refer partner application and issue credentials.</li>
                <li>Deliver tailored AI platform demonstrations and enterprise consultation.</li>
                <li>Manage our relationship with you including notifications of updates or security notices.</li>
              </ul>

              <h3>4. Contact Details</h3>
              <p>For questions or requests regarding your personal data, contact us at: <strong style={{ color: '#D6A559' }}>admin@uwo24.com</strong>.</p>
            </>
          ) : (
            <>
              <h3>1. Terms of Use</h3>
              <p>
                By accessing or using the digital platforms, website, or APIs provided by UWO™ - Unified Web Options &amp; Services Pvt. Ltd., you agree to be bound by these Terms &amp; Conditions and all applicable laws and regulations.
              </p>

              <h3>2. Intellectual Property Rights</h3>
              <p>
                All content, trademarks, patents, proprietary algorithms, and brand assets associated with UWO™, AISA™, AI Mall™, and EFV™ are the sole property of Unified Web Options &amp; Services Pvt. Ltd. No material may be reproduced or distributed without express written permission.
              </p>

              <h3>3. Partner &amp; Referral Program</h3>
              <p>
                Participation in the UWO™ Earn &amp; Refer program is subject to compliance with ethical marketing practices. Fraudulent clicks, spamming, self-referrals, or misrepresentation will result in immediate termination of partner access and forfeiture of accrued balances.
              </p>

              <h3>4. Limitation of Liability</h3>
              <p>
                Our platforms leverage generative AI. Outputs and recommendations should be independently verified for mission-critical enterprise decisions.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
