// ========================================================
// 🌐 UWO™ CENTRAL API SERVICE
// ========================================================

export const BACKEND_BASE = typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:8080"
  : "https://uwo-backend-977864306871.asia-south1.run.app";

export const API_URL = `${BACKEND_BASE}/api`;

export const getApiUrl = () => API_URL;

export const REFERRAL_BACKEND = typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000"
  : "https://referrals-api.uwo24.com";

export const DASHBOARD_LOGIN_URL = typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5173/login"
  : "https://referrals.uwo24.com/login";

// Centralized fetch helper with auth header injection
export async function apiRequest(endpoint, options = {}) {
  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('uwo_token') || localStorage.getItem('uwo_partner_token')) : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const errorMsg = (data && (data.message || data.error)) || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// Flagship Projects API
export async function fetchProjects() {
  return await apiRequest('/projects/public');
}

// Blog Posts API
export async function fetchBlogs() {
  return await apiRequest('/blogs');
}

export async function fetchBlogBySlug(slug) {
  return await apiRequest(`/blogs/${slug}`);
}

// Fallback & Resolve image helpers for Blogs
export function getBlogFallbackImage(category = '', title = '') {
  const cat = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (cat.includes('automation') || cat.includes('artificial') || t.includes('automation')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  } else if (cat.includes('tech') || cat.includes('technology') || cat.includes('ai') || t.includes('ai') || t.includes('intelligence')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';
  } else if (cat.includes('commerce') || cat.includes('business') || cat.includes('marketing') || t.includes('brand') || t.includes('commerce')) {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';
  } else if (cat.includes('research') || t.includes('study') || t.includes('research')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';
  }
  return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80';
}

export const CLOUD_RUN_BACKEND = 'https://uwo-backend-977864306871.asia-south1.run.app';

export function resolveBlogImageUrl(blog) {
  if (!blog) return getBlogFallbackImage();
  const img = blog.coverImage || blog.featuredImage || blog.image;
  if (!img) return getBlogFallbackImage(blog.category, blog.title);

  // GCS Private assets must be fetched via Cloud Run media proxy which has valid GCP IAM credentials
  if (img.includes('storage.googleapis.com/uwo-document/')) {
    const objectPath = img.split('storage.googleapis.com/uwo-document/')[1];
    return `${CLOUD_RUN_BACKEND}/api/media/${objectPath.replace(/^\/+/, '')}`;
  }
  if (img.includes('/api/media/')) {
    const mediaPath = img.split('/api/media/')[1];
    return `${CLOUD_RUN_BACKEND}/api/media/${mediaPath.replace(/^\/+/, '')}`;
  }
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
    return img;
  }
  if (img.startsWith('/uploads/')) {
    return `${BACKEND_BASE}${img}`;
  }
  return `${CLOUD_RUN_BACKEND}/api/media/${img.replace(/^\/+/, '')}`;
}

// Contact Form submission
export async function submitContact(formData) {
  return await apiRequest('/contacts', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

// Newsletter Subscription
export async function subscribeNewsletter(email) {
  return await apiRequest('/subscribers', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

// Referral / Earn & Refer submission
export async function submitReferral(payload) {
  try {
    return await apiRequest('/affiliate/referrals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return await apiRequest('/referrals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

// Register user in Referral Portal
export async function registerPortalUser(name, email) {
  try {
    const res = await fetch(`${REFERRAL_BACKEND}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    return await res.json();
  } catch (err) {
    console.warn('[Portal Registration Warning]:', err.message);
    return null;
  }
}
