import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileDrawer from './MobileDrawer';
import EarnReferModal from '../modals/EarnReferModal';
import LegalModal from '../modals/LegalModal';
import CookieConsent from '../modals/CookieConsent';
import ChatbotWidget from '../widgets/ChatbotWidget';

export default function Layout({ actualLocation }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [earnReferOpen, setEarnReferOpen] = useState(false);
  const [legalModalState, setLegalModalState] = useState({ isOpen: false, type: 'terms' });

  const routerLocation = useLocation();
  const navigate = useNavigate();

  // Effective location: prioritized from App top-level BrowserRouter, fallback to routerLocation
  const currentLoc = actualLocation || routerLocation;
  const pathname = (currentLoc?.pathname || window.location.pathname || '').toLowerCase();

  const isPrivacyRoute = pathname === '/privacy-policy' || pathname === '/privacy' || pathname === '/privacy-policy.html';
  const isTermsRoute = pathname === '/terms-and-conditions' || pathname === '/terms' || pathname === '/terms-of-service' || pathname === '/terms-and-conditions.html';
  const isCookiesRoute = pathname === '/cookies-policy' || pathname === '/cookie-policy' || pathname === '/cookies' || pathname === '/cookies-policy.html';
  const isLegalRoute = isPrivacyRoute || isTermsRoute || isCookiesRoute;

  const legalModalType = isPrivacyRoute 
    ? 'privacy' 
    : (isCookiesRoute ? 'cookies' : (isTermsRoute ? 'terms' : legalModalState.type));
  
  const isLegalModalOpen = isLegalRoute || legalModalState.isOpen;

  const handleOpenLegal = (type) => {
    let targetPath = '/terms-and-conditions';
    if (type === 'privacy') targetPath = '/privacy-policy';
    if (type === 'cookies') targetPath = '/cookies-policy';

    setLegalModalState({ isOpen: true, type });

    if (pathname !== targetPath) {
      // Store current background location so page behind modal stays unchanged
      const backgroundLoc = isLegalRoute 
        ? currentLoc.state?.backgroundLocation 
        : { pathname: currentLoc.pathname, search: currentLoc.search };

      navigate(targetPath, { 
        state: { 
          backgroundLocation: backgroundLoc || { pathname: '/' },
          from: currentLoc.pathname + currentLoc.search 
        } 
      });
    }
  };

  const handleCloseLegal = () => {
    setLegalModalState(prev => ({ ...prev, isOpen: false }));

    if (isLegalRoute) {
      if (currentLoc.state?.from && currentLoc.state.from !== currentLoc.pathname) {
        navigate(currentLoc.state.from);
      } else if (currentLoc.state?.backgroundLocation?.pathname && currentLoc.state.backgroundLocation.pathname !== currentLoc.pathname) {
        navigate(currentLoc.state.backgroundLocation.pathname + (currentLoc.state.backgroundLocation.search || ''));
      } else if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  // Expose global window methods so existing inline or external onclicks still work smoothly
  useEffect(() => {
    window.openEarnReferModal = () => setEarnReferOpen(true);
    window.closeEarnReferModal = () => setEarnReferOpen(false);
    window.openLegalModal = (type) => handleOpenLegal(type);
    window.closeLegalModal = () => handleCloseLegal();
    return () => {
      delete window.openEarnReferModal;
      delete window.closeEarnReferModal;
      delete window.openLegalModal;
      delete window.closeLegalModal;
    };
  }, [currentLoc]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar 
        onOpenEarnRefer={() => setEarnReferOpen(true)}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenEarnRefer={() => setEarnReferOpen(true)}
      />

      {/* Main Routed Page Content */}
      <main className="main-content page-transition">
        <Outlet context={{ openEarnRefer: () => setEarnReferOpen(true) }} />
      </main>

      {/* Global Footer */}
      <Footer onOpenLegal={handleOpenLegal} />

      {/* 2-Field Earn & Refer Modal */}
      <EarnReferModal 
        isOpen={earnReferOpen} 
        onClose={() => setEarnReferOpen(false)} 
      />

      {/* Legal Overlay (Terms / Privacy / Cookies) synced with URL route */}
      <LegalModal 
        isOpen={isLegalModalOpen}
        type={legalModalType}
        onClose={handleCloseLegal}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent onOpenPrivacy={() => handleOpenLegal('privacy')} />

      {/* Floating AI Chatbot */}
      <ChatbotWidget />
    </div>
  );
}
