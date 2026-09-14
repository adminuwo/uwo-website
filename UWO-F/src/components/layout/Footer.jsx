import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer({ onOpenLegal }) {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* LEFT SIDE */}
        <div className="footer-left">
          <div className="social-links">
            <a href="mailto:admin@uwo24.com" className="social-icon-wrapper" title="Email Us">
              <img src="/images/Gmail_Logo_512px-removebg-preview.png" alt="Email" />
            </a>
            <a href="https://wa.me/918358990909" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="WhatsApp">
              <img src="/images/whatsapp.svg" alt="WhatsApp" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="Facebook">
              <img src="/images/facebook..webp" alt="Facebook" />
            </a>
            <a href="https://www.instagram.com/uwo_business/" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="Instagram">
              <img src="/images/instagram-logo-transparent-background-2..webp" alt="Instagram" />
            </a>
            <a href="https://www.linkedin.com/company/uwo-business/" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="LinkedIn">
              <img src="/images/linkedin..webp" alt="LinkedIn" />
            </a>
            <a href="https://x.com/uwo_business" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="Twitter">
              <img src="/images/twitter..webp" alt="Twitter" />
            </a>
            <a href="https://in.pinterest.com/UWO_Business/" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="Pinterest">
              <i className="fa-brands fa-pinterest" style={{ color: '#E60023', fontSize: '22px' }}></i>
            </a>
            <a href="https://www.reddit.com/user/AcanthisittaFront692/" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="Reddit">
              <i className="fa-brands fa-reddit" style={{ color: '#FF4500', fontSize: '22px' }}></i>
            </a>
            <a href="https://www.quora.com/profile/UWO-Business" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="Quora">
              <i className="fa-brands fa-quora" style={{ color: '#B92B27', fontSize: '22px' }}></i>
            </a>
            <a href="https://medium.com/@sreshthi.unifiedweboption" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="Medium">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '22px', height: '22px' }}>
                <path d="M25 25 L35 25 L45 65 L55 25 L65 25 L75 25 L75 75 L65 75 L65 35 L55 75 L45 75 L35 35 L35 75 L25 75 Z" fill="#ffffff" />
              </svg>
            </a>
            <a href="https://www.youtube.com/channel/UC_YQo0Y8bX54gsl8k4D9jvA" target="_blank" rel="noopener noreferrer" className="social-icon-wrapper" title="YouTube">
              <img src="/images/youtube..webp" alt="YouTube" />
            </a>
          </div>

          <p style={{ marginTop: '15px', marginBottom: 0 }}>
            UWO<sup>&trade;</sup> - Unified Web Options &amp; Services Pvt. Ltd. &copy; {currentYear}
          </p>
          <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '0.9rem' }}>
            <Link 
              to="/terms-and-conditions" 
              state={{ backgroundLocation: location, from: location.pathname + location.search }}
              className="legal-footer-link" 
              style={{ marginRight: '15px' }}
              onClick={(e) => {
                if (onOpenLegal) {
                  e.preventDefault();
                  onOpenLegal('terms');
                }
              }}
            >
              Terms &amp; Conditions
            </Link>
            <Link 
              to="/privacy-policy" 
              state={{ backgroundLocation: location, from: location.pathname + location.search }}
              className="legal-footer-link" 
              style={{ marginRight: '15px' }}
              onClick={(e) => {
                if (onOpenLegal) {
                  e.preventDefault();
                  onOpenLegal('privacy');
                }
              }}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/cookies-policy" 
              state={{ backgroundLocation: location, from: location.pathname + location.search }}
              className="legal-footer-link"
              onClick={(e) => {
                if (onOpenLegal) {
                  e.preventDefault();
                  onOpenLegal('cookies');
                }
              }}
            >
              Cookies Policy
            </Link>
          </p>
        </div>

        {/* D-U-N-S Registered™ Seal Wrapper */}
        <div className="duns-seal-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '97px', width: '100%' }}>
          <img src="/images/duns-logo.png" alt="D-U-N-S® Registered™" style={{ width: '102px', height: '93px' }} />
        </div>

        {/* RIGHT SIDE */}
        <div className="footer-right">
          <h2 className="partner-heading">AISA<sup>&trade;</sup> | AI Mall<sup>&trade;</sup> | A-Series&trade;</h2>
          <div className="partner-logos-row">
            <div className="logo-item"><img src="/images/azure.png" alt="Azure" height="38" /></div>
            <div className="logo-item"><img src="/images/AWS.png" alt="AWS" height="38" /></div>
            <div className="logo-item"><img src="/images/mongodb.png" alt="MongoDB" height="38" /></div>
            <div className="logo-item"><img src="/images/notion copy.png" alt="Notion" height="38" /></div>
            <div className="logo-item"><img src="/images/google_cloud_.webp" alt="Google Cloud" height="38" /></div>
            <div className="logo-item"><img src="/images/DigitalOcean.png" alt="DigitalOcean" height="38" /></div>
            <div className="logo-item"><img src="/images/tavily.webp" alt="Tavily" height="38" /></div>
          </div>
          <p className="partner-subtext">
            Supported by Global Startup Programs &amp; Cloud credits from leading Technology providers <br />
            D-U-N-S® Registered™
          </p>
        </div>
      </div>
    </footer>
  );
}
