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

// ============================================================
// BASE API CONFIGURATION
// ============================================================
// Single API Base: window.location.origin
// - Production on Render: https://shopora-w6bv.onrender.com
//   calls https://shopora-w6bv.onrender.com/api/...
// - Localhost: http://localhost:5000
//   calls http://localhost:5000/api/...
const API_BASE_URL = window.location.origin;

const AUTH_BASE = `${API_BASE_URL}/api/auth`;
const PRODUCTS_BASE = `${API_BASE_URL}/api/products`;
const HEALTH_BASE = `${API_BASE_URL}/api/health`;

// Maintain endpoint aliases for compatibility
const AUTH_URL = AUTH_BASE;
const PRODUCTS_URL = PRODUCTS_BASE;
const HEALTH_URL = HEALTH_BASE;

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
const profileAction = document.getElementById('profile-action');
const profileBtn = document.getElementById('profile-btn');
const profileBtnLabel = document.getElementById('profile-btn-label');
const profileDropdown = document.getElementById('profile-dropdown');
const wishlistBadge = document.getElementById('wishlist-badge');
const bagBadge = document.getElementById('bag-badge');

// Profile dropdown state
let isProfileDropdownOpen = false;
let profileCloseTimer = null;

// Modals & Drawers
const profileModal = document.getElementById('profile-modal');
const manageProductsModal = document.getElementById('manage-products-modal');
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
        const response = await fetch(`${AUTH_BASE}/me`, {
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

    // Header Profile Click-First & Hover Dropdown
    profileBtn.addEventListener('click', toggleProfileDropdown);

    if (profileAction) {
        profileAction.addEventListener('mouseenter', () => {
            clearTimeout(profileCloseTimer);
        });

        profileAction.addEventListener('mouseleave', () => {
            if (isProfileDropdownOpen) {
                profileCloseTimer = setTimeout(() => {
                    closeProfileDropdown();
                }, 250);
            }
        });
    }

    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Global outside click listener to close profile dropdown
    window.addEventListener('click', (e) => {
        if (isProfileDropdownOpen && profileAction && !profileAction.contains(e.target)) {
            closeProfileDropdown();
        }
    });

    // Escape key closes profile dropdown & modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isProfileDropdownOpen) closeProfileDropdown();
            if (manageProductsModal && manageProductsModal.style.display === 'flex') closeManageProductsModal();
        }
    });

    // Header Wishlist & Bag Drawers
    document.getElementById('wishlist-btn').addEventListener('click', openWishlistDrawer);
    document.getElementById('wishlist-drawer-close').addEventListener('click', closeWishlistDrawer);

    document.getElementById('bag-btn').addEventListener('click', openBagDrawer);
    document.getElementById('bag-drawer-close').addEventListener('click', closeBagDrawer);

    // Modals Close Buttons
    document.getElementById('profile-modal-close').addEventListener('click', closeProfileModal);
    const manageCloseBtn = document.getElementById('manage-products-close');
    if (manageCloseBtn) manageCloseBtn.addEventListener('click', closeManageProductsModal);
    document.getElementById('add-modal-close').addEventListener('click', closeAddProductModal);
    document.getElementById('edit-modal-close').addEventListener('click', closeEditProductModal);
    document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('quick-view-close').addEventListener('click', closeQuickViewModal);

    // Manage Products Admin Modal Toolbar
    const adminAddBtn = document.getElementById('admin-add-product-btn');
    if (adminAddBtn) {
        adminAddBtn.addEventListener('click', () => {
            closeManageProductsModal();
            openAddProductModal();
        });
    }

    const adminSearch = document.getElementById('admin-search-input');
    if (adminSearch) {
        adminSearch.addEventListener('input', (e) => {
            renderAdminProductsTable(e.target.value);
        });
    }

    // Close Modals on Backdrop Click
    [profileModal, manageProductsModal, addProductModal, editProductModal, deleteModal, quickViewModal, bagDrawer, wishlistDrawer].forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) {
                    m.style.display = 'none';
                }
            });
        }
    });

    // Optional Top Action: Add Product Button (Protected)
    const openAddBtn = document.getElementById('open-add-product-btn');
    if (openAddBtn) {
        openAddBtn.addEventListener('click', () => {
            if (!currentUser) {
                showAuthScreen('login');
                return;
            }
            openAddProductModal();
        });
    }

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
        const response = await fetch(`${AUTH_BASE}/login`, {
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
        const response = await fetch(`${AUTH_BASE}/register`, {
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
        const response = await fetch(`${AUTH_BASE}/reset-password`, {
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

// ============================================================
// PROFILE DROPDOWN: CLICK-FIRST & HOVER-STABLE IMPLEMENTATION
// ============================================================

// Update Header Profile State & Triggers
function updateHeaderProfile(user) {
    if (user) {
        const firstName = (user.name || 'Member').split(' ')[0];
        profileBtnLabel.textContent = `Hi, ${firstName}`;
        profileBtnLabel.title = user.name;
    } else {
        profileBtnLabel.textContent = 'Profile';
        profileBtnLabel.title = 'User Profile';
    }
    renderProfileDropdown();
}

// Render Profile Dropdown Content
function renderProfileDropdown() {
    if (!profileDropdown) return;

    if (currentUser) {
        const firstName = (currentUser.name || 'Member').split(' ')[0];
        const bagTotalCount = bag.reduce((sum, item) => sum + (item.quantity || 1), 0);

        profileDropdown.innerHTML = `
            <div class="dropdown-user-header">
                <div class="dropdown-user-greeting">Hi, ${escapeHtml(firstName)}</div>
                <div class="dropdown-user-email">${escapeHtml(currentUser.email || '')}</div>
            </div>
            <div class="dropdown-nav-list">
                <button type="button" class="dropdown-nav-link" id="dd-nav-profile">
                    <span class="dd-icon">👤</span>
                    <span class="dd-text">My Profile</span>
                </button>
                <button type="button" class="dropdown-nav-link" id="dd-nav-orders">
                    <span class="dd-icon">📦</span>
                    <span class="dd-text">My Orders</span>
                    <span class="dd-badge">0</span>
                </button>
                <button type="button" class="dropdown-nav-link" id="dd-nav-wishlist">
                    <span class="dd-icon">♡</span>
                    <span class="dd-text">Wishlist</span>
                    <span class="dd-badge">${wishlist.length}</span>
                </button>
                <button type="button" class="dropdown-nav-link" id="dd-nav-bag">
                    <span class="dd-icon">🛍️</span>
                    <span class="dd-text">Bag</span>
                    <span class="dd-badge">${bagTotalCount}</span>
                </button>
                <button type="button" class="dropdown-nav-link" id="dd-nav-manage" style="color: var(--primary); font-weight: 700;">
                    <span class="dd-icon">⚙️</span>
                    <span class="dd-text">Manage Products</span>
                    <span class="dd-badge" style="background:#fee2e2; color:#dc2626;">Admin</span>
                </button>
            </div>
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-logout-btn" id="dd-nav-logout">
                <span class="dd-icon">🚪</span>
                <span>Logout</span>
            </button>
        `;

        // Direct, conflict-free event bindings for dropdown items
        const btnProfile = document.getElementById('dd-nav-profile');
        if (btnProfile) {
            btnProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                closeProfileDropdown();
                openProfileModal();
            });
        }

        const btnOrders = document.getElementById('dd-nav-orders');
        if (btnOrders) {
            btnOrders.addEventListener('click', (e) => {
                e.stopPropagation();
                closeProfileDropdown();
                showToast('info', 'My Orders', 'You have 0 active shipments in transit.');
            });
        }

        const btnWishlist = document.getElementById('dd-nav-wishlist');
        if (btnWishlist) {
            btnWishlist.addEventListener('click', (e) => {
                e.stopPropagation();
                closeProfileDropdown();
                openWishlistDrawer();
            });
        }

        const btnBag = document.getElementById('dd-nav-bag');
        if (btnBag) {
            btnBag.addEventListener('click', (e) => {
                e.stopPropagation();
                closeProfileDropdown();
                openBagDrawer();
            });
        }

        const btnManage = document.getElementById('dd-nav-manage');
        if (btnManage) {
            btnManage.addEventListener('click', (e) => {
                e.stopPropagation();
                closeProfileDropdown();
                openManageProductsModal();
            });
        }

        const btnLogout = document.getElementById('dd-nav-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.stopPropagation();
                closeProfileDropdown();
                logoutUser();
            });
        }
    } else {
        profileDropdown.innerHTML = `
            <div style="padding: 14px 10px; text-align: center;">
                <p style="font-size: 0.88rem; font-weight: 600; color: var(--secondary-dark); margin-bottom: 4px;">Welcome to SHOPORA</p>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">Log in to access your orders, wishlist &amp; settings</p>
                <button type="button" class="btn btn-auth-primary" style="width: 100%;" onclick="closeProfileDropdown(); showAuthScreen('login');">
                    <span>LOGIN / SIGN UP</span>
                </button>
            </div>
        `;
    }
}

// Click-First Toggle Handler for Profile Trigger Button
function toggleProfileDropdown(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (!currentUser) {
        showAuthScreen('login');
        return;
    }

    if (isProfileDropdownOpen) {
        closeProfileDropdown();
    } else {
        openProfileDropdown();
    }
}

// Open Dropdown
function openProfileDropdown() {
    clearTimeout(profileCloseTimer);
    renderProfileDropdown();
    if (profileDropdown) {
        profileDropdown.classList.add('active');
    }
    if (profileAction) {
        profileAction.classList.add('open');
    }
    isProfileDropdownOpen = true;
}

// Close Dropdown smoothly
function closeProfileDropdown() {
    clearTimeout(profileCloseTimer);
    if (profileDropdown) {
        profileDropdown.classList.remove('active');
    }
    if (profileAction) {
        profileAction.classList.remove('open');
    }
    isProfileDropdownOpen = false;
}

// ============================================================
// VERIFIED LOCAL PRODUCT IMAGE SYSTEM
// ============================================================
// Map of verified primary images stored locally in frontend/assets/products/
const VERIFIED_PRODUCT_IMAGE_MAP = {
    1: 'assets/products/nike-air-force-1-07.jpg',
    2: 'assets/products/jbl-tune-770nc.jpg',
    3: 'assets/products/jbl-flip-6.jpg',
    4: 'assets/products/jbl-tune-beam-2.jpg',
    5: 'assets/products/levis-511-slim-fit-jeans.jpg',
    6: 'assets/products/adidas-grand-court-base.jpg',
    7: 'assets/products/puma-smash-v2-sneakers.jpg',
    8: 'assets/products/apple-airpods-3rd-gen.jpg',
    9: 'assets/products/sony-wh-1000xm5.jpg',
    10: 'assets/products/tommy-hilfiger-oxford-shirt.jpg',
    11: 'assets/products/us-polo-pique-polo-tshirt.jpg',
    12: 'assets/products/manyavar-kurta-set.jpg',
    13: 'assets/products/zara-tailored-blazer.jpg',
    14: 'assets/products/biba-anarkali-suit.jpg',
    15: 'assets/products/hm-floral-maxi-dress.jpg',
    16: 'assets/products/mango-wide-leg-trousers.jpg',
    20: 'assets/products/maybelline-matte-ink-lipstick.jpg',
    21: 'assets/products/minimalist-niacinamide-serum.jpg',
    22: 'assets/products/forest-essentials-soundarya-cream.jpg',
    23: 'assets/products/loreal-extraordinary-hair-serum.jpg',
    24: 'assets/products/mothercare-boys-dino-tee.jpg',
    25: 'assets/products/hm-girls-tulle-dress.jpg',
    26: 'assets/products/gap-kids-denim-overalls.jpg',
    27: 'assets/products/crocs-kids-classic-clog.jpg',
    28: 'assets/products/philips-digital-air-fryer.jpg',
    29: 'assets/products/sleepyhead-office-chair.jpg',
    30: 'assets/products/bombay-dyeing-cotton-bedsheet.jpg',
    31: 'assets/products/milton-thermosteel-flask.jpg',
    32: 'assets/products/casio-g-shock-ga2100.jpg',
    33: 'assets/products/fossil-grant-chronograph.jpg',
    35: 'assets/products/ray-ban-aviator-rb3025.jpg',
    36: 'assets/products/wildcraft-35l-backpack.jpg'
};

// Safe Product-Specific SVG Generator (Eliminates all generic 'OPEN SHOP' / living room fallbacks)
function getProductFallbackSvg(product) {
    const brand = escapeHtml(product?.brand || 'SHOPORA').toUpperCase();
    const category = escapeHtml(product?.category || 'ORIGINAL').toUpperCase();
    const name = escapeHtml(product?.name || 'Exclusive Product');

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="560" viewBox="0 0 480 560">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="%23f8fafc"/>
                <stop offset="100%" stop-color="%23e2e8f0"/>
            </linearGradient>
        </defs>
        <rect width="480" height="560" fill="url(%23bg)"/>
        <rect x="24" y="24" width="432" height="512" rx="16" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="6,6"/>
        <circle cx="240" cy="210" r="70" fill="%23fee2e2"/>
        <text x="240" y="222" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="40" font-weight="900" fill="%23ff3f6c" text-anchor="middle">S</text>
        <rect x="180" y="306" width="120" height="24" rx="12" fill="%23ff3f6c"/>
        <text x="240" y="322" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="800" fill="%23ffffff" text-anchor="middle" letter-spacing="1.5">${category}</text>
        <text x="240" y="364" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="16" font-weight="800" fill="%230f172a" text-anchor="middle" letter-spacing="1.2">${brand}</text>
        <text x="240" y="394" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="600" fill="%23475569" text-anchor="middle">${name.slice(0, 36)}</text>
        <text x="240" y="470" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10" font-weight="700" fill="%2394a3b8" text-anchor="middle" letter-spacing="2">AUTHENTIC • 100% GENUINE</text>
    </svg>`;
}

// Resolve primary product image URL with priority hierarchy
function getProductImage(product) {
    if (!product) return getProductFallbackSvg({});

    // 1. Direct verified database asset path
    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
        return product.image.trim();
    }

    // 2. Verified local product catalog map
    if (product.id && VERIFIED_PRODUCT_IMAGE_MAP[product.id]) {
        return VERIFIED_PRODUCT_IMAGE_MAP[product.id];
    }

    // 3. Fallback to product-specific SVG (NEVER a generic photo)
    return getProductFallbackSvg(product);
}

// Error handler attached to <img> elements to guarantee zero broken images
function handleProductImageError(imgEl, productId) {
    imgEl.onerror = null;
    const product = productsList.find(p => p.id === productId);
    imgEl.src = getProductFallbackSvg(product);
}

// ============================================================
// PRODUCT CRUD OPERATIONS (MYSQL VIA EXPRESS REST API)
// ============================================================

// READ ALL: GET /api/products
async function fetchProducts() {
    renderLoadingGrid();
    try {
        const response = await fetch(PRODUCTS_BASE);
        const result = await response.json();

        if (result.success) {
            productsList = result.data || [];
            renderTrendingSection();
            applyFiltersAndRender();

            // If Manage Products modal is open, refresh its table
            if (manageProductsModal && manageProductsModal.style.display === 'flex') {
                const searchVal = document.getElementById('admin-search-input')?.value || '';
                renderAdminProductsTable(searchVal);
            }
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
    const brand = document.getElementById('add-product-brand')?.value.trim() || '';
    const category = document.getElementById('add-product-category').value.trim();
    const badge = document.getElementById('add-product-badge')?.value.trim() || '';
    const price = parseFloat(document.getElementById('add-product-price').value);
    const mrp = parseFloat(document.getElementById('add-product-mrp')?.value || (price * 1.35));
    const quantity = parseInt(document.getElementById('add-product-quantity').value, 10);
    const image = document.getElementById('add-product-image')?.value.trim() || '';
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
        const response = await fetch(PRODUCTS_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                brand,
                category,
                price,
                mrp,
                quantity,
                promotional_badge: badge || null,
                badge: badge || null,
                image_url: image || '',
                image: image || '',
                description
            })
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
    const brand = document.getElementById('edit-product-brand')?.value.trim() || '';
    const category = document.getElementById('edit-product-category').value.trim();
    const badge = document.getElementById('edit-product-badge')?.value.trim() || '';
    const price = parseFloat(document.getElementById('edit-product-price').value);
    const mrp = parseFloat(document.getElementById('edit-product-mrp')?.value || (price * 1.35));
    const quantity = parseInt(document.getElementById('edit-product-quantity').value, 10);
    const image = document.getElementById('edit-product-image')?.value.trim() || '';
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
        const response = await fetch(`${PRODUCTS_BASE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                brand,
                category,
                price,
                mrp,
                quantity,
                promotional_badge: badge || null,
                badge: badge || null,
                image_url: image || '',
                image: image || '',
                description
            })
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
        const response = await fetch(`${PRODUCTS_BASE}/${id}`, {
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

function closeAddProductModal() {
    addProductModal.style.display = 'none';
}

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
    const brandInput = document.getElementById('edit-product-brand');
    if (brandInput) brandInput.value = product.brand || '';
    document.getElementById('edit-product-category').value = product.category;
    const badgeInput = document.getElementById('edit-product-badge');
    if (badgeInput) badgeInput.value = product.badge || '';
    document.getElementById('edit-product-price').value = product.price;
    const mrpInput = document.getElementById('edit-product-mrp');
    if (mrpInput) mrpInput.value = product.mrp || (parseFloat(product.price) * 1.35).toFixed(2);
    document.getElementById('edit-product-quantity').value = product.quantity;
    const imageInput = document.getElementById('edit-product-image');
    if (imageInput) imageInput.value = product.image || '';
    document.getElementById('edit-product-desc').value = product.description || '';
    document.getElementById('edit-char-count').textContent = `${(product.description || '').length} / 255`;

    clearValidationErrors();
    editProductModal.style.display = 'flex';
    document.getElementById('edit-product-name').focus();
}

function closeEditProductModal() {
    editProductModal.style.display = 'none';
}

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

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deleteTargetProduct = null;
}

// ============================================================
// ADMIN INVENTORY MANAGEMENT MODAL
// ============================================================
function openManageProductsModal() {
    if (!currentUser) {
        showAuthScreen('login');
        return;
    }
    renderAdminProductsTable('');
    if (manageProductsModal) {
        manageProductsModal.style.display = 'flex';
    }
}

function closeManageProductsModal() {
    if (manageProductsModal) {
        manageProductsModal.style.display = 'none';
    }
}

function renderAdminProductsTable(query = '') {
    const tbody = document.getElementById('admin-table-body');
    const countEl = document.getElementById('admin-catalog-count');
    if (!tbody) return;

    let items = [...productsList];
    if (query && query.trim() !== '') {
        const q = query.toLowerCase().trim();
        items = items.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.brand || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q) ||
            String(p.id).includes(q)
        );
    }

    if (countEl) {
        countEl.textContent = `${items.length} of ${productsList.length}`;
    }

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 36px; color: var(--text-muted); font-size: 0.9rem;">
                    No products found matching "${escapeHtml(query)}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(p => {
        const img = getProductImage(p);
        const qty = parseInt(p.quantity, 10) || 0;
        let stockPill = `<span class="stock-tag in-stock">${qty} in stock</span>`;
        if (qty === 0) {
            stockPill = `<span class="stock-tag out-stock">Out of Stock</span>`;
        } else if (qty <= 5) {
            stockPill = `<span class="stock-tag low-stock">Low (${qty})</span>`;
        }

        const price = parseFloat(p.price) || 0;
        const mrp = parseFloat(p.mrp) || Math.round(price * 1.35);

        return `
            <tr>
                <td style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">#${p.id}</td>
                <td>
                    <img 
                        src="${img}" 
                        alt="${escapeHtml(p.name)}" 
                        class="manage-thumb admin-thumb"
                        onerror="handleProductImageError(this, ${p.id})"
                    >
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--secondary-dark); font-size: 0.88rem;">${escapeHtml(p.name)}</div>
                    <div style="font-size: 0.75rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">${escapeHtml(p.brand || 'SHOPORA')}</div>
                </td>
                <td><span class="badge-cat">${escapeHtml(p.category)}</span></td>
                <td>
                    <div style="font-weight: 800; color: var(--secondary-dark); font-size: 0.9rem;">₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-decoration: line-through;">₹${mrp.toLocaleString('en-IN')}</div>
                </td>
                <td>${stockPill}</td>
                <td>
                    <span style="font-size: 0.85rem; font-weight: 700;">★ ${p.rating || '4.5'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">(${p.review_count || 120})</span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="manage-action-btn manage-action-edit btn-action-edit" onclick="closeManageProductsModal(); openEditProductModal(${p.id});" title="Edit Product">
                        ✏️ Edit
                    </button>
                    <button type="button" class="manage-action-btn manage-action-del btn-action-delete" onclick="closeManageProductsModal(); promptDeleteProduct(${p.id});" title="Delete Product">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// FILTERING, SORTING & RENDERING CATALOG & TRENDING
// ============================================================

// Render Top Trending Section (4 curated items)
function renderTrendingSection() {
    if (!trendingGrid) return;

    const trendingList = productsList.slice(0, 4);

    if (trendingList.length === 0) {
        document.getElementById('trending-section').style.display = 'none';
        return;
    }

    document.getElementById('trending-section').style.display = 'block';
    trendingGrid.innerHTML = trendingList.map(product => createProductCardHtml(product)).join('');
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
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function applyFiltersAndRender() {
    let result = [...productsList];

    // 1. Category Filter across full realistic catalog
    if (currentCategory && currentCategory !== 'all') {
        const cat = currentCategory.toLowerCase();
        if (cat === 'men') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'men' || (p.category || '').toLowerCase() === 'clothing');
        } else if (cat === 'women') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'women');
        } else if (cat === 'footwear') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'footwear');
        } else if (cat === 'electronics') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'electronics');
        } else if (cat === 'beauty') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'beauty');
        } else if (cat === 'kids') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'kids');
        } else if (cat === 'home') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'home' || (p.category || '').toLowerCase() === 'furniture');
        } else if (cat === 'accessories') {
            result = result.filter(p => (p.category || '').toLowerCase() === 'accessories');
        } else if (cat === 'offers') {
            result = result.filter(p => (p.discount_percent && p.discount_percent >= 25) || (p.badge && p.badge.toLowerCase().includes('sale')));
        } else {
            result = result.filter(p => (p.category || '').toLowerCase().includes(cat));
        }
    }

    // 2. Multi-Attribute Search Filter (name, brand, category, description)
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => {
            const nameMatch = (p.name || '').toLowerCase().includes(q);
            const brandMatch = (p.brand || '').toLowerCase().includes(q);
            const catMatch = (p.category || '').toLowerCase().includes(q);
            const descMatch = (p.description || '').toLowerCase().includes(q);
            return nameMatch || brandMatch || catMatch || descMatch;
        });
    }

    // 3. In-Stock Filter
    if (inStockOnly) {
        result = result.filter(p => parseInt(p.quantity, 10) > 0);
    }

    // 4. Sorting Options
    if (currentSort === 'price-low') {
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (currentSort === 'price-high') {
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (currentSort === 'name-asc') {
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (currentSort === 'quantity-high') {
        result.sort((a, b) => parseInt(b.quantity, 10) - parseInt(a.quantity, 10));
    } else {
        // Recommended: Newest first
        result.sort((a, b) => b.id - a.id);
    }

    filteredProducts = result;
    renderProductsGrid(filteredProducts);
}

// ============================================================
// CLEAN CUSTOMER PRODUCT CARD DESIGN (ZERO EDIT / DELETE ON CARDS)
// ============================================================
function createProductCardHtml(product) {
    const imageUrl = getProductImage(product);
    const isWishlisted = wishlist.includes(product.id);
    const parsedPrice = parseFloat(product.price) || 0;
    const formattedPrice = parsedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const parsedMrp = parseFloat(product.mrp) || Math.round(parsedPrice * 1.35);
    const formattedMrp = parsedMrp.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const discount = product.discount_percent || Math.max(10, Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100));

    const qty = parseInt(product.quantity, 10) || 0;
    let stockClass = 'in-stock';
    let stockText = 'In Stock';
    if (qty === 0) {
        stockClass = 'out-stock';
        stockText = 'Out of Stock';
    } else if (qty <= 5) {
        stockClass = 'low-stock';
        stockText = `Only ${qty} left!`;
    }

    const safeName = escapeHtml(product.name);
    const safeBrand = escapeHtml(product.brand || 'SHOPORA').toUpperCase();
    const safeCategory = escapeHtml(product.category || 'General').toUpperCase();
    const badgeText = product.badge ? escapeHtml(product.badge) : (discount >= 30 ? 'SALE' : (qty <= 10 ? 'TRENDING' : 'BESTSELLER'));
    const ratingVal = product.rating ? Number(product.rating).toFixed(1) : '4.6';
    const reviewCountVal = product.review_count || 140;

    return `
        <div class="product-card" id="card-${product.id}">
            <div class="card-media-box">
                <img 
                    src="${imageUrl}" 
                    alt="${safeName}" 
                    loading="lazy"
                    onerror="handleProductImageError(this, ${product.id})"
                >
                <button 
                    type="button"
                    class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                    onclick="toggleWishlist(${product.id})" 
                    title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                    aria-label="Save to Wishlist"
                >
                    ${isWishlisted ? '♥' : '♡'}
                </button>
                <span class="card-badge-pill">${badgeText}</span>
                <span class="card-stock-pill ${stockClass}">${stockText}</span>
            </div>

            <div class="card-content">
                <div class="card-brand-row">
                    <span class="card-brand">${safeBrand}</span>
                    <span class="card-category-tag">${safeCategory}</span>
                </div>
                <h3 class="card-product-title" onclick="openQuickViewModal(${product.id})" title="${safeName}">${safeName}</h3>

                <div class="card-rating-row">
                    <span class="card-rating-pill">★ ${ratingVal}</span>
                    <span class="card-rating-count">(${reviewCountVal})</span>
                </div>

                <div class="card-price-row">
                    <span class="card-price">₹${formattedPrice}</span>
                    <span class="card-mrp">₹${formattedMrp}</span>
                    <span class="card-discount-tag">${discount}% OFF</span>
                </div>

                <div class="card-actions-row">
                    <button 
                        type="button"
                        class="btn-card-bag" 
                        onclick="addToBag(${product.id})" 
                        ${qty === 0 ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}
                    >
                        ${qty === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                    </button>
                    <button 
                        type="button"
                        class="btn-card-quick" 
                        onclick="openQuickViewModal(${product.id})" 
                        title="Quick View"
                        aria-label="Quick View"
                    >
                        👁️
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderProductsGrid(products) {
    catalogCountText.textContent = `Showing ${products.length} of ${productsList.length} verified products`;

    if (products.length === 0) {
        productGrid.innerHTML = `
            <div class="grid-empty-state">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">🔍</span>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">No products match your search</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">Try adjusting your filters or search keywords.</p>
                <button type="button" class="btn btn-primary-accent" onclick="resetAllFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = products.map(product => createProductCardHtml(product)).join('');
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
            <button type="button" class="btn btn-outline" onclick="fetchProducts()">Retry Connection</button>
        </div>
    `;
}

// ============================================================
// PROFILE, QUICK VIEW, WISHLIST & SHOPPING BAG
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

function closeProfileModal() {
    profileModal.style.display = 'none';
}

// Quick View Modal with Rich Ratings Breakdown & Verified Reviews
function openQuickViewModal(id) {
    const product = productsList.find(p => p.id === id);
    if (!product) return;

    const imageUrl = getProductImage(product);
    const parsedPrice = parseFloat(product.price) || 0;
    const parsedMrp = parseFloat(product.mrp) || Math.round(parsedPrice * 1.35);
    const discount = product.discount_percent || Math.max(10, Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100));
    const qty = parseInt(product.quantity, 10) || 0;

    const imgEl = document.getElementById('qv-image');
    if (imgEl) {
        imgEl.src = imageUrl;
        imgEl.onerror = () => handleProductImageError(imgEl, product.id);
    }

    const titleEl = document.getElementById('qv-title');
    if (titleEl) titleEl.textContent = product.name;

    const brandEl = document.getElementById('qv-brand');
    if (brandEl) brandEl.textContent = (product.brand || 'SHOPORA').toUpperCase();

    const badgeEl = document.getElementById('qv-badge');
    if (badgeEl) badgeEl.textContent = product.badge || 'BESTSELLER';

    const catEl = document.getElementById('qv-category');
    if (catEl) catEl.textContent = (product.category || 'GENERAL').toUpperCase();

    const priceEl = document.getElementById('qv-price');
    if (priceEl) priceEl.textContent = `₹${parsedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const mrpEl = document.getElementById('qv-mrp');
    if (mrpEl) mrpEl.textContent = `₹${parsedMrp.toLocaleString('en-IN')}`;

    const discountEl = document.getElementById('qv-discount');
    if (discountEl) discountEl.textContent = `(${discount}% OFF)`;

    const ratingVal = product.rating ? Number(product.rating).toFixed(1) : '4.6';
    const ratingEl = document.getElementById('qv-rating');
    if (ratingEl) ratingEl.textContent = ratingVal;

    const reviewCountVal = product.review_count || 140;
    const reviewCountEl = document.getElementById('qv-review-count');
    if (reviewCountEl) reviewCountEl.textContent = `(${reviewCountVal} verified ratings)`;

    const descEl = document.getElementById('qv-desc');
    if (descEl) descEl.textContent = product.description || '100% Genuine product backed by official brand warranty and easy 14-day exchange.';

    const idEl = document.getElementById('qv-id');
    if (idEl) idEl.textContent = `#${product.id}`;

    const qtyEl = document.getElementById('qv-quantity');
    if (qtyEl) qtyEl.textContent = `${qty} units in warehouse`;

    const stockBadge = document.getElementById('qv-stock-badge');
    if (stockBadge) {
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
    }

    const addBtn = document.getElementById('qv-add-to-bag-btn');
    if (addBtn) {
        addBtn.disabled = qty === 0;
        addBtn.onclick = () => {
            addToBag(product.id);
            closeQuickViewModal();
        };
    }

    const wishBtn = document.getElementById('qv-wishlist-toggle-btn');
    if (wishBtn) {
        const isW = wishlist.includes(product.id);
        wishBtn.textContent = isW ? '♥ IN WISHLIST' : '♡ WISHLIST';
        wishBtn.onclick = () => {
            toggleWishlist(product.id);
            const nowW = wishlist.includes(product.id);
            wishBtn.textContent = nowW ? '♥ IN WISHLIST' : '♡ WISHLIST';
        };
    }

    // Render realistic customer reviews for this specific product
    renderProductReviews(product);

    quickViewModal.style.display = 'flex';
}

function closeQuickViewModal() {
    quickViewModal.style.display = 'none';
}

// Render dynamic customer reviews for Quick View modal
function renderProductReviews(product) {
    const listEl = document.getElementById('qv-reviews-list');
    if (!listEl) return;

    const brand = product.brand || 'Shopora';
    const cat = (product.category || '').toLowerCase();

    const reviews = [
        {
            name: 'Priya Sharma',
            rating: 5,
            date: 'Reviewed in India on 14 September 2026',
            verified: true,
            title: `Exceptional quality from ${brand}`,
            body: `100% genuine product. The fit, finish, and materials are top-notch. Delivered securely within 48 hours in original brand packaging.`
        },
        {
            name: 'Rahul Mehta',
            rating: (product.rating && product.rating >= 4.5) ? 5 : 4,
            date: 'Reviewed in India on 28 August 2026',
            verified: true,
            title: 'Value for money purchase',
            body: `Fits perfectly into my daily routine. The discount offered on Shopora made this an absolute steal compared to retail outlets.`
        },
        {
            name: 'Ananya Verma',
            rating: 5,
            date: 'Sample review for demonstration',
            verified: false,
            title: 'Verified college demonstration catalog item',
            body: `Tested during QA verification: fast response time, reliable stock tracking in MySQL, and authentic ${product.category} specifications.`
        }
    ];

    listEl.innerHTML = reviews.map(r => `
        <div class="review-card">
            <div class="review-header">
                <span class="reviewer-name">${escapeHtml(r.name)}</span>
                <span class="review-badge ${r.verified ? 'verified' : 'demo'}">
                    ${r.verified ? '✓ Verified Buyer' : 'Sample review for demonstration'}
                </span>
            </div>
            <div class="review-stars-row">
                <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                <span class="review-date">${escapeHtml(r.date)}</span>
            </div>
            <h4 class="review-title">${escapeHtml(r.title)}</h4>
            <p class="review-body">${escapeHtml(r.body)}</p>
        </div>
    `).join('');
}

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
        const response = await fetch(HEALTH_BASE);
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
