console.log("Admin.js loaded with API URL on port 8080");
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8080/api"
  : "https://uwo-backend-977864306871.asia-south1.run.app/api";

// ✅ LOGIN
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.querySelector("#loginSection button");

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = "Signing In..."; }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: window.currentRoleAdmin || 'admin' }),
    });

    const data = await response.json();

    if (response.ok) {
        if (data.role === 'partner') {
            localStorage.setItem("uwo_partner_token", data.token);
            window.location.href = "partner-dashboard.html";
        } else {
            localStorage.setItem("uwo_token", data.token);
            showDashboard();
        }
    } else {
        alert("Login failed: " + (data.message || "Invalid credentials"));
    }
  } catch (error) {
    alert("Cannot connect to server. Please make sure the backend is running.");
    console.error("Login error:", error);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "SIGN IN"; }
  }
}

// ✅ LOGOUT
function logout() {
  localStorage.removeItem("uwo_token");
  document.getElementById("loginSection").style.display = "flex";
  
  const superLayout = document.getElementById("super-admin-layout");
  if (superLayout) superLayout.style.display = "none";
  
  const salesLayout = document.getElementById("sales-admin-layout");
  if (salesLayout) salesLayout.style.display = "none";
}

// Dynamic Sidebar Renderer
function renderSidebar(permissions) {
    const sidebarId = window.adminRole === 'SUPER_ADMIN' ? '#superAdminSidebar nav' : '#salesAdminSidebar nav';
    const nav = document.querySelector(sidebarId);
    if (!nav) return;

    const sidebarItems = [
        {
            type: 'link',
            id: 'btn-messages',
            tab: 'messages',
            icon: 'fa-envelope',
            label: 'Messages',
            permission: 'messages.view'
        },
        {
            type: 'link',
            id: 'btn-rag',
            tab: 'rag',
            icon: 'fa-brain',
            label: 'AI Knowledge',
            permission: 'knowledge.view'
        },
        {
            type: 'link',
            id: 'btn-blogs',
            tab: 'blogs',
            icon: 'fa-newspaper',
            label: 'Manage Blogs',
            permission: 'blogs.view'
        },
        {
            type: 'header',
            label: 'Content Management',
            permission: 'legal.view'
        },
        {
            type: 'link',
            id: 'btn-legal-privacy',
            tab: 'legal-privacy',
            icon: 'fa-user-shield',
            label: 'Privacy Policy',
            permission: 'legal.view'
        },
        {
            type: 'link',
            id: 'btn-legal-terms',
            tab: 'legal-terms',
            icon: 'fa-file-signature',
            label: 'Terms & Conditions',
            permission: 'legal.view'
        },
        {
            type: 'link',
            id: 'btn-legal-cookies',
            tab: 'legal-cookies',
            icon: 'fa-cookie-bite',
            label: 'Cookies Policy',
            permission: 'legal.view'
        },
        {
            type: 'header',
            label: 'CMS',
            permission: 'projects.view'
        },
        {
            type: 'link',
            id: 'btn-projects',
            tab: 'projects',
            icon: 'fa-project-diagram',
            label: 'Projects',
            permission: 'projects.view'
        },
        {
            type: 'link',
            id: 'btn-team-members',
            tab: 'team-members',
            icon: 'fa-users',
            label: 'Team Members',
            permission: 'team.view'
        },
        {
            type: 'link',
            id: 'btn-product-management',
            tab: 'product-management',
            icon: 'fa-box',
            label: 'Products',
            permission: 'sales.view'
        },
        {
            type: 'link',
            id: 'btn-sales-settings',
            tab: 'sales-settings',
            icon: 'fa-wallet',
            label: 'Sales Settings',
            permission: 'sales.view'
        },
        {
            type: 'link',
            id: 'btn-settings',
            tab: 'settings',
            icon: 'fa-cog',
            label: 'System Settings',
            permission: 'settings.view'
        }
    ];

    let navHTML = "";
    sidebarItems.forEach(item => {
        if (item.permission && !permissions.includes(item.permission)) {
            return;
        }

        if (item.type === 'header') {
            navHTML += `
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.4); letter-spacing: 2px; padding: 15px 20px 5px 20px; font-family: 'Inter', sans-serif;">
                    ${item.label}
                </div>
            `;
        } else {
            navHTML += `
                <div onclick="showTab('${item.tab}')" class="nav-link" id="${item.id}">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.label}</span>
                </div>
            `;
        }
    });

    nav.innerHTML = navHTML;
}

// Global Admin Permissions State
window.adminPermissions = [];
window.adminRole = "";

// ✅ SHOW DASHBOARD
async function showDashboard() {
  const token = localStorage.getItem("uwo_token");
  if (!token) {
    document.getElementById("loginSection").style.display = "flex";
    const superLayout = document.getElementById("super-admin-layout");
    if (superLayout) superLayout.style.display = "none";
    const salesLayout = document.getElementById("sales-admin-layout");
    if (salesLayout) salesLayout.style.display = "none";
    return;
  }

  try {
    const profileRes = await fetch(`${API_URL}/admin/profile`, {
      headers: { "Authorization": token }
    });

    if (profileRes.status === 401) {
      logout();
      return;
    }

    if (profileRes.status !== 200) {
      throw new Error("Failed to load admin profile");
    }

    const profileData = await profileRes.json();
    window.adminPermissions = profileData.permissions || [];
    window.adminRole = profileData.role || "";

    const greetingText = document.querySelector(window.adminRole === 'SUPER_ADMIN' ? '#superAdminDashboard #greetingText' : '#salesAdminDashboard .sales-greeting-text');
    if (greetingText) {
      const roleLabel = window.adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Sales Admin';
      greetingText.innerHTML = `Welcome, <span style="color:var(--uwo-accent);">${profileData.email}</span> (${roleLabel})`;
    }

    const profileRoleSpan = document.querySelector(window.adminRole === 'SUPER_ADMIN' ? '.admin-profile span' : '.sales-admin-profile span');
    if (profileRoleSpan) {
      profileRoleSpan.innerText = window.adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Sales Admin';
    }

    const profileAvatarDiv = document.querySelector(window.adminRole === 'SUPER_ADMIN' ? '.admin-profile div' : '.sales-admin-profile div');
    if (profileAvatarDiv) {
      profileAvatarDiv.innerText = window.adminRole === 'SUPER_ADMIN' ? 'SA' : 'A';
    }

    renderSidebar(window.adminPermissions);

    const loginSection = document.getElementById("loginSection");
    if (loginSection) loginSection.style.display = "none";

    const superLayout = document.getElementById("super-admin-layout");
    const salesLayout = document.getElementById("sales-admin-layout");

    if (window.adminRole === "SUPER_ADMIN") {
      if (superLayout) superLayout.style.display = "flex";
      if (salesLayout) salesLayout.style.display = "none";
      showTab("messages");
      fetchMessages();
      fetchRagDocs();
      fetchAdminBlogs();
      if (typeof fetchPendingRequestsCount === 'function') fetchPendingRequestsCount();
    } else if (window.adminRole === "SALES_ADMIN") {
      if (superLayout) superLayout.style.display = "none";
      if (salesLayout) salesLayout.style.display = "flex";
      showTab("product-management");
    }
  } catch (err) {
    console.error("Dashboard initialize error:", err);
    logout();
  }
}

