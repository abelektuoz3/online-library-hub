// ==================== NAVIGATION CONTROLLER ====================
// This controls what links appear in the navbar based on login status

// Detect if we are in the pages/ subdirectory to adjust path references
const isPageSubdir = window.location.pathname.includes("/pages/");
const PATH_PREFIX = isPageSubdir ? "../" : "";

// List of pages that require authentication
const PROTECTED_PAGES = ["profile.html", "dashboard.html"];

// Check if current page requires login
function isCurrentPageProtected() {
  const currentPage = window.location.pathname.split("/").pop();
  return PROTECTED_PAGES.includes(currentPage);
}

// Get current user from localStorage
function getCurrentUser() {
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (user && token) {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Get first name only
function getFirstName(fullName) {
  if (!fullName) return "User";
  return fullName.split(" ")[0];
}

// Render navbar based on authentication state
function renderNavbar() {
  const navLinksContainer = document.getElementById("navLinks");
  if (!navLinksContainer) return;

  const user = getCurrentUser();
  const isLoggedIn = !!user;

  // Define navigation items for both states
  const publicLinks = [
    { name: "Home", href: "index.html", icon: "fas fa-home" },
    { name: "Catalog", href: "catalog.html", icon: "fas fa-search" },
    { name: "Study Tools", href: "study-tools.html", icon: "fas fa-tools" },
    { name: "FAQ", href: "faq.html", icon: "fas fa-question-circle" },
    { name: "Contact", href: "contact.html", icon: "fas fa-envelope" },
    { name: "About", href: "about.html", icon: "fas fa-info-circle" },
    {
      name: "Sign In",
      href: "login.html",
      icon: "fas fa-sign-in-alt",
      special: "btn-outline",
    },
    {
      name: "Join Free",
      href: "register.html",
      icon: "fas fa-user-plus",
      special: "btn-primary",
    },
  ];

  const privateLinks = [
    {
      name: "Dashboard",
      href: "dashboard.html",
      icon: "fas fa-tachometer-alt",
    },
    { name: "Catalog", href: "catalog.html", icon: "fas fa-search" },
    { name: "Study Tools", href: "study-tools.html", icon: "fas fa-tools" },
    { name: "FAQ", href: "faq.html", icon: "fas fa-question-circle" },
    { name: "Contact", href: "contact.html", icon: "fas fa-envelope" },
    { name: "About", href: "about.html", icon: "fas fa-info-circle" },
    {
      name: "Logout",
      href: "#",
      icon: "fas fa-sign-out-alt",
      special: "logout",
    },
  ];

  const linksToRender = isLoggedIn ? privateLinks : publicLinks;

  // Build the HTML
  let navHtml = "";

  linksToRender.forEach((link) => {
    if (link.name === "Logout") {
      navHtml += `
                <li>
                    <a href="#" id="logoutBtn" style="color: #dc2626;">
                        <i class="${link.icon}"></i> ${link.name}
                    </a>
                </li>
            `;
    } else {
      let linkClass = "";
      if (link.special === "btn-outline") linkClass = 'class="btn-nav-outline"';
      if (link.special === "btn-primary") linkClass = 'class="btn-nav-primary"';

      let href;

      // Determine correct path based on current page location
      if (isPageSubdir) {
        if (link.name === "Home") {
          href = "../index.html";
        } else {
          href = link.href;
        }
      } else {
        if (link.name === "Home") {
          href = "index.html";
        } else {
          href = `pages/${link.href}`;
        }
      }

      navHtml += `
                <li>
                    <a href="${href}" ${linkClass}>
                        <i class="${link.icon}"></i> ${link.name}
                    </a>
                </li>
            `;
    }
  });

  navLinksContainer.innerHTML = navHtml;

  // Add logout event listener if logged in
  if (isLoggedIn) {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = isPageSubdir ? "../index.html" : "index.html";
      });
    }
  }

  // Re-attach hamburger menu functionality
  const hamburger = document.getElementById("hamburger");
  if (hamburger) {
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);
    newHamburger.addEventListener("click", function () {
      navLinksContainer.classList.toggle("active");
    });
  }
}

// Helper to escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Get first name helper (exposed globally)
window.getFirstName = function (fullName) {
  if (!fullName) return "User";
  return fullName.split(" ")[0];
};

// ==================== AUTH GUARD ====================
function authGuard() {
  if (!isCurrentPageProtected()) return;

  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token || !user) {
    localStorage.setItem("redirectAfterLogin", window.location.href);
    const loginPath = isPageSubdir ? "login.html" : "pages/login.html";
    window.location.href = loginPath;
    return;
  }

  const API_BASE =
    window.API_BASE || "https://online-library-hub.onrender.com/api";
  fetch(`${API_BASE}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (response) => {
      if (response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const loginPath = isPageSubdir ? "login.html" : "pages/login.html";
        window.location.href = `${loginPath}?suspended=1`;
        return;
      }

      if (!response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const loginPath = isPageSubdir ? "login.html" : "pages/login.html";
        window.location.href = loginPath;
      }
    })
    .catch((err) => {
      console.error("Session verification error:", err);
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  authGuard();
});
