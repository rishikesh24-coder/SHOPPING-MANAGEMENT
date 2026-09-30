// ============================================================
// SHOPORA - FRONTEND APPLICATION CORE JAVASCRIPT
// ============================================================
// Features:
//   - Mandatory First-Screen Login & Authentication Gate
//   - MySQL Authentication (Login, Register, Me, Reset Password) via Express REST API
//   - Protected Shopping Homepage
//   - Product Catalog CRUD (GET, POST, PUT, DELETE) connected to MySQL
//   - Real-time Product Live Search, Category Filtering, Price Sorting
//   - Trending Products & All Products sections
//   - Dynamic Product Image Mapping with HTTPS URLs and SVG Fallbacks
//   - Interactive Wishlist, Shopping Bag, Quick View Modals
// ============================================================

// Base API endpoints (auto-adapts if served via port 5000 or file/Live Server)
const API_BASE_URL = window.location.origin.includes('5000')
    ? '/api'
    : 'http://localhost:5000/api';

const PRODUCTS_URL = `${API_BASE_URL}/products`;
const AUTH_URL = `${API_BASE_URL}/auth`;
const HEALTH_URL = `${API_BASE_URL}/health`;

// ============================================================
// GLOBAL APPLICATION STATE
// ============================================================
let productsList = [];
let filteredProducts = [];
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'recommended';
let inStockOnly = false;

let authToken = localStorage.getItem('shopora_token') || null;
let currentUser = null;

let wishlist = JSON.parse(localStorage.getItem('shopora_wishlist') || '[]');
let bag = JSON.parse(localStorage.getItem('shopora_bag') || '[]');

let deleteTargetProduct = null;

