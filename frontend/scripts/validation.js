// API base is served from backend/server.js via /scripts/api-config.js
const API_BASE_URL = window.API_BASE || '/api';

/**
 * Make an authenticated API request.
 * Automatically redirects to login on 401.
 */
async function apiRequest(endpoint, method, data) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    const options = {
        method: method,
        headers: headers
    };
    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API_BASE_URL + endpoint, options);
    const result = await response.json();

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        var isPageSubdir = window.location.pathname.includes('/pages/');
        var loginPath = isPageSubdir ? 'login.html' : 'pages/login.html';
        window.location.href = loginPath;
        throw new Error('Session expired');
    }

    if (response.status === 403 && result.error && result.error.toLowerCase().includes('suspended')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        var suspendedLoginPath = window.location.pathname.includes('/pages/') ? 'login.html?suspended=1' : 'pages/login.html?suspended=1';
        window.location.href = suspendedLoginPath;
        throw new Error('Account suspended');
    }

    return { success: response.ok, data: result, status: response.status };
}

/**
 * Display a status message above the form.
 */
function showMessage(message, type, containerId) {
    containerId = containerId || 'form-message';
    var msgDiv = document.getElementById(containerId);
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = containerId;
        var form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(msgDiv, form);
        }
    }
    msgDiv.className = 'message ' + type;
    msgDiv.style.display = 'block';
    var icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    msgDiv.innerHTML = '<i class="fas ' + icon + '"></i> ' + message;

    setTimeout(function() {
        if (msgDiv) {
            msgDiv.style.display = 'none';
            msgDiv.className = '';
            msgDiv.innerHTML = '';
        }
    }, 5000);
}

/**
 * Show a field-level inline error.
 */
function showFieldError(fieldId, message) {
    var errorDiv = document.getElementById(fieldId + '-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    var input = document.getElementById(fieldId);
    if (input) {
        input.classList.add('input-error');
    }
}

/**
 * Clear a field-level inline error.
 */
function clearFieldError(fieldId) {
    var errorDiv = document.getElementById(fieldId + '-error');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    var input = document.getElementById(fieldId);
    if (input) {
        input.classList.remove('input-error');
    }
}

/**
 * Clear all field errors in the form.
 */
function clearAllFieldErrors() {
    var errors = document.querySelectorAll('.field-error');
    errors.forEach(function(el) {
        el.textContent = '';
        el.style.display = 'none';
    });
    var inputs = document.querySelectorAll('.input-error');
    inputs.forEach(function(el) {
        el.classList.remove('input-error');
    });
}

// Email regex for client-side validation
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// ==================== REGISTRATION ====================
var registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllFieldErrors();

        var nameInput = document.getElementById('name');
        var emailInput = document.getElementById('email');
        var passwordInput = document.getElementById('password');
        var confirmInput = document.getElementById('confirm_password');
        var termsCheckbox = document.getElementById('termsCheckbox');
        var submitBtn = document.getElementById('registerBtn');

        var name = nameInput ? nameInput.value.trim() : '';
        var email = emailInput ? emailInput.value.trim() : '';
        var password = passwordInput ? passwordInput.value : '';
        var confirmPassword = confirmInput ? confirmInput.value : '';

        // --- Client-side validation ---
        var hasError = false;

        if (!name) {
            showFieldError('name', 'Full name is required');
            hasError = true;
        } else if (name.length < 2) {
            showFieldError('name', 'Name must be at least 2 characters');
            hasError = true;
        }

        if (!email) {
            showFieldError('email', 'Email is required');
            hasError = true;
        } else if (!EMAIL_REGEX.test(email)) {
            showFieldError('email', 'Please enter a valid email address');
            hasError = true;
        }

        if (!password) {
            showFieldError('password', 'Password is required');
            hasError = true;
        } else if (password.length < 4) {
            showFieldError('password', 'Password must be at least 4 characters');
            hasError = true;
        }

        if (!confirmPassword) {
            showFieldError('confirm_password', 'Please confirm your password');
            hasError = true;
        } else if (password !== confirmPassword) {
            showFieldError('confirm_password', 'Passwords do not match');
            hasError = true;
        }

        if (termsCheckbox && !termsCheckbox.checked) {
            showFieldError('terms', 'You must agree to the Terms of Service');
            hasError = true;
        }

        if (hasError) {
            showMessage('Please fix the errors below', 'error');
            return;
        }

        // --- Submit to server ---
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
        }

        try {
            var response = await fetch(API_BASE_URL + '/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    confirm_password: confirmPassword
                })
            });

            var data = await response.json();

            if (response.ok && data.success) {
                showMessage('Registration successful! Redirecting to login...', 'success');
                setTimeout(function() {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                showMessage(data.error || 'Registration failed', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create account';
                }
            }
        } catch (err) {
            console.error('Registration error:', err);
            showMessage('Server error. Please make sure the backend is running.', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create account';
            }
        }
    });
}


// ==================== LOGIN ====================
var loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllFieldErrors();

        var emailInput = document.getElementById('email');
        var passwordInput = document.getElementById('password');
        var rememberCheckbox = document.getElementById('rememberMe');
        var submitBtn = document.getElementById('loginBtn');

        var email = emailInput ? emailInput.value.trim() : '';
        var password = passwordInput ? passwordInput.value : '';

        // --- Remember me ---
        if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // --- Client-side validation ---
        var hasError = false;

        if (!email) {
            showFieldError('email', 'Email is required');
            hasError = true;
        } else if (!EMAIL_REGEX.test(email)) {
            showFieldError('email', 'Please enter a valid email address');
            hasError = true;
        }

        if (!password) {
            showFieldError('password', 'Password is required');
            hasError = true;
        }

        if (hasError) {
            showMessage('Please fix the errors below', 'error');
            return;
        }

        // --- Submit to server ---
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
        }

        try {
            var response = await fetch(API_BASE_URL + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            var data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showMessage('Login successful! Redirecting to dashboard...', 'success');
                setTimeout(function() {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showMessage(data.error || 'Invalid email or password', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign in';
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            showMessage('Server error. Please make sure the backend is running.', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign in';
            }
        }
    });
}


// ==================== PASSWORD TOGGLE & REMEMBER EMAIL (Login page) ====================
(function() {
    // Toggle password visibility on login page
    var togglePassword = document.getElementById('togglePassword');
    var passwordInput = document.getElementById('password');

    // Only wire up if we are on the login page (registerForm absent)
    if (togglePassword && passwordInput && !document.getElementById('registerForm')) {
        togglePassword.addEventListener('click', function() {
            var type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Restore remembered email
    var emailInput = document.getElementById('email');
    var rememberCheckbox = document.getElementById('rememberMe');
    var saved = localStorage.getItem('rememberedEmail');
    if (saved) {
        if (emailInput) emailInput.value = saved;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
})();


// ==================== CONTACT FORM ====================
var contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        var name = (document.getElementById('name') || {}).value || '';
        var email = (document.getElementById('email') || {}).value || '';
        var message = (document.getElementById('message') || {}).value || '';

        name = name.trim();
        email = email.trim();
        message = message.trim();

        if (!name || !email || !message) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        try {
            var response = await fetch(API_BASE_URL + '/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, message: message })
            });

            var data = await response.json();

            if (response.ok && data.success) {
                showMessage('✅ Message sent successfully! Thank you for your feedback.', 'success');
                contactForm.reset();
            } else {
                showMessage(data.error || 'Failed to send message', 'error');
            }
        } catch (err) {
            console.error('Contact error:', err);
            showMessage('Server error. Please try again.', 'error');
        }
    });
}