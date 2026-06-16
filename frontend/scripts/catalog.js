// Catalog API — base URL is provided by backend/server.js via /scripts/api-config.js

const API_BASE =
  window.API_BASE || "https://online-library-hub.onrender.com/api";

function getFileUrl(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("/")) {
    const uploadsBase =
      window.UPLOADS_BASE || "https://online-library-hub.onrender.com/uploads";
    return `${uploadsBase}${fileUrl}`;
  }
  const uploadsBase =
    window.UPLOADS_BASE || "https://online-library-hub.onrender.com/uploads";
  return `${uploadsBase}/${fileUrl}`;
}

async function loadCatalog() {
  try {
    const response = await fetch(`${API_BASE}/catalog`);
    const resources = await response.json();
    displayResources(resources);
    return resources;
  } catch (err) {
    console.error("Error loading catalog:", err);
    const container = document.getElementById("catalog-container");
    if (container) {
      container.innerHTML =
        "<p>Error loading resources. Please try again later.</p>";
    }
  }
}

let allResources = [];

function displayResources(resources) {
  const container = document.getElementById("catalog-container");
  if (!container) return;

  if (resources.length === 0) {
    container.innerHTML = "<p>No resources found matching your criteria.</p>";
    return;
  }

  container.innerHTML = resources
    .map(
      (resource) => `
        <div class="resource-card">
            <h3>${escapeHtml(resource.title)}</h3>
            <p class="category">${escapeHtml(resource.category || "General")}</p>
            <p class="grade">${escapeHtml(resource.grade_level || "All grades")}</p>
            <p class="type">${escapeHtml(resource.resource_type || "Resource")}</p>
            <p class="description">${escapeHtml(resource.description || "").substring(0, 100)}...</p>
            <span class="availability ${resource.available ? "available" : "unavailable"}">
                ${resource.available ? "✓ Available" : "✗ Unavailable"}
            </span>
            ${
              resource.file_url ?
                `
                <div class="resource-media" style="margin-top:0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    ${resource.file_type === "video" ? `<video controls style="max-width:100%;max-height:200px; border-radius: 0.5rem;" src="${getFileUrl(resource.file_url)}"></video>` : ""}
                    ${resource.file_type === "audio" ? `<audio controls src="${getFileUrl(resource.file_url)}" style="width: 100%;"></audio>` : ""}
                    ${resource.file_type === "image" ? `<img src="${getFileUrl(resource.file_url)}" style="max-width:100%;max-height:150px; border-radius: 0.5rem;" alt="${escapeHtml(resource.title)}">` : ""}
                    <a href="${getFileUrl(resource.file_url)}" target="_blank" class="view-link" style="display:inline-block; margin-top:0.5rem; color:#2563eb; text-decoration:none;">
                        <i class="fas fa-external-link-alt"></i> Open / Download ${resource.file_type ? resource.file_type.toUpperCase() : "File"}
                    </a>
                </div>
            `
              : ""
            }
        </div>
    `,
    )
    .join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Search and filter
function setupFilters() {
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const gradeFilter = document.getElementById("grade-filter");
  const typeFilter = document.getElementById("type-filter");

  async function applyFilters() {
    const search = searchInput?.value || "";
    const category = categoryFilter?.value || "all";
    const grade_level = gradeFilter?.value || "all";
    const resource_type = typeFilter?.value || "all";

    const params = new URLSearchParams({
      search,
      category,
      grade_level,
      resource_type,
    });

    try {
      const response = await fetch(`${API_BASE}/catalog?${params}`);
      const resources = await response.json();
      displayResources(resources);
    } catch (err) {
      console.error("Error filtering:", err);
    }
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
  if (gradeFilter) gradeFilter.addEventListener("change", applyFilters);
  if (typeFilter) typeFilter.addEventListener("change", applyFilters);

  loadCatalog();
}

// Make sure DOM is loaded before setting up filters
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupFilters);
} else {
  setupFilters();
}
