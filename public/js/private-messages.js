// Private messaging functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
        return;
    }

    console.log('Messages page loaded for user:', username);
    
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
        }
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
            
            const lastMessageDate = new Date(conv.lastMessageTime);
            const formattedTime = formatTime(lastMessageDate);
            
            // Sanitize the last message to preserve emoticons
            const sanitizedLastMessage = sanitizeWithEmoticons(conv.lastMessage);
            
            conversationItem.innerHTML = `
                <div class="conversation-profile-pic">
                    <img src="${conv.withUserProfilePic}" alt="${conv.withUserDisplayName}">
                    ${conv.unreadCount > 0 ? `<div class="unread-indicator">${conv.unreadCount}</div>` : ''}
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
    }
    
    // Open a conversation
    function openConversation(withUsername) {
        console.log('Opening conversation with:', withUsername);
        activeConversation = withUsername;
        
        // Update UI
        emptyState.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        // Update active class in conversations list
        const conversationItems = document.querySelectorAll('.conversation-item');
        conversationItems.forEach(item => {
            if (item.dataset.username === withUsername) {
                item.classList.add('active');
                // Remove unread indicator
                const unreadIndicator = item.querySelector('.unread-indicator');
                if (unreadIndicator) {
                    unreadIndicator.remove();
                }
            } else {
                item.classList.remove('active');
            }
        });
        
        // Reset message grouping
        lastMessageSender = null;
        lastMessageTime = null;
        lastMessageWrapper = null;
        
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
            
            // Clear loading indicator
            messagesContainer.innerHTML = '';
            
            // Update user info in header
            userNameElement.textContent = data.user.displayName;
            userPicElement.src = data.user.profilePic;
            userProfileLink.href = `/user/${data.user.username}`;
            
            // Mark messages as read
            socket.emit('mark messages read', { conversationWith: withUsername });
            
            // Render messages
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    addMessage(msg);
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
            addMessage(msg);
            
            // If the message is from the other user, mark as read
            if (!msg.isSelf) {
                socket.emit('mark messages read', { conversationWith: msg.sender });
            }
        } else if (!msg.isSelf) {
            // If it's a new message not in the active conversation, update the UI
            notifications.info('New Message', `${msg.senderDisplayName} sent you a message`);
            // Reload conversations to show the new message
            loadConversations();
        }
    });
    
    // Handle conversation updates
    socket.on('conversation update', (data) => {
        console.log('Conversation update received:', data);
        // Refresh conversations list
        loadConversations();
    });
    
    // Handle socket errors
    socket.on('error', (err) => {
        console.error('Socket error:', err);
        notifications.error('Error', err.message || 'An error occurred');
    });
    
    // Add a message to the chat
    function addMessage(msg) {
        const currentSender = msg.isSelf ? username : msg.sender;
        const currentTime = msg.timestamp;
        const isOwnMessage = msg.isSelf;
        const messageText = msg.text;
        
        // Check if this message should be grouped with the previous one
        if (shouldGroupMessages(currentSender, currentTime)) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message ' + 
                (isOwnMessage ? 'message-own' : 'message-other') + ' consecutive-message';
            
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
            
            messageElement.appendChild(textSpan);
            
            const messageContent = lastMessageWrapper.querySelector('.message-content');
            messageContent.appendChild(messageElement);
            
            lastMessageTime = currentTime;
            scrollToBottom();
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
        
        messageElement.appendChild(textSpan);
        messageContent.appendChild(messageElement);
        
        messageWrapper.appendChild(profilePic);
        messageWrapper.appendChild(messageContent);
        
        messageContainer.appendChild(messageWrapper);
        messagesContainer.appendChild(messageContainer);
        
        lastMessageSender = currentSender;
        lastMessageTime = currentTime;
        lastMessageWrapper = messageWrapper;
        
        scrollToBottom();
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

    // Function to create media element
    function createMediaElement(media) {
        // Check if media object is valid and has a URL
        if (!media || typeof media !== 'object' || !media.url) {
            // Remove console warning that's causing log spam
            // Return an empty div instead of logging an error
            return document.createElement('div');
        }

        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'message-media';
        
        let mediaElement;
        
        // Check if media.type exists and is a string
        if (media.type && typeof media.type === 'string') {
            const isImage = media.type === 'image' || media.type.startsWith('image/');
            const isVideo = media.type === 'video' || media.type.startsWith('video/');
            
            if (isImage) {
                mediaElement = document.createElement('img');
                mediaElement.src = media.url;
                mediaElement.alt = 'Shared image';
            } else if (isVideo) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.url;
                mediaElement.controls = true;
                mediaElement.playsInline = true;
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
            } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.url;
                mediaElement.controls = true;
                mediaElement.playsInline = true;
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

        // Create media overlay
        const overlay = document.createElement('div');
        overlay.className = 'media-overlay';
        
        const overlayContent = document.createElement('div');
        overlayContent.className = 'media-overlay-content';
        
        // Create a new media element for the overlay instead of cloning
        let overlayMediaElement;
        if (mediaElement.tagName === 'IMG') {
            overlayMediaElement = document.createElement('img');
            overlayMediaElement.src = media.url;
            overlayMediaElement.alt = 'Full size image';
        } else if (mediaElement.tagName === 'VIDEO') {
            overlayMediaElement = document.createElement('video');
            overlayMediaElement.src = media.url;
            overlayMediaElement.controls = true;
            overlayMediaElement.playsInline = true;
        }
        
        if (overlayMediaElement) {
            overlayContent.appendChild(overlayMediaElement);
            overlay.appendChild(overlayContent);
            
            // Add click handler to close overlay when clicking outside media content
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                }
            });
            
            // Add click handler to show overlay when clicking on media
            mediaElement.addEventListener('click', () => {
                document.body.appendChild(overlay);
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
    
    // Scroll to bottom of messages container
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
}); 