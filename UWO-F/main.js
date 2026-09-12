// 🔹 DYNAMIC BACKEND API URL
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8080/api"
  : "https://uwo-backend-977864306871.asia-south1.run.app/api";

// UI Helper Functions
function toggleDrawer() {
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("drawerOverlay");
  if (drawer) drawer.classList.toggle("open");
  if (overlay) overlay.classList.toggle("active");
}

function toggleMobileProjects() {
  const projects = document.getElementById("mobileProjects");
  if (projects) projects.classList.toggle("open");
}

function openPage(page) {
  window.location.href = page;
}

// ============ CUSTOM SELECT DROPDOWN — Clean & Minimal ============
function initCustomSelect() {
  const wrap = document.getElementById('cselWrap');
  const native = document.getElementById('purpose');
  if (!wrap || !native) return;

  const firstVal = native.value || native.options[0].value;

  // Build trigger
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'cselTrigger';
  trigger.className = 'csel-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <span class="csel-t-label" id="cselLabel">${firstVal}</span>
    <svg class="csel-arrow" id="cselArrow" xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#D6A559" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`;

  // Build options panel
  const panel = document.createElement('div');
  panel.id = 'cselPanel';
  panel.className = 'csel-panel';
  panel.setAttribute('role', 'listbox');

  Array.from(native.options).forEach((opt, i) => {
    const item = document.createElement('div');
    item.className = 'csel-option' + (i === 0 ? ' csel-selected' : '');
    item.setAttribute('role', 'option');
    item.setAttribute('data-value', opt.value);
    item.innerHTML = `
      <span class="cso-label">${opt.value}</span>
      <svg class="cso-check" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
        viewBox="0 0 24 24" fill="none" stroke="#D6A559" stroke-width="2.8"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
    item.addEventListener('click', () => pickOption(item));
    panel.appendChild(item);
  });

  wrap.appendChild(trigger);
  wrap.appendChild(panel);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.classList.contains('csel-open') ? closeDropdown() : openDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });
}

function openDropdown() {
  const wrap = document.getElementById('cselWrap');
  const trigger = document.getElementById('cselTrigger');
  const panel = document.getElementById('cselPanel');
  const arrow = document.getElementById('cselArrow');
  if (!wrap) return;
  wrap.classList.add('csel-open');
  trigger.setAttribute('aria-expanded', 'true');
  panel.style.maxHeight = panel.scrollHeight + 'px';
  arrow.style.transform = 'rotate(180deg)';
}

function closeDropdown() {
  const wrap = document.getElementById('cselWrap');
  const trigger = document.getElementById('cselTrigger');
  const panel = document.getElementById('cselPanel');
  const arrow = document.getElementById('cselArrow');
  if (!wrap) return;
  wrap.classList.remove('csel-open');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (panel) panel.style.maxHeight = '0';
  if (arrow) arrow.style.transform = 'rotate(0deg)';
}

function pickOption(item) {
  const value = item.getAttribute('data-value');

  // Sync native select
  document.getElementById('purpose').value = value;

  // Update trigger label
  document.getElementById('cselLabel').textContent = value;

  // Update selected state
  document.querySelectorAll('.csel-option').forEach(o => o.classList.remove('csel-selected'));
  item.classList.add('csel-selected');

  closeDropdown();
}

document.addEventListener('DOMContentLoaded', initCustomSelect);

// Global ScrollTrigger refresh — called after all deferred scripts run
// This is critical because stacked-features.js uses pinSpacing:true which
// adds spacer divs mid-page, shifting all subsequent ScrollTrigger positions
window.addEventListener('load', () => {
  if (typeof ScrollTrigger !== 'undefined') {
    // First refresh after short delay (let all JS components render)
    setTimeout(() => ScrollTrigger.refresh(), 500);
    // Second refresh after longer delay (let GSAP pin spacers fully settle)
    setTimeout(() => ScrollTrigger.refresh(), 1500);
  }
});


// ============ CUSTOM MODAL POPUP ============
const MODAL_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#22c55e" stroke-width="2"/>
    <path fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M14 27l8 8 16-16"/>
  </svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#ef4444" stroke-width="2"/>
    <line x1="17" y1="17" x2="35" y2="35" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
    <line x1="35" y1="17" x2="17" y2="35" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
  </svg>`
};

function showModal(message, type = 'success') {
  const existing = document.getElementById('uwo-modal-overlay');
  if (existing) existing.remove();

  const title = type === 'success' ? 'Message Sent' : 'Something went wrong';

  const overlay = document.createElement('div');
  overlay.id = 'uwo-modal-overlay';
  overlay.innerHTML = `
    <div class="uwo-modal" id="uwo-modal">
      <div class="uwo-modal-icon">${MODAL_ICONS[type]}</div>
      <h3 class="uwo-modal-title">${title}</h3>
      <p class="uwo-modal-message">${message}</p>
      <button class="uwo-modal-btn" onclick="closeModal()">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('uwo-modal-visible');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  const overlay = document.getElementById('uwo-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('uwo-modal-visible');
  overlay.classList.add('uwo-modal-hiding');
  setTimeout(() => overlay.remove(), 300);
}

// ============ CONTACT FORM ============
async function sendMessage() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const purpose = document.getElementById("purpose").value;

  if (!name || !email || !message) {
    showModal('Please fill in all required fields.', 'error');
    return;
  }

  try {
    const affiliateCode = localStorage.getItem('uwo_affiliate_code') || '';
    const productSlug = localStorage.getItem('uwo_affiliate_product') || '';
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, purpose, affiliateCode, productSlug })
    });

    if (response.ok) {
      showModal("Your message has been sent. We'll get back to you shortly.", 'success');
      document.getElementById("name").value = '';
      document.getElementById("email").value = '';
      document.getElementById("message").value = '';
    } else {
      showModal('Something went wrong. Please try again later.', 'error');
    }
  } catch (error) {
    showModal('Unable to send message. Please check your connection.', 'error');
    console.error(error);
  }
}

// ============ LEGAL MODAL LOGIC ============
let originalSeo = null;
let hasPushedState = false;

function applySeo(data) {
  if (!originalSeo) {
    originalSeo = {
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      metaKeywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
    };
  }

  if (data.seoTitle) document.title = data.seoTitle;

  const setMeta = (name, content, attrName = 'name') => {
    if (!content) return;
    let el = document.querySelector(`meta[${attrName}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('description', data.metaDescription);
  setMeta('keywords', data.metaKeywords);
  setMeta('robots', data.robots);
  setMeta('og:title', data.openGraphTitle || data.seoTitle, 'property');
  setMeta('og:description', data.openGraphDescription || data.metaDescription, 'property');
  setMeta('og:image', data.openGraphImage, 'property');

  if (data.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', data.canonicalUrl);
  }
}

function restoreSeo() {
  if (!originalSeo) return;

  document.title = originalSeo.title;

  const setMetaOrRemove = (name, content, attrName = 'name') => {
    const el = document.querySelector(`meta[${attrName}="${name}"]`);
    if (el) {
      if (content) el.setAttribute('content', content);
      else el.remove();
    }
  };

  setMetaOrRemove('description', originalSeo.metaDescription);
  setMetaOrRemove('keywords', originalSeo.metaKeywords);
  setMetaOrRemove('robots', originalSeo.robots);
  setMetaOrRemove('og:title', originalSeo.ogTitle, 'property');
  setMetaOrRemove('og:description', originalSeo.ogDescription, 'property');
  setMetaOrRemove('og:image', originalSeo.ogImage, 'property');

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    if (originalSeo.canonical) canonical.setAttribute('href', originalSeo.canonical);
    else canonical.remove();
  }

  originalSeo = null;
}

function injectLegalModal() {
  if (document.getElementById('uwo-legal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'uwo-legal-overlay';
  overlay.className = 'uwo-legal-overlay';
  overlay.innerHTML = `
    <div class="uwo-legal-card">
      <div class="uwo-legal-header">
        <h2 id="legal-modal-title"></h2>
        <button class="uwo-legal-close" onclick="closeLegalModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="uwo-legal-body" id="legal-modal-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLegalModal();
  });
}

function handlePathRoute() {
  const path = window.location.pathname;
  if (path === '/privacy-policy' || path.endsWith('/privacy-policy')) {
    openLegalModal('privacy');
  } else if (path === '/terms-and-conditions' || path.endsWith('/terms-and-conditions') || 
             path === '/terms-of-service' || path.endsWith('/terms-of-service') || 
             path === '/terms' || path.endsWith('/terms')) {
    openLegalModal('terms');
  } else if (path === '/cookies-policy' || path.endsWith('/cookies-policy') || 
             path === '/cookie-policy' || path.endsWith('/cookie-policy')) {
    openLegalModal('cookies');
  } else {
    closeLegalModalInternal();
    restoreSeo();
  }
}

function closeLegalModalInternal() {
  const overlay = document.getElementById('uwo-legal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

async function openLegalModal(type) {
  injectLegalModal();
  const overlay = document.getElementById('uwo-legal-overlay');
  const titleEl = document.getElementById('legal-modal-title');
  const bodyEl = document.getElementById('legal-modal-body');

  if (overlay) {
    overlay.classList.add('active');
  }
  document.body.style.overflow = 'hidden';

  let slug = '';
  let displayTitle = '';
  if (type === 'privacy') {
    slug = 'privacy-policy';
    displayTitle = 'Privacy Policy';
  } else if (type === 'terms') {
    slug = 'terms-and-conditions';
    displayTitle = 'Terms & Conditions';
  } else if (type === 'cookies') {
    slug = 'cookies-policy';
    displayTitle = 'Cookies Policy';
  }

  const currentPath = window.location.pathname;
  const targetPath = '/' + slug;
  if (currentPath !== targetPath && !currentPath.endsWith(targetPath)) {
    const prevPath = currentPath + window.location.search;
    history.pushState({ prevPath, isLegalModal: true, type }, '', targetPath);
    hasPushedState = true;
  }

  if (titleEl) titleEl.textContent = displayTitle;
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: var(--primary);">
        <i class="fas fa-spinner fa-spin" style="font-size: 32px; margin-bottom: 15px;"></i>
        <span style="font-size: 14px; font-weight: 600; letter-spacing: 1px;">SYNCING DOCUMENT...</span>
      </div>`;
  }

  try {
    const response = await fetch(`${API_URL}/legal/${slug}`);
    if (response.ok) {
      const data = await response.json();
      if (titleEl) titleEl.textContent = data.title;
      if (bodyEl) bodyEl.innerHTML = data.content;
      applySeo(data);
    } else {
      if (bodyEl) bodyEl.innerHTML = '<div style="text-align:center; padding: 40px 0; color: #ef4444; font-weight: 600;">Content is currently unavailable.</div>';
    }
  } catch (err) {
    console.error('Error loading legal page:', err);
    if (bodyEl) bodyEl.innerHTML = '<div style="text-align:center; padding: 40px 0; color: #ef4444; font-weight: 600;">Content is currently unavailable.</div>';
  }
}

function closeLegalModal() {
  if (hasPushedState) {
    history.back();
    hasPushedState = false;
  } else {
    const currentPath = window.location.pathname;
    if (currentPath === '/privacy-policy' || currentPath === '/terms-and-conditions' || currentPath === '/cookies-policy' ||
        currentPath.endsWith('/privacy-policy') || currentPath.endsWith('/terms-and-conditions') || currentPath.endsWith('/cookies-policy') ||
        currentPath.endsWith('/terms-of-service') || currentPath.endsWith('/cookie-policy')) {
      history.replaceState(null, '', '/');
    }
    closeLegalModalInternal();
  }
  
  restoreSeo();
  injectCookieConsent();
}

window.addEventListener('popstate', handlePathRoute);

document.addEventListener('click', (e) => {
  const link = e.target.closest('.legal-footer-link');
  if (link) {
    const href = link.getAttribute('href');
    if (href) {
      e.preventDefault();
      if (href.includes('privacy-policy')) {
        openLegalModal('privacy');
      } else if (href.includes('terms-of-service') || href.includes('/terms') || href.includes('terms-and-conditions')) {
        openLegalModal('terms');
      } else if (href.includes('cookie-policy') || href.includes('cookies-policy')) {
        openLegalModal('cookies');
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  injectLegalModal();
  handlePathRoute();
});

// ============ COOKIE CONSENT POPUP ============
function injectCookieConsent() {
  // Don't show if user already made a choice
  if (localStorage.getItem('uwo-cookie-consent')) return;

  // Don't inject twice
  if (document.getElementById('cookie-consent-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cookie-consent-overlay';
  overlay.className = 'cookie-consent-overlay';
  overlay.innerHTML = `
    <div class="cookie-consent-popup">
      <div class="cookie-popup-icon-container">
        <i class="fa-solid fa-cookie-bite"></i>
      </div>
      <div class="cookie-popup-content">
        <h3 class="cookie-popup-title">We Value Your Privacy</h3>
        <p class="cookie-popup-desc">
          We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking <strong>"Accept All"</strong>, you consent to our use of cookies.
          <a href="/cookie-policy" class="legal-footer-link">Read our Cookie Policy →</a>
        </p>
      </div>
      <div class="cookie-popup-actions">
        <button class="cookie-btn cookie-btn-accept" onclick="acceptCookies()">Accept All Cookies</button>
        <button class="cookie-btn cookie-btn-reject" onclick="rejectCookies()">Reject Non-Essential</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Show popup after a short delay
  setTimeout(() => {
    overlay.classList.add('active');
  }, 1200);
}

function acceptCookies() {
  localStorage.setItem('uwo-cookie-consent', 'accepted');
  hideCookiePopup();
}

function rejectCookies() {
  localStorage.setItem('uwo-cookie-consent', 'rejected');
  hideCookiePopup();
}

function hideCookiePopup() {
  const overlay = document.getElementById('cookie-consent-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.classList.add('hiding');
  document.body.style.overflow = '';
  setTimeout(() => overlay.remove(), 500);
}

// Global helper for fallback images based on category or title
function getFallbackImage(category, title) {
  const cat = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (cat.includes('automation') || cat.includes('artificial') || t.includes('automation')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'; // Abstract purple AI
  } else if (cat.includes('tech') || cat.includes('technology') || cat.includes('ai') || t.includes('ai') || t.includes('intelligence')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'; // Neon code/Tech network
  } else if (cat.includes('commerce') || cat.includes('business') || cat.includes('marketing') || t.includes('brand') || t.includes('commerce')) {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'; // Business desk analytics
  } else if (cat.includes('research') || t.includes('study') || t.includes('research')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'; // Digital sphere science
  }
  return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80'; // Default tech landscape
}

document.addEventListener('DOMContentLoaded', injectCookieConsent);

// ==========================================
// 🚀 FLAGSHIP PROJECTS MODULE
// ==========================================
async function loadFlagshipProjects() {
    const container = document.getElementById("dynamic-project-cards");
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/projects/public`);
        if (!res.ok) throw new Error("Failed to fetch flagship projects");
        
        const projects = await res.json();
        
        if (projects.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#94a3b8;">New projects coming soon...</p>';
            return;
        }

        container.innerHTML = "";
        projects.forEach((project, index) => {
            let logoUrl = "";
            if (project.logo) {
                if (project.logo.includes('storage.googleapis.com/uwo-document/')) {
                    const objectPath = project.logo.split('storage.googleapis.com/uwo-document/')[1];
                    logoUrl = API_URL + '/media/' + objectPath;
                } else if (project.logo.includes('/api/media/')) {
                    const mediaPath = project.logo.split('/api/media/')[1];
                    logoUrl = API_URL + '/media/' + mediaPath;
                } else {
                    logoUrl = project.logo.startsWith('http') ? project.logo : (API_URL.replace('/api', '') + project.logo);
                }
            }
            
            const delay = 100 + (index * 250); 
            const aosEffect = index % 3 === 2 ? 'zoom-in-up' : 'zoom-in'; 
            const durationAttr = index % 3 === 2 ? 'data-aos-duration="1200"' : '';
            
            const cardHTML = `
                <a href="${project.project_url}" target="_blank" class="project-card" data-aos="${aosEffect}" data-aos-delay="${delay}" ${durationAttr} rel="noopener noreferrer">
                    <img src="${logoUrl}" alt="${project.name}" class="project-icon" crossorigin="anonymous" onerror="this.src='images/uwo-logo.png'">
                    <h3>${project.name}${project.is_featured ? '<sup>&trade;</sup>' : ''}</h3>
                    <p>${project.short_description}</p>
                </a>
            `;
            
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

    } catch (err) {
        console.error("Error loading flagship projects:", err);
        container.innerHTML = '<p style="text-align:center; width:100%; color:#ef4444;">Unable to load projects at this time.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFlagshipProjects();
});

// Note: 🎁 UWO™ Earn & Refer Program modal is managed in dedicated earn-refer.js

