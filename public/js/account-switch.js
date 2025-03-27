// Account Switching Functionality
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Account switch page loaded');
    
    // Try to load profile data if available
    if (typeof profileManager !== 'undefined') {
        try {
            const userData = await profileManager.fetchProfileData();
            if (userData) {
                console.log('Profile data fetched successfully:', userData);
                
                // Update localStorage with fetched data if needed
                if (userData.displayName) {
                    localStorage.setItem('displayName', userData.displayName);
                }
                
                if (userData.profilePic) {
                    localStorage.setItem('profilePic', userData.profilePic);
                }
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    }
    
    // Initialize UI
    initializeAccountSwitcher();
});

// Initialize the account switching UI
function initializeAccountSwitcher() {
    console.log('Initializing account switcher');
    
    // Try to load profile data if on account-switch page
    const currentUser = localStorage.getItem('username');
    if (currentUser) {
        console.log('Current user found:', currentUser);
    }
    
    // Check for existing display name - debug
    const displayName = localStorage.getItem('displayName');
    if (displayName) {
        console.log('Display name found:', displayName);
    } else {
        console.log('No display name found for user:', currentUser);
    }
    
    // Load accounts data
    loadAccounts();
    
    // Initialize password modal events
    initializePasswordModal();
}

// Load active and recent accounts
function loadAccounts() {
    const activeAccountsContainer = document.getElementById('activeAccounts');
    const recentAccountsContainer = document.getElementById('recentAccounts');
    
    if (!activeAccountsContainer || !recentAccountsContainer) return;
    
    // Get accounts from localStorage
    const activeAccounts = getActiveAccounts();
    const recentAccounts = getRecentAccounts();
    
    // Display active accounts
    if (activeAccounts.length > 0) {
        activeAccountsContainer.innerHTML = '';
        activeAccounts.forEach(account => {
            activeAccountsContainer.appendChild(createAccountItem(account, true));
        });
    } else {
        activeAccountsContainer.innerHTML = '<div class="no-accounts">No active accounts</div>';
    }
    
    // Display recent accounts
    if (recentAccounts.length > 0) {
        recentAccountsContainer.innerHTML = '';
        recentAccounts.forEach(account => {
            recentAccountsContainer.appendChild(createAccountItem(account, false));
        });
    } else {
        recentAccountsContainer.innerHTML = '<div class="no-accounts">No recent accounts</div>';
    }
}

// Get active accounts from localStorage
function getActiveAccounts() {
    try {
        // In a real app, this would come from a more secure storage like sessions
        // For demo purposes, we're using localStorage
        const activeAccountsJSON = localStorage.getItem('activeAccounts');
        
        if (activeAccountsJSON) {
            const accounts = JSON.parse(activeAccountsJSON);
            
            // Add current account if not already in the list
            const username = localStorage.getItem('username');
            if (!username) return accounts;
            
            // Get profile data for current user more comprehensively
            const displayName = localStorage.getItem('displayName');
            
            // Handle profile picture correctly
            let profilePic = '/images/default-profile.png';
            const storedProfilePic = localStorage.getItem('profilePic');
            if (storedProfilePic && 
                storedProfilePic !== 'undefined' && 
                storedProfilePic !== 'null') {
                profilePic = storedProfilePic;
            }
            
            const currentUser = {
                username: username,
                displayName: displayName || username,
                profilePic: profilePic,
                lastActive: Date.now()
            };
            
            // Check if current user is already in the list
            const existingAccount = accounts.find(account => account.username === currentUser.username);
            
            if (existingAccount) {
                // Update existing account information if needed
                if (displayName && existingAccount.displayName !== displayName) {
                    existingAccount.displayName = displayName;
                }
                
                // Update profile picture if needed
                if (profilePic !== '/images/default-profile.png' && 
                    existingAccount.profilePic !== profilePic) {
                    existingAccount.profilePic = profilePic;
                }
                
                existingAccount.lastActive = Date.now();
                localStorage.setItem('activeAccounts', JSON.stringify(accounts));
            } else if (username !== 'Unknown') {
                // Add new user to accounts
                accounts.push(currentUser);
                localStorage.setItem('activeAccounts', JSON.stringify(accounts));
            }
            
            return accounts;
        }
        
        // If no active accounts exist, create array with the current user
        const username = localStorage.getItem('username');
        if (!username) return [];
        
        const displayName = localStorage.getItem('displayName');
        
        // Handle profile picture correctly
        let profilePic = '/images/default-profile.png';
        const storedProfilePic = localStorage.getItem('profilePic');
        if (storedProfilePic && 
            storedProfilePic !== 'undefined' && 
            storedProfilePic !== 'null') {
            profilePic = storedProfilePic;
        }
        
        const currentUser = {
            username: username,
            displayName: displayName || username,
            profilePic: profilePic,
            lastActive: Date.now()
        };
        
        localStorage.setItem('activeAccounts', JSON.stringify([currentUser]));
        return [currentUser];
    } catch (error) {
        console.error('Error getting active accounts:', error);
        return [];
    }
}

