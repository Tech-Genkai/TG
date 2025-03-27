// Function to check if user is logged in
function isLoggedIn() {
    // Check for login status in localStorage (or sessionStorage)
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Redirect if not logged in
function checkLoginStatus() {
    // If we're not on the login or signup page and user is not logged in, redirect to login
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage === '/login' || currentPage === '/signup';
    
    if (!isLoginPage && !isLoggedIn()) {
        // Force redirect to login page
        window.location.replace('/login');
        return false;
    }
    return true;
}

// Set login status (call this after successful login)
function setLoginStatus(status) {
    localStorage.setItem('isLoggedIn', status);
}

// Run on page load
window.onload = function() {
    // First check authentication before doing anything else
    if (checkLoginStatus()) {
        showSuccessModal();
        // Profile updates are now handled by profileManager
    }
};

// Add event listener for page visibility changes (handles when user uses back button)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page is now visible again (after using back button)
        checkLoginStatus();
    }
}); 