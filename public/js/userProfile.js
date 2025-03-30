document.addEventListener('DOMContentLoaded', function() {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername) {
        window.location.href = '/login';
        return;
    }

    // Get username from the URL
    const urlPath = window.location.pathname;
    const targetUsername = urlPath.split('/').pop();
    
    // If viewing your own profile via /user/[your-username], redirect to /profile
    if (targetUsername === currentUsername) {
        window.location.href = '/profile';
        return;
    }
    
    // Fetch and display user profile data
    fetchUserProfile(targetUsername);
    
    // Add event listener for send message button
    document.getElementById('sendMessageBtn').addEventListener('click', function() {
        // Redirect to the private messaging page with this user
        window.location.href = `/messages/${targetUsername}`;
    });

    // Add event listener for friend button
    document.getElementById('friendBtn').addEventListener('click', function() {
        handleFriendAction(targetUsername);
    });
    
    // Connect to Socket.io to get real-time online status updates
    connectToSocketIO(targetUsername);
});

// Set up socket connection and online status tracking
let socket;
const onlineUsers = new Set();

function connectToSocketIO(targetUsername) {
    const username = localStorage.getItem('username');
    
    // Connect to Socket.io
    socket = io({
        auth: { username }
    });
    
    // Handle connection
    socket.on('connect', () => {
        console.log('Connected to chat server for profile online status');
        
        // Start sending heartbeats every minute to keep online status
        setInterval(() => {
            socket.emit('heartbeat');
        }, 60 * 1000); // every minute
    });
    
    // Handle online users list
    socket.on('online users', (users) => {
        console.log('Received online users list with', users.length, 'users');
        onlineUsers.clear();
        users.forEach(user => onlineUsers.add(user));
        
        // Update online status indicator
        updateOnlineStatus(targetUsername);
    });
    
    // Handle user status updates
    socket.on('user status', (data) => {
        console.log('User status update:', data.username, data.status);
        
        if (data.status === 'online') {
            onlineUsers.add(data.username);
        } else {
            onlineUsers.delete(data.username);
        }
        
        // Only update UI if it's the user we're viewing
        if (data.username === targetUsername) {
            updateOnlineStatus(targetUsername);
        }
    });
}

// Update the online status indicator in the UI
function updateOnlineStatus(username) {
    const isOnline = onlineUsers.has(username);
    
    // Remove existing status indicator if any
    const existingStatus = document.getElementById('onlineStatusIndicator');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Add new status indicator text next to username
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'onlineStatusIndicator';
    statusIndicator.className = `user-status ${isOnline ? 'online' : 'offline'}`;
    statusIndicator.innerHTML = isOnline 
        ? '<i class="bi bi-circle-fill"></i> Online'
        : '<i class="bi bi-circle"></i> Offline';
    
    // Add to the profile info after the username
    const usernameEl = document.getElementById('userUsername');
    if (usernameEl && usernameEl.parentNode) {
        usernameEl.parentNode.insertBefore(statusIndicator, usernameEl.nextSibling);
    }
    
    // No longer adding the indicator to the profile picture
}

