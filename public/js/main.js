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

// Replace "Profile" text with username in sidebar
function updateProfileName() {
    // Only proceed if user is logged in
    if (!isLoggedIn()) return;
    
    const username = localStorage.getItem('username');
    
    if (username) {
        // Find the profile link in sidebar
        const profileLinks = document.querySelectorAll('.sidebar a');
        
        profileLinks.forEach(link => {
            // Check if this is the profile link
            if (link.textContent.includes('Profile')) {
                // Keep the image but replace the text
                const img = link.querySelector('img');
                link.innerHTML = '';
                link.appendChild(img);
                link.appendChild(document.createTextNode(username));
            }
        });
    }
}

// Show success modal only if user is newly logged in
function showSuccessModal() {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
    
    if (justLoggedIn && document.getElementById('successModal')) {
        // Display the modal
        document.getElementById('successModal').style.display = 'flex';
        
        // Clear the flag so modal won't show on refresh
        sessionStorage.removeItem('justLoggedIn');
        
        // Automatically close after 3 seconds
        setTimeout(function() {
            closeModal();
        }, 3000);
    }
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Set login status (call this after successful login)
function setLoginStatus(status) {
    localStorage.setItem('isLoggedIn', status);
}

// Function to update profile picture
async function updateProfilePicture() {
    const username = localStorage.getItem('username');
    if (!username) return;

    try {
        const response = await fetch(`/api/profile?username=${username}`);
        if (!response.ok) throw new Error('Failed to fetch profile data');
        
        const data = await response.json();
        const profileLink = document.querySelector('a[href="/profile"]');
        if (profileLink) {
            const img = profileLink.querySelector('img');
            if (img) {
                img.src = data.profilePic;
                img.alt = data.displayName;
            }
            // Update the text content after the image
            const textNode = profileLink.childNodes[1];
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = data.displayName;
            }
        }
    } catch (error) {
        console.error('Error updating profile picture:', error);
    }
}

// Run on page load
window.onload = function() {
    // First check authentication before doing anything else
    if (checkLoginStatus()) {
        showSuccessModal();
        updateProfileName();
        updateProfilePicture();
    }
};

// Add event listener for page visibility changes (handles when user uses back button)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page is now visible again (after using back button)
        checkLoginStatus();
    }
}); 