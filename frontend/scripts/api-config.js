// frontend/scripts/api-config.js
// This file configures the API base URL for all frontend pages

// ============================================
// PRODUCTION (Render) - USE THIS FOR DEPLOYMENT
// ============================================
var API_BASE_URL = "https://online-library-hub.onrender.com/api";
var BACKEND_BASE = "https://online-library-hub.onrender.com";
var UPLOADS_BASE = "https://online-library-hub.onrender.com/uploads";

// ============================================
// DEVELOPMENT (Local) - UNCOMMENT FOR LOCAL TESTING
// ============================================
// var API_BASE_URL = 'http://localhost:5000/api';
// var BACKEND_BASE = 'http://localhost:5000';
// var UPLOADS_BASE = 'http://localhost:5000/uploads';

// Make available globally
window.API_BASE = API_BASE_URL;
window.BACKEND_BASE = BACKEND_BASE;
window.UPLOADS_BASE = UPLOADS_BASE;

console.log("📡 API Base URL:", API_BASE_URL);
console.log("🔗 Backend Base:", BACKEND_BASE);
console.log("📁 Uploads Base URL:", UPLOADS_BASE);