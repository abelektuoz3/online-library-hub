// Catalog API — fetches from MongoDB via backend

// Use the global API_BASE from api-config.js
function getApiBase() {
    return window.API_BASE || 'https://online-library-hub.onrender.com/api';
}

function getBackendBase() {
    return window.BACKEND_BASE || 'https://online-library-hub.onrender.com';
}

function getFileUrl(fileUrl) {
    if (!fileUrl) return '';
    
    const backendBase = getBackendBase();
    
    // If fileUrl already starts with http, return as-is (it's a full URL)
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        return fileUrl;
    }
    
    // If fileUrl starts with /uploads/, use it with backend base
    if (fileUrl.startsWith('/uploads/')) {
        return `${backendBase}${fileUrl}`;
    }
    
    // If fileUrl starts with uploads/ (no leading slash), add the leading slash
    if (fileUrl.startsWith('uploads/')) {
        return `${backendBase}/${fileUrl}`;
    }
    
    // If it starts with a slash, use it with backend base
    if (fileUrl.startsWith('/')) {
        return `${backendBase}${fileUrl}`;
    }
    
    // Default: assume it's just a filename in the uploads folder
    return `${backendBase}/uploads/${fileUrl}`;
}

// Load all resources from MongoDB
async function loadCatalog() {
    try {
        const apiBase = getApiBase();
        console.log('📡 Fetching catalog from:', `${apiBase}/catalog`);
        
        const response = await fetch(`${apiBase}/catalog`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const resources = await response.json();
        console.log('📚 Resources loaded:', resources.length);
        
        displayResources(resources);
        return resources;
    } catch (err) {
        console.error('Error loading catalog:', err);
        const container = document.getElementById('catalog-container');
        if (container) {
            container.innerHTML = '<p>❌ Error loading resources. Please make sure the backend is running.</p>';
        }
    }
}

function displayResources(resources) {
    const container = document.getElementById('catalog-container');
    if (!container) return;
    
    if (resources.length === 0) {
        container.innerHTML = '<p>No resources found in the catalog. Add some resources from the admin panel.</p>';
        return;
    }
    
    container.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <h3>${escapeHtml(resource.title)}</h3>
            <p class="author">✍️ ${escapeHtml(resource.author || 'Unknown')}</p>
            <p class="category">📁 ${escapeHtml(resource.category || 'General')}</p>
            <p class="grade">🎓 ${escapeHtml(resource.grade_level || 'All grades')}</p>
            <p class="type">📖 ${escapeHtml(resource.resource_type || 'Resource')}</p>
            <p class="description">${escapeHtml(resource.description || '').substring(0, 100)}${(resource.description || '').length > 100 ? '...' : ''}</p>
            <span class="availability ${resource.available ? 'available' : 'unavailable'}">
                ${resource.available ? '✅ Available' : '❌ Unavailable'}
            </span>
            ${resource.file_url ? `
                <div class="resource-media" style="margin-top:0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    ${resource.file_type === 'video' ? `<video controls style="max-width:100%;max-height:200px; border-radius: 0.5rem;" src="${getFileUrl(resource.file_url)}"></video>` : ''}
                    ${resource.file_type === 'audio' ? `<audio controls src="${getFileUrl(resource.file_url)}" style="width: 100%;"></audio>` : ''}
                    ${resource.file_type === 'image' ? `<img src="${getFileUrl(resource.file_url)}" style="max-width:100%;max-height:150px; border-radius: 0.5rem;" alt="${escapeHtml(resource.title)}">` : ''}
                    ${resource.file_type === 'pdf' ? `<a href="${getFileUrl(resource.file_url)}" target="_blank" class="view-link" style="display:inline-block; margin-top:0.5rem; color:#2563eb; text-decoration:none;"><i class="fas fa-file-pdf"></i> View PDF</a>` : ''}
                    ${resource.file_type === 'none' || !resource.file_type ? `<a href="${getFileUrl(resource.file_url)}" target="_blank" class="view-link" style="display:inline-block; margin-top:0.5rem; color:#2563eb; text-decoration:none;"><i class="fas fa-external-link-alt"></i> Open File</a>` : ''}
                    ${resource.file_type === 'video' || resource.file_type === 'audio' ? '' : ''}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Search and filter
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const gradeFilter = document.getElementById('grade-filter');
    const typeFilter = document.getElementById('type-filter');
    
    async function applyFilters() {
        const search = searchInput?.value || '';
        const category = categoryFilter?.value || 'all';
        const grade_level = gradeFilter?.value || 'all';
        const resource_type = typeFilter?.value || 'all';
        
        const apiBase = getApiBase();
        const params = new URLSearchParams({ search, category, grade_level, resource_type });
        
        try {
            console.log('📡 Applying filters:', params.toString());
            const response = await fetch(`${apiBase}/catalog/search?${params}`);
            const resources = await response.json();
            displayResources(resources);
        } catch (err) {
            console.error('Error filtering:', err);
        }
    }
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (gradeFilter) gradeFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    
    loadCatalog();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFilters);
} else {
    setupFilters();
}