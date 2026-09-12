import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import OurTeamPage from './pages/OurTeamPage';
import BlogsPage from './pages/BlogsPage';
import BlogSinglePage from './pages/BlogSinglePage';
import ContactPage from './pages/ContactPage';
import AisaPage from './pages/AisaPage';
import EfvPage from './pages/EfvPage';
import PartnerLoginPage from './pages/PartnerLoginPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';
import AdminPage from './pages/AdminPage';

// Auto-scroll to top on route change
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes wrapped with master Layout (Navbar, Footer, 2-Field Modal, Chatbot) */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/index.html" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about.html" element={<AboutPage />} />
          <Route path="/our-team" element={<OurTeamPage />} />
          <Route path="/our-team.html" element={<OurTeamPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs.html" element={<BlogsPage />} />
          <Route path="/blogs/:slug" element={<BlogSinglePage />} />
          <Route path="/blog-single.html" element={<BlogSinglePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contact.html" element={<ContactPage />} />
          <Route path="/aisa" element={<AisaPage />} />
          <Route path="/aisa.html" element={<AisaPage />} />
          <Route path="/efv" element={<EfvPage />} />
          <Route path="/efv.html" element={<EfvPage />} />
          <Route path="/partner-login" element={<PartnerLoginPage />} />
          <Route path="/partner-login.html" element={<PartnerLoginPage />} />
          <Route path="/partner-dashboard" element={<PartnerDashboardPage />} />
          <Route path="/partner-dashboard.html" element={<PartnerDashboardPage />} />
        </Route>

        {/* Dedicated Admin Portal Route */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
