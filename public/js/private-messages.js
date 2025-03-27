// Private messaging functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
        return;
    }

    console.log('Messages page loaded for user:', username);

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
                    <p class="conversation-last-message">${conv.lastMessage}</p>
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
            // Create only the message bubble for consecutive messages
            const messageElement = document.createElement('div');
            messageElement.className = 'message ' + 
                (isOwnMessage ? 'message-own' : 'message-other') + ' consecutive-message';
            
            // Create a span for the text content to control alignment
            const textSpan = document.createElement('span');
            textSpan.className = 'message-text';
            textSpan.innerHTML = formatMessageText(messageText);
            messageElement.appendChild(textSpan);
            
            // Find the message content container in the last wrapper
            const messageContent = lastMessageWrapper.querySelector('.message-content');
            messageContent.appendChild(messageElement);
            
            // Update last message time
            lastMessageTime = currentTime;
            
            // Scroll to bottom
            scrollToBottom();
            return;
        }
        
        // Create a new message container for a new sender or after time gap
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        
        // Create message content wrapper
        const messageWrapper = document.createElement('div');
        messageWrapper.className = isOwnMessage ? 'message-wrapper own' : 'message-wrapper';
        
        // Add profile picture
        const profilePic = document.createElement('div');
        profilePic.className = 'message-profile-pic';
        
        // Make profile picture clickable
        const profilePicLink = document.createElement('a');
        profilePicLink.href = isOwnMessage 
            ? '/profile' 
            : `/user/${msg.sender}`;
        profilePicLink.title = `View ${isOwnMessage 
            ? 'your' 
            : `${msg.senderDisplayName}'s`} profile`;
        
        const profileImg = document.createElement('img');
        profileImg.src = isOwnMessage 
            ? (document.getElementById('navProfilePic').src) 
            : (msg.senderProfilePic || '/images/default-profile.png');
        profileImg.alt = isOwnMessage ? 'You' : (msg.senderDisplayName || msg.sender);
        
        profilePicLink.appendChild(profileImg);
        profilePic.appendChild(profilePicLink);
        
        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Create header with sender name and timestamp
        const header = document.createElement('div');
        header.className = 'message-header';
        
        // Add sender name with appropriate alignment and make it clickable
        const sender = document.createElement('a');
        sender.className = 'message-sender';
        sender.textContent = isOwnMessage ? 'You' : (msg.senderDisplayName || msg.sender);
        sender.href = isOwnMessage 
            ? '/profile' 
            : `/user/${msg.sender}`;
        sender.title = `View ${isOwnMessage 
            ? 'your' 
            : `${msg.senderDisplayName}'s`} profile`;
        
        // Add timestamp if available
        let timestamp;
        if (currentTime) {
            timestamp = document.createElement('span');
            timestamp.className = 'message-time';
            timestamp.textContent = formatTime(new Date(currentTime));
        }
        
        // Arrange header elements based on message ownership
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
        
        // Add message text
        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + 
            (isOwnMessage ? 'message-own' : 'message-other');
        
        // Create a span for the text content to control alignment
        const textSpan = document.createElement('span');
        textSpan.className = 'message-text';
        textSpan.innerHTML = formatMessageText(messageText);
        messageElement.appendChild(textSpan);
        
        messageContent.appendChild(messageElement);
        
        // Append profile pic and message content
        messageWrapper.appendChild(profilePic);
        messageWrapper.appendChild(messageContent);
        
        // Add to container and scroll to bottom
        messageContainer.appendChild(messageWrapper);
        messagesContainer.appendChild(messageContainer);
        
        // Update tracking variables
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
        // Use the new function that preserves emoticons and handles line breaks
        return sanitizeWithEmoticonsAndLineBreaks(text);
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
    
    // Update sidebar message link
    const sidebarMessageLink = document.querySelector('.sidebar a:nth-child(2)');
    if (sidebarMessageLink) {
        sidebarMessageLink.href = '/messages';
    }
}); 