// Get recent (logged out) accounts from localStorage
function getRecentAccounts() {
    try {
        const recentAccountsJSON = localStorage.getItem('recentAccounts');
        if (!recentAccountsJSON) return [];
        
        // Parse accounts and validate each one
        const accounts = JSON.parse(recentAccountsJSON);
        
        // Validate each account's profile picture
        return accounts.map(account => {
            // Ensure valid profile picture
            if (!account.profilePic || 
                account.profilePic === 'undefined' || 
                account.profilePic === 'null') {
                account.profilePic = '/images/default-profile.png';
            }
            
            // Ensure valid display name
            if (!account.displayName) {
                account.displayName = account.username || 'Unknown User';
            }
            
            return account;
        });
    } catch (error) {
        console.error('Error getting recent accounts:', error);
        return [];
    }
}

// Create account item element
function createAccountItem(account, isActive) {
    const accountItem = document.createElement('div');
    accountItem.className = `account-item${isActive ? ' active' : ''}`;
    accountItem.dataset.username = account.username;
    
    const avatarClass = isActive ? '' : ' logged-out';
    
    // Ensure we have valid display values and default profile picture
    const displayName = account.displayName || account.username || 'Unknown User';
    const username = account.username || 'unknown';
    
    // Default profile picture handling
    let profilePic = '/images/default-profile.png';
    if (account.profilePic && account.profilePic !== 'undefined' && account.profilePic !== 'null') {
        profilePic = account.profilePic;
    }
    
    // Debug profile pic value
    console.log(`Profile pic for ${username}:`, profilePic, 'Original value:', account.profilePic);
    
    accountItem.innerHTML = `
        <img src="${profilePic}" alt="${displayName}" class="account-avatar${avatarClass}" onerror="this.src='/images/default-profile.png'">
        <div class="account-info">
            <div class="account-name">${displayName}</div>
            <div class="account-username">@${username}</div>
            <div class="account-status${isActive ? ' active' : ''}">
                ${isActive ? 'Active now' : 'Logged out'}
            </div>
        </div>
        <div class="account-actions">
            ${isActive ? 
                `<button class="switch-btn" data-action="switch" data-username="${username}">
                    <i class="bi bi-box-arrow-in-right"></i> Use
                </button>` 
                : 
                `<button class="switch-btn" data-action="login" data-username="${username}">
                    <i class="bi bi-key"></i> Log in
                </button>`
            }
            <button class="remove-btn" data-action="remove" data-username="${username}">
                <i class="bi bi-x-circle"></i> Remove
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    const switchBtn = accountItem.querySelector('[data-action="switch"], [data-action="login"]');
    const removeBtn = accountItem.querySelector('[data-action="remove"]');
    
    if (switchBtn) {
        switchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.dataset.action;
            const username = this.dataset.username;
            
            if (action === 'switch') {
                switchToAccount(username);
            } else if (action === 'login') {
                showPasswordModal(username);
            }
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeAccount(this.dataset.username, isActive);
        });
    }
    
    // Make entire account item clickable for active accounts
    if (isActive) {
        accountItem.addEventListener('click', function() {
            switchToAccount(this.dataset.username);
        });
    }
    
    return accountItem;
}

// Switch to an active account
function switchToAccount(username) {
    // Get active accounts
    const activeAccountsJSON = localStorage.getItem('activeAccounts');
    if (!activeAccountsJSON) return;
    
    const activeAccounts = JSON.parse(activeAccountsJSON);
    const accountToSwitch = activeAccounts.find(account => account.username === username);
    
    if (!accountToSwitch) return;
    
    // Make sure we have valid data
    const displayName = accountToSwitch.displayName || username;
    
    // Handle default profile picture properly
    let profilePic = '/images/default-profile.png';
    if (accountToSwitch.profilePic && 
        accountToSwitch.profilePic !== 'undefined' && 
        accountToSwitch.profilePic !== 'null') {
        profilePic = accountToSwitch.profilePic;
    }
    
    // Update current user in localStorage
    localStorage.setItem('username', username);
    localStorage.setItem('displayName', displayName);
    localStorage.setItem('profilePic', profilePic);
    
    // Ensure user is marked as logged in
    localStorage.setItem('isLoggedIn', 'true');
    
    // Update last active timestamp
    accountToSwitch.lastActive = Date.now();
    localStorage.setItem('activeAccounts', JSON.stringify(activeAccounts));
    
    // Redirect to home page
    window.location.href = '/';
}

// Remove an account from active or recent accounts
function removeAccount(username, isActive) {
    if (!confirm(`Remove ${username} from your accounts?`)) return;
    
    if (isActive) {
        // Remove from active accounts
        const activeAccountsJSON = localStorage.getItem('activeAccounts');
        if (activeAccountsJSON) {
            let activeAccounts = JSON.parse(activeAccountsJSON);
            activeAccounts = activeAccounts.filter(account => account.username !== username);
            localStorage.setItem('activeAccounts', JSON.stringify(activeAccounts));
        }
    } else {
        // Remove from recent accounts
        const recentAccountsJSON = localStorage.getItem('recentAccounts');
        if (recentAccountsJSON) {
            let recentAccounts = JSON.parse(recentAccountsJSON);
            recentAccounts = recentAccounts.filter(account => account.username !== username);
            localStorage.setItem('recentAccounts', JSON.stringify(recentAccounts));
        }
    }
    
    // Reload accounts UI
    loadAccounts();
}

// Initialize password modal events
function initializePasswordModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('passwordModal')) {
        const modal = document.createElement('div');
        modal.id = 'passwordModal';
        modal.className = 'password-modal';
        
        modal.innerHTML = `
            <div class="password-modal-content">
                <div class="password-modal-header">
                    <h3>Enter Password</h3>
                    <button type="button" class="password-modal-close">&times;</button>
                </div>
                <form class="password-form" id="passwordForm">
                    <input type="hidden" id="loginUsername" value="">
                    <div class="field">
                        <input type="password" id="loginPassword" placeholder="Password" required>
                        <span class="toggle-pass bi bi-eye"></span>
                    </div>
                    <div class="error-message" id="passwordError">Incorrect password</div>
                    <button type="submit">Log in</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners to modal
        const closeBtn = modal.querySelector('.password-modal-close');
        const form = modal.querySelector('#passwordForm');
        const togglePass = modal.querySelector('.toggle-pass');
        
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            attemptLogin();
        });
        
        togglePass.addEventListener('click', function() {
            const passwordInput = document.getElementById('loginPassword');
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
        
        // Close modal if clicked outside content
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
}

// Show password modal for logging in to a logged-out account
function showPasswordModal(username) {
    const modal = document.getElementById('passwordModal');
    if (!modal) return;
    
    // Set username in hidden field
    const usernameInput = document.getElementById('loginUsername');
    if (usernameInput) usernameInput.value = username;
    
    // Clear password field and error message
    const passwordInput = document.getElementById('loginPassword');
    if (passwordInput) passwordInput.value = '';
    
    const errorMsg = document.getElementById('passwordError');
    if (errorMsg) errorMsg.classList.remove('show');
    
    // Show modal
    modal.classList.add('show');
    
    // Focus on password field
    if (passwordInput) passwordInput.focus();
}

// Attempt to log in with password
function attemptLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('passwordError');
    
    if (!username || !password) return;
    
    // In a real app, this would make an API call to verify credentials
    // For demo purposes, we'll use a simple mock authentication
    mockAuthenticate(username, password)
        .then(success => {
            if (success) {
                // Get recent accounts
                const recentAccountsJSON = localStorage.getItem('recentAccounts');
                let recentAccounts = recentAccountsJSON ? JSON.parse(recentAccountsJSON) : [];
                
                // Find the account in recent accounts
                const accountIndex = recentAccounts.findIndex(account => account.username === username);
                
                if (accountIndex >= 0) {
                    // Get the full account data
                    const account = recentAccounts[accountIndex];
                    
                    // Make sure we have valid data
                    const displayName = account.displayName || username;
                    
                    // Handle default profile picture properly
                    let profilePic = '/images/default-profile.png';
                    if (account.profilePic && 
                        account.profilePic !== 'undefined' && 
                        account.profilePic !== 'null') {
                        profilePic = account.profilePic;
                    }
                    
                    // Remove from recent accounts
                    recentAccounts.splice(accountIndex, 1);
                    localStorage.setItem('recentAccounts', JSON.stringify(recentAccounts));
                    
                    // Add to active accounts
                    const activeAccountsJSON = localStorage.getItem('activeAccounts');
                    let activeAccounts = activeAccountsJSON ? JSON.parse(activeAccountsJSON) : [];
                    
                    // Add complete account data to active accounts
                    activeAccounts.push({
                        username: username,
                        displayName: displayName,
                        profilePic: profilePic,
                        lastActive: Date.now()
                    });
                    
                    localStorage.setItem('activeAccounts', JSON.stringify(activeAccounts));
                    
                    // Set as current user with complete data
                    localStorage.setItem('username', username);
                    localStorage.setItem('displayName', displayName);
                    localStorage.setItem('profilePic', profilePic);
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    // Redirect to home
                    window.location.href = '/';
                }
            } else {
                // Show error message
                if (errorMsg) errorMsg.classList.add('show');
            }
        });
}