// Fallback transparent SVG data URI for guaranteed image safety
const FALLBACK_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect fill="%23f1f5f9" width="400" height="500"/><text fill="%2394a3b8" font-family="sans-serif" font-size="18" font-weight="bold" x="50%25" y="50%25" text-anchor="middle">SHOPORA PRODUCT</text></svg>`;

// ============================================================
// DOM ELEMENTS CACHE
// ============================================================
// Main Screens
const authScreen = document.getElementById('auth-screen');
const shoporaHome = document.getElementById('shopora-home');
const authAlert = document.getElementById('auth-alert');

// Auth Views & Forms
const authLoginView = document.getElementById('auth-login-view');
const authRegisterView = document.getElementById('auth-register-view');
const authForgotView = document.getElementById('auth-forgot-view');

const mainLoginForm = document.getElementById('main-login-form');
const mainRegisterForm = document.getElementById('main-register-form');
const mainForgotForm = document.getElementById('main-forgot-form');

// Catalog & Search
const productGrid = document.getElementById('product-grid');
const trendingGrid = document.getElementById('trending-grid');
const catalogCountText = document.getElementById('catalog-count-text');
const globalSearchInput = document.getElementById('global-search');
const searchClearBtn = document.getElementById('search-clear-btn');
const sortSelect = document.getElementById('sort-select');
const inStockCheckbox = document.getElementById('in-stock-only');

// Header Profile & Badges
const profileBtn = document.getElementById('profile-btn');
const profileBtnLabel = document.getElementById('profile-btn-label');
const profileDropdown = document.getElementById('profile-dropdown');
const wishlistBadge = document.getElementById('wishlist-badge');
const bagBadge = document.getElementById('bag-badge');

// Modals & Drawers
const profileModal = document.getElementById('profile-modal');
const addProductModal = document.getElementById('add-product-modal');
const editProductModal = document.getElementById('edit-product-modal');
const deleteModal = document.getElementById('delete-modal');
const quickViewModal = document.getElementById('quick-view-modal');
const bagDrawer = document.getElementById('bag-drawer');
const wishlistDrawer = document.getElementById('wishlist-drawer');
const toastContainer = document.getElementById('toast-container');

// Modal Forms
const addProductForm = document.getElementById('add-product-form');
const editProductForm = document.getElementById('edit-product-form');

// ============================================================
// APP INITIALIZATION & AUTH GATE
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Setup UI event listeners
    setupEventListeners();

    // 2. Initial Auth Verification:
    // If user has a stored token, attempt to authenticate via /api/auth/me.
    // If valid, show homepage; otherwise, display Login screen.
    await checkInitialAuth();
});

// Primary Auth Gate Verification
async function checkInitialAuth() {
    if (!authToken) {
        // No token -> SHOW LOGIN PAGE (FIRST SCREEN), HIDE HOMEPAGE
        showAuthScreen('login');
        return;
    }

    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;

            // Successful authentication -> SHOW HOMEPAGE
            showHomepage();

            // Load products from MySQL
            await fetchProducts();

            // Update badge counts & backend health
            updateWishlistBadge();
            updateBagBadge();
            checkBackendHealth();
        } else {
            // Token expired or invalid -> Clear session and show login
            logoutUser(false);
            showAuthAlert('error', 'Session expired. Please log in again.');
        }
    } catch (error) {
        console.error('Initial auth check error:', error);
        logoutUser(false);
    }
}

// Display Auth Screen (Login / Register / Forgot Password)
function showAuthScreen(view = 'login') {
    authScreen.style.display = 'flex';
    shoporaHome.style.display = 'none';

    switchAuthView(view);
}

// Display Authenticated Shopora Homepage
function showHomepage() {
    authScreen.style.display = 'none';
    shoporaHome.style.display = 'block';

    updateHeaderProfile(currentUser);
}

// Switch between Login, Register, and Forgot Password views
function switchAuthView(view) {
    authLoginView.style.display = view === 'login' ? 'block' : 'none';
    authRegisterView.style.display = view === 'register' ? 'block' : 'none';
    authForgotView.style.display = view === 'forgot' ? 'block' : 'none';

    clearValidationErrors();
    clearAuthAlert();
}

function showAuthAlert(type, message) {
    authAlert.className = `auth-alert ${type}`;
    authAlert.textContent = message;
    authAlert.style.display = 'block';
}

function clearAuthAlert() {
    authAlert.style.display = 'none';
    authAlert.textContent = '';
}

// ============================================================
// EVENT LISTENERS SETUP
// ============================================================
function setupEventListeners() {
    // Auth View Navigation Switches
    document.getElementById('goto-register-btn').addEventListener('click', () => switchAuthView('register'));
    document.getElementById('goto-forgot-btn').addEventListener('click', () => switchAuthView('forgot'));
    document.getElementById('goto-login-from-reg-btn').addEventListener('click', () => switchAuthView('login'));
    document.getElementById('goto-login-from-forgot-btn').addEventListener('click', () => switchAuthView('login'));

    // Password Visibility Toggles
    setupPasswordToggle('toggle-login-pw', 'main-login-password');
    setupPasswordToggle('toggle-reg-pw', 'main-reg-password');
    setupPasswordToggle('toggle-reg-cpw', 'main-reg-confirm-password');

    // Auth Form Submissions
    mainLoginForm.addEventListener('submit', handleLoginSubmit);
    mainRegisterForm.addEventListener('submit', handleRegisterSubmit);
    mainForgotForm.addEventListener('submit', handleResetPasswordSubmit);

    // Global Search Input
    globalSearchInput.addEventListener('input', handleGlobalSearch);
    searchClearBtn.addEventListener('click', () => {
        globalSearchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchQuery = '';
        applyFiltersAndRender();
    });

    // Navigation Category Buttons (Header)
    document.querySelectorAll('.nav-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            filterByCategory(cat);
        });
    });

    // Category Filter Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cat = chip.getAttribute('data-cat');
            filterByCategory(cat);
        });
    });

    // Sorting & In-Stock Filter
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndRender();
    });

    inStockCheckbox.addEventListener('change', (e) => {
        inStockOnly = e.target.checked;
        applyFiltersAndRender();
    });

    // Header Profile Click
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentUser) {
            openProfileModal();
        } else {
            showAuthScreen('login');
        }
    });

    // Header Wishlist & Bag Drawers
    document.getElementById('wishlist-btn').addEventListener('click', openWishlistDrawer);
    document.getElementById('wishlist-drawer-close').addEventListener('click', closeWishlistDrawer);

    document.getElementById('bag-btn').addEventListener('click', openBagDrawer);
    document.getElementById('bag-drawer-close').addEventListener('click', closeBagDrawer);

    // Modals Close Buttons
    document.getElementById('profile-modal-close').addEventListener('click', closeProfileModal);
    document.getElementById('add-modal-close').addEventListener('click', closeAddProductModal);
    document.getElementById('edit-modal-close').addEventListener('click', closeEditProductModal);
    document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('quick-view-close').addEventListener('click', closeQuickViewModal);

    // Close Modals on Backdrop Click
    [profileModal, addProductModal, editProductModal, deleteModal, quickViewModal, bagDrawer, wishlistDrawer].forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) {
                m.style.display = 'none';
            }
        });
    });

    // Top Action: Add Product Button (Protected)
    document.getElementById('open-add-product-btn').addEventListener('click', () => {
        if (!currentUser) {
            showAuthScreen('login');
            return;
        }
        openAddProductModal();
    });

    // Refresh Catalog Button
    document.getElementById('refresh-catalog-btn').addEventListener('click', async () => {
        showToast('info', 'Refreshing...', 'Fetching live product records from MySQL');
        await fetchProducts();
    });

    // Logo Click -> Reset to All & Scroll to top
    document.getElementById('logo-link').addEventListener('click', (e) => {
        e.preventDefault();
        filterByCategory('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Product Modal Forms
    addProductForm.addEventListener('submit', handleAddProductSubmit);
    editProductForm.addEventListener('submit', handleEditProductSubmit);
    document.getElementById('confirm-delete-btn').addEventListener('click', handleConfirmDelete);

    // Character counters for textareas
    document.getElementById('add-product-desc').addEventListener('input', (e) => {
        document.getElementById('add-char-count').textContent = `${e.target.value.length} / 255`;
    });
    document.getElementById('edit-product-desc').addEventListener('input', (e) => {
        document.getElementById('edit-char-count').textContent = `${e.target.value.length} / 255`;
    });
}

function setupPasswordToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
    });
}

// ============================================================
// AUTHENTICATION CONTROLLER (LOGIN, REGISTER, LOGOUT)
// ============================================================

// 1. User Login (POST /api/auth/login)
async function handleLoginSubmit(e) {
    e.preventDefault();
    clearValidationErrors();
    clearAuthAlert();

    const email = document.getElementById('main-login-email').value.trim();
    const password = document.getElementById('main-login-password').value;

    let hasError = false;
    if (!email) {
        showFieldError('main-login-email-error', 'Email address is required');
        document.getElementById('main-login-email').classList.add('is-invalid');
        hasError = true;
    }
    if (!password) {
        showFieldError('main-login-password-error', 'Password is required');
        document.getElementById('main-login-password').classList.add('is-invalid');
        hasError = true;
    }
    if (hasError) return;

    const submitBtn = document.getElementById('main-login-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>AUTHENTICATING...</span>';

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Invalid email or password.');
        }

        // Store JWT token securely in localStorage
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('shopora_token', authToken);

        // Switch to Homepage
        mainLoginForm.reset();
        showHomepage();
        showToast('success', 'Login Successful', `Welcome back, ${currentUser.name}!`);

        // Load Products from MySQL
        await fetchProducts();
        updateWishlistBadge();
        updateBagBadge();
        checkBackendHealth();
    } catch (error) {
        console.error('Login error:', error);
        showAuthAlert('error', error.message);
        showFieldError('main-login-password-error', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>LOGIN</span>';
    }
}

// 2. User Registration (POST /api/auth/register)
async function handleRegisterSubmit(e) {
    e.preventDefault();
    clearValidationErrors();
    clearAuthAlert();

    const name = document.getElementById('main-reg-name').value.trim();
    const email = document.getElementById('main-reg-email').value.trim();
    const password = document.getElementById('main-reg-password').value;
    const confirmPassword = document.getElementById('main-reg-confirm-password').value;

    let hasError = false;
    if (!name) {
        showFieldError('main-reg-name-error', 'Full name is required');
        document.getElementById('main-reg-name').classList.add('is-invalid');
        hasError = true;
    }
    if (!email) {
        showFieldError('main-reg-email-error', 'Valid email address is required');
        document.getElementById('main-reg-email').classList.add('is-invalid');
        hasError = true;
    }
    if (password.length < 6) {
        showFieldError('main-reg-password-error', 'Password must be at least 6 characters');
        document.getElementById('main-reg-password').classList.add('is-invalid');
        hasError = true;
    }
    if (password !== confirmPassword) {
        showFieldError('main-reg-confirm-password-error', 'Passwords do not match');
        document.getElementById('main-reg-confirm-password').classList.add('is-invalid');
        hasError = true;
    }
    if (hasError) return;

    const submitBtn = document.getElementById('main-register-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>CREATING ACCOUNT...</span>';

    try {
        const response = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Registration failed.');
        }

        // According to Requirement 5:
        // Do NOT automatically bypass authentication.
        // Redirect/show LOGIN screen with message: "Account created successfully. Please login."
        mainRegisterForm.reset();
        switchAuthView('login');

        // Pre-fill email in login form
        document.getElementById('main-login-email').value = email;

        // Display exact required prompt
        showAuthAlert('success', 'Account created successfully. Please login.');
        showToast('success', 'Registration Complete', 'Account created successfully. Please login.');
    } catch (error) {
        console.error('Registration error:', error);
        showAuthAlert('error', error.message);
        showFieldError('main-reg-email-error', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>CREATE ACCOUNT</span>';
    }
}

// 3. Password Reset (POST /api/auth/reset-password)
async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    clearValidationErrors();
    clearAuthAlert();

    const email = document.getElementById('main-forgot-email').value.trim();
    const newPassword = document.getElementById('main-forgot-password').value;
    const confirmNewPassword = document.getElementById('main-forgot-confirm').value;

    let hasError = false;
    if (!email) {
        showFieldError('main-forgot-email-error', 'Email is required');
        document.getElementById('main-forgot-email').classList.add('is-invalid');
        hasError = true;
    }
    if (newPassword.length < 6) {
        showFieldError('main-forgot-password-error', 'Password must be at least 6 characters');
        document.getElementById('main-forgot-password').classList.add('is-invalid');
        hasError = true;
    }
    if (newPassword !== confirmNewPassword) {
        showFieldError('main-forgot-confirm-error', 'Passwords do not match');
        document.getElementById('main-forgot-confirm').classList.add('is-invalid');
        hasError = true;
    }
    if (hasError) return;

    const submitBtn = document.getElementById('main-forgot-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>UPDATING...</span>';

    try {
        const response = await fetch(`${AUTH_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword, confirmNewPassword })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Password update failed.');
        }

        mainForgotForm.reset();
        switchAuthView('login');
        document.getElementById('main-login-email').value = email;
        showAuthAlert('success', 'Password updated successfully! Please log in.');
        showToast('success', 'Password Reset', 'Password updated! Please log in.');
    } catch (error) {
        console.error('Reset error:', error);
        showAuthAlert('error', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>UPDATE PASSWORD</span>';
    }
}

