import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function Navbar({ onOpenEarnRefer, onToggleDrawer }) {
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* LOGO */}
        <Link to="/" className="nav-logo" title="UWO Home">
          <img src="/images/uwo-logo.png" alt="UWO™ Logo" onError={(e) => { e.currentTarget.src = '/images/logo..webp'; }} />
        </Link>

        {/* DESKTOP NAV */}
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Home
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
            About UWO<sup>™</sup>
          </NavLink>

          {/* OUR PROJECTS DROPDOWN */}
          <div className="projects-dropdown">
            <span className="projects-link">Our Projects &#9662;</span>
            <div className="projects-menu">
              <Link to="/aisa">AISA<sup>™</sup></Link>
              <a href="/aisa-connect/" target="_blank" rel="noopener noreferrer">AISA Connect</a>
              <a href="https://aimall24.com/" target="_blank" rel="noopener noreferrer">AI Mall<sup>™</sup></a>
              <Link to="/efv">EFV<sup>™</sup></Link>
            </div>
          </div>

          <NavLink to="/our-team" className={({ isActive }) => isActive ? 'active' : ''}>
            Our Team
          </NavLink>
          <NavLink to="/blogs" className={({ isActive }) => isActive ? 'active' : ''}>
            Blogs
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>
            Contact
          </NavLink>

          {/* EARN & REFER BUTTON */}
          <button 
            type="button" 
            id="earnReferNavbarBtn" 
            className="earn-refer-btn" 
            onClick={onOpenEarnRefer}
            title="Earn & Refer"
          >
            <i className="fa-solid fa-gift"></i>
            <span>Earn &amp; Refer</span>
          </button>
        </nav>

        {/* MOBILE HAMBURGER */}
        <div className="hamburger" onClick={onToggleDrawer} aria-label="Toggle navigation drawer">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </header>
  );
}
