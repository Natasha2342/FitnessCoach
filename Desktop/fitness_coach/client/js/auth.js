// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    // Define public and protected routes
    const publicRoutes = ['/', '/login', '/signup'];
    const protectedRoutes = ['/workouts', '/progress', '/chat'];
    
    // If user is logged in and tries to access login/signup pages, redirect to home
    if (token && (currentPath === '/login' || currentPath === '/signup')) {
        window.location.href = '/';
        return;
    }
    
    // If user is not logged in and tries to access protected pages, redirect to login
    if (!token && protectedRoutes.includes(currentPath)) {
        window.location.href = '/login';
        return;
    }

    // Update UI based on auth state
    const logoutBtn = document.getElementById('logout-btn');
    const authLinks = document.querySelector('.auth-links');
    
    if (token) {
        // User is logged in
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (authLinks) {
            authLinks.querySelector('a[href="/login"]').style.display = 'none';
            authLinks.querySelector('a[href="/signup"]').style.display = 'none';
        }
    } else {
        // User is not logged in
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (authLinks) {
            authLinks.querySelector('a[href="/login"]').style.display = 'inline-block';
            authLinks.querySelector('a[href="/signup"]').style.display = 'inline-block';
        }
    }
}

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Update auth state
            updateAuthUI();

            // Redirect to workouts page
            window.location.href = '/workouts';
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = error.message || 'Login failed. Please try again.';
            loginForm.insertBefore(errorMessage, loginForm.firstChild);
            
            // Remove error message after 3 seconds
            setTimeout(() => {
                errorMessage.remove();
            }, 3000);
        }
    });
}

// Handle signup form submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        console.log('Attempting signup for email:', email);

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log('Signup response:', { status: response.status, ok: response.ok, data });

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Signup successful, token stored');

            // Redirect to dashboard
            window.location.href = '/';
        } catch (error) {
            console.error('Signup error:', error);
            alert(error.message || 'Signup failed. Please try again.');
        }
    });
}

// Handle logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    });
}

// Add auth token to all API requests
function addAuthHeader(headers = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Check auth on page load
checkAuth();

// Auth state management
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const authLinks = document.querySelector('.auth-links');
    const logoutBtn = document.getElementById('logout-btn');
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');

    if (token) {
        // Show full navigation for logged-in users
        if (navbar) navbar.style.display = 'flex';
        navLinks.forEach(link => {
            if (!link.closest('.auth-links')) {
                link.style.display = 'flex';
            }
        });
        if (authLinks) {
            authLinks.innerHTML = `
                <button id="logout-btn" class="btn btn-danger"><i class="fas fa-sign-out-alt"></i> Logout</button>
            `;
            const newLogoutBtn = document.getElementById('logout-btn');
            if (newLogoutBtn) {
                newLogoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('token');
                    window.location.href = '/';
                });
            }
        }
    } else {
        // Show limited navigation for non-logged in users
        if (navbar) navbar.style.display = 'flex';
        navLinks.forEach(link => {
            if (!link.closest('.auth-links') && !['/', '/login', '/signup'].includes(link.getAttribute('href'))) {
                link.style.display = 'none';
            }
        });
        if (authLinks) {
            authLinks.innerHTML = `
                <a href="/login" class="nav-link"><i class="fas fa-sign-in-alt"></i> Login</a>
                <a href="/signup" class="nav-link"><i class="fas fa-user-plus"></i> Sign Up</a>
            `;
        }
    }
}

// Initialize auth UI when DOM loads
document.addEventListener('DOMContentLoaded', updateAuthUI);

// Export for use in other files
window.updateAuthUI = updateAuthUI; 