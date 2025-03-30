// Private messaging functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
        return;
    }

    console.log('Messages page loaded for user:', username);
    
    // Add a style tag for the no-scroll class if not already present
    if (!document.querySelector('style#private-messages-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'private-messages-styles';
        styleTag.textContent = `
            .loading-messages-no-scroll {
                scroll-behavior: auto !important;
                overflow-anchor: none !important;
            }
            
            /* Stabilize message containers during scrolling */
            .message-container {
                transform: translateZ(0);
                will-change: transform;
                contain: layout style paint;
            }
            
            /* Prevent individual elements from flying around */
            .message-wrapper, .message-profile-pic, .message-content, 
            .message, .message-text {
                will-change: transform;
                transform: translateZ(0);
                transition: none !important;
            }
            
            /* Smoother media animations */
            .message-media img, .message-media video {
                contain: layout style paint;
                will-change: transform;
            }
            
            /* Prevent layout shifts during scrolling */
            #messages {
                contain: layout style;
                position: relative;
            }
            
            /* Force GPU acceleration for smoother scrolling */
            #messages.smooth-scroll {
                scroll-behavior: smooth;
            }
            
            #messages.no-smooth-scroll {
                scroll-behavior: auto;
            }
            
            /* Improved read indicator styling */
            .read-indicator {
                display: inline-flex;
                align-items: center;
                color: rgba(0, 255, 255, 0.8);
                opacity: 0.9;
                position: absolute;
                right: 6px;
                bottom: 2px;
                font-size: 0.8rem;
                z-index: 2;
            }
            
            /* Special positioning for short messages */
            .read-wrapper {
                display: inline-flex;
                margin-left: 4px;
                margin-right: 0;
                position: relative;
                vertical-align: middle;
                height: 100%;
                align-items: center;
            }
            
            .read-indicator.after-message {
                position: relative;
                right: auto;
                bottom: auto;
                margin-left: 0;
                margin-right: 0;
                vertical-align: middle;
                line-height: 1;
                padding: 0 2px;
            }
            
            /* For better alignment in short messages */
            .read-indicator.after-message i {
                font-size: 12px;
                line-height: 1;
            }
            
            /* Make space for read indicators */
            .message-own:not(.short-message) .message-text {
                padding-right: 22px;
                display: inline-block;
            }
            
            /* For short messages, use consistent sizing and prevent overflow */
            .message.short-message {
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                white-space: nowrap;
                flex-direction: row;
                justify-content: flex-end;
                max-width: fit-content;
                min-width: 40px;
                border-radius: 5px !important;
                box-sizing: border-box;
                margin: 2px 0;
            }
            
            /* Apply consistent styling to both own and other short messages */
            .message-own.short-message,
            .message-other.short-message {
                border-radius: 5px !important;
            }
            
            .message.short-message .message-text {
                padding-right: 0;
                order: 1;
            }
            
            .message.short-message .read-wrapper {
                order: 2;
            }
            
            /* For consecutive short messages with read receipts */
            .message.short-message.consecutive-message {
                display: inline-flex;
                align-items: center;
                justify-content: flex-end;
                margin-top: 2px;
            }
            
            /* Online status indicator in conversation list */
            .online-indicator {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 12px;
                height: 12px;
                background-color: #4CAF50;
                border-radius: 50%;
                border: 2px solid #191919;
                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                transform: translate(2px, 2px); /* Move slightly out from the circle edge */
                z-index: 2; /* Ensure indicator appears above the image */
            }
            
            /* Online status indicator in chat header */
            .user-status {
                display: inline-flex;
                align-items: center;
                font-size: 0.8rem;
                margin-left: 8px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .user-status.online {
                color: #4CAF50;
            }
            
            .user-status.offline {
                color: rgba(255, 255, 255, 0.5);
            }
            
            .user-status i {
                margin-right: 4px;
                font-size: 0.9rem;
            }
            
            /* Position wrapper for profile pic to accommodate status indicator */
            .conversation-profile-pic {
                position: relative;
                overflow: visible; /* Prevent cropping of indicators */
                z-index: 1;
            }
            
            .conversation-profile-pic img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
            }
            
            /* Ensure unread indicators are visible and not cropped */
            .unread-indicator {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #f218d9;
                color: white;
                font-size: 11px;
                min-width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #191919;
                z-index: 3;
            }
            
            /* Message badge for navbar and sidebar */
            /* Styles now in style.css */
            
            /* Special styling for sidebar badge */
            /* Styles now in style.css */
            
            /* Hover effect */
            /* Styles now in style.css */
        `;
        document.head.appendChild(styleTag);
    }
    
    // Function to highlight the messages link in sidebar
    function highlightMessagesInSidebar() {
        // Remove active class from all sidebar links
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Find and highlight the messages link
        const messagesLinks = document.querySelectorAll('.sidebar a[href="/messages"]');
        if (messagesLinks.length > 0) {
            messagesLinks.forEach(link => {
                link.classList.add('active');
            });
            console.log('Messages link highlighted in sidebar');
        } else {
            // Fallback to finding by content or image alt
            const allSidebarLinks = document.querySelectorAll('.sidebar a');
            allSidebarLinks.forEach(link => {
                const text = link.textContent?.trim();
                const img = link.querySelector('img');
                const alt = img ? img.getAttribute('alt') : '';
                
                if (text === 'Messages' || alt === 'Messages') {
                    link.classList.add('active');
                    console.log('Messages link found by text/alt and highlighted');
                }
            });
        }
    }
    
    // Highlight the messages link in sidebar immediately
    highlightMessagesInSidebar();

    // DOM elements
    const conversationsContainer = document.getElementById('conversations');
    const chatContainer = document.getElementById('chat-container');
    const emptyState = document.getElementById('empty-state');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    const userNameElement = document.getElementById('chat-user-name');
    const userPicElement = document.getElementById('chat-user-pic');
    const userProfileLink = document.getElementById('user-profile-link');
    const conversationSearchInput = document.getElementById('conversation-search');
    const mediaUploadButton = document.getElementById('media-upload');
    const mediaInput = document.getElementById('media-input');
    
    // Current active conversation
    let activeConversation = null;

    // Add mobile conversation toggle functionality
    function setupMobileConversationToggle() {
        const chatHeader = document.getElementById('chat-header');
        const conversationsHeader = document.querySelector('.conversations-header');
        const conversationsList = document.querySelector('.conversations-list');
        
        // Function to toggle conversations list
        function toggleConversationsList() {
            conversationsList.classList.toggle('active');
        }
        
        // Add click event to chat header to show conversations
        if (chatHeader) {
            chatHeader.addEventListener('click', function(e) {
                // Only toggle if we're on mobile (check window width)
                if (window.innerWidth <= 768) {
                    // Don't toggle if clicking on the user profile link
                    if (e.target.closest('#user-profile-link')) {
                        return;
                    }
                    toggleConversationsList();
                }
            });
        }
        
        // Add click event to conversations header to hide conversations
        if (conversationsHeader) {
            conversationsHeader.addEventListener('click', function(e) {
                // Only toggle if we're on mobile
                if (window.innerWidth <= 768) {
                    toggleConversationsList();
                }
            });
        }
        
        // Hide conversations list when a conversation is selected on mobile
        if (conversationsContainer) {
            conversationsContainer.addEventListener('click', function(e) {
                const conversationItem = e.target.closest('.conversation-item');
                if (conversationItem && window.innerWidth <= 768) {
                    // Short delay to allow the conversation to load first
                    setTimeout(() => {
                        conversationsList.classList.remove('active');
                    }, 100);
                }
            });
        }
        
        // Handle window resize to reset mobile view
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                conversationsList.classList.remove('active');
            }
        });
    }
    
    // Call the mobile setup function
    setupMobileConversationToggle();
    
    // Check URL for username parameter
    function checkUrlForUsername() {
        const path = window.location.pathname;
        const match = path.match(/\/messages\/([^\/]+)/);
        if (match && match[1]) {
            return decodeURIComponent(match[1]);
        }
        return null;
    }
    
    // Handle media upload
    mediaUploadButton.addEventListener('click', () => {
        mediaInput.click();
    });
    
    mediaInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            notifications.error('File Too Large', 'Maximum file size is 5MB');
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            notifications.error('Invalid File Type', 'Only images and videos are allowed');
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Show upload started notification
        const notificationId = notifications.info('Uploading Media', 'Starting upload...', 0);
        
        try {
            const response = await fetch('/upload-media', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const data = await response.json();
            
            // Update notification to success and auto-close after 3 seconds
            notifications.success('Upload Complete', 'Media uploaded successfully', notificationId, 3000);
            
            // Send the message with media
            socket.emit('private message', {
                recipient: activeConversation,
                text: messageInput.value.trim() || ' ',
                media: {
                    url: data.url,
                    type: data.type
                }
            });
            
            // Clear the input
            messageInput.value = '';
            mediaInput.value = '';
            
        } catch (error) {
            console.error('Upload error:', error);
            notifications.error('Upload Failed', 'Failed to upload media', notificationId, 5000);
        }
    });
    
    // Connect to Socket.io
    const socket = io({
        auth: { 
            username: username
        }
    });
    
    // Handle connection
    socket.on('connect', () => {
        console.log('Connected to chat server');
        loadConversations();
        
        // Check if we have a username in the URL
        const urlUsername = checkUrlForUsername();
        if (urlUsername) {
            console.log('Opening conversation from URL:', urlUsername);
            // Short delay to ensure conversations are loaded first
            setTimeout(() => {
                openConversation(urlUsername);
            }, 500);
        } else {
            // If not opening a specific conversation, update unread badges
            setTimeout(() => {
                updateUnreadMessageBadges();
            }, 1000);
        }
        
        // Start sending heartbeats every minute to keep online status
        setInterval(() => {
            socket.emit('heartbeat');
        }, 60 * 1000); // every minute
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        notifications.error('Connection Error', 'Failed to connect to chat server');
    });
    
    // Track last message sender for grouping
    let lastMessageSender = null;
    let lastMessageTime = null;
    let lastMessageWrapper = null;
    
    // Add auto-resize functionality to the message input
    messageInput.addEventListener('input', function() {
        // Reset height to auto to get the right scrollHeight
        this.style.height = 'auto';
        // Set new height based on content (with a max)
        const newHeight = Math.min(this.scrollHeight, 120);
        this.style.height = newHeight + 'px';
    });
    
    // Load conversations list
    function loadConversations() {
        console.log('Loading conversations...');
        fetch('/api/conversations', {
            headers: {
                'x-username': username
            }
        })
        .then(response => {
            if (!response.ok) {
                console.error('Response not OK:', response.status);
                throw new Error('Failed to load conversations');
            }
            return response.json();
        })
        .then(data => {
            console.log('Conversations loaded:', data);
            renderConversations(data.conversations);
        })
        .catch(error => {
            console.error('Error loading conversations:', error);
            conversationsContainer.innerHTML = `
                <div class="error-message">
                    Failed to load conversations. <a href="#" id="retry-load">Retry</a>
                </div>
            `;
            document.getElementById('retry-load')?.addEventListener('click', (e) => {
                e.preventDefault();
                loadConversations();
            });
        });
    }
    
    // Track online users
    const onlineUsers = new Set();

    // Render conversations list
    function renderConversations(conversations) {
        if (!conversations || conversations.length === 0) {
            conversationsContainer.innerHTML = `
                <div class="no-conversations">
                    <p>No conversations yet</p>
                    <p>Messages from other users will appear here</p>
                </div>
            `;
            return;
        }
        
        conversationsContainer.innerHTML = '';
        
        conversations.forEach(conv => {
            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            conversationItem.dataset.username = conv.withUser;
            
            if (activeConversation && activeConversation === conv.withUser) {
                conversationItem.classList.add('active');
            }
            
            // Format timestamp properly, handling invalid dates
            let formattedTime = '';
            if (conv.lastMessageTime) {
                const lastMessageDate = new Date(conv.lastMessageTime);
                if (!isNaN(lastMessageDate.getTime())) {
                    formattedTime = formatTime(lastMessageDate);
                }
            }
            
            // Sanitize the last message to preserve emoticons
            const sanitizedLastMessage = sanitizeWithEmoticons(conv.lastMessage || '');
            
            // Check if user is online
            const isOnline = conv.isOnline || onlineUsers.has(conv.withUser);
            
            conversationItem.innerHTML = `
                <div class="conversation-profile-pic">
                    <img src="${conv.withUserProfilePic}" alt="${conv.withUserDisplayName}">
                    ${conv.unreadCount > 0 ? `<div class="unread-indicator">${conv.unreadCount}</div>` : ''}
                    ${isOnline ? '<div class="online-indicator"></div>' : ''}
                </div>
                <div class="conversation-details">
                    <div class="conversation-header">
                        <h4 class="conversation-name">${conv.withUserDisplayName}</h4>
                        <span class="conversation-time">${formattedTime}</span>
                    </div>
                    <p class="conversation-last-message">${sanitizedLastMessage}</p>
                </div>
            `;
            
            conversationItem.addEventListener('click', () => {
                openConversation(conv.withUser);
                // Update URL without reloading
                const url = `/messages/${encodeURIComponent(conv.withUser)}`;
                history.pushState({}, '', url);
            });
            
            conversationsContainer.appendChild(conversationItem);
        });
        
        // Update unread message badges after rendering conversations
        updateUnreadMessageBadges();
    }
    
    // Open conversation
    function openConversation(withUsername) {
        if (!withUsername) return;
        
        console.log('Opening conversation with:', withUsername);
        activeConversation = withUsername;
        
        // Mark the conversation as active
        const conversationItems = document.querySelectorAll('.conversation-item');
        conversationItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.username === withUsername) {
                item.classList.add('active');
            }
        });
        
        // Mark conversation as read when opening
        markConversationAsRead(withUsername);
        
        // Show messages container and hide empty state
        if (chatContainer) {
            chatContainer.style.display = 'flex';
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        messagesContainer.classList.add('optimized-scroll');
        
        // Clear messages container
        messagesContainer.innerHTML = '';
        
        // Add loading indicator
        messagesContainer.innerHTML = `
            <div class="loading-messages">
                <div class="loading-spinner">
                    <i class="bi bi-arrow-repeat"></i> Loading messages...
                </div>
            </div>
        `;
        
        // Load conversation history
        fetch(`/api/messages/${encodeURIComponent(withUsername)}`, {
            headers: {
                'x-username': username
            }
        })
        .then(response => {
            if (!response.ok) {
                console.error('Response not OK:', response.status);
                throw new Error('Failed to load messages');
            }
            return response.json();
        })
        .then(data => {
            console.log('Messages loaded:', data);
            
            // Add a class to force scroll position to bottom without animation
            messagesContainer.classList.add('loading-messages-no-scroll');
            messagesContainer.classList.add('optimized-scroll');
            
            // Clear loading indicator
            messagesContainer.innerHTML = '';
            
            // Create a div for messages that will be initially hidden
            const messagesWrapper = document.createElement('div');
            messagesWrapper.style.opacity = '0';
            messagesWrapper.style.visibility = 'hidden';
            messagesWrapper.style.transition = 'opacity 0.2s ease-out';
            messagesWrapper.style.willChange = 'opacity, transform';
            messagesWrapper.style.transform = 'translateZ(0)';
            messagesContainer.appendChild(messagesWrapper);
            
            // Update user info in header with online status
            userNameElement.textContent = data.user.displayName;
            userPicElement.src = data.user.profilePic;
            userProfileLink.href = `/user/${data.user.username}`;
            
            // Add or update the user status indicator
            const chatHeaderDetails = document.querySelector('.user-details');
            
            // Remove existing status indicator if any
            const existingStatus = chatHeaderDetails.querySelector('.user-status');
            if (existingStatus) {
                existingStatus.remove();
            }
            
            // Get online status
            const isOnline = data.user.isOnline || onlineUsers.has(data.user.username);
            
            // Create new status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = `user-status ${isOnline ? 'online' : 'offline'}`;
            statusIndicator.innerHTML = isOnline 
                ? '<i class="bi bi-circle-fill"></i> Online'
                : '<i class="bi bi-circle"></i> Offline';
            statusIndicator.dataset.username = data.user.username;
            
            // Add to the chat header
            chatHeaderDetails.appendChild(statusIndicator);
            
            // Mark messages as read
            socket.emit('mark messages read', { conversationWith: withUsername });
            
            // Render messages
            if (data.messages && data.messages.length > 0) {
                // Store original parent to restore later
                const originalMessagesContainer = messagesContainer;
                
                // Use the temporary container for adding messages
                const tempContainer = messagesWrapper;
                
                // Add all messages to the temporary container
                data.messages.forEach(msg => {
                    addMessage(msg, tempContainer);
                });
                
                // Position at bottom immediately before showing messages
                requestAnimationFrame(() => {
                    // Add extra padding at the bottom to ensure full visibility of last message
                    const lastMessageEl = tempContainer.querySelector('.message-container:last-child, .system-message:last-child');
                    if (lastMessageEl) {
                        const paddingEl = document.createElement('div');
                        paddingEl.style.height = '50px'; // Extra padding at bottom
                        paddingEl.style.display = 'block';
                        tempContainer.appendChild(paddingEl);
                    }
                    
                    // Force scroll to bottom before display
                    originalMessagesContainer.scrollTop = originalMessagesContainer.scrollHeight + 8000;
                    
                    // Now show messages with a slight delay
                    setTimeout(() => {
                        // Make the container visible
                        messagesWrapper.style.opacity = '1';
                        messagesWrapper.style.visibility = 'visible';
                        
                        // Keep optimal performance during reveal
                        setTimeout(() => {
                            // One more scroll to ensure we're at the bottom
                            originalMessagesContainer.scrollTop = originalMessagesContainer.scrollHeight + 8000;
                            
                            // Finally remove the performance classes
                            setTimeout(() => {
                                originalMessagesContainer.classList.remove('loading-messages-no-scroll');
                                originalMessagesContainer.classList.remove('optimized-scroll');
                            }, 250);
                        }, 50);
                    }, 30);
                });
            }
            
            // Focus on input
            messageInput.focus();
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            messagesContainer.innerHTML = `
                <div class="error-message">
                    Failed to load conversation. <button id="retry-conversation">Retry</button>
                </div>
            `;
            document.getElementById('retry-conversation')?.addEventListener('click', () => {
                openConversation(withUsername);
            });
        });
    }
    
    // Scroll to bottom of messages container with improved reliability
    function scrollToBottom(smooth = true) {
        // Temporarily add a class to optimize rendering during scrolling
        messagesContainer.classList.add('optimized-scroll');
        
        // If smooth is false, disable smooth scrolling
        if (!smooth) {
            messagesContainer.classList.add('no-smooth-scroll');
            messagesContainer.classList.remove('smooth-scroll');
        } else {
            messagesContainer.classList.add('smooth-scroll');
            messagesContainer.classList.remove('no-smooth-scroll');
        }
        
        // Use a large value to ensure we scroll past the last message
        const targetScrollTop = messagesContainer.scrollHeight + 8000;
        
        // First scroll attempt - immediate
        messagesContainer.scrollTop = targetScrollTop;
        
        // Second scroll attempt - after frame render
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = targetScrollTop;
            
            // Third scroll attempt - with slight delay to handle layout shifts
            setTimeout(() => {
                messagesContainer.scrollTop = targetScrollTop;
                
                // Remove performance optimization classes after scrolling is done
                setTimeout(() => {
                    if (!smooth) {
                        messagesContainer.classList.remove('no-smooth-scroll');
                    }
                    messagesContainer.classList.remove('optimized-scroll');
                }, 100);
            }, 30);
        });
    }
    
    // Send message
    function sendMessage() {
        if (!activeConversation) return;
        
        const messageText = messageInput.value.trim();
        if (messageText) {
            console.log('Sending message to:', activeConversation);
            socket.emit('private message', {
                recipient: activeConversation,
                text: messageText
            });
            
            // Clear input field and reset its size
            messageInput.value = '';
            messageInput.style.height = 'auto';
            // Focus on input field
            messageInput.focus();
            
            // Ensure we scroll to bottom after sending a message (without animation)
            scrollToBottom(false);
        }
    }
    
    // Handle send button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message when Enter key is pressed (without Shift)
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Handle private messages from server
    socket.on('private message', (msg) => {
        console.log('Received private message:', msg);
        // If this message is part of the active conversation, add it to the chat
        if (activeConversation === (msg.isSelf ? msg.recipient : msg.sender)) {
            // Use smooth scrolling for incoming messages, immediate for outgoing
            addMessage(msg, false);
            
            // If the message is from the other user, mark as read
            if (!msg.isSelf) {
                socket.emit('mark messages read', { conversationWith: msg.sender });
            }
        } else if (!msg.isSelf) {
            // If it's a new message not in the active conversation, update the UI
            notifications.info('New Message', `${msg.senderDisplayName} sent you a message`);
            // Reload conversations to show the new message
            loadConversations();
            // Update unread message badges
            updateUnreadMessageBadges();
        }
    });
    
    // Handle conversation updates
    socket.on('conversation update', (data) => {
        console.log('Conversation update received:', data);
        // Refresh conversations list
        loadConversations();
        // Update unread message badges
        updateUnreadMessageBadges();
    });
    
    // Handle socket errors
    socket.on('error', (err) => {
        console.error('Socket error:', err);
        notifications.error('Error', err.message || 'An error occurred');
    });
    
    // Handle messages read events
    socket.on('messages read', (data) => {
        console.log('Messages read by:', data.by, 'count:', data.count);
        // Find all messages sent by current user to the reader and mark them as read
        if (activeConversation === data.by) {
            updateMessageReadStatus(data.by);
        }
    });
    
    // Handle online users list
    socket.on('online users', (users) => {
        console.log('Received online users list:', users);
        onlineUsers.clear();
        users.forEach(user => onlineUsers.add(user));
        
        // Update UI for conversations
        updateOnlineStatusInUI();
    });
    
    // Handle user status updates
    socket.on('user status', (data) => {
        console.log('User status update:', data);
        
        if (data.status === 'online') {
            onlineUsers.add(data.username);
        } else {
            onlineUsers.delete(data.username);
        }
        
        // Update UI for this user
        updateOnlineStatusInUI(data.username);
    });
    
    // Function to update read status of messages
    function updateMessageReadStatus(reader) {
        // Get all message elements in the current conversation that are our own 
        // and don't already have a read indicator
        const messageElements = messagesContainer.querySelectorAll('.message.message-own:not(.read)');
        
        messageElements.forEach(messageEl => {
            // Skip if already has read indicator
            if (messageEl.querySelector('.read-indicator')) {
                return;
            }
            
            // Mark the message as read in the UI
            messageEl.classList.add('read');
            
            // Check if this is a short message
            const isShort = messageEl.classList.contains('short-message');
            
            // Add read indicator based on message type
            const textSpan = messageEl.querySelector('.message-text');
            
            if (isShort) {
                // For short messages, append after the message
                const readIndicator = document.createElement('span');
                readIndicator.className = 'read-indicator after-message';
                readIndicator.title = 'Read';
                readIndicator.innerHTML = '<i class="bi bi-check2-all"></i>';
                
                const readWrapper = document.createElement('div');
                readWrapper.className = 'read-wrapper';
                readWrapper.appendChild(readIndicator);
                
                // Ensure the message element uses flexbox to position elements
                messageEl.style.display = 'inline-flex';
                messageEl.style.alignItems = 'center';
                messageEl.style.justifyContent = 'flex-end';
                
                // Set correct order for text and read indicator
                if (textSpan) textSpan.style.order = '1';
                readWrapper.style.order = '2';
                
                messageEl.appendChild(readWrapper);
            } else if (messageEl.classList.contains('consecutive-message') && textSpan) {
                // For consecutive messages, append to the element itself
                const readIndicator = document.createElement('span');
                readIndicator.className = 'read-indicator';
                readIndicator.title = 'Read';
                readIndicator.innerHTML = '<i class="bi bi-check2-all"></i>';
                messageEl.appendChild(readIndicator);
            } else {
                // For regular messages, append to the element itself
                const readIndicator = document.createElement('span');
                readIndicator.className = 'read-indicator';
                readIndicator.title = 'Read';
                readIndicator.innerHTML = '<i class="bi bi-check2-all"></i>';
                messageEl.appendChild(readIndicator);
            }
        });
    }
    
    // Function to update online status indicators in UI
    function updateOnlineStatusInUI(specificUsername = null) {
        // Update conversation list items
        const conversations = document.querySelectorAll('.conversation-item');
        conversations.forEach(conv => {
            const username = conv.dataset.username;
            
            // If we're updating for a specific user only, skip others
            if (specificUsername && username !== specificUsername) {
                return;
            }
            
            const isOnline = onlineUsers.has(username);
            const profilePic = conv.querySelector('.conversation-profile-pic');
            
            // Remove existing indicator if present
            const existingIndicator = profilePic.querySelector('.online-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Add indicator if online
            if (isOnline) {
                const indicator = document.createElement('div');
                indicator.className = 'online-indicator';
                profilePic.appendChild(indicator);
            }
        });
        
        // Update status in chat header if in a conversation
        if (activeConversation) {
            const statusIndicator = document.querySelector(`.user-status[data-username="${activeConversation}"]`);
            if (statusIndicator) {
                const isOnline = onlineUsers.has(activeConversation);
                statusIndicator.className = `user-status ${isOnline ? 'online' : 'offline'}`;
                statusIndicator.innerHTML = isOnline 
                    ? '<i class="bi bi-circle-fill"></i> Online'
                    : '<i class="bi bi-circle"></i> Offline';
            }
        }
    }
    
    // Add a message to the chat
    function addMessage(msg, targetContainer = null) {
        const currentSender = msg.isSelf ? username : msg.sender;
        const currentTime = msg.timestamp;
        const isOwnMessage = msg.isSelf;
        const messageText = msg.text;
        
        // Use the provided container or the default messagesContainer
        const container = targetContainer || messagesContainer;
        
        // Create document fragment for better DOM performance
        const fragment = document.createDocumentFragment();
        
        // Check if this message should be grouped with the previous one
        if (shouldGroupMessages(currentSender, currentTime) && lastMessageWrapper) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message ' + 
                (isOwnMessage ? 'message-own' : 'message-other') + ' consecutive-message';
            
            // Add 'read' class if the message has been read
            if (isOwnMessage && msg.read) {
                messageElement.classList.add('read');
            }
            
            // Check if message is short to apply special styling
            if (isShortMessage(messageText)) {
                messageElement.classList.add('short-message');
            }
            
            const textSpan = document.createElement('span');
            textSpan.className = 'message-text';
            
            // Handle media if present and valid
            if (msg.media && typeof msg.media === 'object' && msg.media.url) {
                const mediaElement = createMediaElement(msg.media);
                if (mediaElement) {
                    textSpan.appendChild(mediaElement);
                }
            }
            
            // Add text if present
            if (msg.text && msg.text.trim()) {
                const textNode = document.createElement('span');
                textNode.innerHTML = formatMessageText(msg.text);
                textSpan.appendChild(textNode);
            }
            
            // Add read indicator for own messages that have been read
            if (isOwnMessage && msg.read) {
                addReadIndicator(messageElement, textSpan, isShortMessage(messageText));
            }
            
            messageElement.appendChild(textSpan);
            
            const messageContent = lastMessageWrapper.querySelector('.message-content');
            messageContent.appendChild(messageElement);
            
            lastMessageTime = currentTime;
            
            // Only scroll if we're using the main container (not a temporary one)
            if (!targetContainer) {
                scrollToBottom();
            }
            return;
        }
        
        // Create new message container for non-consecutive messages
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = isOwnMessage ? 'message-wrapper own' : 'message-wrapper';
        
        const profilePic = document.createElement('div');
        profilePic.className = 'message-profile-pic';
        
        const profilePicLink = document.createElement('a');
        profilePicLink.href = isOwnMessage ? '/profile' : `/user/${msg.sender}`;
        profilePicLink.title = `View ${isOwnMessage ? 'your' : `${msg.senderDisplayName}'s`} profile`;
        
        const profileImg = document.createElement('img');
        profileImg.src = isOwnMessage 
            ? (document.getElementById('navProfilePic').src) 
            : (msg.senderProfilePic || '/images/default-profile.png');
        profileImg.alt = isOwnMessage ? 'You' : (msg.senderDisplayName || msg.sender);
        profileImg.loading = 'lazy'; // Add lazy loading for better performance
        
        profilePicLink.appendChild(profileImg);
        profilePic.appendChild(profilePicLink);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const sender = document.createElement('a');
        sender.className = 'message-sender';
        sender.textContent = isOwnMessage ? 'You' : (msg.senderDisplayName || msg.sender);
        sender.href = isOwnMessage ? '/profile' : `/user/${msg.sender}`;
        sender.title = `View ${isOwnMessage ? 'your' : `${msg.senderDisplayName}'s`} profile`;
        
        let timestamp;
        if (currentTime) {
            timestamp = document.createElement('span');
            timestamp.className = 'message-time';
            timestamp.textContent = formatTime(new Date(currentTime));
        }
        
        if (isOwnMessage) {
            header.style.flexDirection = 'row-reverse';
            header.style.textAlign = 'right';
            if (timestamp) {
                timestamp.style.marginLeft = '0';
                timestamp.style.marginRight = '8px';
                header.appendChild(timestamp);
            }
            header.appendChild(sender);
        } else {
            header.appendChild(sender);
            if (timestamp) header.appendChild(timestamp);
        }
        
        messageContent.appendChild(header);
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + 
            (isOwnMessage ? 'message-own' : 'message-other');
        
        // Add 'read' class if the message has been read
        if (isOwnMessage && msg.read) {
            messageElement.classList.add('read');
        }
        
        // Check if message is short to apply special styling
        if (isShortMessage(messageText)) {
            messageElement.classList.add('short-message');
        }
        
        const textSpan = document.createElement('span');
        textSpan.className = 'message-text';
        
        // Handle media if present and valid
        if (msg.media && typeof msg.media === 'object' && msg.media.url) {
            const mediaElement = createMediaElement(msg.media);
            if (mediaElement) {
                textSpan.appendChild(mediaElement);
            }
        }
        
        // Add text if present
        if (msg.text && msg.text.trim()) {
            const textNode = document.createElement('span');
            textNode.innerHTML = formatMessageText(msg.text);
            textSpan.appendChild(textNode);
        }
        
        // Add read indicator for own messages that have been read
        if (isOwnMessage && msg.read) {
            addReadIndicator(messageElement, textSpan, isShortMessage(messageText));
        }
        
        messageElement.appendChild(textSpan);
        
        messageContent.appendChild(messageElement);
        
        messageWrapper.appendChild(profilePic);
        messageWrapper.appendChild(messageContent);
        
        messageContainer.appendChild(messageWrapper);
        
        // Use fragment for better performance
        fragment.appendChild(messageContainer);
        container.appendChild(fragment);
        
        lastMessageSender = currentSender;
        lastMessageTime = currentTime;
        lastMessageWrapper = messageWrapper;
        
        // Only scroll if we're using the main container (not a temporary one)
        if (!targetContainer) {
            scrollToBottom();
        }
    }
    
    // Check if message is short (for special styling)
    function isShortMessage(messageText) {
        // If empty or very short text, definitely a short message
        if (!messageText || !messageText.trim()) return true;
        
        // Normalize the text to handle emojis and other characters
        const normalizedText = messageText.trim();
        
        // Check character count - using a consistent measure for all messages
        return normalizedText.length <= 30;
    }
    
    // Helper function to add read indicators based on message length
    function addReadIndicator(messageElement, textSpan, isShort) {
        const readIndicator = document.createElement('span');
        readIndicator.className = 'read-indicator';
        readIndicator.title = 'Read';
        
        // Different styling for short vs long messages
        if (isShort) {
            readIndicator.className += ' after-message';
            readIndicator.innerHTML = '<i class="bi bi-check2-all"></i>';
            
            // For short messages, append after the message instead of overlaying
            const readWrapper = document.createElement('div');
            readWrapper.className = 'read-wrapper';
            readWrapper.appendChild(readIndicator);
            
            // Ensure the message element uses flexbox to position elements
            messageElement.style.display = 'inline-flex';
            messageElement.style.alignItems = 'center';
            messageElement.style.justifyContent = 'flex-end';
            
            // Set correct order for text and read indicator
            if (textSpan) textSpan.style.order = '1';
            readWrapper.style.order = '2';
            
            messageElement.appendChild(readWrapper);
        } else {
            // For longer messages, use the original overlay approach
            readIndicator.innerHTML = '<i class="bi bi-check2-all"></i>';
            messageElement.appendChild(readIndicator);
        }
    }
    
    // Check if messages should be grouped
    function shouldGroupMessages(currentSender, currentTime) {
        // If no previous message or different sender, don't group
        if (!lastMessageSender || lastMessageSender !== currentSender) {
            return false;
        }
        
        // Check if messages are within 2 minutes of each other
        if (currentTime && lastMessageTime) {
            const timeDiff = Math.abs(new Date(currentTime) - new Date(lastMessageTime));
            const twoMinutesInMs = 2 * 60 * 1000;
            return timeDiff < twoMinutesInMs;
        }
        
        return true;
    }
    
    // Function to format message text for display
    function formatMessageText(text) {
        // Use the sanitize function that preserves emoticons and handles line breaks
        return sanitizeWithEmoticonsAndLineBreaks(text);
    }

    // Function to create media element with improved performance
    function createMediaElement(media) {
        // Check if media object is valid and has a URL
        if (!media || typeof media !== 'object' || !media.url) {
            return document.createElement('div');
        }

        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'message-media';
        mediaContainer.style.transform = 'translateZ(0)'; // Hardware acceleration
        mediaContainer.style.willChange = 'transform'; // Indicate to browser optimization
        
        let mediaElement;
        
        // Check if media.type exists and is a string
        if (media.type && typeof media.type === 'string') {
            const isImage = media.type === 'image' || media.type.startsWith('image/');
            const isVideo = media.type === 'video' || media.type.startsWith('video/');
            
            if (isImage) {
                mediaElement = document.createElement('img');
                mediaElement.src = media.url;
                mediaElement.alt = 'Shared image';
                mediaElement.loading = 'lazy'; // Add lazy loading
                
                // Add width/height to prevent layout shifts
                mediaElement.style.width = '100%';
                mediaElement.style.maxHeight = '300px';
                mediaElement.style.objectFit = 'contain';
            } else if (isVideo) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.url;
                mediaElement.controls = true;
                mediaElement.playsInline = true;
                mediaElement.preload = 'metadata'; // Just load metadata initially
                
                // Add width/height to prevent layout shifts
                mediaElement.style.width = '100%';
                mediaElement.style.maxHeight = '300px';
            } else {
                // For unknown types, create a link
                mediaElement = document.createElement('a');
                mediaElement.href = media.url;
                mediaElement.target = '_blank';
                mediaElement.textContent = media.name || 'View Media';
                mediaElement.className = 'media-link';
                return mediaContainer;
            }
        } else {
            // If media.type is missing, try to guess from URL
            const url = media.url.toLowerCase();
            if (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || 
                url.endsWith('.gif') || url.endsWith('.webp')) {
                mediaElement = document.createElement('img');
                mediaElement.src = media.url;
                mediaElement.alt = 'Shared image';
                mediaElement.loading = 'lazy'; // Add lazy loading
                
                // Add width/height to prevent layout shifts
                mediaElement.style.width = '100%';
                mediaElement.style.maxHeight = '300px';
                mediaElement.style.objectFit = 'contain';
            } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.url;
                mediaElement.controls = true;
                mediaElement.playsInline = true;
                mediaElement.preload = 'metadata'; // Just load metadata initially
                
                // Add width/height to prevent layout shifts
                mediaElement.style.width = '100%';
                mediaElement.style.maxHeight = '300px';
            } else {
                // For unknown extensions, create a link
                mediaElement = document.createElement('a');
                mediaElement.href = media.url;
                mediaElement.target = '_blank';
                mediaElement.textContent = media.name || 'View Media';
                mediaElement.className = 'media-link';
                return mediaContainer;
            }
        }

        // Apply performance optimizations to media elements
        mediaElement.style.transform = 'translateZ(0)';
        mediaElement.style.willChange = 'transform';
        
        // Create media overlay with performance optimizations
        const overlay = document.createElement('div');
        overlay.className = 'media-overlay';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.style.position = 'fixed';
        
        const overlayContent = document.createElement('div');
        overlayContent.className = 'media-overlay-content';
        overlayContent.style.transform = 'translateZ(0)';
        
        // Create a new media element for the overlay instead of cloning
        let overlayMediaElement;
        if (mediaElement.tagName === 'IMG') {
            overlayMediaElement = document.createElement('img');
            overlayMediaElement.src = media.url;
            overlayMediaElement.alt = 'Full size image';
            overlayMediaElement.loading = 'lazy';
        } else if (mediaElement.tagName === 'VIDEO') {
            overlayMediaElement = document.createElement('video');
            overlayMediaElement.src = media.url;
            overlayMediaElement.controls = true;
            overlayMediaElement.playsInline = true;
            overlayMediaElement.preload = 'metadata';
        }
        
        if (overlayMediaElement) {
            overlayContent.appendChild(overlayMediaElement);
            overlay.appendChild(overlayContent);
            
            // Add click handler to close overlay when clicking outside media content
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.visibility = 'hidden';
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }, 200);
                }
            });
            
            // Add click handler to show overlay when clicking on media
            mediaElement.addEventListener('click', () => {
                document.body.appendChild(overlay);
                // Force reflow before animating
                overlay.offsetHeight;
                overlay.style.opacity = '1';
                overlay.style.visibility = 'visible';
                if (overlayMediaElement.tagName === 'VIDEO') {
                    overlayMediaElement.play();
                }
            });
        }
        
        mediaContainer.appendChild(mediaElement);
        return mediaContainer;
    }
    
    // Format time for display
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    // Handle conversation search
    conversationSearchInput.addEventListener('input', debounce(function() {
        const query = this.value.trim().toLowerCase();
        const conversations = document.querySelectorAll('.conversation-item');
        let matchFound = false;
        
        conversations.forEach(conv => {
            const name = conv.querySelector('.conversation-name').textContent.toLowerCase();
            const lastMessage = conv.querySelector('.conversation-last-message').textContent.toLowerCase();
            const username = conv.dataset.username.toLowerCase();
            
            if (name.includes(query) || lastMessage.includes(query) || username.includes(query)) {
                conv.style.display = 'flex';
                matchFound = true;
            } else {
                conv.style.display = 'none';
            }
        });
        
        // Get the no-results element or create it if it doesn't exist
        let noResultsEl = document.querySelector('.conversations .no-results');
        
        if (!matchFound && query.length > 0) {
            // If no conversations matched and we don't already have a no-results element
            if (!noResultsEl) {
                noResultsEl = document.createElement('div');
                noResultsEl.className = 'no-results';
                noResultsEl.innerHTML = `
                    <i class="bi bi-search"></i>
                    <p>No conversations found matching "${query}"</p>
                `;
                conversationsContainer.appendChild(noResultsEl);
            } else {
                // Update existing no-results element
                noResultsEl.innerHTML = `
                    <i class="bi bi-search"></i>
                    <p>No conversations found matching "${query}"</p>
                `;
                noResultsEl.style.display = 'flex';
            }
        } else if (noResultsEl) {
            // If we have matches or empty query, hide the no-results element
            noResultsEl.style.display = 'none';
        }
    }, 300));
    
    // Debounce function to limit how often a function can be called
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Fix home link navigation with more reliable method
    const homeLinks = document.querySelectorAll('a.home-link, a[href="/"]');
    homeLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/';
        });
    });
    
    // Update navbar message icon with link to messages
    const navbarMessageIcon = document.querySelector('.nav-icons a:first-child');
    if (navbarMessageIcon) {
        navbarMessageIcon.href = '/messages';
    }
    
    // Set correct title based on page
    document.title = 'Messages | Tech Genkai';

    // Add a optimized scroll handler for manual scrolling
    let isScrolling = false;
    let scrollTimeout;
    
    messagesContainer.addEventListener('scroll', function() {
        if (!isScrolling) {
            isScrolling = true;
            messagesContainer.classList.add('optimized-scroll');
        }
        
        // Clear previous timeout
        clearTimeout(scrollTimeout);
        
        // Set new timeout to remove class after scrolling stops
        scrollTimeout = setTimeout(function() {
            messagesContainer.classList.remove('optimized-scroll');
            isScrolling = false;
        }, 150);
    });

    // Add wheel event listener to prevent stutter during fast scrolling
    messagesContainer.addEventListener('wheel', function(e) {
        // Check if it's a fast scroll
        if (Math.abs(e.deltaY) > 50) {
            messagesContainer.classList.add('no-smooth-scroll');
            
            // Remove the class after scrolling ends
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                messagesContainer.classList.remove('no-smooth-scroll');
                messagesContainer.classList.remove('optimized-scroll');
                isScrolling = false;
            }, 250);
        }
    }, { passive: true });

    // Prevent touchmove events from causing stutter on mobile
    messagesContainer.addEventListener('touchmove', function() {
        if (!isScrolling) {
            isScrolling = true;
            messagesContainer.classList.add('optimized-scroll');
            messagesContainer.classList.add('no-smooth-scroll');
        }
        
        // Clear previous timeout
        clearTimeout(scrollTimeout);
        
        // Set new timeout to remove class after scrolling stops
        scrollTimeout = setTimeout(function() {
            messagesContainer.classList.remove('optimized-scroll');
            messagesContainer.classList.remove('no-smooth-scroll');
            isScrolling = false;
        }, 250);
    }, { passive: true });

    // Function to add a system message
    function addSystemMessage(text, targetContainer = null) {
        // Create a system message element
        const systemMessage = document.createElement('div');
        systemMessage.className = 'system-message';
        
        // Sanitize the text
        const sanitizedText = sanitizeWithEmoticons(text);
        
        systemMessage.innerHTML = sanitizedText;
        
        // Add to the specified container or default messagesContainer
        const container = targetContainer || messagesContainer;
        container.appendChild(systemMessage);
        
        // Only scroll if we're not using a target container
        if (!targetContainer) {
            scrollToBottom();
        }
    }

    // Function to update unread message badges in navbar and sidebar
    function updateUnreadMessageBadges() {
        // Get all conversation items to count total unread messages
        const conversationItems = document.querySelectorAll('.conversation-item');
        let totalUnread = 0;
        
        // Count all unread messages
        conversationItems.forEach(item => {
            const unreadIndicator = item.querySelector('.unread-indicator');
            if (unreadIndicator) {
                const count = parseInt(unreadIndicator.textContent);
                if (!isNaN(count)) {
                    totalUnread += count;
                }
            }
        });
        
        console.log('Total unread messages:', totalUnread);
        
        // No longer adding badge to navbar message icon
        
        // Update sidebar message icon badge
        const sidebarMessageIcon = document.querySelector('.sidebar a[title="Messages"]') || 
                                  document.querySelector('.sidebar a[href="/messages"]');
        
        if (sidebarMessageIcon) {
            // Remove existing badge if present
            const existingBadge = sidebarMessageIcon.querySelector('.message-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            // Add badge if there are unread messages
            if (totalUnread > 0) {
                const badge = document.createElement('div');
                badge.className = 'message-badge';
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                sidebarMessageIcon.style.position = 'relative';
                sidebarMessageIcon.appendChild(badge);
            }
        }
        
        // Save the unread count to localStorage so other pages can access it
        localStorage.setItem('unreadMessageCount', totalUnread);
    }

    // Mark conversation as read
    function markConversationAsRead(username) {
        if (!username) return;
        
        fetch(`/api/conversations/${username}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log('Conversation marked as read', username);
                // Get the conversation item and remove unread indicator
                const conversationItem = document.querySelector(`.conversation-item[data-username="${username}"]`);
                if (conversationItem) {
                    const unreadIndicator = conversationItem.querySelector('.unread-indicator');
                    if (unreadIndicator) {
                        unreadIndicator.remove();
                    }
                }
                // Update unread badges after marking as read
                updateUnreadMessageBadges();
            }
        })
        .catch(err => {
            console.error('Error marking conversation as read:', err);
        });
    }
}); 