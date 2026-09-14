import React, { useState, useEffect, useRef } from 'react';
import { fetchLegalPage } from '../../services/api';

const DEFAULT_LEGAL_DATA = {
  privacy: {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: `
      <h3>1. Introduction</h3>
      <p>Unified Web Options &amp; Services Pvt. Ltd. ("UWO", "we", "us", or "our") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website, apply to partner programs, or use our digital platforms (including AISA™, AI Mall™, and EFV™).</p>
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
      <p>For questions or requests regarding your personal data, contact us at: <strong style="color: #D6A559;">admin@uwo24.com</strong>.</p>
    `
  },
  terms: {
    title: 'Terms & Conditions',
    slug: 'terms-and-conditions',
    content: `
      <h3>1. Terms of Use</h3>
      <p>By accessing or using the digital platforms, website, or APIs provided by UWO™ - Unified Web Options &amp; Services Pvt. Ltd., you agree to be bound by these Terms &amp; Conditions and all applicable laws and regulations.</p>
      <h3>2. Intellectual Property Rights</h3>
      <p>All content, trademarks, patents, proprietary algorithms, and brand assets associated with UWO™, AISA™, AI Mall™, and EFV™ are the sole property of Unified Web Options &amp; Services Pvt. Ltd. No material may be reproduced or distributed without express written permission.</p>
      <h3>3. Partner &amp; Referral Program</h3>
      <p>Participation in the UWO™ Earn &amp; Refer program is subject to compliance with ethical marketing practices. Fraudulent clicks, spamming, self-referrals, or misrepresentation will result in immediate termination of partner access and forfeiture of accrued balances.</p>
      <h3>4. Limitation of Liability</h3>
      <p>Our platforms leverage generative AI. Outputs and recommendations should be independently verified for mission-critical enterprise decisions.</p>
    `
  },
  cookies: {
    title: 'Cookies Policy',
    slug: 'cookies-policy',
    content: `
      <h3>1. What Are Cookies?</h3>
      <p>Cookies and similar tracking technologies are small data files stored on your browser or device when visiting UWO™ digital portals. They help preserve session authentication, analyze user traffic patterns, and deliver responsive AI platform experiences.</p>
      <h3>2. Types of Cookies We Use</h3>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for secure login, CSRF verification, and core interface navigation.</li>
        <li><strong>Functional &amp; Preference:</strong> Retain UI choices, such as dark theme preferences and partner referral IDs.</li>
        <li><strong>Performance &amp; Analytics:</strong> Help our engineers identify load bottlenecks and optimize API speeds.</li>
      </ul>
      <h3>3. Managing Cookie Preferences</h3>
      <p>You can manage or revoke non-essential cookies at any time via the on-site cookie banner or through your browser settings.</p>
      <h3>4. Contact</h3>
      <p>Inquiries regarding our Cookie Policy can be directed to: <strong style="color: #D6A559;">admin@uwo24.com</strong>.</p>
    `
  }
};

export default function LegalModal({ isOpen, type = 'terms', onClose }) {
  const bodyRef = useRef(null);
  const normalizedType = type === 'privacy' ? 'privacy' : (type === 'cookies' ? 'cookies' : 'terms');
  const initialData = DEFAULT_LEGAL_DATA[normalizedType] || DEFAULT_LEGAL_DATA.terms;

  const [title, setTitle] = useState(initialData.title);
  const [contentHtml, setContentHtml] = useState(initialData.content);
  const [, setIsLoading] = useState(false);

  // Close on Escape key & manage body overflow
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Sync title and fetch latest published content from backend CMS
  useEffect(() => {
    if (!isOpen) return;

    const fallback = DEFAULT_LEGAL_DATA[normalizedType] || DEFAULT_LEGAL_DATA.terms;
    setTitle(fallback.title);
    setContentHtml(fallback.content);

    // Save previous document title and set page title
    const prevDocumentTitle = document.title;
    document.title = `${fallback.title} | UWO™`;

    // Scroll modal body to top
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchLegalPage(fallback.slug)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.content) {
          setContentHtml(data.content);
          if (data.title) {
            setTitle(data.title);
            document.title = `${data.title} | UWO™`;
          }
        }
      })
      .catch((err) => {
        console.warn(`[LegalModal] Using fallback content for ${fallback.slug}:`, err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      document.title = prevDocumentTitle;
    };
  }, [isOpen, normalizedType]);

  if (!isOpen) return null;

  return (
    <div 
      className="uwo-legal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div className="uwo-legal-card" role="dialog" aria-modal="true" aria-labelledby="uwo-legal-modal-title">
        <div className="uwo-legal-header">
          <h2 id="uwo-legal-modal-title">{title}</h2>
          <button 
            type="button" 
            className="uwo-legal-close" 
            onClick={onClose} 
            aria-label="Close dialog"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div 
          ref={bodyRef}
          className="uwo-legal-body"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>
    </div>
  );
}
