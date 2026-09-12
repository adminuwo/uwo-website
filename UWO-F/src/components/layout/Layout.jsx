import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileDrawer from './MobileDrawer';
import EarnReferModal from '../modals/EarnReferModal';
import LegalModal from '../modals/LegalModal';
import CookieConsent from '../modals/CookieConsent';
import ChatbotWidget from '../widgets/ChatbotWidget';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [earnReferOpen, setEarnReferOpen] = useState(false);
  const [legalModalState, setLegalModalState] = useState({ isOpen: false, type: 'privacy' });

  // Expose global window method so existing inline or external onclicks still work smoothly
  React.useEffect(() => {
    window.openEarnReferModal = () => setEarnReferOpen(true);
    window.closeEarnReferModal = () => setEarnReferOpen(false);
    return () => {
      delete window.openEarnReferModal;
      delete window.closeEarnReferModal;
    };
  }, []);

  const handleOpenLegal = (type) => {
    setLegalModalState({ isOpen: true, type });
  };

  const handleCloseLegal = () => {
    setLegalModalState({ ...legalModalState, isOpen: false });
  };

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

      {/* Legal Overlay (Terms / Privacy) */}
      <LegalModal 
        isOpen={legalModalState.isOpen}
        type={legalModalState.type}
        onClose={handleCloseLegal}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent onOpenPrivacy={() => handleOpenLegal('privacy')} />

      {/* Floating AI Chatbot */}
      <ChatbotWidget />
    </div>
  );
}