// ✅ FETCH MESSAGES
async function fetchMessages() {
  const token = localStorage.getItem("uwo_token");
  const uwoContactsBox = document.getElementById("uwo-contacts");

  try {
    uwoContactsBox.innerHTML = "<div class='loading' style='padding:20px;'>Syncing Inbox...</div>";

    const response = await fetch(`${API_URL}/contacts`, {
      headers: { "Authorization": token },
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const contactsData = await response.json();
    uwoContactsBox.innerHTML = "";

    const uwoContacts = contactsData.filter(m => m.source === 'UWO' || !m.source);

    if (uwoContacts.length === 0) {
      uwoContactsBox.innerHTML = `
        <div style='text-align:center; padding:40px; color:#64748b;'>
          <i class='fas fa-ghost' style='font-size:40px; margin-bottom:15px; opacity:0.3;'></i>
          <p>Inbox is empty. No new inquiries.</p>
        </div>`;
      return;
    }

    uwoContacts.reverse().forEach(m => {
      const date = new Date(m.created_at).toLocaleString();
      const item = document.createElement("div");
      item.className = "message-item";
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
          <div>
            <h3 style="margin:0; font-size:18px; color:#0f172a;">${m.name}</h3>
            <p style="margin:2px 0; color:var(--uwo-accent); font-weight:700; font-size:13px;">${m.email}</p>
          </div>
          <span style="font-size:12px; color:#94a3b8; font-weight:600;">${date}</span>
        </div>
        <div style="background:#fff; padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid #e2e8f0;">
          <p style="margin:0; color:#334155; line-height:1.6;">${m.message}</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="background:rgba(214,165,89,0.1); color:var(--uwo-accent); padding:5px 12px; border-radius:50px; font-size:11px; font-weight:800; text-transform:uppercase;">
            ${m.purpose || 'General Inquiry'}
          </span>
          <button class="btn-premium btn-danger" style="padding:8px 16px; font-size:12px; box-shadow:none;" onclick="deleteMessage('${m._id}')">
            DELETE MESSAGE
          </button>
        </div>
      `;
      uwoContactsBox.appendChild(item);
    });
  } catch (error) {
    console.error("Fetch failed:", error);
    uwoContactsBox.innerHTML = `
      <div style='text-align:center; padding:30px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 20px; margin-bottom: 20px;'>
        <i class='fas fa-exclamation-triangle' style='font-size:30px; color:#e11d48; margin-bottom:10px;'></i>
        <h3 style='margin:0; color:#e11d48;'>Backend Server Offline</h3>
        <p style='color:#9f1239; margin-top:5px; font-size:14px;'>Cannot connect to database. Showing a sample preview.</p>
      </div>
      
      <div class="message-item">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
          <div>
            <h3 style="margin:0; font-size:18px; color:#0f172a;">Sample User</h3>
            <p style="margin:2px 0; color:var(--uwo-accent); font-weight:700; font-size:13px;">user@example.com</p>
          </div>
          <span style="font-size:12px; color:#94a3b8; font-weight:600;">Just now</span>
        </div>
        <div style="background:#fff; padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid #e2e8f0;">
          <p style="margin:0; color:#334155; line-height:1.6;">Hi there! I am interested in AISA™. Can we schedule a demo soon? Please let me know.</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="background:rgba(214,165,89,0.1); color:var(--uwo-accent); padding:5px 12px; border-radius:50px; font-size:11px; font-weight:800; text-transform:uppercase;">
            Demo Request
          </span>
          <button class="btn-premium btn-danger" style="padding:8px 16px; font-size:12px; box-shadow:none;">
            DELETE MESSAGE
          </button>
        </div>
      </div>
    `;
  }
}

// 🗑️ DELETE MESSAGE
async function deleteMessage(id) {
  if (!confirm("Permanent delete this inquire?")) return;
  const token = localStorage.getItem("uwo_token");

  try {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: "DELETE",
      headers: { "Authorization": token },
    });

    if (response.ok) fetchMessages();
  } catch (error) {
    alert("Delete failed");
  }
}

// --- RAG MANAGEMENT ---
async function fetchRagDocs() {
  const ragList = document.getElementById("rag-docs-list");
  const countDisplay = document.getElementById("totalDocsCount");
  if (!ragList) return;

  try {
    ragList.innerHTML = "<div class='loading' style='grid-column: 1/-1;'>Scanning Knowledge Base...</div>";
    const response = await fetch(`${API_URL}/admin/list-docs`);
    const docs = await response.json();
    ragList.innerHTML = "";

    if (countDisplay) countDisplay.innerText = docs.length;

    if (docs.length === 0) {
      ragList.innerHTML = "<p style='color:#64748b; grid-column: 1/-1; text-align:center;'>No knowledge indexed. UWO AI is currently using default training.</p>";
      return;
    }

    docs.forEach(d => {
      const card = document.createElement("div");
      card.className = "message-item"; // Reuse item style for consistency
      card.style.borderLeftColor = "#4F46E5";
      card.style.background = "#fff";
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
          <div style="width:40px; height:40px; background:rgba(79,70,229,0.1); color:#4F46E5; border-radius:10px; display:flex; align-items:center; justify-content:center;">
            <i class="fas fa-file-pdf"></i>
          </div>
          <div style="flex:1; overflow:hidden;">
            <p title="${d.fileName}" style="margin:0; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${d.fileName}
            </p>
            <p style="margin:2px 0 0; font-size:11px; color:#94a3b8; font-weight:600;">
              INDEXED ON ${new Date(d.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button class="btn-premium btn-danger" style="width:100%; padding:10px; font-size:11px; box-shadow:none; background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;" onclick="deleteRagDoc('${d._id}')">
          DELETE & FORGET
        </button>
      `;
      ragList.appendChild(card);
    });
  } catch (err) {
    ragList.innerHTML = `
      <div style='grid-column: 1/-1; text-align:center; padding:30px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 20px;'>
        <i class='fas fa-exclamation-triangle' style='font-size:30px; color:#e11d48; margin-bottom:10px;'></i>
        <h3 style='margin:0; color:#e11d48;'>Backend Server Offline</h3>
        <p style='color:#9f1239; margin-top:5px; font-size:14px;'>Cannot retrieve indexed documents. Please start the backend.</p>
      </div>
    `;
  }
}

async function uploadRagDoc() {
  const fileInput = document.getElementById("rag-file-input");
  const status = document.getElementById("rag-status");
  const btn = document.getElementById("rag-upload-btn");

  if (!fileInput.files[0]) {
    alert("Select knowledge source first.");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('document', file);

  btn.disabled = true;
  btn.innerText = "UPLOADING...";
  status.innerText = "⏳ Please wait, processing your document...";

  try {
    const response = await fetch(`${API_URL}/admin/upload-doc`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    if (response.ok) {
      status.style.color = "#10b981";
      status.innerText = "✅ DOCUMENT SAVED SUCCESSFULLY";
      fileInput.value = "";
      const fileNameDisplay = document.getElementById("selected-file-name");
      if (fileNameDisplay) fileNameDisplay.innerText = "";
      fetchRagDocs();
    } else {
      status.style.color = "#ef4444";
      status.innerText = "❌ INDEXING FAILED: " + result.message;
    }
  } catch (error) {
    status.style.color = "#ef4444";
    status.innerText = "❌ NETWORK TIMEOUT";
  } finally {
    btn.disabled = false;
    btn.innerText = "UPLOAD & TRAIN";
    setTimeout(() => { if (status) status.innerText = ""; }, 5000);
  }
}

async function deleteRagDoc(id) {
  if (!confirm("UWO AI will lose this specific knowledge. Proceed?")) return;

  try {
    const response = await fetch(`${API_URL}/admin/delete-doc/${id}`, { method: "DELETE" });
    if (response.ok) fetchRagDocs();
  } catch (err) {
    alert("Delete failed.");
  }
}

// ==========================================
// 🏷️ CREATABLE CATEGORY COMBOBOX
// ==========================================

let allCategories = [];      // cached from server
let catFocusIndex = -1;      // keyboard nav index

// Load categories from API
async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    allCategories = await res.json();
  } catch (e) {
    allCategories = [
      { name: 'AI & Automation' }, { name: 'Tech Insights' },
      { name: 'Digital Commerce' }, { name: 'Research' }
    ];
  }
}

// Open the dropdown
function openCatDropdown() {
  const input = document.getElementById('cat-search');
  const wrap = document.getElementById('cat-input-wrap');
  const dropdown = document.getElementById('cat-dropdown');
  const chevron = document.getElementById('cat-chevron');
  const label = document.getElementById('cat-selected-label');

  // Make label invisible, input visible
  label.style.opacity = '0';
  input.style.opacity = '1';
  input.style.zIndex = '2';
  wrap.style.border = '1.5px solid #D6A559';
  chevron.style.transform = 'rotate(180deg)';
  dropdown.style.display = 'block';

  input.value = '';
  catFocusIndex = -1;
  filterCategories('');
}

// Close the dropdown
function closeCatDropdown() {
  const input = document.getElementById('cat-search');
  const wrap = document.getElementById('cat-input-wrap');
  const dropdown = document.getElementById('cat-dropdown');
  const chevron = document.getElementById('cat-chevron');
  const label = document.getElementById('cat-selected-label');

  label.style.opacity = '1';
  input.style.opacity = '0';
  input.style.zIndex = '-1';
  wrap.style.border = '1.5px solid #cbd5e1';
  chevron.style.transform = 'rotate(0deg)';
  dropdown.style.display = 'none';
  catFocusIndex = -1;
}

// Filter categories as user types
function filterCategories(query) {
  const list = document.getElementById('cat-list');
  const createOpt = document.getElementById('cat-create-option');
  const createLabel = document.getElementById('cat-create-label');
  const q = query.trim().toLowerCase();

  const filtered = q
    ? allCategories.filter(c => c.name.toLowerCase().includes(q))
    : allCategories;

  // Render matching items
  list.innerHTML = '';
  catFocusIndex = -1;
  filtered.forEach((cat, i) => {
    const item = document.createElement('div');
    item.setAttribute('data-index', i);
    item.setAttribute('data-name', cat.name);
    item.style.cssText = 'padding:10px 16px; cursor:pointer; font-size:14px; font-weight:600; color:#0f172a; transition:background 0.15s; display:flex; align-items:center; gap:10px; justify-content:space-between;';
    item.onmouseenter = () => { item.style.background = '#f8fafc'; delBtn.style.opacity = '1'; };
    item.onmouseleave = () => { item.style.background = 'transparent'; delBtn.style.opacity = '0'; };

    const left = document.createElement('span');
    left.style.cssText = 'display:flex; align-items:center; gap:10px; flex:1;';
    left.innerHTML = `<i class="fas fa-tag" style="color:#D6A559; font-size:11px;"></i> ${cat.name}`;
    left.onclick = () => selectCategory(cat.name);

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    delBtn.title = 'Delete category';
    delBtn.style.cssText = 'background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; padding:4px 6px; border-radius:6px; opacity:0; transition:opacity 0.15s, background 0.15s; flex-shrink:0;';
    delBtn.onmouseenter = (e) => { e.stopPropagation(); delBtn.style.background = '#fee2e2'; };
    delBtn.onmouseleave = (e) => { e.stopPropagation(); delBtn.style.background = 'none'; };
    delBtn.onclick = (e) => { e.stopPropagation(); deleteCategory(cat); };

    item.appendChild(left);
    item.appendChild(delBtn);
    list.appendChild(item);
  });

  // Show "+ Create" option if typed value doesn't match any existing category exactly
  const exactMatch = allCategories.some(c => c.name.toLowerCase() === q);
  if (q && !exactMatch) {
    createLabel.textContent = query.trim();
    createOpt.style.display = 'block';
  } else {
    createOpt.style.display = 'none';
  }
}


// Select a category
function selectCategory(name) {
  document.getElementById('blog-category').value = name;
  document.getElementById('cat-selected-label').textContent = name;
  closeCatDropdown();
}

// Keyboard navigation
function catKeyNav(e) {
  const items = document.querySelectorAll('#cat-list div[data-index]');
  if (e.key === 'ArrowDown') {
    catFocusIndex = Math.min(catFocusIndex + 1, items.length - 1);
    items.forEach((el, i) => el.style.background = i === catFocusIndex ? '#f8fafc' : 'transparent');
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    catFocusIndex = Math.max(catFocusIndex - 1, 0);
    items.forEach((el, i) => el.style.background = i === catFocusIndex ? '#f8fafc' : 'transparent');
    e.preventDefault();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (catFocusIndex >= 0 && items[catFocusIndex]) {
      selectCategory(items[catFocusIndex].getAttribute('data-name'));
    } else {
      const q = document.getElementById('cat-search').value.trim();
      if (q) createNewCategory();
    }
  } else if (e.key === 'Escape') {
    closeCatDropdown();
  }
}

// Create a new category via API and select it
async function createNewCategory() {
  const raw = document.getElementById('cat-search').value.trim()
    || document.getElementById('cat-create-label').textContent.trim();
  if (!raw) return;
  const token = localStorage.getItem('uwo_token');
  try {
    const res = await fetch(`${API_URL}/categories/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ name: raw })
    });
    const cat = await res.json();
    // Add to local cache if genuinely new
    if (!allCategories.find(c => c.name.toLowerCase() === cat.name.toLowerCase())) {
      allCategories.unshift(cat);
    }
    selectCategory(cat.name);
  } catch (e) {
    // Fallback: just select locally
    selectCategory(raw);
  }
}

// Delete a category via API
async function deleteCategory(cat) {
  if (!confirm(`Delete category "${cat.name}"? This won't affect existing blog posts.`)) return;
  const token = localStorage.getItem('uwo_token');
  try {
    const res = await fetch(`${API_URL}/categories/${cat._id || cat.slug}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    });
    if (res.ok || res.status === 200) {
      // Remove from local cache
      allCategories = allCategories.filter(c => c.name !== cat.name);
      // Re-render list
      filterCategories(document.getElementById('cat-search').value);
      // If deleted category was selected, reset to first available
      const current = document.getElementById('blog-category').value;
      if (current === cat.name && allCategories.length > 0) {
        selectCategory(allCategories[0].name);
      }
    } else {
      alert('Failed to delete category.');
    }
  } catch (e) {
    // Remove locally even if API fails
    allCategories = allCategories.filter(c => c.name !== cat.name);
    filterCategories(document.getElementById('cat-search').value);
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const combobox = document.getElementById('cat-combobox');
  if (combobox && !combobox.contains(e.target)) {
    closeCatDropdown();
  }
});

// ==========================================
// 📚 UWO™ ADMIN BLOG MANAGEMENT JS CONTROLLER
// ==========================================

let adminBlogsList = [];


// 1. Fetch All Blogs for Admin Listing
async function fetchAdminBlogs() {
  const listContainer = document.getElementById("blogs-manager-list");
  const token = localStorage.getItem("uwo_token");

  try {
    listContainer.innerHTML = "<div class='loading' style='padding:20px; color:#fff;'>Fetching publications...</div>";

    const response = await fetch(`${API_URL}/admin/blogs`, {
      headers: { "Authorization": token }
    });

    if (response.status === 401) {
      logout();
      return;
    }

    adminBlogsList = await response.json();
    listContainer.innerHTML = "";

    if (adminBlogsList.length === 0) {
      listContainer.innerHTML = `
        <div style='text-align:center; padding:50px; color:#64748b;'>
          <i class='fas fa-newspaper' style='font-size:40px; margin-bottom:15px; opacity:0.3;'></i>
          <p>No blog posts created yet. Launch your first insight!</p>
        </div>`;
      return;
    }

    // Render beautiful list table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "10px";

    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">
          <th style="padding:15px 10px; color:#0f172a;">Article Title</th>
          <th style="padding:15px 10px; color:#0f172a;">Category</th>
          <th style="padding:15px 10px; color:#0f172a;">Status</th>
          <th style="padding:15px 10px; text-align:center; color:#0f172a;">Views</th>
          <th style="padding:15px 10px; text-align:center; color:#0f172a;">Likes</th>
          <th style="padding:15px 10px; text-align:right; color:#0f172a;">Actions</th>
        </tr>
      </thead>
      <tbody id="admin-blogs-tbody"></tbody>
    `;

    listContainer.appendChild(table);
    const tbody = document.getElementById("admin-blogs-tbody");

    adminBlogsList.forEach(blog => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid #e2e8f0";
      tr.style.fontSize = "14px";

      const statusBadge = blog.status === 'published'
        ? `<span style="background:rgba(16,185,129,0.1); color:#10b981; padding:4px 10px; border-radius:50px; font-weight:800; font-size:11px; text-transform:uppercase;">Published</span>`
        : `<span style="background:rgba(245,158,11,0.1); color:#f59e0b; padding:4px 10px; border-radius:50px; font-weight:800; font-size:11px; text-transform:uppercase;">Draft</span>`;

      tr.innerHTML = `
        <td style="padding:15px 10px; font-weight:700; color:#0f172a;">${blog.title}</td>
        <td style="padding:15px 10px; font-weight:600; color:#64748b;">${blog.category}</td>
        <td style="padding:15px 10px;">${statusBadge}</td>
        <td style="padding:15px 10px; text-align:center; font-weight:700; color:#0f172a;">${blog.views || 0}</td>
        <td style="padding:15px 10px; text-align:center; font-weight:700; color:#0f172a;">${blog.likes || 0}</td>
        <td style="padding:15px 10px; text-align:right;">
          <button onclick="openBlogEditor('${blog._id}')" class="btn-premium" style="padding:6px 12px; font-size:12px; box-shadow:none; margin-right:5px; background:var(--uwo-accent); color:#000;"><i class="fas fa-edit"></i> Edit</button>
          <button onclick="deleteBlogPost('${blog._id}')" class="btn-premium btn-danger" style="padding:6px 12px; font-size:12px; box-shadow:none; margin-right:0;"><i class="fas fa-trash"></i> Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Failed to fetch admin blogs:", error);
  }
}

// 2. Open Compose/Edit Modal
async function openBlogEditor(blogId = null) {
  // Lazy load Quill first!
  await new Promise(resolve => lazyLoadQuill(resolve));

  // Initialize blog editor quill instance on demand
  if (!quill && document.getElementById('quill-editor')) {
    quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: 'Compose an epic insight...',
      modules: {
        toolbar: [
          [{ 'header': [2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }
    });
  }

  const modal = document.getElementById("blogEditorModal");
  modal.style.display = "flex";

  // Load categories fresh each time editor opens
  await loadCategories();

  // Reset fields
  document.getElementById("edit-blog-id").value = "";
  document.getElementById("blog-title").value = "";
  selectCategory("AI & Automation");
  document.getElementById("blog-featured-image").value = "";
  if (quill) quill.root.innerHTML = "";
  document.getElementById("blog-status").value = "published";
  document.getElementById("blog-seodesc").value = "";
  document.getElementById("media-upload-indicator").innerText = "";

  document.getElementById("editorModalTitle").innerHTML = `<i class="fas fa-plus-circle" style="color: var(--uwo-accent);"></i> Compose Publication`;

  if (blogId) {
    document.getElementById("editorModalTitle").innerHTML = `<i class="fas fa-edit" style="color: var(--uwo-accent);"></i> Edit Publication`;
    const blog = adminBlogsList.find(b => b._id === blogId);
    if (blog) {
      document.getElementById("edit-blog-id").value = blog._id;
      document.getElementById("blog-title").value = blog.title;
      selectCategory(blog.category);
      document.getElementById("blog-featured-image").value = blog.coverImage || blog.featuredImage || "";
      if (quill) quill.root.innerHTML = blog.content;
      document.getElementById("blog-status").value = blog.status;
      document.getElementById("blog-seodesc").value = blog.seoDescription || "";
    }
  }
}

// 3. Close Modal
function closeBlogEditor() {
  document.getElementById("blogEditorModal").style.display = "none";
}

// 4. Save Blog Post (Create or Update)
async function saveBlogPost() {
  const id = document.getElementById("edit-blog-id").value;
  const title = document.getElementById("blog-title").value;
  const category = document.getElementById("blog-category").value;
  const featuredImage = document.getElementById("blog-featured-image").value;

  // Get content from Quill editor
  const content = quill ? quill.root.innerHTML : "";
  const pureText = quill ? quill.getText() : "";

  // Automate read time (Avg 200 words per minute)
  const wordCount = pureText.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const status = document.getElementById("blog-status").value;
  const seoDescription = document.getElementById("blog-seodesc").value;

  if (!title || !content || content === "<p><br></p>") {
    alert("Please enter title and content details.");
    return;
  }

  const token = localStorage.getItem("uwo_token");
  const payload = {
    title,
    category,
    featuredImage: featuredImage,
    coverImage: featuredImage,
    content,
    status,
    seoDescription,
    readTime,
    author: "UWO Team",
    seoTitle: title // Auto-generate SEO title from main title
  };

  try {
    let response;
    if (id) {
      // Update
      response = await fetch(`${API_URL}/blogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Create new
      response = await fetch(`${API_URL}/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(payload)
      });
    }

    if (response.ok) {
      closeBlogEditor();
      fetchAdminBlogs();
    } else {
      if (response.status === 401) {
        alert("Session expired or invalid. Logging out...");
        logout();
        return;
      }
      const err = await response.json();
      alert("Failed to save article: " + (err.message || "Unknown error"));
    }
  } catch (error) {
    alert("Network error occurred.");
  }
}

// 5. Delete Blog Post
async function deleteBlogPost(id) {
  if (!confirm("Are you sure you want to permanently delete this blog publication?")) return;
  const token = localStorage.getItem("uwo_token");

  try {
    const response = await fetch(`${API_URL}/blogs/${id}`, {
      method: "DELETE",
      headers: { "Authorization": token }
    });

    if (response.ok) {
      fetchAdminBlogs();
    } else {
      if (response.status === 401) {
        alert("Session expired or invalid. Logging out...");
        logout();
        return;
      }
      alert("Failed to delete article.");
    }
  } catch (error) {
    alert("Delete operation failed.");
  }
}

// 6. Direct Media File Uploader
async function uploadBlogMediaFile() {
  const fileInput = document.getElementById("blog-media-file");
  const indicator = document.getElementById("media-upload-indicator");
  const token = localStorage.getItem("uwo_token");

  if (!fileInput.files[0]) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("media", file);

  indicator.innerText = "⏳ Uploading media file...";
  indicator.style.color = "var(--uwo-blue-deep)";

  try {
    const response = await fetch(`${API_URL}/blogs/upload-media`, {
      method: "POST",
      headers: { "Authorization": token },
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      const uploadedUrl = data.url || data.coverImage || data.featuredImage || "";
      document.getElementById("blog-featured-image").value = uploadedUrl;
      indicator.innerText = "✅ Media uploaded successfully! (Saved permanently)";
      indicator.style.color = "#10b981";
    } else {
      if (response.status === 401) {
        alert("Session expired or invalid. Logging out...");
        logout();
        return;
      }
      indicator.innerText = "❌ Media upload failed.";
      indicator.style.color = "#ef4444";
    }
  } catch (error) {
    indicator.innerText = "❌ Network error uploading file.";
    indicator.style.color = "#ef4444";
  }
}

// --- SYSTEM SETTINGS ---
async function fetchSettings() {
  const token = localStorage.getItem("uwo_token");
  const webhookInput = document.getElementById("setting-webhook-url");
  const expiryInput = document.getElementById("setting-session-expiry");
  const msg = document.getElementById("settings-status-msg");
  
  if (!webhookInput) return;
  msg.innerText = "Loading...";
  msg.style.color = "#64748b";

  try {
    const res = await fetch(`${API_URL}/admin/settings`, {
      headers: { "Authorization": token }
    });
    if (res.ok) {
      const data = await res.json();
      webhookInput.value = data.webhookUrl || "";
      if (expiryInput) {
        expiryInput.value = data.affiliateSessionExpiry !== undefined ? data.affiliateSessionExpiry : 24;
      }
      msg.innerText = "";
    } else {
      msg.innerText = "Failed to load settings.";
      msg.style.color = "#ef4444";
    }
  } catch (err) {
    msg.innerText = "Network error loading settings.";
    msg.style.color = "#ef4444";
  }
}

async function saveSettings() {
  const token = localStorage.getItem("uwo_token");
  const webhookInput = document.getElementById("setting-webhook-url");
  const expiryInput = document.getElementById("setting-session-expiry");
  const msg = document.getElementById("settings-status-msg");
  const btn = document.getElementById("btn-save-settings");
  
  if (!webhookInput) return;
  
  const webhookUrl = webhookInput.value.trim();
  const affiliateSessionExpiry = expiryInput ? Number(expiryInput.value) : 24;
  
  btn.disabled = true;
  btn.innerText = "Saving...";
  msg.innerText = "⏳ Saving configuration...";
  msg.style.color = "#64748b";

  try {
    const res = await fetch(`${API_URL}/admin/settings`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token 
      },
      body: JSON.stringify({ webhookUrl, affiliateSessionExpiry })
    });
    if (res.ok) {
      msg.innerText = "✅ Settings saved successfully!";
      msg.style.color = "#10b981";
    } else {
      msg.innerText = "❌ Failed to save settings.";
      msg.style.color = "#ef4444";
    }
  } catch (err) {
    msg.innerText = "❌ Network error saving settings.";
    msg.style.color = "#ef4444";
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-save"></i> Save Settings`;
    setTimeout(() => { if (msg.innerText.includes("✅")) msg.innerText = ""; }, 3000);
  }
}

// Global Quill Instance
let quill;

// (Initialization block moved to bottom of file)

// ==========================================
// 🛡️ DYNAMIC LEGAL PAGES DASHBOARD LOGIC
// ==========================================

let quillPrivacy = null, quillTerms = null, quillCookies = null;
let isPrivacyDirty = false, isTermsDirty = false, isCookiesDirty = false;
let privacyLastSaved = null, termsLastSaved = null, cookiesLastSaved = null;
let activeLegalTab = { privacy: 'editor', terms: 'editor', cookies: 'editor' };
let currentLegalData = { privacy: null, terms: null, cookies: null };
let legalAutoSaveTimer = null;
let quillLoaded = false;

// 1. Lazy load Quill assets
function lazyLoadQuill(callback) {
  if (quillLoaded || typeof Quill !== 'undefined') {
    quillLoaded = true;
    callback();
    return;
  }

  console.log("⏳ Lazy loading Quill Editor resources...");

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
  script.onload = () => {
    quillLoaded = true;
    console.log("✅ Quill Editor loaded dynamically!");
    
    try {
      const BlockEmbed = Quill.import('blots/block/embed');
      class HrBlot extends BlockEmbed {
        static create() {
          return document.createElement('hr');
        }
      }
      HrBlot.blotName = 'hr';
      HrBlot.tagName = 'hr';
      Quill.register(HrBlot);
    } catch(e) {
      console.error("Failed to register HR blot:", e);
    }
    
    callback();
  };
  document.head.appendChild(script);
}

// Custom divider insert helper
function insertDivider(quillInstance) {
  const range = quillInstance.getSelection(true);
  quillInstance.insertEmbed(range.index, 'hr', true, Quill.sources.USER);
  quillInstance.setSelection(range.index + 1);
}

// 2. Initialize legal Quill editors
function initLegalQuillEditor(pageType) {
  const containerId = `#quill-editor-${pageType}`;
  if (!document.querySelector(containerId)) return;

  let instance = getLegalQuillInstance(pageType);
  if (instance) return; // already initialized

  const toolbarOptions = [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image', 'video'],
    ['clean'],
    ['divider'] // horizontal rule
  ];

  const editor = new Quill(containerId, {
    theme: 'snow',
    placeholder: `Compose the ${pageType} content...`,
    modules: {
      toolbar: {
        container: toolbarOptions,
        handlers: {
          'divider': function() {
            insertDivider(this.quill);
          }
        }
      }
    }
  });

  // Set icon for divider button
  const dividerButton = document.querySelector(`${containerId}-container .ql-divider`);
  if (dividerButton) {
    dividerButton.innerHTML = '<i class="fas fa-minus" title="Insert Horizontal Rule"></i>';
    dividerButton.style.display = 'inline-flex';
    dividerButton.style.alignItems = 'center';
    dividerButton.style.justifyContent = 'center';
  }

  // Handle text change event to set dirty flag
  editor.on('text-change', () => {
    setLegalDirty(pageType, true);
  });

  if (pageType === 'privacy') quillPrivacy = editor;
  else if (pageType === 'terms') quillTerms = editor;
  else if (pageType === 'cookies') quillCookies = editor;

  // Add event listener to form inputs to track dirty state too
  const fields = ['title', 'seo-title', 'canonical', 'meta-desc', 'meta-keys', 'og-title', 'og-image', 'og-desc', 'robots'];
  fields.forEach(f => {
    const el = document.getElementById(`legal-${pageType}-${f}`);
    if (el) {
      el.addEventListener('input', () => setLegalDirty(pageType, true));
      el.addEventListener('change', () => setLegalDirty(pageType, true));
    }
  });
}

function getLegalQuillInstance(pageType) {
  if (pageType === 'privacy') return quillPrivacy;
  if (pageType === 'terms') return quillTerms;
  if (pageType === 'cookies') return quillCookies;
  return null;
}

function setLegalDirty(pageType, isDirty) {
  if (pageType === 'privacy') isPrivacyDirty = isDirty;
  else if (pageType === 'terms') isTermsDirty = isDirty;
  else if (pageType === 'cookies') isCookiesDirty = isDirty;

  const indicator = document.getElementById(`legal-${pageType}-save-indicator`);
  if (indicator) {
    if (isDirty) {
      indicator.innerHTML = '<i class="fas fa-dot-circle" style="color:#ef4444;"></i> Unsaved changes';
      indicator.style.color = '#ef4444';
    } else {
      indicator.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981;"></i> All changes saved';
      indicator.style.color = '#64748b';
    }
  }
}

function updateLastSavedIndicator(pageType, text) {
  const indicator = document.getElementById(`legal-${pageType}-save-indicator`);
  if (indicator && !getLegalDirtyState(pageType)) {
    indicator.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> ${text}`;
    indicator.style.color = '#64748b';
  }
}

function getLegalDirtyState(pageType) {
  if (pageType === 'privacy') return isPrivacyDirty;
  if (pageType === 'terms') return isTermsDirty;
  if (pageType === 'cookies') return isCookiesDirty;
  return false;
}

function hasUnsavedLegalChanges() {
  return isPrivacyDirty || isTermsDirty || isCookiesDirty;
}

// 3. Switch Legal Editor tabs
function switchLegalEditorTab(pageType, tabName) {
  activeLegalTab[pageType] = tabName;

  // Toggle active tab buttons
  const tabs = ['editor', 'seo', 'preview', 'history'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${pageType}-${t}`);
    if (btn) {
      btn.style.color = t === tabName ? 'var(--uwo-accent)' : '#64748b';
      btn.style.borderBottom = t === tabName ? '3px solid var(--uwo-accent)' : 'none';
    }

    const panel = document.getElementById(`legal-panel-${pageType}-${t}`);
    if (panel) {
      panel.style.display = t === tabName ? 'block' : 'none';
    }
  });

  if (tabName === 'preview') {
    // Generate live preview HTML
    const titleVal = document.getElementById(`legal-${pageType}-title`).value || '';
    const editor = getLegalQuillInstance(pageType);
    const contentHtml = editor ? editor.root.innerHTML : '';

    const previewTitle = document.getElementById(`legal-${pageType}-preview-title`);
    const previewBody = document.getElementById(`legal-${pageType}-preview-body`);
    
    if (previewTitle) previewTitle.textContent = titleVal;
    if (previewBody) previewBody.innerHTML = contentHtml;
  }
}

function updateLegalPageHeader(pageType, data) {
  const badge = document.getElementById(`legal-${pageType}-badge`);
  const verNum = document.getElementById(`legal-${pageType}-ver-num`);
  const unpubBtn = document.getElementById(`btn-unpublish-${pageType}`);

  if (badge) {
    badge.textContent = data.status === 'published' ? 'Published' : 'Draft';
    badge.style.background = data.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)';
    badge.style.color = data.status === 'published' ? '#10b981' : '#f59e0b';
  }

  if (verNum) {
    verNum.textContent = data.version || 0;
  }

  if (unpubBtn) {
    unpubBtn.style.display = data.status === 'published' ? 'inline-block' : 'none';
  }
}

// 4. Save Draft API
async function saveLegalDraft(pageType, isAutoSave = false) {
  const token = localStorage.getItem("uwo_token");
  const editor = getLegalQuillInstance(pageType);
  if (!editor) return;

  const title = document.getElementById(`legal-${pageType}-title`).value || '';
  const content = editor.root.innerHTML;
  
  const payload = {
    page_type: pageType,
    title,
    content,
    seoTitle: document.getElementById(`legal-${pageType}-seo-title`).value || '',
    canonicalUrl: document.getElementById(`legal-${pageType}-canonical`).value || '',
    metaDescription: document.getElementById(`legal-${pageType}-meta-desc`).value || '',
    metaKeywords: document.getElementById(`legal-${pageType}-meta-keys`).value || '',
    openGraphTitle: document.getElementById(`legal-${pageType}-og-title`).value || '',
    openGraphImage: document.getElementById(`legal-${pageType}-og-image`).value || '',
    openGraphDescription: document.getElementById(`legal-${pageType}-og-desc`).value || '',
    robots: document.getElementById(`legal-${pageType}-robots`).value || 'Index'
  };

  try {
    const res = await fetch(`${API_URL}/admin/legal/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      alert("Session expired. Please log in again.");
      logout();
      return;
    }

    if (res.ok) {
      const data = await res.json();
      currentLegalData[pageType] = data.page;
      setLegalDirty(pageType, false);
      
      const timeStr = new Date().toLocaleTimeString();
      updateLastSavedIndicator(pageType, isAutoSave ? `Draft auto-saved at ${timeStr}` : `Draft saved at ${timeStr}`);
      updateLegalPageHeader(pageType, data.page);
    } else {
      if (!isAutoSave) alert("Failed to save draft.");
    }
  } catch (err) {
    console.error("Save draft error:", err);
    if (!isAutoSave) alert("Network error saving draft.");
  }
}

// Auto Save scheduler running every 10 seconds
function startLegalAutoSave() {
  if (legalAutoSaveTimer) clearInterval(legalAutoSaveTimer);
  
  legalAutoSaveTimer = setInterval(() => {
    if (isPrivacyDirty) {
      console.log("⏳ Autosaving Privacy Policy...");
      saveLegalDraft('privacy', true);
    }
    if (isTermsDirty) {
      console.log("⏳ Autosaving Terms & Conditions...");
      saveLegalDraft('terms', true);
    }
    if (isCookiesDirty) {
      console.log("⏳ Autosaving Cookies Policy...");
      saveLegalDraft('cookies', true);
    }
  }, 10000);
}

// 5. Publish Confirmation Modal Trigger
function confirmPublishLegal(pageType) {
  document.getElementById("legal-publish-type").value = pageType;
  document.getElementById("legal-publish-notes").value = "";
  document.getElementById("legalPublishModal").style.display = "flex";
}

function closePublishModal() {
  document.getElementById("legalPublishModal").style.display = "none";
}

async function publishLegalPage() {
  const pageType = document.getElementById("legal-publish-type").value;
  const notes = document.getElementById("legal-publish-notes").value;
  const token = localStorage.getItem("uwo_token");

  // Save current draft first
  await saveLegalDraft(pageType, false);

  try {
    const res = await fetch(`${API_URL}/admin/legal/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({ page_type: pageType, notes })
    });

    if (res.status === 401) {
      alert("Session expired. Please log in again.");
      logout();
      return;
    }

    if (res.ok) {
      const data = await res.json();
      currentLegalData[pageType] = data.page;
      setLegalDirty(pageType, false);
      
      updateLegalPageHeader(pageType, data.page);
      updateLastSavedIndicator(pageType, `Published live at ${new Date().toLocaleTimeString()}`);
      closePublishModal();
      
      // Reload history tab
      fetchLegalHistory(pageType);
      
      alert(`${data.page.title} has been published successfully!`);
    } else {
      alert("Failed to publish.");
    }
  } catch (err) {
    console.error("Publish error:", err);
    alert("Network error occurred.");
  }
}

// 6. Unpublish Page API
async function unpublishLegal(pageType) {
  if (!confirm("Are you sure you want to unpublish this page? It will show 'Content is currently unavailable.' on the public website.")) return;
  
  const token = localStorage.getItem("uwo_token");
  
  try {
    const res = await fetch(`${API_URL}/admin/legal/unpublish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({ page_type: pageType })
    });

    if (res.status === 401) {
      alert("Session expired. Please log in again.");
      logout();
      return;
    }

    if (res.ok) {
      const data = await res.json();
      currentLegalData[pageType] = data.page;
      
      updateLegalPageHeader(pageType, data.page);
      updateLastSavedIndicator(pageType, `Draft unpublished at ${new Date().toLocaleTimeString()}`);
      
      alert(`${data.page.title} unpublished.`);
    } else {
      alert("Unpublish failed.");
    }
  } catch (err) {
    console.error("Unpublish error:", err);
    alert("Network error.");
  }
}

// 7. Get Version History list
async function fetchLegalHistory(pageType) {
  const container = document.getElementById(`legal-${pageType}-history-container`);
  if (!container) return;

  const token = localStorage.getItem("uwo_token");

  try {
    container.innerHTML = '<div style="padding:20px; color:#fff;">Fetching history...</div>';
    const res = await fetch(`${API_URL}/admin/legal/versions/${pageType}`, {
      headers: { "Authorization": token }
    });

    if (res.status === 401) {
      alert("Session expired. Please log in again.");
      logout();
      return;
    }

    if (res.ok) {
      const versions = await res.json();
      container.innerHTML = "";

      if (versions.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b;">No published versions yet.</div>';
        return;
      }

      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.marginTop = "10px";
      table.innerHTML = `
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">
            <th style="padding:12px 10px; color:#0f172a;">Ver.</th>
            <th style="padding:12px 10px; color:#0f172a;">Updated Date</th>
            <th style="padding:12px 10px; color:#0f172a;">Updated By</th>
            <th style="padding:12px 10px; color:#0f172a;">Notes</th>
            <th style="padding:12px 10px; text-align:right; color:#0f172a;">Actions</th>
          </tr>
        </thead>
        <tbody id="legal-${pageType}-history-tbody"></tbody>
      `;
      container.appendChild(table);

      const tbody = document.getElementById(`legal-${pageType}-history-tbody`);
      versions.forEach(v => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #cbd5e1";
        tr.style.fontSize = "14px";
        tr.style.color = "#334155";
        
        const date = new Date(v.created_at).toLocaleString();
        
        tr.innerHTML = `
          <td style="padding:12px 10px; font-weight:800; color:#0f172a;">v${v.version}</td>
          <td style="padding:12px 10px; font-weight:600;">${date}</td>
          <td style="padding:12px 10px;">${v.updated_by}</td>
          <td style="padding:12px 10px; font-style:italic;">${v.notes || '-'}</td>
          <td style="padding:12px 10px; text-align:right;">
            <button onclick="compareLegalVersion('${pageType}', '${v._id}')" class="btn-premium" style="padding:6px 10px; font-size:11px; box-shadow:none; margin-right:5px; background:var(--uwo-accent); color:#000;"><i class="fas fa-columns"></i> Diff</button>
            <button onclick="restoreLegalVersion('${pageType}', '${v._id}')" class="btn-premium" style="padding:6px 10px; font-size:11px; box-shadow:none; background:#0f172a; color:#fff;"><i class="fas fa-history"></i> Rollback</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      container.innerHTML = '<div style="padding:20px; color:#ef4444;">Failed to load version history.</div>';
    }
  } catch(err) {
    container.innerHTML = '<div style="padding:20px; color:#ef4444;">Network error loading history.</div>';
  }
}



// 8. Restore Version Snapshot API
async function restoreLegalVersion(pageType, versionId) {
  if (!confirm("Restoring this version will immediately overwrite the current draft AND publish it live. Proceed?")) return;
  
  const token = localStorage.getItem("uwo_token");

  try {
    const res = await fetch(`${API_URL}/admin/legal/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({ page_type: pageType, version_id: versionId })
    });

    if (res.status === 401) {
      alert("Session expired. Please log in again.");
      logout();
      return;
    }

    if (res.ok) {
      const data = await res.json();
      currentLegalData[pageType] = data.page;
      setLegalDirty(pageType, false);

      // Reload fields
      loadLegalPage(pageType);
      
      alert("Successfully restored and published!");
    } else {
      alert("Restore failed.");
    }
  } catch(err) {
    alert("Network error.");
  }
}

// 9. Compare Versions / Diffs (HTML String Diff Comparison)
function closeCompareModal() {
  document.getElementById("legalCompareModal").style.display = "none";
}

async function compareLegalVersion(pageType, versionId) {
  const token = localStorage.getItem("uwo_token");
  
  const paneLeft = document.getElementById("compare-pane-left");
  const paneRight = document.getElementById("compare-pane-right");
  const header = document.getElementById("compare-version-header");
  const modal = document.getElementById("legalCompareModal");

  paneLeft.innerHTML = "Processing differences...";
  paneRight.innerHTML = "Processing differences...";
  modal.style.display = "flex";

  try {
    // Get version
    const res = await fetch(`${API_URL}/admin/legal/versions/${pageType}`, {
      headers: { "Authorization": token }
    });
    
    if (res.status === 401) {
      alert("Session expired. Please log in again.");
      logout();
      return;
    }

    if (res.ok) {
      const versions = await res.json();
      const v = versions.find(item => item._id === versionId);
      if (v) {
        header.textContent = `Version ${v.version} (Published on ${new Date(v.created_at).toLocaleDateString()})`;
        
        const editor = getLegalQuillInstance(pageType);
        const currentHtml = editor ? editor.root.innerHTML : '';
        const versionHtml = v.content;

        // Perform clean visual diff
        paneLeft.innerHTML = diffStrings(versionHtml, currentHtml);
        paneRight.innerHTML = v.content;
      }
    }
  } catch (err) {
    paneLeft.textContent = "Compare failed.";
    paneRight.textContent = "Compare failed.";
  }
}

// Very simple, robust, high-quality visual text diffing function
function diffStrings(oldStr, newStr) {
  const cleanStr = (s) => s.replace(/<[^>]+>/g, ' ').split(/\s+/);
  const oldWords = cleanStr(oldStr);
  const newWords = cleanStr(newStr);
  
  let diffHtml = '';
  newWords.forEach((word, idx) => {
    if (oldWords.includes(word)) {
      diffHtml += word + ' ';
    } else {
      diffHtml += `<span style="background-color:#d1fae5; color:#065f46; font-weight:700; padding:2px 4px; border-radius:4px;" title="Added">${word}</span> `;
    }
  });
  
  return diffHtml || 'No visual differences detected.';
}

async function loadLegalPage(pageType) {
  const token = localStorage.getItem("uwo_token");
  
  // Lazy load Quill first
  await new Promise(resolve => lazyLoadQuill(resolve));
  
  // Initialize editors
  initLegalQuillEditor(pageType);
  
  try {
    const response = await fetch(`${API_URL}/admin/legal/page/${pageType}`, {
      headers: { "Authorization": token }
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (response.ok) {
      const data = await response.json();
      currentLegalData[pageType] = data;

      // Populate input values from draft fields (with fallback to active fields)
      document.getElementById(`legal-${pageType}-title`).value = data.draftTitle || data.title || '';
      document.getElementById(`legal-${pageType}-seo-title`).value = data.draftSeoTitle || data.seoTitle || '';
      document.getElementById(`legal-${pageType}-canonical`).value = data.draftCanonicalUrl || data.canonicalUrl || '';
      document.getElementById(`legal-${pageType}-meta-desc`).value = data.draftMetaDescription || data.metaDescription || '';
      document.getElementById(`legal-${pageType}-meta-keys`).value = data.draftMetaKeywords || data.metaKeywords || '';
      document.getElementById(`legal-${pageType}-og-title`).value = data.draftOpenGraphTitle || data.openGraphTitle || '';
      document.getElementById(`legal-${pageType}-og-image`).value = data.draftOpenGraphImage || data.openGraphImage || '';
      document.getElementById(`legal-${pageType}-og-desc`).value = data.draftOpenGraphDescription || data.openGraphDescription || '';
      document.getElementById(`legal-${pageType}-robots`).value = data.draftRobots || data.robots || 'Index';

      // Load Editor Content from draft content
      const editor = getLegalQuillInstance(pageType);
      if (editor) {
        editor.root.innerHTML = data.draftContent || data.content || '';
      }

      // Update Badges & Version Number
      updateLegalPageHeader(pageType, data);
      
      // Load History
      fetchLegalHistory(pageType);

      // Reset dirty flag
      setLegalDirty(pageType, false);
      updateLastSavedIndicator(pageType, `Loaded at ${new Date().toLocaleTimeString()}`);
    }
  } catch (err) {
    console.error(`Failed to load legal page: ${pageType}`, err);
  }
}

// ==========================================
// 👥 TEAM MEMBERS MANAGEMENT
// ==========================================

let teamCurrentPage = 1;
let teamQuillInstance = null;

// Resolve team member image URL (handles both frontend images/ and backend /uploads/ paths)
function resolveTeamImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.includes('storage.googleapis.com/uwo-document/')) {
    const objectPath = imagePath.split('storage.googleapis.com/uwo-document/')[1];
    return API_URL + '/media/' + objectPath;
  }
  if (imagePath.includes('/api/media/')) {
    const mediaPath = imagePath.split('/api/media/')[1];
    return API_URL + '/media/' + mediaPath;
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/uploads/')) {
    return API_URL.replace('/api', '') + imagePath;
  }
  return API_URL + '/media/' + imagePath.replace(/^\/+/, '');
}

// Resolve project logo URL
function resolveProjectLogoUrl(logoPath) {
  if (!logoPath) return '';
  if (logoPath.includes('storage.googleapis.com/uwo-document/')) {
    const objectPath = logoPath.split('storage.googleapis.com/uwo-document/')[1];
    return API_URL + '/media/' + objectPath;
  }
  if (logoPath.includes('/api/media/')) {
    const mediaPath = logoPath.split('/api/media/')[1];
    return API_URL + '/media/' + mediaPath;
  }
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  if (logoPath.startsWith('/uploads/')) {
    return API_URL.replace('/api', '') + logoPath;
  }
  return API_URL + '/media/' + logoPath.replace(/^\/+/, '');
}

// Initialize Quill Rich Text editor for team biography
async function initTeamQuillEditor() {
  if (teamQuillInstance) return teamQuillInstance;

  await new Promise(resolve => lazyLoadQuill(resolve));

  teamQuillInstance = new Quill('#team-biography-quill', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
      ]
    }
  });

  // Apply Inter font styling to Quill editor
  const editorElem = document.querySelector('#team-biography-quill .ql-editor');
  if (editorElem) {
    editorElem.style.fontFamily = "'Inter', sans-serif";
    editorElem.style.fontSize = "14px";
  }

  return teamQuillInstance;
}

// Toggle custom category input box
function checkCustomCategory(select) {
  const customInput = document.getElementById("team-category-custom");
  if (!customInput) return;
  if (select.value === "__custom__") {
    customInput.style.display = "block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
    customInput.value = "";
  }
}

// Fetch and render team members list
async function fetchTeamMembers() {
  const token = localStorage.getItem("uwo_token");
  const tbody = document.getElementById("team-members-tbody");
  const search = document.getElementById("team-search")?.value || '';
  const status = document.getElementById("team-status-filter")?.value || '';
  const sort = document.getElementById("team-sort")?.value || 'order';

  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i><br>Loading team members...</td></tr>`;

  try {
    const params = new URLSearchParams({ page: teamCurrentPage, limit: 20, sort });
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await fetch(`${API_URL}/team-members?${params.toString()}`, {
      headers: { "Authorization": token }
    });

    if (response.status === 401) { logout(); return; }

    const data = await response.json();
    const members = data.members || [];

    if (members.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;"><i class="fas fa-users" style="font-size: 32px; margin-bottom: 10px; opacity: 0.3;"></i><br>No team members found</td></tr>`;
      document.getElementById('team-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = members.map(m => {
      const imgUrl = resolveTeamImageUrl(m.image);
      const defaultAvatar = `<div style="width:42px;height:42px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;"><i class="fas fa-user" style="color:#cbd5e1;font-size:16px;"></i></div>`;
      const imgHtml = imgUrl
        ? `<img src="${imgUrl}" alt="${m.name}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid var(--uwo-accent);" onerror="this.onerror=null; this.src='images/uwo-logo.png';">`
        : defaultAvatar;
      const statusBadge = m.status === 'active'
        ? `<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">Active</span>`
        : `<span style="background:#fef2f2;color:#ef4444;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">Inactive</span>`;
      const date = new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const desc = m.short_description ? (m.short_description.length > 50 ? m.short_description.substring(0, 50) + '...' : m.short_description) : '<span style="color:#cbd5e1;">—</span>';
      
      const leadershipTag = m.is_leadership 
        ? `<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:800;margin-left:6px;text-transform:uppercase;">Leadership</span>` 
        : '';

      return `<tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background='transparent'">
        <td style="padding:12px 16px;">${imgHtml}</td>
        <td style="padding:12px 16px;font-weight:700;color:#0f172a;">
          <div>${m.name}</div>
          <div style="font-weight:500;font-size:11px;color:#94a3b8;margin-top:2px;">Category: <b>${m.category}</b>${leadershipTag}</div>
        </td>
        <td style="padding:12px 16px;color:#475569;">${m.designation}</td>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${desc}</td>
        <td style="padding:12px 16px;text-align:center;font-weight:700;color:#0f172a;">${m.display_order}</td>
        <td style="padding:12px 16px;text-align:center;">${statusBadge}</td>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;white-space:nowrap;">${date}</td>
        <td style="padding:12px 16px;text-align:center;">
          <div style="display:flex;gap:6px;justify-content:center;">
            <button onclick="openTeamMemberEditor('${m._id}')" title="Edit" style="background:#f1f5f9;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseenter="this.style.background='#dbeafe'" onmouseleave="this.style.background='#f1f5f9'"><i class="fas fa-edit" style="color:#3b82f6;font-size:13px;"></i></button>
            <button onclick="toggleTeamMemberStatus('${m._id}')" title="${m.status === 'active' ? 'Deactivate' : 'Activate'}" style="background:#f1f5f9;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseenter="this.style.background='${m.status === 'active' ? '#fef9c3' : '#dcfce7'}'" onmouseleave="this.style.background='#f1f5f9'"><i class="fas fa-${m.status === 'active' ? 'eye-slash' : 'eye'}" style="color:${m.status === 'active' ? '#eab308' : '#22c55e'};font-size:13px;"></i></button>
            <button onclick="openTeamDeleteModal('${m._id}')" title="Delete" style="background:#f1f5f9;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseenter="this.style.background='#fef2f2'" onmouseleave="this.style.background='#f1f5f9'"><i class="fas fa-trash" style="color:#ef4444;font-size:13px;"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');

    // Render pagination
    const paginationHtml = [];
    for (let i = 1; i <= data.totalPages; i++) {
      paginationHtml.push(`<button onclick="teamCurrentPage=${i};fetchTeamMembers()" style="width:36px;height:36px;border-radius:10px;border:1px solid ${i === data.page ? 'var(--uwo-accent)' : '#e2e8f0'};background:${i === data.page ? 'var(--uwo-accent)' : '#fff'};color:${i === data.page ? '#000' : '#64748b'};font-weight:700;cursor:pointer;font-size:13px;transition:all 0.2s;">${i}</button>`);
    }
    document.getElementById('team-pagination').innerHTML = data.totalPages > 1 ? paginationHtml.join('') : '';

  } catch (err) {
    console.error("Error fetching team members:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i><br>Failed to load team members</td></tr>`;
  }
}

// Open add/edit modal
async function openTeamMemberEditor(id) {
  const modal = document.getElementById("teamMemberModal");
  const title = document.getElementById("teamModalTitle");
  const idField = document.getElementById("edit-team-member-id");

  // Ensure Quill is initialized
  const quill = await initTeamQuillEditor();

  // Reset form fields
  document.getElementById("team-name").value = '';
  document.getElementById("team-designation").value = '';
  document.getElementById("team-description").value = '';
  document.getElementById("team-skills").value = '';
  document.getElementById("team-experience").value = '';
  document.getElementById("team-achievements").value = '';
  quill.root.innerHTML = '';
  
  const categorySelect = document.getElementById("team-category");
  categorySelect.value = 'Technology';
  
  const customCategoryInput = document.getElementById("team-category-custom");
  customCategoryInput.style.display = 'none';
  customCategoryInput.value = '';

  document.getElementById("team-is-leadership").value = 'false';
  document.getElementById("team-order").value = '';
  document.getElementById("team-status").value = 'active';

  // Reset Social Links
  document.getElementById("team-linkedin").value = '';
  document.getElementById("team-twitter").value = '';
  document.getElementById("team-github").value = '';
  document.getElementById("team-website").value = '';
  document.getElementById("team-email").value = '';

  document.getElementById("team-image-input").value = '';
  document.getElementById("team-image-preview").innerHTML = '<i class="fas fa-user" style="font-size: 32px; color: #cbd5e1;"></i>';
  updateTeamCharCount();
  idField.value = '';

  if (id) {
    title.innerHTML = '<i class="fas fa-user-edit" style="color: var(--uwo-accent);"></i> Edit Team Member';
    idField.value = id;

    try {
      const token = localStorage.getItem("uwo_token");
      const response = await fetch(`${API_URL}/team-members/${id}`, {
        headers: { "Authorization": token }
      });
      if (response.ok) {
        const member = await response.json();
        document.getElementById("team-name").value = member.name || '';
        document.getElementById("team-designation").value = member.designation || '';
        document.getElementById("team-description").value = member.short_description || member.description || '';
        quill.root.innerHTML = member.full_biography || '';
        
        // Handle Category Selection
        const categoryVal = member.category || 'Technology';
        let optionExists = false;
        for (let i = 0; i < categorySelect.options.length; i++) {
          if (categorySelect.options[i].value === categoryVal) {
            optionExists = true;
            break;
          }
        }
        if (optionExists) {
          categorySelect.value = categoryVal;
          customCategoryInput.style.display = 'none';
          customCategoryInput.value = '';
        } else {
          categorySelect.value = '__custom__';
          customCategoryInput.style.display = 'block';
          customCategoryInput.value = categoryVal;
        }

        document.getElementById("team-is-leadership").value = member.is_leadership ? 'true' : 'false';
        document.getElementById("team-order").value = member.display_order || '';
        document.getElementById("team-status").value = member.status || 'active';

        // Populate Social Links
        document.getElementById("team-linkedin").value = member.linkedin || '';
        document.getElementById("team-twitter").value = member.twitter || '';
        document.getElementById("team-github").value = member.github || '';
        document.getElementById("team-website").value = member.website || '';
        document.getElementById("team-email").value = member.email || '';

        // Populate new fields
        document.getElementById("team-skills").value = member.skills ? member.skills.join(', ') : '';
        document.getElementById("team-experience").value = member.experience ? member.experience.join('\n') : '';
        document.getElementById("team-achievements").value = member.achievements ? member.achievements.join('\n') : '';
        
        updateTeamCharCount();

        if (member.image) {
          const imgUrl = resolveTeamImageUrl(member.image);
          document.getElementById("team-image-preview").innerHTML = `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\' style=\\'font-size:32px;color:#cbd5e1;\\'></i>';">`;
        }
      }
    } catch (err) {
      console.error("Error loading team member:", err);
    }
  } else {
    title.innerHTML = '<i class="fas fa-user-plus" style="color: var(--uwo-accent);"></i> Add Team Member';
  }

  modal.style.display = "flex";
}

function closeTeamMemberEditor() {
  document.getElementById("teamMemberModal").style.display = "none";
}

// Save (create or update)
async function saveTeamMember() {
  const token = localStorage.getItem("uwo_token");
  const id = document.getElementById("edit-team-member-id").value;
  const name = document.getElementById("team-name").value.trim();
  const designation = document.getElementById("team-designation").value.trim();
  const short_description = document.getElementById("team-description").value.trim();
  
  // Quill biography retrieval
  const full_biography = teamQuillInstance ? teamQuillInstance.root.innerHTML : '';
  
  // Category retrieval
  const categorySelect = document.getElementById("team-category");
  let category = categorySelect.value;
  if (category === "__custom__") {
    category = document.getElementById("team-category-custom").value.trim();
  }

  const is_leadership = document.getElementById("team-is-leadership").value === 'true';
  const display_order = document.getElementById("team-order").value.trim() || '1';
  const status = document.getElementById("team-status").value;

  // Social Links
  const linkedin = document.getElementById("team-linkedin").value.trim();
  const twitter = document.getElementById("team-twitter").value.trim();
  const github = document.getElementById("team-github").value.trim();
  const website = document.getElementById("team-website").value.trim();
  const email = document.getElementById("team-email").value.trim();
  
  // Profile Details
  const skills = document.getElementById("team-skills").value.trim();
  const experience = document.getElementById("team-experience").value.trim();
  const achievements = document.getElementById("team-achievements").value.trim();

  const imageFile = document.getElementById("team-image-input").files[0];

  // Client-side validation
  if (!name || name.length < 3) {
    showTeamToast('Name is required (min 3 characters)', 'error');
    return;
  }
  if (!designation) {
    showTeamToast('Designation is required', 'error');
    return;
  }
  if (short_description.length > 250) {
    showTeamToast('Short description must be 250 characters or less', 'error');
    return;
  }
  if (!category) {
    showTeamToast('Category/Department is required', 'error');
    return;
  }
  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    showTeamToast('Image must be less than 2MB', 'error');
    return;
  }

  const saveBtn = document.getElementById("btn-save-team-member");
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('designation', designation);
    formData.append('short_description', short_description);
    formData.append('full_biography', full_biography);
    formData.append('category', category);
    formData.append('is_leadership', is_leadership);
    formData.append('display_order', display_order);
    formData.append('status', status);
    
    // Social Links
    formData.append('linkedin', linkedin);
    formData.append('twitter', twitter);
    formData.append('github', github);
    formData.append('website', website);
    formData.append('email', email);
    
    // Profile Details
    formData.append('skills', skills);
    formData.append('experience', experience);
    formData.append('achievements', achievements);

    if (imageFile) formData.append('image', imageFile);

    const url = id ? `${API_URL}/team-members/${id}` : `${API_URL}/team-members`;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { "Authorization": token },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      showTeamToast(id ? 'Team member updated successfully!' : 'Team member added successfully!', 'success');
      closeTeamMemberEditor();
      fetchTeamMembers();
    } else {
      showTeamToast(data.message || 'Failed to save team member', 'error');
    }
  } catch (err) {
    console.error("Error saving team member:", err);
    showTeamToast('An error occurred while saving', 'error');
  } finally {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
}

// Delete modal
function openTeamDeleteModal(id) {
  document.getElementById("delete-team-member-id").value = id;
  document.getElementById("teamDeleteModal").style.display = "flex";
}

function closeTeamDeleteModal() {
  document.getElementById("teamDeleteModal").style.display = "none";
}

async function confirmDeleteTeamMember() {
  const token = localStorage.getItem("uwo_token");
  const id = document.getElementById("delete-team-member-id").value;

  try {
    const response = await fetch(`${API_URL}/team-members/${id}`, {
      method: 'DELETE',
      headers: { "Authorization": token }
    });

    if (response.ok) {
      showTeamToast('Team member deleted successfully', 'success');
      closeTeamDeleteModal();
      fetchTeamMembers();
    } else {
      const data = await response.json();
      showTeamToast(data.message || 'Failed to delete', 'error');
    }
  } catch (err) {
    console.error("Error deleting team member:", err);
    showTeamToast('An error occurred while deleting', 'error');
  }
}

// Toggle status
async function toggleTeamMemberStatus(id) {
  const token = localStorage.getItem("uwo_token");

  try {
    const response = await fetch(`${API_URL}/team-members/${id}/status`, {
      method: 'PATCH',
      headers: { "Authorization": token }
    });

    if (response.ok) {
      const data = await response.json();
      showTeamToast(data.message, 'success');
      fetchTeamMembers();
    } else {
      showTeamToast('Failed to update status', 'error');
    }
  } catch (err) {
    console.error("Error toggling status:", err);
    showTeamToast('An error occurred', 'error');
  }
}

// Image preview
function previewTeamImage(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showTeamToast('Image must be less than 2MB', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("team-image-preview").innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    };
    reader.readAsDataURL(file);
  }
}

// Character counter
function updateTeamCharCount() {
  const desc = document.getElementById("team-description");
  const counter = document.getElementById("team-char-count");
  if (desc && counter) {
    const len = desc.value.length;
    counter.textContent = `${len} / 250`;
    counter.style.color = len > 230 ? (len >= 250 ? '#ef4444' : '#eab308') : '#94a3b8';
  }
}

function updateProjectCharCount() {
  const desc = document.getElementById("project-description");
  const counter = document.getElementById("project-char-count");
  if (desc && counter) {
    const len = desc.value.length;
    counter.textContent = `${len} / 300`;
    counter.style.color = len > 280 ? (len >= 300 ? '#ef4444' : '#eab308') : '#94a3b8';
  }
}

// Toast notification
function showTeamToast(message, type = 'success') {
  const toast = document.getElementById("teamToast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = type === 'success'
    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => { toast.style.display = 'none'; }, 400);
  }, 3000);
}

// 🚀 PROJECTS MANAGEMENT MODULE 
// ==========================================

let currentProjectPage = 1;

async function fetchProjects(page = 1) {
    currentProjectPage = page;
    const token = localStorage.getItem("uwo_token");
    const search = document.getElementById("project-search")?.value || "";
    const status = document.getElementById("project-status-filter")?.value || "";
    
    try {
        const res = await fetch(`${API_URL}/projects?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${status}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
            showTeamToast("Session expired. Please log in again.", "error");
            setTimeout(() => logout(), 1500);
            return;
        }

        if (!res.ok) throw new Error("Failed to fetch projects");
        
        const data = await res.json();
        const tbody = document.getElementById("projects-tbody");
        if (!tbody) return;
        
        tbody.innerHTML = "";

        if (data.projects.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No projects found.</td></tr>`;
            document.getElementById("project-pagination").innerHTML = "";
            return;
        }

        data.projects.forEach(project => {
            const logoUrl = resolveProjectLogoUrl(project.logo);
            const statusBadge = project.status === 'active' 
                ? `<span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:800;">ACTIVE</span>`
                : `<span style="background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:800;">INACTIVE</span>`;
            
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #e2e8f0";
            
            tr.innerHTML = `
                <td style="padding:14px 16px;">
                    <div style="width:40px; height:40px; border-radius:8px; overflow:hidden; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">
                        <img src="${logoUrl}" alt="${project.name}" style="width:100%; height:100%; object-fit:contain;" onerror="this.outerHTML='<i class=\\'fas fa-image\\' style=\\'color:#cbd5e1;\\'></i>'">
                    </div>
                </td>
                <td style="padding:14px 16px; font-weight:700; color:#0f172a;">
                    ${project.name}
                    ${project.is_featured ? '<i class="fas fa-star" style="color:#eab308; margin-left:5px; font-size:12px;" title="Featured"></i>' : ''}
                </td>
                <td style="padding:14px 16px; color:#475569; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${project.short_description}">
                    ${project.short_description}
                </td>
                <td style="padding:14px 16px; text-align:center; font-weight:600; color:#0f172a;">${project.display_order}</td>
                <td style="padding:14px 16px; text-align:center;">
                    <div style="cursor:pointer;" onclick="toggleProjectStatus('${project._id}')" title="Click to toggle status">${statusBadge}</div>
                </td>
                <td style="padding:14px 16px; color:#64748b; font-size:12px;">${new Date(project.created_at).toLocaleDateString()}</td>
                <td style="padding:14px 16px; text-align:center;">
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button onclick="editProject('${project._id}')" style="background:#f1f5f9; color:#3b82f6; border:none; width:32px; height:32px; border-radius:8px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='#e0f2fe'" onmouseout="this.style.background='#f1f5f9'" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="openProjectDeleteModal('${project._id}')" style="background:#fef2f2; color:#ef4444; border:none; width:32px; height:32px; border-radius:8px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Setup Pagination
        const pagination = document.getElementById("project-pagination");
        if (pagination) {
            pagination.innerHTML = "";
            for (let i = 1; i <= data.totalPages; i++) {
                const btn = document.createElement("button");
                btn.textContent = i;
                btn.style.width = "32px";
                btn.style.height = "32px";
                btn.style.border = "none";
                btn.style.borderRadius = "8px";
                btn.style.cursor = "pointer";
                btn.style.fontWeight = "700";
                
                if (i === data.currentPage) {
                    btn.style.background = "var(--uwo-accent)";
                    btn.style.color = "#000";
                } else {
                    btn.style.background = "#f1f5f9";
                    btn.style.color = "#64748b";
                }
                
                btn.onclick = () => fetchProjects(i);
                pagination.appendChild(btn);
            }
        }
    } catch (err) {
        console.error("Error fetching projects:", err);
        showTeamToast("Failed to load projects", "error");
    }
}

function openProjectEditor() {
    document.getElementById("edit-project-id").value = "";
    document.getElementById("project-name").value = "";
    document.getElementById("project-url").value = "";
    document.getElementById("project-description").value = "";
    document.getElementById("project-btn-label").value = "Visit Project";
    document.getElementById("project-order").value = "0";
    document.getElementById("project-status").value = "active";
    document.getElementById("project-featured").checked = false;
    document.getElementById("project-image-input").value = "";
    
    document.getElementById("project-image-preview").innerHTML = `<i class="fas fa-image" style="font-size: 32px; color: #cbd5e1;"></i>`;
    
    document.getElementById("projectModalTitle").innerHTML = `<i class="fas fa-plus" style="color: var(--uwo-accent);"></i> Add Project`;
    document.getElementById("btn-save-project").innerHTML = `<i class="fas fa-save"></i> Save Project`;
    
    updateProjectCharCount();
    document.getElementById("projectModal").style.display = "flex";
}

function closeProjectEditor() {
    document.getElementById("projectModal").style.display = "none";
}

async function editProject(id) {
    const token = localStorage.getItem("uwo_token");
    try {
        const res = await fetch(`${API_URL}/projects/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch project");
        const project = await res.json();
        
        document.getElementById("edit-project-id").value = project._id;
        document.getElementById("project-name").value = project.name;
        document.getElementById("project-url").value = project.project_url;
        document.getElementById("project-description").value = project.short_description;
        document.getElementById("project-btn-label").value = project.button_label || "Visit Project";
        document.getElementById("project-order").value = project.display_order;
        document.getElementById("project-status").value = project.status;
        document.getElementById("project-featured").checked = project.is_featured;
        
        document.getElementById("project-image-input").value = ""; // Clear file input
        
        const logoUrl = resolveProjectLogoUrl(project.logo);
        document.getElementById("project-image-preview").innerHTML = `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;">`;
        
        document.getElementById("projectModalTitle").innerHTML = `<i class="fas fa-edit" style="color: var(--uwo-accent);"></i> Edit Project`;
        document.getElementById("btn-save-project").innerHTML = `<i class="fas fa-save"></i> Update Project`;
        
        updateProjectCharCount();
        document.getElementById("projectModal").style.display = "flex";
    } catch (err) {
        console.error("Error fetching project:", err);
        showTeamToast("Failed to load project details", "error");
    }
}

async function saveProject() {
    const id = document.getElementById("edit-project-id").value;
    const name = document.getElementById("project-name").value;
    const url = document.getElementById("project-url").value;
    const desc = document.getElementById("project-description").value;
    const btnLabel = document.getElementById("project-btn-label").value;
    const order = document.getElementById("project-order").value;
    const status = document.getElementById("project-status").value;
    const featured = document.getElementById("project-featured").checked;
    const imageInput = document.getElementById("project-image-input");

    if (!name || !url || !desc) {
        showTeamToast("Name, URL, and Description are required", "error");
        return;
    }
    
    if (!id && (!imageInput.files || imageInput.files.length === 0)) {
        showTeamToast("Project logo is required", "error");
        return;
    }

    const btn = document.getElementById("btn-save-project");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("project_url", url);
        formData.append("short_description", desc);
        formData.append("button_label", btnLabel);
        formData.append("display_order", order);
        formData.append("status", status);
        formData.append("is_featured", featured);
        
        if (imageInput.files[0]) {
            formData.append("logo", imageInput.files[0]);
        }

        const token = localStorage.getItem("uwo_token");
        const method = id ? "PUT" : "POST";
        const endpoint = id ? `${API_URL}/projects/${id}` : `${API_URL}/projects`;

        const res = await fetch(endpoint, {
            method: method,
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.status === 401) {
            showTeamToast("Session expired. Please log in again.", "error");
            setTimeout(() => logout(), 1500);
            throw new Error("Session expired. Please log in again.");
        }

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.details || errData.message || errData.error || "Failed to save project");
        }

        showTeamToast(`Project ${id ? 'updated' : 'created'} successfully`);
        closeProjectEditor();
        fetchProjects(currentProjectPage);
    } catch (err) {
        console.error("Error saving project:", err);
        showTeamToast(err.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function previewProjectImage(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showTeamToast('Image must be less than 2MB', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("project-image-preview").innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:contain;border-radius:12px;">`;
    };
    reader.readAsDataURL(file);
  }
}

function openProjectDeleteModal(id) {
    document.getElementById("delete-project-id").value = id;
    document.getElementById("projectDeleteModal").style.display = "flex";
}

function closeProjectDeleteModal() {
    document.getElementById("projectDeleteModal").style.display = "none";
}

async function confirmDeleteProject() {
    const id = document.getElementById("delete-project-id").value;
    if (!id) return;

    try {
        const token = localStorage.getItem("uwo_token");
        const res = await fetch(`${API_URL}/projects/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to delete project");

        showTeamToast("Project deleted successfully");
        closeProjectDeleteModal();
        fetchProjects(currentProjectPage);
    } catch (err) {
        console.error("Error deleting project:", err);
        showTeamToast("Failed to delete project", "error");
    }
}

async function toggleProjectStatus(id) {
    try {
        const token = localStorage.getItem("uwo_token");
        const res = await fetch(`${API_URL}/projects/${id}/status`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to update status");

        showTeamToast("Project status updated");
        fetchProjects(currentProjectPage);
    } catch (err) {
        console.error("Error updating project status:", err);
        showTeamToast("Failed to update status", "error");
    }
}

// Intercept showTab inside admin.js to trigger fetching
const originalShowTabAdmin = window.showTab;
window.showTab = function(tabId) {
    const tabPermissions = {
        'messages': 'messages.view',
        'rag': 'knowledge.view',
        'blogs': 'blogs.view',
        'legal-privacy': 'legal.view',
        'legal-terms': 'legal.view',
        'legal-cookies': 'legal.view',
        'projects': 'projects.view',
        'team-members': 'team.view',
        'storage': 'settings.view',
        'product-management': 'sales.view',
        'sales-settings': 'sales.view',
        'settings': 'settings.view'
    };

    const reqPermission = tabPermissions[tabId];
    if (reqPermission && window.adminPermissions && !window.adminPermissions.includes(reqPermission)) {
        console.warn(`Access Denied to tab: ${tabId}`);
        showTeamToast("Access Denied: You do not have permission to view this tab", "error");
        return;
    }

    if (originalShowTabAdmin) originalShowTabAdmin(tabId);
    
    document.querySelectorAll('.section-card').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    const section = document.getElementById(`tab-${tabId}`);
    const navItem = document.getElementById(`btn-${tabId}`);
    
    if (section) {
        section.style.display = 'block';
    } else {
        // Fallback for missing tabs visually
        const messagesTab = document.getElementById(`tab-messages`);
        if(messagesTab) messagesTab.style.display = 'block';
    }
    
    if (navItem) navItem.classList.add('active');
    
    // Auto fetch data on tab click
    if (tabId === 'team-members') fetchTeamMembers();
    if (tabId === 'projects') fetchProjects();
    if (tabId === 'storage') fetchStorageFiles();
    if (tabId === 'product-management') fetchProducts();
    if (tabId === 'sales-settings') fetchSalesPartners();
};

// =========================================================================
// =================== SALES PARTNER CONFIG & ANALYTICS ====================
// =========================================================================

let allPartners = [];

// Helper to escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function fetchSalesPartners() {
    const token = localStorage.getItem("uwo_token");
    const tbody = document.getElementById("partners-tbody");
    
    try {
        tbody.innerHTML = "<tr><td colspan='11' style='text-align:center; padding:30px;'>Loading Sales Partners...</td></tr>";
        
        const response = await fetch(`${API_URL}/affiliate/admin/partners`, {
            headers: { "Authorization": token }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        allPartners = await response.json();
        renderPartnersList();
        fetchPendingRequestsCount();
    } catch (err) {
        console.error("Error loading partners:", err);
        showTeamToast("Failed to load sales partners", "error");
        tbody.innerHTML = "<tr><td colspan='11' style='text-align:center; padding:30px; color:#ef4444;'>Failed to load sales partners.</td></tr>";
    }
}

function renderPartnersList() {
    const query = document.getElementById("partner-search").value.trim().toLowerCase();
    const tbody = document.getElementById("partners-tbody");
    tbody.innerHTML = "";

    const filtered = allPartners.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.email.toLowerCase().includes(query) ||
        p.affiliateCode.toLowerCase().includes(query)
    );

    const sortBy = document.getElementById("partner-sort-filter").value;
    if (sortBy === 'sales') {
        filtered.sort((a, b) => (b.orders || 0) - (a.orders || 0));
    } else if (sortBy === 'revenue') {
        filtered.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = "<tr><td colspan='11' style='text-align:center; padding:40px; color:#64748b;'>No sales partners found.</td></tr>";
        return;
    }

    filtered.forEach(p => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        
        const nameEscaped = escapeHtml(p.name);
        const emailEscaped = escapeHtml(p.email);
        const phoneEscaped = escapeHtml(p.phone);
        const codeEscaped = escapeHtml(p.affiliateCode);
        const totalLogins = p.totalLogins || 0;
        const orders = p.orders || 0;
        const revenue = p.revenue || 0;
        const returned = p.returned || 0;
        const cancelled = p.cancelled || 0;

        const statusBadge = p.status === 'active' 
            ? '<span style="background:#dcfce7; color:#15803d; padding:4px 8px; border-radius:50px; font-size:11px; font-weight:700; text-transform:uppercase;">Active</span>'
            : '<span style="background:#fee2e2; color:#b91c1c; padding:4px 8px; border-radius:50px; font-size:11px; font-weight:700; text-transform:uppercase;">Disabled</span>';

        const toggleBtnLabel = p.status === 'active' ? 'Disable' : 'Enable';
        const toggleBtnIcon = p.status === 'active' ? 'fa-ban' : 'fa-check';
        const toggleColor = p.status === 'active' ? '#ef4444' : '#10b981';

        // Assigned products display text
        let assignedDisplay = 'None';
        if (p.assignedProducts && p.assignedProducts.length > 0) {
            assignedDisplay = p.assignedProducts.join(', ');
            if (assignedDisplay.length > 30) {
                assignedDisplay = `${p.assignedProducts.length} Products`;
            }
        }

        tr.innerHTML = `
            <td style="padding:14px 16px; color:#0f172a;">
                <div style="font-weight:700;">${nameEscaped}</div>
                <div style="font-size:12px; color:#64748b; margin-top:2px;">Email: ${emailEscaped}</div>
                <div style="font-size:12px; color:#94a3b8;">Phone: ${phoneEscaped}</div>
                <div style="font-size:12px; font-family:monospace; font-weight:700; color:var(--uwo-accent); margin-top:2px;">Code: ${codeEscaped}</div>
            </td>
            <td style="padding:14px 16px; text-align:center;">
                <a href="#" onclick="openManageProductsModal('${p._id}'); return false;" style="color:#B48E3D; font-weight:700; text-decoration:none; border-bottom:1px dashed #B48E3D; cursor:pointer;">
                    ${assignedDisplay}
                </a>
            </td>
            <td style="padding:14px 16px; text-align:center; font-weight:600;">${totalLogins.toLocaleString('en-IN')}</td>
            <td style="padding:14px 16px; text-align:center; font-weight:600;">${orders.toLocaleString('en-IN')}</td>
            <td style="padding:14px 16px; text-align:right; font-weight:600;">₹${revenue.toLocaleString('en-IN')}</td>
            <td style="padding:14px 16px; text-align:center; color:#64748b;">${returned.toLocaleString('en-IN')}</td>
            <td style="padding:14px 16px; text-align:center; color:#64748b;">${cancelled.toLocaleString('en-IN')}</td>
            <td style="padding:14px 16px; text-align:center;">${statusBadge}</td>
            <td style="padding:14px 16px; text-align:center;">
                <div style="display:flex; justify-content:center; gap:8px;">
                    <button onclick="viewPartnerDetails('${p._id}')" class="btn-action" title="Manage Partner" style="background:rgba(214,165,89,0.1); border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas fa-eye" style="color:#B48E3D;"></i></button>
                    <button onclick="openManageProductsModal('${p._id}')" class="btn-action" title="Manage Products" style="background:#fef9ee; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas fa-cubes" style="color:#D6A559;"></i></button>
                    <button onclick="openPartnerModal('${p._id}')" class="btn-action" title="Edit Partner" style="background:#f1f5f9; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas fa-edit" style="color:#475569;"></i></button>
                    <button onclick="openPartnerResetPasswordModal('${p._id}')" class="btn-action" title="Reset Password" style="background:#fef9ee; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas fa-key" style="color:#D6A559;"></i></button>
                    <button onclick="togglePartnerStatus('${p._id}', '${p.status}')" class="btn-action" title="${toggleBtnLabel} Partner" style="background:${p.status === 'active' ? '#fef2f2' : '#ecfdf5'}; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas ${toggleBtnIcon}" style="color:${toggleColor};"></i></button>
                    <button onclick="openPartnerDeleteModal('${p._id}')" class="btn-action" title="Delete Partner" style="background:#fef2f2; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas fa-trash-alt" style="color:#ef4444;"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================= AFFILIATE PARTNER DETAIL DASHBOARD =================

let currentDetailPartnerData = null;
let activeDetailPartnerId = null;
let detailRefreshInterval = null;

async function viewPartnerDetails(partnerId) {
    const token = localStorage.getItem("uwo_token");
    activeDetailPartnerId = partnerId;
    
    const modal = document.getElementById("partnerDetailModal");
    if (!modal) return;
    modal.style.display = "block";

    try {
        const response = await fetch(`${API_URL}/affiliate/admin/partner-details/${partnerId}`, {
            headers: { "Authorization": token }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            showTeamToast("Failed to fetch partner details", "error");
            return;
        }

        const data = await response.json();
        currentDetailPartnerData = data;
        renderPartnerDetailDashboard(data);

        // Live Auto-Refresh (Every 15s)
        if (detailRefreshInterval) clearInterval(detailRefreshInterval);
        detailRefreshInterval = setInterval(async () => {
            if (activeDetailPartnerId && modal.style.display !== "none") {
                try {
                    const res = await fetch(`${API_URL}/affiliate/admin/partner-details/${activeDetailPartnerId}`, {
                        headers: { "Authorization": token }
                    });
                    if (res.ok) {
                        const refreshData = await res.json();
                        currentDetailPartnerData = refreshData;
                        renderPartnerDetailDashboard(refreshData);
                    }
                } catch (e) {
                    console.warn("Auto-refresh partner details error:", e);
                }
            }
        }, 15000);
    } catch (err) {
        console.error("Error opening partner detail dashboard:", err);
        showTeamToast("Failed to load partner dashboard", "error");
    }
}

function closePartnerDetailModal() {
    const modal = document.getElementById("partnerDetailModal");
    if (modal) modal.style.display = "none";
    if (detailRefreshInterval) {
        clearInterval(detailRefreshInterval);
        detailRefreshInterval = null;
    }
    currentDetailPartnerData = null;
    activeDetailPartnerId = null;
}

function renderPartnerDetailDashboard(data) {
    const partner = data.partner || {};
    const stats = data.stats || {};
    const revBreak = data.revenueBreakdown || {};
    const products = data.products || [];
    const activities = data.recentActivity || [];
    const chartSalesByProduct = (data.chartData && data.chartData.salesByProduct) || [];

    // Header Metadata
    const firstChar = partner.name ? partner.name.charAt(0).toUpperCase() : 'A';
    const avatarElem = document.getElementById("detail-avatar");
    if (avatarElem) avatarElem.innerText = firstChar;
    const nameElem = document.getElementById("detail-partner-name");
    if (nameElem) nameElem.innerText = partner.name || "Abha";
    const codeElem = document.getElementById("detail-partner-code");
    if (codeElem) codeElem.innerText = partner.affiliateCode || '-';
    
    const emailElem = document.getElementById("detail-partner-email");
    if (emailElem) emailElem.innerText = partner.email || '-';
    const phoneElem = document.getElementById("detail-partner-phone");
    if (phoneElem) phoneElem.innerText = partner.phone || '-';
    
    const regDateStr = partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const loginStr = partner.lastLogin ? new Date(partner.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never';
    
    const regElem = document.getElementById("detail-partner-registered");
    if (regElem) regElem.innerText = regDateStr;
    const loginElem = document.getElementById("detail-partner-login");
    if (loginElem) loginElem.innerText = loginStr;

    // Status Badge
    const statusElem = document.getElementById("detail-partner-status");
    if (partner.status === 'active') {
        statusElem.innerText = "ACTIVE";
        statusElem.style.background = "#dcfce7";
        statusElem.style.color = "#15803d";
    } else {
        statusElem.innerText = "DISABLED";
        statusElem.style.background = "#fee2e2";
        statusElem.style.color = "#b91c1c";
    }

    // Toggle Button Label
    const toggleBtn = document.getElementById("detail-btn-toggle");
    if (toggleBtn) {
        if (partner.status === 'active') {
            toggleBtn.innerHTML = '<i class="fas fa-ban"></i> Deactivate';
            toggleBtn.style.background = "#fef2f2";
            toggleBtn.style.color = "#ef4444";
            toggleBtn.style.borderColor = "#fecaca";
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-check-circle"></i> Activate';
            toggleBtn.style.background = "#ecfdf5";
            toggleBtn.style.color = "#10b981";
            toggleBtn.style.borderColor = "#a7f3d0";
        }
    }

    // Top Compact KPI Cards
    document.getElementById("detail-views").innerText = (stats.totalViews || 0).toLocaleString('en-IN');
    document.getElementById("detail-leads").innerText = (stats.totalLeads || 0).toLocaleString('en-IN');
    document.getElementById("detail-sales").innerText = (stats.totalSales || 0).toLocaleString('en-IN');
    document.getElementById("detail-revenue").innerText = `₹${(stats.revenue || 0).toLocaleString('en-IN')}`;
    document.getElementById("detail-returned").innerText = (stats.returned || 0).toLocaleString('en-IN');
    document.getElementById("detail-cancelled").innerText = (stats.cancelled || 0).toLocaleString('en-IN');
    document.getElementById("detail-conversion").innerText = `${stats.conversionRate || 0}%`;

    // Revenue Breakdown
    const revToday = document.getElementById("detail-rev-today");
    if (revToday) revToday.innerText = `₹${(revBreak.today || 0).toLocaleString('en-IN')}`;
    const revWeek = document.getElementById("detail-rev-week");
    if (revWeek) revWeek.innerText = `₹${(revBreak.week || 0).toLocaleString('en-IN')}`;
    const revMonth = document.getElementById("detail-rev-month");
    if (revMonth) revMonth.innerText = `₹${(revBreak.month || 0).toLocaleString('en-IN')}`;
    const revLife = document.getElementById("detail-rev-lifetime");
    if (revLife) revLife.innerText = `₹${(revBreak.lifetime || 0).toLocaleString('en-IN')}`;

    // Product Comparison Chart Visual Bars
    const chartContainer = document.getElementById("detail-chart-container");
    if (chartContainer) {
        chartContainer.innerHTML = "";
        if (chartSalesByProduct.length === 0) {
            chartContainer.innerHTML = `<div style="text-align: center; color: #64748b; font-size: 13px; padding: 20px;">No product performance data available.</div>`;
        } else {
            const maxRev = Math.max(...chartSalesByProduct.map(c => c.revenue || 0), 1);
            chartSalesByProduct.forEach(c => {
                const pct = Math.round(((c.revenue || 0) / maxRev) * 100);
                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.flexDirection = "column";
                row.style.gap = "6px";

                row.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #0f172a;">
                        <span><i class="fas fa-cube" style="color: var(--uwo-accent); margin-right: 6px;"></i> ${escapeHtml(c.product)}</span>
                        <span>₹${(c.revenue || 0).toLocaleString('en-IN')} (${c.sales || 0} sales, ${c.views || 0} views)</span>
                    </div>
                    <div style="background: #f1f5f9; height: 10px; border-radius: 50px; overflow: hidden; width: 100%;">
                        <div style="background: linear-gradient(90deg, #d6a559 0%, #b48e3d 100%); height: 100%; width: ${Math.max(pct, 5)}%; border-radius: 50px; transition: width 0.5s ease;"></div>
                    </div>
                `;
                chartContainer.appendChild(row);
            });
        }
    }

function getProductBadgeHtml(productName) {
    const pUpper = (productName || '').toUpperCase();
    let bg = '#fef9ee';
    let color = '#b48e3d';
    let border = '#fde68a';

    if (pUpper.includes('EFV')) {
        bg = '#fef9ee'; color = '#b48e3d'; border = '#fde68a';
    } else if (pUpper.includes('AISA')) {
        bg = '#eff6ff'; color = '#2563eb'; border = '#bfdbfe';
    } else if (pUpper.includes('LEGAL')) {
        bg = '#f1f5f9'; color = '#334155'; border = '#cbd5e1';
    } else if (pUpper.includes('CONNECT')) {
        bg = '#ecfdf5'; color = '#059669'; border = '#a7f3d0';
    }

    return `<span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-cube" style="font-size: 10px;"></i> ${escapeHtml(productName)}</span>`;
}

// Product-wise Performance Table
    const prodTbody = document.getElementById("detail-products-tbody");
    if (prodTbody) {
        prodTbody.innerHTML = "";
        if (products.length === 0) {
            prodTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:#64748b;">No products assigned to this partner.</td></tr>`;
        } else {
            products.forEach(p => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid #f1f5f9";

                const prodBadge = getProductBadgeHtml(p.productName);

                tr.innerHTML = `
                    <td style="padding: 14px 16px; text-align: left;">${prodBadge}</td>
                    <td style="padding: 14px 16px; font-weight: 700; color: #0f172a;">${(p.views || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 14px 16px; font-weight: 700; color: #0f172a;">${(p.logins || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 14px 16px; font-weight: 700; color: #0f172a;">${(p.leads || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 14px 16px; font-weight: 800; color: ${p.sales > 0 ? '#16a34a' : '#0f172a'};">${(p.sales || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 14px 16px; font-weight: 800; color: #0f172a;">₹${(p.revenue || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 14px 16px; font-weight: 700; color: ${p.returned > 0 ? '#f97316' : '#64748b'};">${(p.returned || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 14px 16px; font-weight: 700; color: ${p.cancelled > 0 ? '#ef4444' : '#64748b'};">${(p.cancelled || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 14px 16px;">
                        <span style="background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 11px; border: 1px solid #bfdbfe;">${p.conversionRate || 0}%</span>
                    </td>
                `;
                prodTbody.appendChild(tr);
            });
        }
    }

    // Recent Activity Table
    const actTbody = document.getElementById("detail-activity-tbody");
    actTbody.innerHTML = "";

    if (activities.length === 0) {
        actTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">No activity recorded for this partner yet.</td></tr>`;
    } else {
        activities.forEach(act => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #f1f5f9";

            const dateVal = act.date;
            const dateStr = dateVal ? new Date(dateVal).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
            const actionBadge = getStatusBadgeHtml(act.action);

            tr.innerHTML = `
                <td style="padding: 12px 16px; color: #64748b; font-size: 12px;">${dateStr}</td>
                <td style="padding: 12px 16px; font-weight: 700; color: #0f172a;"><i class="fas fa-cube" style="color:var(--uwo-accent); font-size:10px; margin-right:6px;"></i>${escapeHtml(act.productName || 'General')}</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #334155;">${escapeHtml(act.visitor || 'Visitor')}</td>
                <td style="padding: 12px 16px;">${actionBadge}</td>
                <td style="padding: 12px 16px; font-weight: 800; color: #0f172a;">${act.amount || '—'}</td>
                <td style="padding: 12px 16px;">${actionBadge}</td>
            `;
            actTbody.appendChild(tr);
        });
    }
}

// Helper: Copy Link
function copyDetailProductLink(inputId, toastId) {
    const input = document.getElementById(inputId);
    const toast = document.getElementById(toastId);
    if (!input) return;

    input.select();
    navigator.clipboard.writeText(input.value);

    if (toast) {
        toast.style.display = "block";
        setTimeout(() => { toast.style.display = "none"; }, 3000);
    }
}

// Quick Actions Callbacks
function editPartnerFromDetail() {
    if (activeDetailPartnerId) {
        closePartnerDetailModal();
        openPartnerModal(activeDetailPartnerId);
    }
}

function assignProductsFromDetail() {
    if (activeDetailPartnerId) {
        closePartnerDetailModal();
        openManageProductsModal(activeDetailPartnerId);
    }
}

function resetPasswordFromDetail() {
    if (activeDetailPartnerId) {
        openPartnerResetPasswordModal(activeDetailPartnerId);
    }
}

function toggleStatusFromDetail() {
    if (currentDetailPartnerData && currentDetailPartnerData.partner) {
        const p = currentDetailPartnerData.partner;
        togglePartnerStatus(p.id || activeDetailPartnerId, p.status);
        setTimeout(() => {
            viewPartnerDetails(activeDetailPartnerId);
        }, 500);
    }
}

function deletePartnerFromDetail() {
    if (activeDetailPartnerId) {
        closePartnerDetailModal();
        openPartnerDeleteModal(activeDetailPartnerId);
    }
}

function sendEmailToPartner() {
    if (currentDetailPartnerData && currentDetailPartnerData.partner && currentDetailPartnerData.partner.email) {
        window.location.href = `mailto:${currentDetailPartnerData.partner.email}?subject=UWO Affiliate Partner Inquiry`;
    }
}

function exportPartnerDetailCSV() {
    if (!currentDetailPartnerData) return;
    const p = currentDetailPartnerData.partner || {};
    const stats = currentDetailPartnerData.stats || {};
    const products = currentDetailPartnerData.products || [];
    const activities = currentDetailPartnerData.recentActivity || [];

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Partner Name,${p.name || ''}\n`;
    csvContent += `Affiliate Code,${p.affiliateCode || ''}\n`;
    csvContent += `Email,${p.email || ''}\n`;
    csvContent += `Phone,${p.phone || ''}\n`;
    csvContent += `Status,${p.status || ''}\n\n`;

    csvContent += "Metric,Value\n";
    csvContent += `Total Views,${stats.totalViews || 0}\n`;
    csvContent += `Total Leads,${stats.totalLeads || 0}\n`;
    csvContent += `Total Sales,${stats.totalSales || 0}\n`;
    csvContent += `Revenue,INR ${stats.revenue || 0}\n`;
    csvContent += `Returned,${stats.returned || 0}\n`;
    csvContent += `Cancelled,${stats.cancelled || 0}\n`;
    csvContent += `Conversion Rate,${stats.conversionRate || 0}%\n\n`;

    csvContent += "Product-wise Performance\n";
    csvContent += "Product,Affiliate Link,Views,Sales,Revenue,Conversion Rate\n";
    products.forEach(prod => {
        csvContent += `"${prod.productName}","${prod.affiliateUrl}",${prod.views || 0},${prod.sales || 0},${prod.revenue || 0},${prod.conversionRate || 0}%\n`;
    });

    if (activities.length > 0) {
        csvContent += "\nRecent Partner Activity\n";
        csvContent += "Date & Time,Product,Visitor,Action,Amount,Status\n";
        activities.forEach(a => {
            csvContent += `"${a.date || ''}","${a.productName || ''}","${a.visitor || ''}","${a.action || ''}","${a.amount || ''}","${a.status || ''}"\n`;
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `affiliate_report_${p.affiliateCode || 'partner'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function openPartnerModal(partnerId = '') {
    const modal = document.getElementById("partnerModal");
    const title = document.getElementById("partnerModalTitle");
    const pwdContainer = document.getElementById("partner-password-container");
    
    // Reset Form
    document.getElementById("edit-partner-id").value = partnerId;
    document.getElementById("partner-name").value = "";
    document.getElementById("partner-email").value = "";
    document.getElementById("partner-phone").value = "";
    document.getElementById("partner-company").value = "";
    document.getElementById("partner-password").value = "";

    if (partnerId) {
        // Edit Mode
        title.innerText = "Edit Sales Partner";
        pwdContainer.style.display = "none";
        
        const partner = allPartners.find(p => p._id === partnerId);
        if (partner) {
            document.getElementById("partner-name").value = partner.name;
            document.getElementById("partner-email").value = partner.email;
            document.getElementById("partner-phone").value = partner.phone;
            document.getElementById("partner-company").value = partner.company || "";
        }
    } else {
        // Create Mode
        title.innerText = "Create Sales Partner";
        pwdContainer.style.display = "block";
    }

    modal.style.display = "flex";
}

function closePartnerModal() {
    document.getElementById("partnerModal").style.display = "none";
}

async function savePartner() {
    const token = localStorage.getItem("uwo_token");
    const partnerId = document.getElementById("edit-partner-id").value;
    const name = document.getElementById("partner-name").value.trim();
    const email = document.getElementById("partner-email").value.trim();
    const phone = document.getElementById("partner-phone").value.trim();
    const company = document.getElementById("partner-company").value.trim();
    const password = document.getElementById("partner-password").value;

    if (!name || !email || !phone) {
        showTeamToast("Name, email, and phone are required", "error");
        return;
    }

    if (!partnerId && !password) {
        showTeamToast("Password is required for new partner", "error");
        return;
    }

    const payload = { name, email, phone, company };
    if (!partnerId) {
        payload.password = password;
    }

    const btn = document.getElementById("btn-save-partner");
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "<i class='fas fa-circle-notch fa-spin'></i> Saving...";

    try {
        const url = partnerId 
            ? `${API_URL}/affiliate/admin/partners/${partnerId}` 
            : `${API_URL}/affiliate/admin/partners`;
            
        const method = partnerId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Authorization": token,
                "Content-Type": "application/json",
                "Origin": window.location.origin
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showTeamToast(partnerId ? "Sales partner updated successfully!" : "Sales partner created successfully!", "success");
            closePartnerModal();
            fetchSalesPartners();
        } else {
            showTeamToast(data.message || "Failed to save sales partner", "error");
        }
    } catch (err) {
        console.error("Save partner error:", err);
        showTeamToast("Connection error while saving partner", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function togglePartnerStatus(partnerId, currentStatus) {
    const token = localStorage.getItem("uwo_token");
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';

    try {
        const response = await fetch(`${API_URL}/affiliate/admin/partners/${partnerId}`, {
            method: "PUT",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showTeamToast(`Sales partner ${newStatus === 'active' ? 'activated' : 'disabled'} successfully`, "success");
            fetchSalesPartners();
        } else {
            showTeamToast("Failed to update status", "error");
        }
    } catch (err) {
        console.error("Toggle partner error:", err);
        showTeamToast("Error communicating with server", "error");
    }
}

function openPartnerResetPasswordModal(partnerId) {
    document.getElementById("reset-partner-password-id").value = partnerId;
    document.getElementById("partner-new-password").value = "";
    document.getElementById("partnerResetPasswordModal").style.display = "flex";
}

function closePartnerResetPasswordModal() {
    document.getElementById("partnerResetPasswordModal").style.display = "none";
}

async function confirmResetPartnerPassword() {
    const token = localStorage.getItem("uwo_token");
    const partnerId = document.getElementById("reset-partner-password-id").value;
    const password = document.getElementById("partner-new-password").value;

    if (!password) {
        showTeamToast("Please enter a new password", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/affiliate/admin/partners/${partnerId}/reset-password`, {
            method: "PUT",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            showTeamToast("Partner password reset successful!", "success");
            closePartnerResetPasswordModal();
        } else {
            const data = await response.json();
            showTeamToast(data.message || "Failed to reset password", "error");
        }
    } catch (err) {
        console.error("Reset password error:", err);
        showTeamToast("Error communicating with server", "error");
    }
}

function openPartnerDeleteModal(partnerId) {
    document.getElementById("delete-partner-id").value = partnerId;
    document.getElementById("partnerDeleteModal").style.display = "flex";
}

function closePartnerDeleteModal() {
    document.getElementById("partnerDeleteModal").style.display = "none";
}

async function confirmDeletePartner() {
    const token = localStorage.getItem("uwo_token");
    const partnerId = document.getElementById("delete-partner-id").value;

    try {
        const response = await fetch(`${API_URL}/affiliate/admin/partners/${partnerId}`, {
            method: "DELETE",
            headers: { "Authorization": token }
        });

        if (response.ok) {
            showTeamToast("Sales partner deleted successfully", "success");
            closePartnerDeleteModal();
            fetchSalesPartners();
        } else {
            showTeamToast("Failed to delete sales partner", "error");
        }
    } catch (err) {
        console.error("Delete partner error:", err);
        showTeamToast("Error communicating with server", "error");
    }
}

function switchSalesSubTab(sub) {
    currentSalesSubTab = sub;
    
    const btnPartners = document.getElementById("btn-sales-partners-sub");
    const btnRequests = document.getElementById("btn-sales-requests-sub");
    const viewPartners = document.getElementById("sales-partners-view");
    const viewRequests = document.getElementById("sales-requests-view");
    const viewDetails = document.getElementById("partner-details-view");

    if (viewDetails) viewDetails.style.display = "none";

    // Reset styles
    [btnPartners, btnRequests].forEach(btn => {
        if (btn) {
            btn.style.background = "#f1f5f9";
            btn.style.color = "#000";
            btn.style.boxShadow = "none";
        }
    });

    [viewPartners, viewRequests].forEach(view => {
        if (view) view.style.display = "none";
    });

    if (sub === 'partners') {
        if (btnPartners) {
            btnPartners.style.background = "";
            btnPartners.style.color = "";
            btnPartners.style.boxShadow = "";
        }
        if (viewPartners) viewPartners.style.display = "block";
        fetchSalesPartners();
    } else {
        if (btnRequests) {
            btnRequests.style.background = "";
            btnRequests.style.color = "";
            btnRequests.style.boxShadow = "";
        }
        if (viewRequests) viewRequests.style.display = "block";
        fetchPendingRequests();
    }
}

async function fetchPendingRequestsCount() {
    const token = localStorage.getItem("uwo_token");
    try {
        const response = await fetch(`${API_URL}/affiliate/admin/pending-requests`, {
            headers: { "Authorization": token }
        });
        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById("requests-badge");
            if (badge) {
                badge.innerText = data.length;
                badge.style.display = data.length > 0 ? "inline-block" : "none";
            }
        }
    } catch (err) {
        console.error("Error fetching requests count:", err);
    }
}

async function fetchPendingRequests() {
    const token = localStorage.getItem("uwo_token");
    const tbody = document.getElementById("requests-tbody");
    
    try {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:30px;'>Loading pending requests...</td></tr>";
        
        const response = await fetch(`${API_URL}/affiliate/admin/pending-requests`, {
            headers: { "Authorization": token }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        window.allPendingRequests = data;
        tbody.innerHTML = "";

        // Update badge
        const badge = document.getElementById("requests-badge");
        if (badge) {
            badge.innerText = data.length;
            badge.style.display = data.length > 0 ? "inline-block" : "none";
        }

        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:40px; color:#64748b;'>No pending registration requests found.</td></tr>";
            return;
        }

        data.forEach(req => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #f1f5f9";
            
            const nameEscaped = escapeHtml(req.name);
            const emailEscaped = escapeHtml(req.email);
            const phoneEscaped = escapeHtml(req.phone);
            const companyEscaped = escapeHtml(req.company || 'N/A');
            const cityEscaped = escapeHtml(req.city || 'N/A');
            const dateStr = new Date(req.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            tr.innerHTML = `
                <td style="padding:14px 16px; font-weight:700; color:#0f172a;">${nameEscaped}</td>
                <td style="padding:14px 16px; color:#475569;">
                    <div>${emailEscaped}</div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${phoneEscaped}</div>
                </td>
                <td style="padding:14px 16px; color:#475569;">
                    <div>${companyEscaped}</div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:2px;">City: ${cityEscaped}</div>
                </td>
                <td style="padding:14px 16px; text-align:center; color:#64748b;">${dateStr}</td>
                <td style="padding:14px 16px; text-align:center;">
                    <div style="display:flex; justify-content:center; gap:8px;">
                        <button onclick="approveRequest('${req._id}')" class="btn-action" title="Approve Request" style="background:#ecfdf5; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; color:#10b981; font-weight:700; display:flex; align-items:center; gap:5px;"><i class="fas fa-check"></i> Approve</button>
                        <button onclick="rejectRequest('${req._id}')" class="btn-action" title="Reject Request" style="background:#fef2f2; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; color:#ef4444; font-weight:700; display:flex; align-items:center; gap:5px;"><i class="fas fa-times"></i> Reject</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading pending requests:", err);
        showTeamToast("Failed to load registration requests", "error");
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:30px; color:#ef4444;'>Failed to load requests.</td></tr>";
    }
}

async function approveRequest(id) {
    const req = (window.allPendingRequests || []).find(r => r._id === id);
    if (!req) return;
    openPartnerAssignmentModal(req, 'approve');
}

async function rejectRequest(id) {
    const token = localStorage.getItem("uwo_token");
    try {
        const response = await fetch(`${API_URL}/affiliate/admin/reject-request/${id}`, {
            method: "POST",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            showTeamToast("Registration request rejected successfully.", "success");
            fetchPendingRequests();
        } else {
            showTeamToast(data.message || "Rejection failed", "error");
        }
    } catch (err) {
        console.error("Reject error:", err);
        showTeamToast("Error communicating with server", "error");
    }
}

let adminFilter = 'alltime';
let adminStartDate = '';
let adminEndDate = '';
let adminTrendChartInstance = null;
let adminAnalyticsData = null;
let currentSalesSubTab = 'partners';

async function fetchSalesAnalytics() {
    const token = localStorage.getItem("uwo_token");
    
    try {
        let queryUrl = `${API_URL}/affiliate/admin/analytics?filter=${adminFilter}`;
        if (adminFilter === 'custom' && adminStartDate && adminEndDate) {
            queryUrl += `&startDate=${adminStartDate}&endDate=${adminEndDate}`;
        }

        const response = await fetch(queryUrl, {
            headers: { "Authorization": token }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        adminAnalyticsData = data;

        // Populate overall stats
        let totalClicks = 0;
        let totalVisits = 0;
        let totalOrders = 0;
        let totalRevenue = 0;

        data.partners.forEach(p => {
            totalClicks += p.clicks;
            totalVisits += p.visits;
            totalOrders += p.sales;
            totalRevenue += p.revenue;
        });

        const conversionRate = totalClicks > 0 ? Number(((totalOrders / totalClicks) * 100).toFixed(2)) : 0;

        document.getElementById("admin-total-clicks").innerText = totalClicks.toLocaleString('en-IN');
        document.getElementById("admin-total-visits").innerText = totalVisits.toLocaleString('en-IN');
        document.getElementById("admin-avg-conversion").innerText = `${conversionRate}%`;
        document.getElementById("admin-total-orders").innerText = totalOrders.toLocaleString('en-IN');
        document.getElementById("admin-total-revenue").innerText = `₹${totalRevenue.toLocaleString('en-IN')}`;

        // Render Top Products
        const productsTbody = document.getElementById("admin-top-products-tbody");
        if (productsTbody) {
            productsTbody.innerHTML = "";
            if (data.products.length === 0) {
                productsTbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:15px; color:#64748b;'>No product performance stats found.</td></tr>";
            } else {
                data.products.forEach(p => {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #e2e8f0";
                    tr.innerHTML = `
                        <td style="padding:10px; font-weight:700;">${escapeHtml(p.name)}</td>
                        <td style="padding:10px; text-align:center;">${p.clicks.toLocaleString('en-IN')}</td>
                        <td style="padding:10px; text-align:center;">${p.sales.toLocaleString('en-IN')}</td>
                        <td style="padding:10px; text-align:right; font-weight:600;">₹${p.revenue.toLocaleString('en-IN')}</td>
                    `;
                    productsTbody.appendChild(tr);
                });
            }
        }

        // Render Top Landing Pages & Detailed Landing Page Analytics
        const landingTbody = document.getElementById("admin-landing-analytics-tbody");
        const topPagesTbody = document.getElementById("admin-top-pages-tbody");
        
        if (landingTbody) {
            landingTbody.innerHTML = "";
            if (!data.landingPages || data.landingPages.length === 0) {
                landingTbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:15px; color:#64748b;'>No landing page stats recorded yet.</td></tr>";
            } else {
                data.landingPages.forEach(p => {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #e2e8f0";
                    tr.innerHTML = `
                        <td style="padding:12px 10px; font-family:monospace; font-size:12px;">${escapeHtml(p.landingPage)}</td>
                        <td style="padding:12px 10px; text-align:center;">${p.uniqueVisitors.toLocaleString('en-IN')}</td>
                        <td style="padding:12px 10px; text-align:center;">${p.bounceRate}%</td>
                        <td style="padding:12px 10px; text-align:center;">${p.avgSessionTime}s</td>
                        <td style="padding:12px 10px; text-align:center; font-weight:700; color:#10b981;">${p.conversions}</td>
                    `;
                    landingTbody.appendChild(tr);
                });
            }
        }

        if (topPagesTbody) {
            topPagesTbody.innerHTML = "";
            if (!data.landingPages || data.landingPages.length === 0) {
                topPagesTbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:15px; color:#64748b;'>No pages stats found.</td></tr>";
            } else {
                const sortedPages = [...data.landingPages].sort((a,b) => b.visits - a.visits).slice(0, 5);
                sortedPages.forEach(p => {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #e2e8f0";
                    tr.innerHTML = `
                        <td style="padding:10px; font-family:monospace; font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(p.landingPage)}">${escapeHtml(p.landingPage)}</td>
                        <td style="padding:10px; text-align:center;">${p.visits.toLocaleString('en-IN')}</td>
                        <td style="padding:10px; text-align:center; font-weight:700; color:#10b981;">${p.conversions}</td>
                        <td style="padding:10px; text-align:right;">${p.bounceRate}% BR</td>
                    `;
                    topPagesTbody.appendChild(tr);
                });
            }
        }

        // Render Trend Chart
        renderAdminTrendChart(data.trends);

    } catch (err) {
        console.error("Error loading analytics:", err);
        showTeamToast("Failed to load performance analytics", "error");
    }
}

function renderAdminTrendChart(trends) {
    if (adminTrendChartInstance) {
        adminTrendChartInstance.destroy();
    }

    const canvas = document.getElementById("adminTrendChart");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const labels = trends.map(t => t.date);
    const clicksData = trends.map(t => t.uniqueClicks);
    const visitsData = trends.map(t => t.totalVisits);
    const revenueData = trends.map(t => t.revenue);

    adminTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Unique Clicks',
                    data: clicksData,
                    borderColor: '#D6A559',
                    backgroundColor: 'rgba(214, 165, 89, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Total Visits',
                    data: visitsData,
                    borderColor: '#162377',
                    backgroundColor: 'rgba(22, 35, 119, 0.05)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    tension: 0.2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { color: '#64748b' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        color: '#10b981',
                        callback: function(val) { return '₹' + val.toLocaleString('en-IN'); }
                    }
                },
                x: {
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

function handleAdminFilterChange() {
    const val = document.getElementById("admin-analytics-filter").value;
    adminFilter = val;
    if (val === 'custom') {
        document.getElementById("admin-custom-date-container").style.display = "flex";
    } else {
        document.getElementById("admin-custom-date-container").style.display = "none";
        fetchSalesAnalytics();
    }
}

function applyAdminCustomFilter() {
    const start = document.getElementById("admin-start-date").value;
    const end = document.getElementById("admin-end-date").value;
    if (!start || !end) {
        alert("Please select both start and end dates.");
        return;
    }
    adminStartDate = start;
    adminEndDate = end;
    fetchSalesAnalytics();
}

function exportAdminCSV() {
    if (!adminAnalyticsData) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "Admin Affiliate Analytics Report\n";
    csvContent += `Filter,${adminFilter}\n`;
    if (adminFilter === 'custom') {
        csvContent += `Range,${adminStartDate} to ${adminEndDate}\n`;
    }
    csvContent += "\nSales Partner Performance\n";
    csvContent += "Partner,Affiliate Code,Status,Unique Clicks,Total Visits,Returning Visitors,Leads,Orders,Revenue,Commission,Conversion Rate\n";
    
    adminAnalyticsData.partners.forEach(p => {
        csvContent += `"${p.name}",${p.affiliateCode},${p.status},${p.clicks},${p.visits},${p.returningVisitors},${p.leads},${p.sales},${p.revenue},${p.commission},${p.conversionRate}%\n`;
    });

    csvContent += "\nProduct-wise Performance\n";
    csvContent += "Product,Unique Clicks,Total Visits,Leads,Orders,Revenue,Conversion Rate\n";
    adminAnalyticsData.products.forEach(p => {
        csvContent += `"${p.name}",${p.clicks},${p.visits},${p.leads},${p.sales},${p.revenue},${p.conversionRate}%\n`;
    });

    csvContent += "\nLanding Page Performance\n";
    csvContent += "Landing URL,Unique Visitors,Bounce Rate,Average Session Time,Conversions\n";
    adminAnalyticsData.landingPages.forEach(p => {
        csvContent += `"${p.landingPage}",${p.uniqueVisitors},${p.bounceRate}%,${p.avgSessionTime}s,${p.conversions}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_affiliate_report_${adminFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportAdminPDF() {
    window.print();
}

function startAdminPolling() {
    setInterval(() => {
        const tabSales = document.getElementById("tab-sales-settings");
        if (tabSales && tabSales.style.display !== "none") {
            if (currentSalesSubTab === 'partners') {
                fetchSalesPartners();
            } else if (currentSalesSubTab === 'analytics') {
                fetchSalesAnalytics();
            }
        }
    }, 30000);
}

// ✅ CLOSE PARTNER DETAILS VIEW
function closePartnerDetails() {
    document.getElementById("partner-details-view").style.display = "none";
    document.getElementById("sales-partners-view").style.display = "block";
}

// ✅ DYNAMIC PRODUCT MANAGEMENT FUNCTIONS

async function fetchProducts() {
    const token = localStorage.getItem("uwo_token");
    const tbody = document.getElementById("products-tbody");
    if (!tbody) return;

    try {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:20px;'>Loading products...</td></tr>";

        const response = await fetch(`${API_URL}/affiliate/admin/products`, {
            headers: { "Authorization": token }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const products = await response.json();
        renderProductsList(products);
    } catch (err) {
        console.error("Fetch products error:", err);
        showTeamToast("Failed to load products", "error");
    }
}

function renderProductsList(products) {
    const tbody = document.getElementById("products-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (products.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:30px; color:#64748b;'>No products created yet. Click '+ Add Product' to start.</td></tr>";
        return;
    }

    products.forEach(p => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #e2e8f0";
        tr.style.background = "#fff";

        const statusBadge = p.status === 'active'
            ? '<span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:50px; font-size:11px; font-weight:700; text-transform:uppercase;">Active</span>'
            : '<span style="background:#fee2e2; color:#b91c1c; padding:4px 10px; border-radius:50px; font-size:11px; font-weight:700; text-transform:uppercase;">Inactive</span>';

        const createdDate = new Date(p.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const toggleBtnLabel = p.status === 'active' ? 'Disable' : 'Enable';
        const toggleBtnIcon = p.status === 'active' ? 'fa-ban' : 'fa-check';
        const toggleColor = p.status === 'active' ? '#ef4444' : '#10b981';

        tr.innerHTML = `
            <td style="padding:14px 16px; font-weight:700; color:#0f172a;">${escapeHtml(p.name)}</td>
            <td style="padding:14px 16px; color:#475569; font-family:monospace; font-weight:600;">${escapeHtml(p.slug)}</td>
            <td style="padding:14px 16px; color:#3b82f6;"><a href="${escapeHtml(p.landingUrl)}" target="_blank" style="color:#2563eb; text-decoration:none;">${escapeHtml(p.landingUrl)}</a></td>
            <td style="padding:14px 16px; text-align:center;">${statusBadge}</td>
            <td style="padding:14px 16px; color:#64748b;">${createdDate}</td>
            <td style="padding:14px 16px; text-align:center;">
                <div style="display:flex; justify-content:center; gap:8px;">
                    <button onclick="openProductModal('${p._id}')" class="btn-action" title="Edit Product" style="background:#f1f5f9; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas fa-edit" style="color:#475569;"></i></button>
                    <button onclick="toggleProductStatus('${p._id}', '${p.status}')" class="btn-action" title="${toggleBtnLabel} Product" style="background:${p.status === 'active' ? '#fef2f2' : '#ecfdf5'}; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas ${toggleBtnIcon}" style="color:${toggleColor};"></i></button>
                    <button onclick="deleteProduct('${p._id}')" class="btn-action" title="Delete Product" style="background:#fef2f2; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fas fa-trash-alt" style="color:#ef4444;"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openProductModal(productId = '') {
    const modal = document.getElementById("productModal");
    const title = document.getElementById("productModalTitle");
    if (!modal) return;

    // Reset fields
    document.getElementById("product-id").value = productId;
    document.getElementById("product-name").value = "";
    document.getElementById("product-slug").value = "";
    document.getElementById("product-landing-url").value = "";
    document.getElementById("product-description").value = "";
    document.getElementById("product-status").value = "active";
    document.getElementById("product-icon").value = "";

    if (productId) {
        title.innerHTML = '<i class="fas fa-edit" style="color:var(--uwo-accent);"></i> Edit Product';
        // Fetch product details
        const token = localStorage.getItem("uwo_token");
        fetch(`${API_URL}/affiliate/admin/products`, {
            headers: { "Authorization": token }
        })
        .then(res => res.json())
        .then(products => {
            const p = products.find(prod => prod._id === productId);
            if (p) {
                document.getElementById("product-name").value = p.name;
                document.getElementById("product-slug").value = p.slug;
                document.getElementById("product-landing-url").value = p.landingUrl;
                document.getElementById("product-description").value = p.description || "";
                document.getElementById("product-status").value = p.status;
                document.getElementById("product-icon").value = p.icon || "";
            }
        });
    } else {
        title.innerHTML = '<i class="fas fa-plus" style="color:var(--uwo-accent);"></i> Add Product';
    }

    modal.style.display = "flex";
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.style.display = "none";
}

async function saveProduct() {
    const token = localStorage.getItem("uwo_token");
    const id = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value.trim();
    const slug = document.getElementById("product-slug").value.trim();
    const landingUrl = document.getElementById("product-landing-url").value.trim();
    const description = document.getElementById("product-description").value.trim();
    const status = document.getElementById("product-status").value;
    const icon = document.getElementById("product-icon").value.trim();

    if (!name || !slug || !landingUrl) {
        showTeamToast("Name, Slug, and Landing URL are required", "error");
        return;
    }

    const payload = { name, slug, landingUrl, description, status, icon };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/affiliate/admin/products/${id}` : `${API_URL}/affiliate/admin/products`;

    const saveBtn = document.getElementById("btn-save-product");
    if (saveBtn) saveBtn.disabled = true;

    try {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.status === 200 || res.status === 201) {
            showTeamToast(data.message || "Product saved successfully", "success");
            closeProductModal();
            fetchProducts();
        } else {
            showTeamToast(data.message || "Failed to save product", "error");
        }
    } catch (err) {
        console.error("Save product error:", err);
        showTeamToast("Server error during save", "error");
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

async function toggleProductStatus(productId, currentStatus) {
    const token = localStorage.getItem("uwo_token");
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
        const res = await fetch(`${API_URL}/affiliate/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (res.status === 200) {
            showTeamToast(`Product status set to ${newStatus}`, "success");
            fetchProducts();
        } else {
            showTeamToast(data.message || "Failed to toggle status", "error");
        }
    } catch (err) {
        console.error("Toggle status error:", err);
        showTeamToast("Server communication error", "error");
    }
}

async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
        return;
    }

    const token = localStorage.getItem("uwo_token");
    try {
        const res = await fetch(`${API_URL}/affiliate/admin/products/${productId}`, {
            method: 'DELETE',
            headers: { "Authorization": token }
        });

        const data = await res.json();
        if (res.status === 200) {
            showTeamToast("Product deleted successfully", "success");
            fetchProducts();
        } else {
            showTeamToast(data.message || "Failed to delete product", "error");
        }
    } catch (err) {
        console.error("Delete product error:", err);
        showTeamToast("Server communication error", "error");
    }
}

function autoGenerateSlug() {
    const nameInput = document.getElementById("product-name");
    const slugInput = document.getElementById("product-slug");
    const idInput = document.getElementById("product-id");
    
    // Only auto-generate slug for new products, not during edit
    if (idInput && idInput.value) return;

    if (nameInput && slugInput) {
        slugInput.value = nameInput.value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // remove special chars
            .replace(/\s+/g, '-');        // replace spaces with hyphens
    }
}

// Bind to window scope so inline html event triggers work
window.viewPartnerDetails = viewPartnerDetails;
window.closePartnerDetails = closePartnerDetails;
window.fetchProducts = fetchProducts;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.toggleProductStatus = toggleProductStatus;
window.deleteProduct = deleteProduct;
window.autoGenerateSlug = autoGenerateSlug;

// ==========================================
// 🤝 UWO™ ADMIN PRODUCT ASSIGNMENT CONTROLLER
// ==========================================

let assignmentProducts = []; // Global list of products in the modal

async function openPartnerAssignmentModal(partnerData, mode) {
    console.log("openPartnerAssignmentModal called, mode:", mode, "partnerData:", partnerData);
    const modal = document.getElementById("partnerAssignmentModal");
    console.log("Found modal element:", modal);
    const title = document.getElementById("assignmentModalTitle");
    const subtitle = document.getElementById("assignmentModalSubtitle");
    const saveBtn = document.getElementById("btn-save-assignment");
    const partnerIdInput = document.getElementById("assignment-partner-id");
    const modeInput = document.getElementById("assignment-mode");
    const detailsSection = document.getElementById("assignment-partner-details-section");
    const searchInput = document.getElementById("assignment-product-search");
    
    if (searchInput) searchInput.value = "";
    if (partnerIdInput) partnerIdInput.value = partnerData._id;
    if (modeInput) modeInput.value = mode;

    if (mode === 'approve') {
        if (title) title.innerText = "Approve Sales Partner";
        if (subtitle) subtitle.innerText = "Assign products, commissions, and access permissions for approval.";
        if (saveBtn) saveBtn.innerText = "Approve Partner";
        if (detailsSection) detailsSection.style.display = "grid";
        
        const detailsName = document.getElementById("assign-details-name");
        const detailsEmail = document.getElementById("assign-details-email");
        const detailsPhone = document.getElementById("assign-details-phone");
        const detailsCompany = document.getElementById("assign-details-company");
        const detailsCity = document.getElementById("assign-details-city");
        const detailsDate = document.getElementById("assign-details-date");
        
        if (detailsName) detailsName.innerText = partnerData.name;
        if (detailsEmail) detailsEmail.innerText = partnerData.email;
        if (detailsPhone) detailsPhone.innerText = partnerData.phone;
        if (detailsCompany) detailsCompany.innerText = partnerData.company || 'N/A';
        if (detailsCity) detailsCity.innerText = partnerData.city || 'N/A';
        if (detailsDate) detailsDate.innerText = new Date(partnerData.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Set default permissions
        const pLink = document.getElementById("perm-generate-link");
        const pAnalytics = document.getElementById("perm-view-analytics");
        const pReports = document.getElementById("perm-download-reports");
        const pWithdraw = document.getElementById("perm-withdraw-earnings");
        
        if (pLink) pLink.checked = true;
        if (pAnalytics) pAnalytics.checked = true;
        if (pReports) pReports.checked = true;
        if (pWithdraw) pWithdraw.checked = true;

        // Fetch all products
        await fetchAssignmentProductsData(partnerData._id, true);
    } else {
        if (title) title.innerText = "Manage Assigned Products";
        if (subtitle) subtitle.innerText = "Configure product access, custom commissions, and permissions for this partner.";
        if (saveBtn) saveBtn.innerText = "Save Changes";
        if (detailsSection) detailsSection.style.display = "none";

        // Fetch assigned products and permissions from backend
        await fetchAssignmentProductsData(partnerData._id, false);
    }

    if (modal) modal.style.display = "flex";
}

async function fetchAssignmentProductsData(partnerId, isNewApproval) {
    console.log("fetchAssignmentProductsData called, partnerId:", partnerId, "isNewApproval:", isNewApproval);
    const token = localStorage.getItem("uwo_token");
    console.log("Token in localStorage:", token);
    const tbody = document.getElementById("assignment-products-tbody");
    console.log("Found tbody element:", tbody);
    if (tbody) tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px;'>Loading products...</td></tr>";

    try {
        if (isNewApproval) {
            // Fetch all active products
            const response = await fetch(`${API_URL}/affiliate/admin/products`, {
                headers: { "Authorization": token }
            });
            const products = await response.json();
            
            assignmentProducts = products.map(prod => ({
                productId: prod._id,
                name: prod.name,
                icon: prod.icon || 'fa-cube',
                themeColor: prod.themeColor || '#4F46E5',
                defaultCommission: prod.commissionValue,
                isAssigned: false,
                commission: prod.commissionValue,
                status: 'active'
            }));
        } else {
            // Fetch assigned mapping details
            const response = await fetch(`${API_URL}/affiliate/admin/partners/${partnerId}/assigned-products`, {
                headers: { "Authorization": token }
            });
            const data = await response.json();
            
            // Populate permissions checkboxes
            const perms = data.partner.permissions || {
                allowGenerateLink: true,
                allowViewAnalytics: true,
                allowDownloadReports: true,
                allowWithdrawEarnings: true
            };
            const pLink = document.getElementById("perm-generate-link");
            const pAnalytics = document.getElementById("perm-view-analytics");
            const pReports = document.getElementById("perm-download-reports");
            const pWithdraw = document.getElementById("perm-withdraw-earnings");
            
            if (pLink) pLink.checked = perms.allowGenerateLink !== false;
            if (pAnalytics) pAnalytics.checked = perms.allowViewAnalytics !== false;
            if (pReports) pReports.checked = perms.allowDownloadReports !== false;
            if (pWithdraw) pWithdraw.checked = perms.allowWithdrawEarnings !== false;

            assignmentProducts = data.products;
        }

        renderAssignmentProductsList();
    } catch (err) {
        console.error("Error loading assignment products:", err);
        if (tbody) tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px; color:#ef4444;'>Failed to load products.</td></tr>";
    }
}

function renderAssignmentProductsList() {
    const tbody = document.getElementById("assignment-products-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (assignmentProducts.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px; color:#64748b;'>No products found in DB.</td></tr>";
        return;
    }

    assignmentProducts.forEach(prod => {
        const tr = document.createElement("tr");
        tr.className = "assign-product-row";
        tr.setAttribute("data-product-id", prod.productId);
        tr.style.borderBottom = "1px solid #e2e8f0";

        const isChecked = prod.isAssigned ? "checked" : "";
        const isStatusActive = prod.status === 'active' ? "selected" : "";
        const isStatusDisabled = prod.status === 'disabled' ? "selected" : "";

        tr.innerHTML = `
            <td style="padding: 10px 14px; text-align: center; vertical-align: middle;">
                <input type="checkbox" class="prod-assign-check" ${isChecked} onchange="updateProductAssignmentState('${prod.productId}', this.checked)" style="width: 16px; height: 16px; accent-color: var(--uwo-accent); cursor: pointer;">
            </td>
            <td style="padding: 10px 14px; vertical-align: middle; font-weight: 700; color: #0f172a;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 28px; height: 28px; background: rgba(79,70,229,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${prod.themeColor || '#4F46E5'};">
                        <i class="fas ${prod.icon || 'fa-cube'}"></i>
                    </div>
                    <span>${prod.name}</span>
                </div>
            </td>
            <td style="padding: 10px 14px; vertical-align: middle;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" class="prod-commission-input" value="${prod.commission}" min="0" max="100" style="width: 70px; height: 32px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center; font-weight: 600;" onchange="updateProductCommission('${prod.productId}', this.value)">
                    <span style="font-weight: 700; color: #64748b;">%</span>
                </div>
            </td>
            <td style="padding: 10px 14px; vertical-align: middle; text-align: center;">
                <select class="prod-status-select" style="height: 32px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; font-weight: 600; cursor: pointer;" onchange="updateProductStatusState('${prod.productId}', this.value)">
                    <option value="active" ${isStatusActive}>Active</option>
                    <option value="disabled" ${isStatusDisabled}>Disabled</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateProductAssignmentState(productId, isAssigned) {
    const prod = assignmentProducts.find(p => p.productId === productId);
    if (prod) prod.isAssigned = isAssigned;
}

function updateProductCommission(productId, commission) {
    const prod = assignmentProducts.find(p => p.productId === productId);
    if (prod) prod.commission = parseFloat(commission) || 0;
}

function updateProductStatusState(productId, status) {
    const prod = assignmentProducts.find(p => p.productId === productId);
    if (prod) prod.status = status;
}

function filterAssignmentProducts() {
    const searchInput = document.getElementById("assignment-product-search");
    if (!searchInput) return;
    const query = searchInput.value.trim().toLowerCase();
    const rows = document.querySelectorAll(".assign-product-row");
    
    rows.forEach(row => {
        const prodId = row.getAttribute("data-product-id");
        const prod = assignmentProducts.find(p => p.productId === prodId);
        if (prod) {
            const matches = prod.name.toLowerCase().includes(query);
            row.style.display = matches ? "table-row" : "none";
        }
    });
}

function toggleAllProductsAssignment(checked) {
    const checks = document.querySelectorAll(".prod-assign-check");
    checks.forEach(chk => {
        const row = chk.closest(".assign-product-row");
        if (row && row.style.display !== 'none') {
            chk.checked = checked;
            const prodId = row.getAttribute("data-product-id");
            updateProductAssignmentState(prodId, checked);
        }
    });
}

function closePartnerAssignmentModal() {
    const modal = document.getElementById("partnerAssignmentModal");
    if (modal) modal.style.display = "none";
}

async function openManageProductsModal(partnerId) {
    console.log("openManageProductsModal called with partnerId:", partnerId);
    console.log("allPartners in memory:", allPartners);
    const partner = allPartners.find(p => p._id === partnerId);
    console.log("Found partner:", partner);
    if (partner) {
        openPartnerAssignmentModal(partner, 'edit');
    } else {
        console.warn("Partner not found in allPartners array!");
    }
}

async function savePartnerAssignment() {
    const token = localStorage.getItem("uwo_token");
    const partnerId = document.getElementById("assignment-partner-id").value;
    const mode = document.getElementById("assignment-mode").value;
    
    // Extract assigned products details
    const assigned = assignmentProducts
        .filter(p => p.isAssigned)
        .map(p => ({
            productId: p.productId,
            commission: p.commission,
            status: p.status
        }));

    // Extract permissions checkboxes
    const permissions = {
        allowGenerateLink: document.getElementById("perm-generate-link").checked,
        allowViewAnalytics: document.getElementById("perm-view-analytics").checked,
        allowDownloadReports: document.getElementById("perm-download-reports").checked,
        allowWithdrawEarnings: document.getElementById("perm-withdraw-earnings").checked
    };

    const url = mode === 'approve' 
        ? `${API_URL}/affiliate/admin/approve-request/${partnerId}`
        : `${API_URL}/affiliate/admin/partners/${partnerId}/assigned-products`;
        
    const method = mode === 'approve' ? "POST" : "PUT";
    
    const saveBtn = document.getElementById("btn-save-assignment");
    if (!saveBtn) return;
    const originalText = saveBtn.innerText;
    
    try {
        saveBtn.innerText = "Saving...";
        saveBtn.disabled = true;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                assignedProducts: assigned,
                permissions: permissions
            })
        });

        const resData = await response.json();
        
        if (response.ok) {
            showTeamToast(mode === 'approve' ? "Partner approved successfully!" : "Assigned products updated successfully!", "success");
            closePartnerAssignmentModal();
            if (mode === 'approve') {
                fetchPendingRequests();
            } else {
                fetchSalesPartners();
            }
        } else {
            showTeamToast(resData.message || "Failed to save settings", "error");
        }
    } catch (err) {
        console.error("Save assignment error:", err);
        showTeamToast("Network error saving settings", "error");
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

window.closePartnerAssignmentModal = closePartnerAssignmentModal;
window.savePartnerAssignment = savePartnerAssignment;
window.openManageProductsModal = openManageProductsModal;
window.toggleAllProductsAssignment = toggleAllProductsAssignment;
window.updateProductAssignmentState = updateProductAssignmentState;
window.updateProductCommission = updateProductCommission;
window.updateProductStatusState = updateProductStatusState;
window.filterAssignmentProducts = filterAssignmentProducts;
window.approveRequest = approveRequest;

// ✅ INITIALIZE ON LOAD
function initAdminPortal() {
  showDashboard();

  // Show selected file name
  const fileInput = document.getElementById("rag-file-input");
  const fileNameDisplay = document.getElementById("selected-file-name");

  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        fileNameDisplay.innerHTML = `<i class="fas fa-file-alt"></i> Selected: <b>${fileInput.files[0].name}</b>`;
        fileNameDisplay.style.color = "var(--uwo-accent)";
      } else {
        fileNameDisplay.innerText = "";
      }
    });
  }

  // Start Legal Auto Save timer
  startLegalAutoSave();

  // Start affiliate analytics background polling
  startAdminPolling();

  // Alert on unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedLegalChanges()) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes in your legal page draft. Are you sure you want to leave?';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminPortal);
} else {
  initAdminPortal();
}

// ==========================================
// 🪣 CLOUD STORAGE MANAGER JS
// ==========================================

async function fetchStorageFiles(folderKey) {
  const tbody = document.getElementById('storage-files-tbody');
  if (!tbody) return;

  const folderSelect = document.getElementById('storage-folder-filter');
  const selectedFolder = folderKey || (folderSelect ? folderSelect.value : '');

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Loading GCS bucket assets...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/storage/list?folder=${selectedFolder}`);
    if (!res.ok) throw new Error('Failed to load storage files');
    const data = await res.json();

    const bucketEl = document.getElementById('storage-bucket-name');
    if (bucketEl && data.bucket) bucketEl.textContent = data.bucket;

    if (!data.files || data.files.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">No assets found in this GCS bucket folder.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.files.map(f => {
      const isImage = f.contentType && f.contentType.startsWith('image/');
      const previewHtml = isImage 
        ? `<img src="${f.url}" style="width:44px; height:44px; object-fit:cover; border-radius:8px; border:1px solid #cbd5e1;">`
        : `<div style="width:44px; height:44px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#64748b;"><i class="fas fa-file-alt" style="font-size:20px;"></i></div>`;

      const sizeKb = (f.size / 1024).toFixed(1);

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 16px;">${previewHtml}</td>
          <td style="padding: 12px 16px; font-weight: 700; color: #0f172a;">
            <div>${f.name}</div>
          </td>
          <td style="padding: 12px 16px; color: #64748b; font-size: 12px;">
            <div>${sizeKb} KB</div>
            <div style="font-size:11px; opacity:0.8;">${f.contentType || 'binary'}</div>
          </td>
          <td style="padding: 12px 16px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="text" readonly value="${f.url}" style="font-size:11px; padding:6px 10px; margin-bottom:0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; width:220px;">
              <button onclick="copyToClipboard('${f.url}')" style="background:none; border:none; color:var(--uwo-accent); cursor:pointer; font-size:14px;" title="Copy Public URL"><i class="fas fa-copy"></i></button>
              <a href="${f.url}" target="_blank" style="color:#64748b; font-size:14px;" title="Open in tab"><i class="fas fa-external-link-alt"></i></a>
            </div>
          </td>
          <td style="padding: 12px 16px; text-align: center;">
            <div style="display:flex; justify-content:center; gap:8px;">
              <button onclick="deleteStorageFile('${f.name}')" style="background:#fee2e2; color:#ef4444; border:none; padding:6px 12px; border-radius:8px; font-weight:700; cursor:pointer; font-size:12px;"><i class="fas fa-trash"></i> Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Storage files error:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#ef4444;">Error fetching GCS files: ${err.message}</td></tr>`;
  }
}

async function uploadStorageFile() {
  const fileInput = document.getElementById('storage-file-input');
  const folderSelect = document.getElementById('storage-upload-folder');
  const file = fileInput ? fileInput.files[0] : null;

  if (!file) {
    showTeamToast('Please select a file to upload', 'error');
    return;
  }

  const folderKey = folderSelect ? folderSelect.value : 'TEMP';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folderKey);

  const progressContainer = document.getElementById('storage-upload-progress-container');
  const progressBar = document.getElementById('storage-upload-bar');
  const progressStatus = document.getElementById('storage-upload-status');

  if (progressContainer) progressContainer.style.display = 'block';
  if (progressBar) progressBar.style.width = '40%';
  if (progressStatus) progressStatus.textContent = 'Uploading file to Google Cloud Storage...';

  try {
    const res = await fetch(`${API_URL}/storage/upload`, {
      method: 'POST',
      body: formData
    });

    if (progressBar) progressBar.style.width = '100%';

    if (res.ok) {
      const data = await res.json();
      if (progressStatus) progressStatus.textContent = '✅ Upload Complete!';
      showTeamToast('File uploaded to GCS bucket successfully', 'success');
      if (fileInput) fileInput.value = '';
      setTimeout(() => {
        if (progressContainer) progressContainer.style.display = 'none';
        fetchStorageFiles(folderKey);
      }, 1000);
    } else {
      const data = await res.json();
      if (progressStatus) progressStatus.textContent = '❌ Upload Failed';
      showTeamToast(data.error || 'GCS Upload failed', 'error');
    }
  } catch (err) {
    if (progressStatus) progressStatus.textContent = '❌ Upload Error';
    console.error('Upload storage error:', err);
    showTeamToast(err.message || 'Upload error', 'error');
  }
}

async function deleteStorageFile(objectPath) {
  if (!confirm(`Are you sure you want to delete object "${objectPath}" from GCS Bucket?`)) return;

  try {
    const res = await fetch(`${API_URL}/storage/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: objectPath })
    });

    if (res.ok) {
      showTeamToast('File deleted from GCS bucket', 'success');
      fetchStorageFiles();
    } else {
      showTeamToast('Failed to delete file from GCS', 'error');
    }
  } catch (err) {
    showTeamToast(err.message, 'error');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showTeamToast('Copied GCS URL to clipboard!', 'success');
  }).catch(() => {
    showTeamToast('Failed to copy', 'error');
  });
}



