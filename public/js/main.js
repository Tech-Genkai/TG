// Function to check if user is logged in
function isLoggedIn() {
    // Check for login status in localStorage (or sessionStorage)
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Check if registration is pending
function isRegistrationPending() {
    return localStorage.getItem('registrationPending') === 'true';
}

// Redirect if not logged in or if registration is pending but not on registration page
function checkLoginStatus() {
    // If we're not on the login or signup page and user is not logged in, redirect to login
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage === '/login' || currentPage === '/signup' || currentPage === '/register';
    const isAccountSwitchPage = currentPage === '/account-switch';
    
    // First check if logged in
    if (!isLoginPage && !isAccountSwitchPage && !isLoggedIn()) {
        // Force redirect to login page
        window.location.replace('/login');
        return false;
    }
    
    // Then check if registration is pending but we're not on registration page
    if (isLoggedIn() && isRegistrationPending() && currentPage !== '/register') {
        // Force redirect to registration page
        window.location.replace('/register');
        return false;
    }
    
    return true;
}

// Set login status (call this after successful login)
function setLoginStatus(status) {
    localStorage.setItem('isLoggedIn', status);
    
    // If logging in, initialize account management
    if (status === 'true') {
        initializeAccountStorage();
    }
}

// Initialize account storage for first login or when active accounts don't exist
function initializeAccountStorage() {
    // Check if active accounts exist
    const activeAccountsJSON = localStorage.getItem('activeAccounts');
    
    // If no active accounts exist, create storage with current user
    if (!activeAccountsJSON) {
        const username = localStorage.getItem('username');
        const displayName = localStorage.getItem('displayName') || 'Unknown User';
        const profilePic = localStorage.getItem('profilePic') || '/images/default-profile.png';
        
        if (username) {
            const currentAccount = {
                username,
                displayName,
                profilePic,
                lastActive: Date.now()
            };
            
            localStorage.setItem('activeAccounts', JSON.stringify([currentAccount]));
        }
    } else {
        // If active accounts exist, check if current user is in the list
        const activeAccounts = JSON.parse(activeAccountsJSON);
        const username = localStorage.getItem('username');
        
        if (username) {
            const exists = activeAccounts.some(account => account.username === username);
            
            if (!exists) {
                // Add current user to active accounts
                const currentAccount = {
                    username,
                    displayName: localStorage.getItem('displayName') || 'Unknown User',
                    profilePic: localStorage.getItem('profilePic') || '/images/default-profile.png',
                    lastActive: Date.now()
                };
                
                activeAccounts.push(currentAccount);
                localStorage.setItem('activeAccounts', JSON.stringify(activeAccounts));
            }
        }
    }
}

// Set active page in sidebar
function setActivePage() {
    try {
        // Get current path
        const currentPath = window.location.pathname;
        
        // Log the current path for debugging
        console.log('Current path:', currentPath);
        
        // Find all navigation elements that could be highlighted
        let sidebarLinks = [];
        let navbarIcons = [];
        
        // Try to find sidebar links using various selectors
        const sidebarSelectors = [
            '.sidebar a',
            'nav a',
            '.nav a',
            '#sidebar a',
            'aside a',
            '[class*="sidebar"] a',
            '[class*="nav"] a'
        ];
        
        // Try each selector until we find some links
        for (const selector of sidebarSelectors) {
            try {
                const links = document.querySelectorAll(selector);
                if (links && links.length > 0) {
                    sidebarLinks = Array.from(links);
                    console.log(`Found ${links.length} sidebar links using selector: ${selector}`);
                    break;
                }
            } catch (err) {
                console.warn(`Error with selector ${selector}:`, err);
            }
        }
        
        // Try to find navbar icons using various selectors
        const navbarSelectors = [
            '.nav-icons a',
            'header a', 
            'nav:first-of-type a',
            '.navbar a',
            '[class*="header"] a',
            '[class*="topbar"] a'
        ];
        
        // Try each selector until we find some icons
        for (const selector of navbarSelectors) {
            try {
                const icons = document.querySelectorAll(selector);
                if (icons && icons.length > 0) {
                    navbarIcons = Array.from(icons);
                    console.log(`Found ${icons.length} navbar icons using selector: ${selector}`);
                    break;
                }
            } catch (err) {
                console.warn(`Error with selector ${selector}:`, err);
            }
        }
        
        // Direct handling for specific pages
        if (currentPath === '/messages' || currentPath.startsWith('/messages/')) {
            console.log('Messages page detected, setting active class directly');
            
            // Clear any existing active classes
            document.querySelectorAll('a.active').forEach(a => {
                a.classList.remove('active');
            });
            
            // Find and highlight the messages link in sidebar
            const messagesLink = document.querySelector('.sidebar a[href="/messages"]');
            if (messagesLink) {
                messagesLink.classList.add('active');
                console.log('Added active class to messages link:', messagesLink);
                return;
            }
            
            // Fallback to finding by content
            const messageLinks = Array.from(document.querySelectorAll('.sidebar a')).filter(a => {
                const text = a.textContent?.trim();
                const img = a.querySelector('img');
                const alt = img ? img.getAttribute('alt') : '';
                const containsMessages = text === 'Messages' || text?.includes('Messages') || 
                                        alt === 'Messages' || alt?.includes('Messages');
                return containsMessages;
            });
            
            if (messageLinks.length > 0) {
                messageLinks[0].classList.add('active');
                console.log('Added active class to messages link by content:', messageLinks[0]);
                return;
            }
        }
        
        // Remove active class from all links before adding it to the matching one
        sidebarLinks.forEach(link => {
            if (link && link.classList) link.classList.remove('active');
        });
        navbarIcons.forEach(icon => {
            if (icon && icon.classList) icon.classList.remove('active');
        });
        
        // Function to check if a link matches the current path
        const matchesPath = (link, path) => {
            if (!link) return false;
            
            try {
                const href = link.getAttribute('href');
                if (!href) return false;
                
                // Log the href for debugging
                console.log(`Checking link: ${href} against path: ${path}`);
                
                // Check for exact match
                if (href === path) return true;
                
                // Check for home page special case
                if ((href === '/' || href === '/index.html') && 
                    (path === '/' || path === '/index.html')) {
                    return true;
                }
                
                // Check for path prefix match for non-home pages
                if (href !== '/' && path.startsWith(href)) return true;
                
                // Special case for messages
                if ((href === '/messages' || href.includes('messages')) && 
                    (path.includes('messages') || path.includes('private-messages'))) {
                    return true;
                }
                
                // Special case for profile
                if ((href === '/profile' || href.includes('profile')) && 
                    (path.includes('profile') || path.includes('user-profile'))) {
                    return true;
                }
                
                return false;
            } catch (err) {
                console.warn('Error matching path for link:', err);
                return false;
            }
        };
        
        // Try to match sidebar links
        let foundSidebarMatch = false;
        for (const link of sidebarLinks) {
            if (matchesPath(link, currentPath)) {
                try {
                    if (link.classList) {
                        link.classList.add('active');
                        console.log('Added active class to sidebar link:', link);
                        foundSidebarMatch = true;
                        break;
                    }
                } catch (err) {
                    console.warn('Error adding active class to sidebar link:', err);
                }
            }
        }
        
        // Try to match navbar icons
        let foundNavbarMatch = false;
        for (const icon of navbarIcons) {
            if (matchesPath(icon, currentPath)) {
                try {
                    if (icon.classList) {
                        icon.classList.add('active');
                        console.log('Added active class to navbar icon:', icon);
                        foundNavbarMatch = true;
                        break;
                    }
                } catch (err) {
                    console.warn('Error adding active class to navbar icon:', err);
                }
            }
        }
        
    } catch (error) {
        console.error('Error in setActivePage:', error);
    }
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

// Setup headers for API requests
function setupHeaders() {
    // Add authorization headers to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // Create headers if they don't exist
        if (!options.headers) {
            options.headers = {};
        }
        
        // Add current user to headers if logged in
        const username = localStorage.getItem('username');
        if (username) {
            options.headers['x-username'] = username;
        }
        
        // Add registration pending flag if applicable
        if (isRegistrationPending()) {
            options.headers['x-registration-pending'] = 'true';
        }
        
        return originalFetch(url, options);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check login status - this will redirect if needed
    if (!checkLoginStatus()) return;
    
    // Setup headers for API requests
    setupHeaders();
    
    // Set active page in navigation
    setActivePage();
    
    // Initialize search if present
    initializeSearch();
});

// Add event listener for page visibility changes (handles when user uses back button)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page is now visible again (after using back button)
        checkLoginStatus();
        // Update active page indicator when returning to the page
        setActivePage();
    }
}); 