// 4. Logout User (Requirement 8)
function logoutUser(notify = true) {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('shopora_token');

    // Show LOGIN screen
    showAuthScreen('login');
    mainLoginForm.reset();

    if (notify) {
        showToast('info', 'Logged Out', 'You have been logged out safely.');
    }
}

// Update Header Profile Dropdown
function updateHeaderProfile(user) {
    if (user) {
        const firstName = user.name.split(' ')[0];
        profileBtnLabel.textContent = `Hi, ${firstName}`;
        profileBtnLabel.title = user.name;

        profileDropdown.innerHTML = `
            <div class="dropdown-user-header">
                <span class="dropdown-user-greeting">Signed in as</span>
                <div class="dropdown-user-name">${escapeHtml(user.name)}</div>
                <div class="dropdown-user-email">${escapeHtml(user.email)}</div>
            </div>
            <div class="dropdown-nav-list">
                <a href="#" class="dropdown-nav-link" onclick="openProfileModal(); return false;">
                    <span>👤</span> <span>My Profile</span>
                </a>
                <a href="#" class="dropdown-nav-link" onclick="openWishlistDrawer(); return false;">
                    <span>♡</span> <span>Wishlist (${wishlist.length})</span>
                </a>
                <a href="#" class="dropdown-nav-link" onclick="openBagDrawer(); return false;">
                    <span>🛍️</span> <span>Shopping Bag (${bag.length})</span>
                </a>
                <a href="#" class="dropdown-nav-link" onclick="openAddProductModal(); return false;" style="color: var(--primary); font-weight: 700;">
                    <span>➕</span> <span>Add New Product</span>
                </a>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-logout-btn" onclick="logoutUser();">
                <span>🚪</span> <span>Log Out</span>
            </button>
        `;
    } else {
        profileBtnLabel.textContent = 'Profile';
        profileDropdown.innerHTML = `
            <div style="padding: 12px; text-align: center;">
                <p style="font-size: 0.85rem; margin-bottom: 10px;">Please log in to continue</p>
                <button class="btn btn-auth-primary" onclick="showAuthScreen('login')">LOGIN</button>
            </div>
        `;
    }
}