// Mock authentication function (replace with real API call in production)
function mockAuthenticate(username, password) {
    return new Promise(resolve => {
        // In a real app, this would be an API call
        // For demo purposes, we'll accept any password that's at least 6 characters
        setTimeout(() => {
            resolve(password.length >= 6);
        }, 800);
    });
}

// Update logout functionality to handle account switching
function logout() {
    const username = localStorage.getItem('username');
    const displayName = localStorage.getItem('displayName');
    
    // Handle profile picture properly
    let profilePic = '/images/default-profile.png';
    const storedProfilePic = localStorage.getItem('profilePic');
    if (storedProfilePic && 
        storedProfilePic !== 'undefined' && 
        storedProfilePic !== 'null') {
        profilePic = storedProfilePic;
    }
    
    if (username) {
        // Get active accounts
        const activeAccountsJSON = localStorage.getItem('activeAccounts');
        let activeAccounts = activeAccountsJSON ? JSON.parse(activeAccountsJSON) : [];
        
        // Remove current account from active accounts
        const accountIndex = activeAccounts.findIndex(account => account.username === username);
        
        if (accountIndex >= 0) {
            // Store the account data before removal
            const account = {...activeAccounts[accountIndex]};
            
            // Remove from active accounts list
            activeAccounts.splice(accountIndex, 1);
            localStorage.setItem('activeAccounts', JSON.stringify(activeAccounts));
            
            // Add to recent accounts
            const recentAccountsJSON = localStorage.getItem('recentAccounts');
            let recentAccounts = recentAccountsJSON ? JSON.parse(recentAccountsJSON) : [];
            
            // Check if already in recent accounts
            const recentIndex = recentAccounts.findIndex(acc => acc.username === username);
            
            if (recentIndex >= 0) {
                recentAccounts.splice(recentIndex, 1);
            }
            
            // Add account with complete data
            recentAccounts.unshift({
                username,
                displayName: displayName || username,
                profilePic: profilePic,
                lastActive: Date.now()
            });
            
            // Limit to 5 recent accounts
            if (recentAccounts.length > 5) {
                recentAccounts = recentAccounts.slice(0, 5);
            }
            
            localStorage.setItem('recentAccounts', JSON.stringify(recentAccounts));
        }
    }
    
    // Clear login status but maintain username for account switch page
    localStorage.removeItem('isLoggedIn');
    
    // Redirect to account switch page
    window.location.href = '/account-switch';
}

// Expose logout function globally for use by logout button
window.logout = logout; 