async function fetchUserProfile(username) {
    try {
        const currentUsername = localStorage.getItem('username');
        
        console.log(`Fetching profile for user: ${username}`);
        
        const response = await fetch(`/api/user/${encodeURIComponent(username)}/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-username': currentUsername
            }
        });
        
        if (!response.ok) {
            // Handle 404 not found or other errors
            if (response.status === 404) {
                notifications.error("User Not Found", "This user does not exist.");
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("User data received:", data);
        
        // Update page with user data
        updateUserProfileUI(data);
        
        // If this is the current user's profile, redirect to /profile
        if (data.isCurrentUser) {
            window.location.href = '/profile';
        }

        // Update friendship UI if status is provided in the response
        if (data.friendshipStatus) {
            updateFriendshipUI(data.friendshipStatus, username);
        }
        
        // Check if the API already provides online status
        if (data.isOnline !== undefined) {
            // Store in our local tracking
            if (data.isOnline) {
                onlineUsers.add(username);
            } else {
                onlineUsers.delete(username);
            }
            // Update the UI
            updateOnlineStatus(username);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        notifications.error("Error", "Failed to load user profile.");
    }
}

function updateUserProfileUI(userData) {
    // Set page title
    document.title = `TG - ${userData.displayName}'s Profile`;
    
    // Debug log
    console.log("User profile data:", userData);
    
    // Update profile picture
    const profilePic = document.getElementById('userProfilePic');
    if (profilePic) {
        profilePic.src = userData.profilePic || '/images/default-profile.png';
        profilePic.alt = `${userData.displayName}'s Profile Picture`;
    }
    
    // Update display name and username
    const displayNameEl = document.getElementById('userDisplayName');
    const usernameEl = document.getElementById('userUsername');
    if (displayNameEl) displayNameEl.textContent = userData.displayName;
    if (usernameEl) usernameEl.textContent = `@${userData.username}`;
    
    // Update friend count
    const friendCountEl = document.getElementById('userFriendCount');
    if (friendCountEl) {
        friendCountEl.textContent = userData.friendCount || 0;
        console.log(`Friend count set to: ${userData.friendCount || 0}`);
    }
    
    // Set up friends link
    const friendsLink = document.getElementById('userFriendsLink');
    if (friendsLink) {
        const encodedUsername = encodeURIComponent(userData.username);
        friendsLink.href = `/friends/${encodedUsername}`;
        console.log(`Friend link set to: /friends/${encodedUsername}`);
    }
    
    // Format date of birth if present
    let formattedDob = 'Not specified';
    if (userData.dob && userData.dob !== 'Not specified') {
        try {
            const dobDate = new Date(userData.dob);
            if (!isNaN(dobDate.getTime())) {
                formattedDob = dobDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (e) {
            console.error('Error formatting date:', e);
        }
    }
    
    // Update gender and DOB
    const genderEl = document.getElementById('userGender');
    const dobEl = document.getElementById('userDob');
    if (genderEl) genderEl.textContent = userData.gender;
    if (dobEl) dobEl.textContent = formattedDob;
}

async function fetchFriendshipStatus(username) {
    try {
        const currentUsername = localStorage.getItem('username');
        
        const response = await fetch(`/api/friends/status/${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-username': currentUsername
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        updateFriendshipUI(data.status, username);
    } catch (error) {
        console.error('Error fetching friendship status:', error);
        // Default to "not friends" in case of error
        updateFriendshipUI('not_friends', username);
    }
}

function updateFriendshipUI(status, username) {
    const friendBtn = document.getElementById('friendBtn');
    const friendshipStatus = document.getElementById('friendshipStatus');
    
    // Remove all classes first
    friendBtn.classList.remove('friend-btn', 'pending-btn', 'remove-friend-btn');
    
    switch(status) {
        case 'friends':
            friendBtn.textContent = 'Remove Friend';
            friendBtn.classList.add('remove-friend-btn');
            friendBtn.innerHTML = '<i class="bi bi-person-dash-fill"></i>Remove Friend';
            friendshipStatus.textContent = 'Friends';
            break;
            
        case 'pending_sent':
            friendBtn.textContent = 'Request Pending';
            friendBtn.classList.add('pending-btn');
            friendBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>Request Pending';
            friendshipStatus.textContent = 'Friend Request Sent';
            break;
            
        case 'pending_received':
            friendBtn.textContent = 'Accept Request';
            friendBtn.classList.add('friend-btn');
            friendBtn.innerHTML = '<i class="bi bi-person-check-fill"></i>Accept Request';
            friendshipStatus.textContent = 'Friend Request Received';
            break;
            
        case 'not_friends':
        default:
            friendBtn.textContent = 'Add Friend';
            friendBtn.classList.add('friend-btn');
            friendBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i>Add Friend';
            friendshipStatus.textContent = 'Not Friends';
            break;
    }
}

async function handleFriendAction(username) {
    try {
        const currentUsername = localStorage.getItem('username');
        
        const response = await fetch(`/api/friends/action/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-username': currentUsername
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            notifications.success(data.title, data.message);
            // Refresh the friendship status
            fetchFriendshipStatus(username);
        } else {
            notifications.error("Error", data.message || "Could not process friend request.");
        }
    } catch (error) {
        console.error('Error handling friend action:', error);
        notifications.error("Error", "Failed to process friend request.");
    }
} 