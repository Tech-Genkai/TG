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

// Set active page in sidebar
function setActivePage() {
    // Get current path
    const currentPath = window.location.pathname;
    
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    
    // Get all navbar icons
    const navbarIcons = document.querySelectorAll('.nav-icons a');
    
    // Remove active class from all links and icons
    sidebarLinks.forEach(link => link.classList.remove('active'));
    navbarIcons.forEach(icon => icon.classList.remove('active'));
    
    // Function to check and mark active link
    const checkAndMarkActive = (element, href) => {
        // Special case for home page
        if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
            element.classList.add('active');
        }
        // Special case for profile-related pages
        else if (href === '/profile' && (currentPath.startsWith('/profile') || currentPath.startsWith('/user-profile'))) {
            element.classList.add('active');
        }
        // Special case for messages
        else if (href === '/messages' && currentPath.startsWith('/messages')) {
            element.classList.add('active');
        }
        // Special case for friends
        else if (href === '/friends' && currentPath.startsWith('/friends')) {
            element.classList.add('active');
        }
        // Exact match for other pages
        else if (href === currentPath) {
            element.classList.add('active');
        }
    };
    
    // Add active class to current page link in sidebar
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        checkAndMarkActive(link, href);
    });
    
    // Add active class to current page icon in navbar
    navbarIcons.forEach(icon => {
        const href = icon.getAttribute('href');
        checkAndMarkActive(icon, href);
    });
}

// Initialize search functionality
function initializeSearch() {
    const searchBar = document.querySelector('.search-bar input');
    if (!searchBar) return;
    
    // Create a dropdown container for search results
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.display = 'none';
    document.querySelector('.search-bar').appendChild(searchResults);
    
    // Add event listener for the search bar
    let debounceTimeout;
    searchBar.addEventListener('input', function() {
        // Clear previous timeout
        clearTimeout(debounceTimeout);
        const query = this.value.trim();
        
        // Hide results if query is too short
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        // Set shorter debounce time for faster response
        debounceTimeout = setTimeout(() => {
            searchUsers(query);
        }, 200); // Reduced from 300ms to 200ms
    });
    
    // Also trigger search on focus if there's content
    searchBar.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            searchUsers(query);
        }
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.search-bar')) {
            searchResults.style.display = 'none';
        }
    });
    
    // Function to search for users
    async function searchUsers(query) {
        try {
            const username = localStorage.getItem('username');
            if (!username) return;
            
            // Show loading indicator
            searchResults.innerHTML = '<div class="no-results">Searching...</div>';
            searchResults.style.display = 'block';
            
            const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-username': username
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            displaySearchResults(data.users);
        } catch (error) {
            console.error('Error searching for users:', error);
            searchResults.innerHTML = '<div class="no-results">Error searching</div>';
            searchResults.style.display = 'block';
        }
    }
    
    // Function to display search results
    function displaySearchResults(users) {
        searchResults.innerHTML = '';
        
        if (users.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No users found</div>';
            searchResults.style.display = 'block';
            return;
        }
        
        users.forEach(user => {
            const userItem = document.createElement('a');
            userItem.className = 'search-result-item';
            userItem.href = user.isCurrentUser ? '/profile' : `/user/${user.username}`;
            
            const userImg = document.createElement('img');
            userImg.src = user.profilePic;
            userImg.alt = user.displayName;
            userImg.className = 'search-result-img';
            
            const userInfo = document.createElement('div');
            userInfo.className = 'search-result-info';
            
            const displayName = document.createElement('div');
            displayName.className = 'search-result-name';
            displayName.textContent = user.displayName;
            
            const username = document.createElement('div');
            username.className = 'search-result-username';
            username.textContent = '@' + user.username;
            
            userInfo.appendChild(displayName);
            userInfo.appendChild(username);
            
            userItem.appendChild(userImg);
            userItem.appendChild(userInfo);
            
            searchResults.appendChild(userItem);
        });
        
        searchResults.style.display = 'block';
    }
}

// Add search functionality to the search bar
document.addEventListener('DOMContentLoaded', function() {
    // Initialize search functionality
    initializeSearch();
    
    // Set active page in sidebar
    setActivePage();
});

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
        // Update active page indicator when returning to the page
        setActivePage();
    }
}); 