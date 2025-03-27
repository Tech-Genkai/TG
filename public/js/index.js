document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
        return;
    }

    if (sessionStorage.getItem('justLoggedIn') === 'true') {
        // Show welcome notification
        notifications.success("Welcome Back!", "Welcome back to your account.");
        // Clear the flag
        sessionStorage.removeItem('justLoggedIn');
    }
}); 