// ============================================================
// PRODUCT CRUD OPERATIONS (MYSQL VIA EXPRESS REST API)
// ============================================================

// READ ALL: GET /api/products
async function fetchProducts() {
    renderLoadingGrid();
    try {
        const response = await fetch(PRODUCTS_URL);
        const result = await response.json();

        if (result.success) {
            productsList = result.data || [];
            renderTrendingSection();
            applyFiltersAndRender();
        } else {
            throw new Error(result.message || 'Failed to retrieve products from MySQL');
        }
    } catch (error) {
        console.error('Fetch products error:', error);
        renderErrorGrid(error.message);
    }
}

// CREATE PRODUCT: POST /api/products (Protected - Requires JWT)
async function handleAddProductSubmit(e) {
    e.preventDefault();
    clearValidationErrors();

    if (!currentUser || !authToken) {
        showToast('error', 'Unauthorized', 'You must be logged in to create products.');
        showAuthScreen('login');
        return;
    }

    const name = document.getElementById('add-product-name').value.trim();
    const category = document.getElementById('add-product-category').value.trim();
    const price = parseFloat(document.getElementById('add-product-price').value);
    const quantity = parseInt(document.getElementById('add-product-quantity').value, 10);
    const description = document.getElementById('add-product-desc').value.trim();

    let hasError = false;
    if (!name) {
        showFieldError('add-name-error', 'Product name is required');
        document.getElementById('add-product-name').classList.add('is-invalid');
        hasError = true;
    }
    if (!category) {
        showFieldError('add-category-error', 'Please choose a category');
        document.getElementById('add-product-category').classList.add('is-invalid');
        hasError = true;
    }
    if (isNaN(price) || price < 0) {
        showFieldError('add-price-error', 'Valid non-negative price is required');
        document.getElementById('add-product-price').classList.add('is-invalid');
        hasError = true;
    }
    if (isNaN(quantity) || quantity < 0) {
        showFieldError('add-quantity-error', 'Valid stock quantity is required');
        document.getElementById('add-product-quantity').classList.add('is-invalid');
        hasError = true;
    }
    if (hasError) return;

    const submitBtn = document.getElementById('add-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Inserting into MySQL...';

    try {
        const response = await fetch(PRODUCTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, category, price, quantity, description })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to insert product.');
        }

        showToast('success', 'Product Created', `Added "${name}" to MySQL database.`);
        closeAddProductModal();
        addProductForm.reset();
        document.getElementById('add-char-count').textContent = '0 / 255';

        // Refresh live data from MySQL
        await fetchProducts();
    } catch (error) {
        console.error('Add product error:', error);
        showToast('error', 'Create Failed', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ADD PRODUCT';
    }
}

