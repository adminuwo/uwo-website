// ==========================================
// 🎁 UWO™ DEDICATED EARN & REFER SCRIPT
// ==========================================

(function() {
  const BACKEND_API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8080/api"
    : "https://uwo-backend-977864306871.asia-south1.run.app/api";

  // user-dashboard backend for referral portal account provisioning
  const REFERRAL_BACKEND = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://referrals-api.uwo24.com"; // update to your deployed referral API

  // Dashboard login URL — dynamic per environment
  const DASHBOARD_LOGIN_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5173/login"
    : "https://referrals.uwo24.com/login"; // update to your deployed dashboard

  function injectEarnReferModal() {
    if (document.getElementById('earnReferOverlay')) return;

    const modalHTML = `
    <div id="earnReferOverlay" class="earn-refer-overlay" onclick="if(event.target === this) window.closeEarnReferModal()">
      <div class="earn-refer-card" role="dialog" aria-modal="true" aria-labelledby="earnReferTitle">
        <!-- Close Button -->
        <button type="button" class="earn-refer-close" onclick="window.closeEarnReferModal()" title="Close modal" aria-label="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- Form View -->
        <div id="earnReferFormView">
          <div class="earn-badge">
            <i class="fa-solid fa-gift"></i> Earn &amp; Refer
          </div>
          <h2 class="earn-title" id="earnReferTitle">Join UWO™ Earn &amp; Refer</h2>
          <p class="earn-subtitle">Partner with us to refer revolutionary AI &amp; enterprise platforms and earn competitive commissions.</p>

          <form id="earnReferForm" onsubmit="window.handleEarnReferSubmit(event)">
            <!-- Name Field -->
            <div class="earn-form-group">
              <label for="earnName">Full Name <span class="req">*</span></label>
              <div class="earn-input-wrap">
                <input type="text" id="earnName" name="name" placeholder="e.g. Rahul Sharma" required autocomplete="name">
                <i class="fa-solid fa-user"></i>
              </div>
            </div>

            <!-- Email Field -->
            <div class="earn-form-group">
              <label for="earnEmail">Email Address <span class="req">*</span></label>
              <div class="earn-input-wrap">
                <input type="email" id="earnEmail" name="email" placeholder="rahul@example.com" required autocomplete="email">
                <i class="fa-solid fa-envelope"></i>
              </div>
            </div>

            <div id="earnErrorMessage" style="display:none; color:#ef4444; font-size:13px; font-weight:600; margin-top:10px; text-align:center;"></div>

            <button type="submit" class="earn-submit-btn" id="earnSubmitBtn">
              <span>Get My Referral Account</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        </div>

        <!-- Success View -->
        <div id="earnReferSuccessView" class="earn-success-view">
          <div class="earn-success-badge">
            <i class="fa-solid fa-check"></i>
          </div>
          <h2 class="earn-success-title">Thank you for submitting the form.</h2>
          <p class="earn-success-text">
            Your referral account has been created! A confirmation email with your <strong>User ID</strong>, <strong>password</strong>, and dashboard access instructions has been sent to <strong id="earnSuccessEmail" style="color:#FABE56;"></strong>.
          </p>

          <div class="earn-success-info">
            Application Reference: <strong id="earnSuccessRefCode">UWO-REF</strong>
          </div>

          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 22px;">
            You can now log in to your personal User Referral Dashboard to generate referral links for all UWO products and track your clicks and downloads in real time.
          </p>

          <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <a id="earnDashboardLink" href="${DASHBOARD_LOGIN_URL}" target="_blank" class="earn-done-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
              <span>Open User Dashboard</span>
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button type="button" class="earn-done-btn" style="background:#1e293b; border:1px solid rgba(255,255,255,0.15);" onclick="window.closeEarnReferModal()">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.closeEarnReferModal();
    });
  }

  window.openEarnReferModal = function() {
    injectEarnReferModal();
    const overlay = document.getElementById('earnReferOverlay');
    if (!overlay) return;

    const formView = document.getElementById('earnReferFormView');
    const successView = document.getElementById('earnReferSuccessView');
    const errorMsg = document.getElementById('earnErrorMessage');
    const submitBtn = document.getElementById('earnSubmitBtn');

    if (formView) formView.style.display = 'block';
    if (successView) successView.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Get My Referral Account</span> <i class="fa-solid fa-arrow-right"></i>';
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeEarnReferModal = function() {
    const overlay = document.getElementById('earnReferOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.handleEarnReferSubmit = async function(event) {
    if (event) event.preventDefault();
    const submitBtn = document.getElementById('earnSubmitBtn');
    const errorMsg = document.getElementById('earnErrorMessage');

    const nameEl = document.getElementById('earnName');
    const emailEl = document.getElementById('earnEmail');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';

    if (!name || !email) {
      if (errorMsg) {
        errorMsg.textContent = 'Please enter your full name and email address.';
        errorMsg.style.display = 'block';
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (errorMsg) {
        errorMsg.textContent = 'Please enter a valid email address.';
        errorMsg.style.display = 'block';
      }
      return;
    }

    if (errorMsg) errorMsg.style.display = 'none';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    }

    try {
      const affiliateCode = localStorage.getItem('uwo_affiliate_code') || '';
      const payload = {
        name,
        email,
        affiliateCode
      };

      let response;
      try {
        response = await fetch(`${BACKEND_API}/affiliate/referrals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok && response.status === 404) {
          response = await fetch(`${BACKEND_API}/referrals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch (fetchErr) {
        response = await fetch(`${BACKEND_API}/referrals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (response.ok) {
        const form = document.getElementById('earnReferForm');
        if (form) form.reset();

        const formView = document.getElementById('earnReferFormView');
        const successView = document.getElementById('earnReferSuccessView');
        const successEmail = document.getElementById('earnSuccessEmail');
        const successRefCode = document.getElementById('earnSuccessRefCode');

        if (successEmail) successEmail.textContent = email;
        if (successRefCode) successRefCode.textContent = data.referralCode || 'UWO-REF-ACTIVE';

        if (formView) formView.style.display = 'none';
        if (successView) successView.style.display = 'block';

        // ----------------------------------------------------------
        // Gap 1 Fix: Also register on user-dashboard backend (port 5000)
        // so user gets a referral portal account with credentials emailed.
        // ----------------------------------------------------------
        try {
          const portalRes = await fetch(`${REFERRAL_BACKEND}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
          });
          const portalData = await portalRes.json();
          if (portalRes.ok && portalData.credentials) {
            // Update the dashboard link with the real login URL from the portal
            const dashLink = document.getElementById('earnDashboardLink');
            if (dashLink && portalData.credentials.loginUrl) {
              dashLink.href = portalData.credentials.loginUrl;
            }
            console.log('[UWO Earn & Refer] Referral portal account created:', portalData.userId);
          }
        } catch (portalErr) {
          // Non-blocking — UWO-B submission already succeeded
          console.warn('[UWO Earn & Refer] Could not create portal account:', portalErr.message);
        }

        if (typeof confetti === 'function') {
          try {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          } catch (cErr) {}
        }
      } else {
        if (errorMsg) {
          errorMsg.textContent = data.message || 'Something went wrong. Please try again.';
          errorMsg.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Get My Referral Account</span> <i class="fa-solid fa-arrow-right"></i>';
        }
      }
    } catch (err) {
      console.error('Error submitting Earn & Refer form:', err);
      if (errorMsg) {
        errorMsg.textContent = 'Network error. Please check your connection and try again.';
        errorMsg.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Get My Referral Account</span> <i class="fa-solid fa-arrow-right"></i>';
      }
    }
  };

  // Delegated click listener — catches clicks on ANY element with .earn-refer-btn or child of it
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.earn-refer-btn, #earnReferNavbarBtn, .mobile-earn-refer-link, [data-action="open-earn-refer"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      window.openEarnReferModal();
    }
  });

  // Inject modal when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectEarnReferModal);
  } else {
    injectEarnReferModal();
  }
})();
