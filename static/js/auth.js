// Authentication module for AI Timetable Generator

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupAuthForms();
});

function initializeAuth() {
    // Check if user is already logged in and on index page
    if (window.location.pathname === '/' && isLoggedIn()) {
        window.location.href = '/dashboard';
        return;
    }

    // Update navbar based on auth status
    updateNavbar();
}

function updateNavbar() {
    const navbarUser = document.getElementById('navbar-user');
    if (!navbarUser) return;

    if (isLoggedIn()) {
        const user = getCurrentUser();
        navbarUser.innerHTML = `
            <span class="navbar-text me-3">Welcome, ${user.username}!</span>
            <button class="btn btn-outline-light btn-sm" onclick="logout()">
                <i class="fas fa-sign-out-alt me-1"></i>Logout
            </button>
        `;
    } else {
        navbarUser.innerHTML = `
            <button class="btn btn-outline-light btn-sm me-2" onclick="showLoginForm()">
                <i class="fas fa-sign-in-alt me-1"></i>Login
            </button>
            <button class="btn btn-light btn-sm" onclick="showSignupForm()">
                <i class="fas fa-user-plus me-1"></i>Sign Up
            </button>
        `;
    }
}

function setupAuthForms() {
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Setup signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Setup password confirmation validation
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
}

function showLoginForm() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    
    if (signupModal) {
        signupModal.hide();
    }
    
    loginModal.show();
}

function showSignupForm() {
    const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    
    if (loginModal) {
        loginModal.hide();
    }
    
    signupModal.show();
}

function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    if (!validateForm(form)) {
        return;
    }

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate input
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Get users from storage
    const users = getFromStorage('aitt-users') || [];
    
    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        showToast('User not found. Please check your email or sign up.', 'error');
        return;
    }

    // Simple password verification (in production, use proper hashing)
    if (user.password !== password) {
        showToast('Invalid password. Please try again.', 'error');
        return;
    }

    // Create session
    const session = {
        userId: user.id,
        loginAt: new Date().toISOString(),
        token: generateId() // Simple token generation
    };

    if (saveToStorage('aitt-session', session)) {
        showToast('Login successful! Redirecting...', 'success');
        
        // Close modal and redirect
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();
        
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1000);
    } else {
        showToast('Login failed. Please try again.', 'error');
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const form = event.target;
    if (!validateForm(form)) {
        return;
    }

    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate input
    if (!username || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Validate password match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    // Validate password strength
    if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    // Get existing users
    const users = getFromStorage('aitt-users') || [];
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showToast('Email already registered. Please use a different email or login.', 'error');
        return;
    }

    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        showToast('Username already taken. Please choose a different username.', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: generateId(),
        username: username,
        email: email,
        password: password, // In production, hash this password
        createdAt: new Date().toISOString()
    };

    // Add to users array
    users.push(newUser);

    // Save to storage
    if (saveToStorage('aitt-users', users)) {
        showToast('Account created successfully! You can now login.', 'success');
        
        // Close signup modal and show login modal
        const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
        signupModal.hide();
        
        // Reset signup form
        resetForm(form);
        
        // Auto-fill login form
        setTimeout(() => {
            document.getElementById('loginEmail').value = email;
            showLoginForm();
        }, 500);
    } else {
        showToast('Registration failed. Please try again.', 'error');
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmField = document.getElementById('confirmPassword');

    if (confirmPassword && password !== confirmPassword) {
        confirmField.setCustomValidity('Passwords do not match');
        confirmField.classList.add('is-invalid');
    } else {
        confirmField.setCustomValidity('');
        confirmField.classList.remove('is-invalid');
    }
}

// Password strength indicator
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) {
        strength += 25;
    } else {
        feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('Lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('Uppercase letter');
    }

    if (/[0-9]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('Number');
    }

    return { strength, feedback };
}

// Add password strength indicator to signup form
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('signupPassword');
    if (passwordInput) {
        // Create strength indicator
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength mt-2';
        strengthIndicator.innerHTML = `
            <div class="progress" style="height: 5px;">
                <div class="progress-bar" id="strengthBar" role="progressbar" style="width: 0%"></div>
            </div>
            <small class="text-muted" id="strengthText">Enter a password</small>
        `;
        
        passwordInput.parentNode.appendChild(strengthIndicator);

        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const { strength, feedback } = checkPasswordStrength(password);
            
            const progressBar = document.getElementById('strengthBar');
            const strengthText = document.getElementById('strengthText');
            
            if (password.length === 0) {
                progressBar.style.width = '0%';
                progressBar.className = 'progress-bar';
                strengthText.textContent = 'Enter a password';
                return;
            }
            
            progressBar.style.width = strength + '%';
            
            if (strength < 50) {
                progressBar.className = 'progress-bar bg-danger';
                strengthText.textContent = 'Weak - ' + feedback.join(', ');
            } else if (strength < 75) {
                progressBar.className = 'progress-bar bg-warning';
                strengthText.textContent = 'Medium - ' + feedback.join(', ');
            } else {
                progressBar.className = 'progress-bar bg-success';
                strengthText.textContent = 'Strong password';
            }
        });
    }
});

// Social login placeholder (for future implementation)
function initializeSocialLogin() {
    // Placeholder for Google/Facebook login integration
    console.log('Social login initialization placeholder');
}

// Remember me functionality
function handleRememberMe(userId) {
    const rememberCheckbox = document.getElementById('rememberMe');
    if (rememberCheckbox && rememberCheckbox.checked) {
        // Store user preference (simplified - in production use secure methods)
        saveToStorage('aitt-remember', userId);
    }
}

// Auto-login if remembered
function checkRememberedUser() {
    const rememberedUserId = getFromStorage('aitt-remember');
    if (rememberedUserId && !isLoggedIn()) {
        const users = getFromStorage('aitt-users') || [];
        const user = users.find(u => u.id === rememberedUserId);
        
        if (user) {
            // Auto-fill email in login form
            const emailField = document.getElementById('loginEmail');
            if (emailField) {
                emailField.value = user.email;
            }
        }
    }
}

// Initialize remember me check
document.addEventListener('DOMContentLoaded', function() {
    checkRememberedUser();
});

// Export authentication functions for global use
window.AuthModule = {
    showLoginForm,
    showSignupForm,
    handleLogin,
    handleSignup,
    validatePasswordMatch,
    checkPasswordStrength
};