// UPDATE PRODUCT: PUT /api/products/:id (Protected - Requires JWT)
async function handleEditProductSubmit(e) {
    e.preventDefault();
    clearValidationErrors();

    if (!currentUser || !authToken) {
        showToast('error', 'Unauthorized', 'You must be logged in to update products.');
        showAuthScreen('login');
        return;
    }

    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('edit-product-name').value.trim();
    const category = document.getElementById('edit-product-category').value.trim();
    const price = parseFloat(document.getElementById('edit-product-price').value);
    const quantity = parseInt(document.getElementById('edit-product-quantity').value, 10);
    const description = document.getElementById('edit-product-desc').value.trim();

    let hasError = false;
    if (!name) {
        showFieldError('edit-name-error', 'Product name is required');
        document.getElementById('edit-product-name').classList.add('is-invalid');
        hasError = true;
    }
    if (isNaN(price) || price < 0) {
        showFieldError('edit-price-error', 'Valid price is required');
        document.getElementById('edit-product-price').classList.add('is-invalid');
        hasError = true;
    }
    if (isNaN(quantity) || quantity < 0) {
        showFieldError('edit-quantity-error', 'Valid quantity is required');
        document.getElementById('edit-product-quantity').classList.add('is-invalid');
        hasError = true;
    }
    if (hasError) return;

    const submitBtn = document.getElementById('edit-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating MySQL...';

    try {
        const response = await fetch(`${PRODUCTS_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, category, price, quantity, description })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to update product in database.');
        }

        showToast('success', 'Product Updated', `Saved changes for Product #${id}.`);
        closeEditProductModal();

        // Refresh live data from MySQL
        await fetchProducts();
    } catch (error) {
        console.error('Update product error:', error);
        showToast('error', 'Update Failed', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
    }
}

// DELETE PRODUCT: DELETE /api/products/:id (Protected - Requires JWT)
async function handleConfirmDelete() {
    if (!deleteTargetProduct) return;

    if (!currentUser || !authToken) {
        showToast('error', 'Unauthorized', 'You must be logged in to delete products.');
        showAuthScreen('login');
        closeDeleteModal();
        return;
    }

    const { id, name } = deleteTargetProduct;
    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
        const response = await fetch(`${PRODUCTS_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to delete record from MySQL.');
        }

        showToast('success', 'Product Deleted', `Removed "${name}" from MySQL.`);
        closeDeleteModal();

        // Remove from wishlist / bag
        wishlist = wishlist.filter(itemId => itemId !== id);
        bag = bag.filter(item => item.product.id !== id);
        saveWishlist();
        saveBag();

        // Refresh live data from MySQL
        await fetchProducts();
    } catch (error) {
        console.error('Delete product error:', error);
        showToast('error', 'Delete Failed', error.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'DELETE PERMANENTLY';
    }
}

// Modal open/close helpers
function openAddProductModal() {
    clearValidationErrors();
    addProductForm.reset();
    document.getElementById('add-char-count').textContent = '0 / 255';
    addProductModal.style.display = 'flex';
    document.getElementById('add-product-name').focus();
}

function closeAddProductModal() { addProductModal.style.display = 'none'; }

function openEditProductModal(id) {
    if (!currentUser) {
        showAuthScreen('login');
        return;
    }

    const product = productsList.find(p => p.id === id);
    if (!product) return;

    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-id-badge').textContent = `#${product.id}`;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-quantity').value = product.quantity;
    document.getElementById('edit-product-desc').value = product.description || '';
    document.getElementById('edit-char-count').textContent = `${(product.description || '').length} / 255`;

    clearValidationErrors();
    editProductModal.style.display = 'flex';
    document.getElementById('edit-product-name').focus();
}

function closeEditProductModal() { editProductModal.style.display = 'none'; }

function promptDeleteProduct(id) {
    if (!currentUser) {
        showAuthScreen('login');
        return;
    }

    const product = productsList.find(p => p.id === id);
    if (!product) return;

    deleteTargetProduct = product;
    document.getElementById('delete-product-title').textContent = `"${product.name}" (#${product.id})`;
    deleteModal.style.display = 'flex';
}

function closeDeleteModal() { deleteModal.style.display = 'none'; deleteTargetProduct = null; }

// ============================================================
// DYNAMIC PRODUCT IMAGE MAPPING
// ============================================================
function getProductImage(product) {
    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();

    // Specific product keyword mapping
    if (name.includes('headphone') || name.includes('audio') || name.includes('earphone')) {
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('t-shirt') || name.includes('shirt') || name.includes('tee') || name.includes('top')) {
        return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('bottle') || name.includes('water') || name.includes('flask')) {
        return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('keyboard')) {
        return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('chair') || name.includes('desk') || name.includes('office')) {
        return 'https://images.unsplash.com/photo-1580481077195-c228ff38a89b?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('laptop') || name.includes('macbook') || name.includes('notebook')) {
        return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('sneaker') || name.includes('shoe') || name.includes('footwear') || cat.includes('footwear')) {
        return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('sunglass') || name.includes('glass') || cat.includes('accessories')) {
        return 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80';
    }
    if (name.includes('watch') || name.includes('band')) {
        return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    }

    // Category-level fallback image mapping
    if (cat.includes('elect')) {
        return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80';
    }
    if (cat.includes('cloth')) {
        return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80';
    }
    if (cat.includes('home') || cat.includes('kitchen')) {
        return 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80';
    }
    if (cat.includes('furn')) {
        return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80';
    }

    return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80';
}

// ============================================================
// FILTERING, SORTING & RENDERING CATALOG & TRENDING
// ============================================================

// Render Top Trending Section
function renderTrendingSection() {
    if (!trendingGrid) return;

    // Pick top 4 products for trending showcase
    const trendingList = productsList.slice(0, 4);

    if (trendingList.length === 0) {
        document.getElementById('trending-section').style.display = 'none';
        return;
    }

    document.getElementById('trending-section').style.display = 'block';
    trendingGrid.innerHTML = trendingList.map(product => createProductCardHtml(product, false)).join('');
}

function handleGlobalSearch(e) {
    searchQuery = e.target.value.trim();
    searchClearBtn.style.display = searchQuery ? 'block' : 'none';
    applyFiltersAndRender();
}

function filterByCategory(category) {
    currentCategory = category;

    // Update active nav buttons
    document.querySelectorAll('.nav-cat-btn').forEach(btn => {
        const cat = btn.getAttribute('data-category');
        btn.classList.toggle('active', cat.toLowerCase() === category.toLowerCase());
    });

    // Update active chips
    document.querySelectorAll('.chip').forEach(chip => {
        const cat = chip.getAttribute('data-cat');
        chip.classList.toggle('active', cat.toLowerCase() === category.toLowerCase());
    });

    applyFiltersAndRender();
    scrollToCatalog();
}

function resetAllFilters() {
    currentCategory = 'all';
    searchQuery = '';
    globalSearchInput.value = '';
    searchClearBtn.style.display = 'none';
    currentSort = 'recommended';
    sortSelect.value = 'recommended';
    inStockOnly = false;
    inStockCheckbox.checked = false;

    document.querySelectorAll('.nav-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
    });
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-cat') === 'all');
    });

    applyFiltersAndRender();
}

function scrollToCatalog() {
    document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
}

function applyFiltersAndRender() {
    let result = [...productsList];

    // 1. Category Filter
    if (currentCategory && currentCategory !== 'all') {
        const cat = currentCategory.toLowerCase();
        if (cat === 'men') {
            result = result.filter(p => (p.category || '').toLowerCase().includes('clothing') || (p.name || '').toLowerCase().includes('shirt') || (p.name || '').toLowerCase().includes('t-shirt'));
        } else if (cat === 'women') {
            result = result.filter(p => (p.category || '').toLowerCase().includes('clothing') || (p.category || '').toLowerCase().includes('accessories') || (p.name || '').toLowerCase().includes('dress'));
        } else if (cat === 'kids') {
            result = result.filter(p => (p.category || '').toLowerCase().includes('clothing') || (p.name || '').toLowerCase().includes('kids'));
        } else if (cat === 'home') {
            result = result.filter(p => (p.category || '').toLowerCase().includes('home') || (p.category || '').toLowerCase().includes('furniture'));
        } else if (cat === 'beauty') {
            result = result.filter(p => (p.category || '').toLowerCase().includes('accessories') || (p.category || '').toLowerCase().includes('beauty'));
        } else if (cat === 'offers') {
            // Show products with lower price or stock
            result = result.filter(p => parseFloat(p.price) < 50);
        } else {
            result = result.filter(p => (p.category || '').toLowerCase().includes(cat));
        }
    }

    // 2. Search Query Filter
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => {
            const nameMatch = (p.name || '').toLowerCase().includes(q);
            const catMatch = (p.category || '').toLowerCase().includes(q);
            const descMatch = (p.description || '').toLowerCase().includes(q);
            return nameMatch || catMatch || descMatch;
        });
    }

    // 3. In-Stock Filter
    if (inStockOnly) {
        result = result.filter(p => parseInt(p.quantity, 10) > 0);
    }

    // 4. Sorting
    if (currentSort === 'price-low') {
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (currentSort === 'price-high') {
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (currentSort === 'name-asc') {
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (currentSort === 'quantity-high') {
        result.sort((a, b) => parseInt(b.quantity, 10) - parseInt(a.quantity, 10));
    } else {
        // Newest first
        result.sort((a, b) => b.id - a.id);
    }

    filteredProducts = result;
    renderProductsGrid(filteredProducts);
}

function createProductCardHtml(product, showAdmin = true) {
    const imageUrl = getProductImage(product);
    const isWishlisted = wishlist.includes(product.id);
    const parsedPrice = parseFloat(product.price);
    const formattedPrice = isNaN(parsedPrice) ? '0.00' : parsedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fakeOriginalPrice = isNaN(parsedPrice) ? '0.00' : (parsedPrice * 1.35).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const qty = parseInt(product.quantity, 10) || 0;
    let stockClass = 'in-stock';
    let stockText = `Available: ${qty}`;
    if (qty === 0) {
        stockClass = 'out-stock';
        stockText = 'Out of Stock';
    } else if (qty <= 5) {
        stockClass = 'low-stock';
        stockText = `Only ${qty} left!`;
    }

    const safeName = escapeHtml(product.name);
    const safeCategory = escapeHtml(product.category);
    const safeDesc = escapeHtml(product.description || 'Verified authentic e-commerce stock with 14-day warranty.');

    // Secondary Admin Buttons (only if user logged in and showAdmin is true)
    const adminBar = (currentUser && showAdmin) ? `
        <div class="card-admin-bar">
            <button class="btn-admin-edit" onclick="openEditProductModal(${product.id})" title="Edit MySQL record">
                ✏️ Edit
            </button>
            <button class="btn-admin-del" onclick="promptDeleteProduct(${product.id})" title="Delete from MySQL">
                🗑️ Delete
            </button>
        </div>
    ` : '';

    return `
        <div class="product-card" id="card-${product.id}">
            <div class="card-media-box">
                <img 
                    src="${imageUrl}" 
                    alt="${safeName}" 
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${FALLBACK_IMAGE_SVG}';"
                >
                <button 
                    class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                    onclick="toggleWishlist(${product.id})" 
                    title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                >
                    ${isWishlisted ? '♥' : '♡'}
                </button>
                <span class="card-stock-pill ${stockClass}">${stockText}</span>
            </div>

            <div class="card-content">
                <span class="card-category-tag">${safeCategory}</span>
                <h3 class="card-product-title" title="${safeName}">${safeName}</h3>

                <div class="card-price-row">
                    <span class="card-price">₹${formattedPrice}</span>
                    <span class="card-mrp">₹${fakeOriginalPrice}</span>
                    <span class="card-discount-tag">(25% OFF)</span>
                </div>

                <div class="card-actions-row">
                    <button class="btn-card-bag" onclick="addToBag(${product.id})" ${qty === 0 ? 'disabled style="opacity: 0.6;"' : ''}>
                        ${qty === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                    </button>
                    <button class="btn-card-quick" onclick="openQuickViewModal(${product.id})" title="Quick View">
                        👁️
                    </button>
                </div>

                ${adminBar}
            </div>
        </div>
    `;
}

function renderProductsGrid(products) {
    catalogCountText.textContent = `Showing ${products.length} of ${productsList.length} verified MySQL products`;

    if (products.length === 0) {
        productGrid.innerHTML = `
            <div class="grid-empty-state">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">🔍</span>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">No products match your search</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">Try adjusting your filters or search keywords, or add a new product.</p>
                <button class="btn btn-primary-accent" onclick="resetAllFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = products.map(product => createProductCardHtml(product, true)).join('');
}

function renderLoadingGrid() {
    productGrid.innerHTML = `
        <div class="grid-loading-placeholder">
            <div class="loading-spinner"></div>
            <p>Fetching real-time inventory from MySQL database...</p>
        </div>
    `;
}

function renderErrorGrid(message) {
    productGrid.innerHTML = `
        <div class="grid-empty-state" style="border-color: var(--danger);">
            <span style="font-size: 3rem; display: block; margin-bottom: 12px;">⚠️</span>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--danger); margin-bottom: 6px;">Cannot Connect to MySQL Backend</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">${escapeHtml(message)}</p>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 16px;">Ensure MySQL Server is running and <code>npm start</code> is executed in <code>backend/</code>.</p>
            <button class="btn btn-outline" onclick="fetchProducts()">Retry Connection</button>
        </div>
    `;
}

// ============================================================
// PROFILE, WISHLIST & SHOPPING BAG
// ============================================================
function openProfileModal() {
    if (!currentUser) return;
    document.getElementById('profile-display-name').textContent = currentUser.name;
    document.getElementById('profile-display-email').textContent = currentUser.email;
    document.getElementById('profile-avatar-letter').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('profile-user-id').textContent = `#${currentUser.id}`;

    const dateStr = currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) : 'Active Member';
    document.getElementById('profile-created-at').textContent = dateStr;

    profileModal.style.display = 'flex';
}

function closeProfileModal() { profileModal.style.display = 'none'; }

// Quick View Modal
function openQuickViewModal(id) {
    const product = productsList.find(p => p.id === id);
    if (!product) return;

    const imageUrl = getProductImage(product);
    const parsedPrice = parseFloat(product.price) || 0;
    const qty = parseInt(product.quantity, 10) || 0;

    document.getElementById('qv-image').src = imageUrl;
    document.getElementById('qv-title').textContent = product.name;
    document.getElementById('qv-category').textContent = (product.category || 'GENERAL').toUpperCase();
    document.getElementById('qv-price').textContent = `₹${parsedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('qv-desc').textContent = product.description || 'Verified authentic e-commerce inventory.';
    document.getElementById('qv-id').textContent = `#${product.id}`;
    document.getElementById('qv-quantity').textContent = `${qty} units`;

    const stockBadge = document.getElementById('qv-stock-badge');
    if (qty === 0) {
        stockBadge.className = 'qv-stock-badge stock-tag out-stock';
        stockBadge.textContent = 'Out of Stock';
    } else if (qty <= 5) {
        stockBadge.className = 'qv-stock-badge stock-tag low-stock';
        stockBadge.textContent = `Low Stock (${qty} left)`;
    } else {
        stockBadge.className = 'qv-stock-badge stock-tag in-stock';
        stockBadge.textContent = 'In Stock';
    }

    const addBtn = document.getElementById('qv-add-to-bag-btn');
    addBtn.disabled = qty === 0;
    addBtn.onclick = () => {
        addToBag(product.id);
        closeQuickViewModal();
    };

    const wishBtn = document.getElementById('qv-wishlist-toggle-btn');
    const isW = wishlist.includes(product.id);
    wishBtn.textContent = isW ? '♥ IN WISHLIST' : '♡ WISHLIST';
    wishBtn.onclick = () => {
        toggleWishlist(product.id);
        const nowW = wishlist.includes(product.id);
        wishBtn.textContent = nowW ? '♥ IN WISHLIST' : '♡ WISHLIST';
    };

    quickViewModal.style.display = 'flex';
}

function closeQuickViewModal() { quickViewModal.style.display = 'none'; }

// Wishlist Logic
function toggleWishlist(id) {
    const idx = wishlist.indexOf(id);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        showToast('info', 'Wishlist', 'Item removed from your wishlist.');
    } else {
        wishlist.push(id);
        showToast('success', 'Wishlist', 'Item saved to your wishlist!');
    }
    saveWishlist();
    updateWishlistBadge();
    applyFiltersAndRender();
}

function saveWishlist() {
    localStorage.setItem('shopora_wishlist', JSON.stringify(wishlist));
}

function updateWishlistBadge() {
    wishlistBadge.textContent = wishlist.length;
    wishlistBadge.style.display = wishlist.length > 0 ? 'flex' : 'none';
}

function openWishlistDrawer() {
    const container = document.getElementById('wishlist-drawer-items');
    document.getElementById('drawer-wishlist-count').textContent = wishlist.length;

    const wishlistedProducts = productsList.filter(p => wishlist.includes(p.id));

    if (wishlistedProducts.length === 0) {
        container.innerHTML = `
            <div class="drawer-empty-msg">
                <div class="drawer-empty-icon">♡</div>
                <h4>Your Wishlist is Empty</h4>
                <p style="font-size: 0.8rem; margin-top: 4px;">Save items you love by tapping the heart icon on any product.</p>
            </div>
        `;
    } else {
        container.innerHTML = wishlistedProducts.map(p => {
            const img = getProductImage(p);
            const price = parseFloat(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `
                <div class="drawer-item">
                    <img src="${img}" alt="${escapeHtml(p.name)}" class="drawer-item-img">
                    <div class="drawer-item-info">
                        <span class="drawer-item-cat">${escapeHtml(p.category)}</span>
                        <h4 class="drawer-item-title">${escapeHtml(p.name)}</h4>
                        <div class="drawer-item-price">₹${price}</div>
                        <button class="btn btn-primary-accent" style="padding: 4px 10px; font-size: 0.72rem; margin-top: 6px; width: fit-content;" onclick="addToBag(${p.id})">
                            Move to Bag
                        </button>
                    </div>
                    <button class="drawer-item-remove" onclick="toggleWishlist(${p.id}); openWishlistDrawer();" title="Remove">&times;</button>
                </div>
            `;
        }).join('');
    }

    wishlistDrawer.style.display = 'flex';
}

function closeWishlistDrawer() { wishlistDrawer.style.display = 'none'; }

// Shopping Bag Logic
function addToBag(id) {
    const product = productsList.find(p => p.id === id);
    if (!product) return;

    if (parseInt(product.quantity, 10) <= 0) {
        showToast('error', 'Out of Stock', 'This product is currently out of stock.');
        return;
    }

    const existingIndex = bag.findIndex(item => item.product.id === id);
    if (existingIndex > -1) {
        bag[existingIndex].quantity += 1;
    } else {
        bag.push({ product, quantity: 1 });
    }

    saveBag();
    updateBagBadge();
    showToast('success', 'Added to Bag', `Added "${product.name}" to your shopping bag.`);
}

function saveBag() {
    localStorage.setItem('shopora_bag', JSON.stringify(bag));
}

function updateBagBadge() {
    const totalCount = bag.reduce((sum, item) => sum + item.quantity, 0);
    bagBadge.textContent = totalCount;
    bagBadge.style.display = totalCount > 0 ? 'flex' : 'none';
}

function openBagDrawer() {
    const container = document.getElementById('bag-drawer-items');
    const footer = document.getElementById('bag-drawer-footer');
    const totalCount = bag.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('drawer-bag-count').textContent = totalCount;

    if (bag.length === 0) {
        container.innerHTML = `
            <div class="drawer-empty-msg">
                <div class="drawer-empty-icon">🛍️</div>
                <h4>Your Bag is Empty</h4>
                <p style="font-size: 0.8rem; margin-top: 4px;">Discover trends and add your favorites to checkout.</p>
            </div>
        `;
        footer.style.display = 'none';
    } else {
        footer.style.display = 'block';
        let subtotal = 0;

        container.innerHTML = bag.map((item, index) => {
            const p = item.product;
            const img = getProductImage(p);
            const unitPrice = parseFloat(p.price) || 0;
            const itemTotal = unitPrice * item.quantity;
            subtotal += itemTotal;

            return `
                <div class="drawer-item">
                    <img src="${img}" alt="${escapeHtml(p.name)}" class="drawer-item-img">
                    <div class="drawer-item-info">
                        <span class="drawer-item-cat">${escapeHtml(p.category)}</span>
                        <h4 class="drawer-item-title">${escapeHtml(p.name)}</h4>
                        <div class="drawer-item-price">₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Qty: ${item.quantity} (₹${unitPrice.toFixed(2)} each)</div>
                    </div>
                    <button class="drawer-item-remove" onclick="removeFromBag(${index})" title="Remove item">&times;</button>
                </div>
            `;
        }).join('');

        document.getElementById('bag-subtotal-price').textContent = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    bagDrawer.style.display = 'flex';
}

function removeFromBag(index) {
    bag.splice(index, 1);
    saveBag();
    updateBagBadge();
    openBagDrawer();
}

function closeBagDrawer() { bagDrawer.style.display = 'none'; }

// ============================================================
// SYSTEM STATUS & UTILITIES
// ============================================================
async function checkBackendHealth() {
    const statusFooter = document.getElementById('footer-db-status');
    if (!statusFooter) return;
    try {
        const response = await fetch(HEALTH_URL);
        if (response.ok) {
            statusFooter.textContent = 'Status: ✅ Backend & MySQL Active';
            statusFooter.style.color = 'var(--success)';
        } else {
            statusFooter.textContent = 'Status: ⚠️ Backend responding with error';
            statusFooter.style.color = 'var(--warning)';
        }
    } catch {
        statusFooter.textContent = 'Status: ❌ Backend offline (run npm start)';
        statusFooter.style.color = 'var(--danger)';
    }
}

// Toast Notifications
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-body">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

function showFieldError(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = text;
}

function clearValidationErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
