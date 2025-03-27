// Chat functionality using Socket.io
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
        return;
    }

    // Get DOM elements
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    
    // Add auto-resize functionality to the message input
    messageInput.addEventListener('input', function() {
        // Reset height to auto to get the right scrollHeight
        this.style.height = 'auto';
        // Set new height based on content (with a max)
        const newHeight = Math.min(this.scrollHeight, 120);
        this.style.height = newHeight + 'px';
    });
    
    // Track last message sender for grouping
    let lastMessageSender = null;
    let lastMessageTime = null;
    let lastMessageWrapper = null;
    
    // Connect to Socket.io with username from localStorage
    const socket = io({
        auth: { 
            username: username
        }
    });

    // Handle connection
    socket.on('connect', () => {
        console.log('Connected to chat server');
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        notifications.error('Connection Error', 'Failed to connect to chat server');
    });

    // Handle incoming messages
    socket.on('chat message', (msg) => {
        addMessage(msg);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        // Reset message grouping on disconnect
        lastMessageSender = null;
        lastMessageTime = null;
        lastMessageWrapper = null;
    });

    // Handle system messages from server
    socket.on('system message', (data) => {
        // System messages break the conversation flow
        lastMessageSender = null;
        lastMessageTime = null;
        lastMessageWrapper = null;
        
        addSystemMessage(data.text);
    });

    // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);

    // Send message when Enter key is pressed (without Shift)
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Function to send a message
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            // Send the message to the server
            socket.emit('chat message', { text: messageText });
            // Clear input field and reset its size
            messageInput.value = '';
            messageInput.style.height = 'auto';
            // Focus on input field
            messageInput.focus();
        }
    }

    // Function to check if messages should be grouped
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
        // Replace newlines with <br> for proper display
        return text.replace(/\n/g, '<br>');
    }

    // Function to add a message to the chat
    function addMessage(msg) {
        const currentSender = msg.username;
        const currentTime = msg.timestamp;
        const isOwnMessage = currentSender === username;
        const messageText = msg.text;
        const isShortMessage = messageText.length <= 5 && !messageText.includes('\n');
        
        // Check if this message should be grouped with the previous one
        if (shouldGroupMessages(currentSender, currentTime)) {
            // Create only the message bubble for consecutive messages
            const messageElement = document.createElement('div');
            messageElement.className = 'message ' + 
                (isOwnMessage ? 'message-own' : 'message-other') + ' consecutive-message';
            
            // Add special class for short messages
            if (isShortMessage) {
                messageElement.classList.add('short-message');
            }
            
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
        profilePicLink.href = `/user/${msg.username}`;
        profilePicLink.title = `View ${msg.displayName || msg.username}'s profile`;
        
        const profileImg = document.createElement('img');
        profileImg.src = msg.profilePic || '/images/default-profile.png';
        profileImg.alt = msg.displayName || msg.username;
        
        profilePicLink.appendChild(profileImg);
        profilePic.appendChild(profilePicLink);
        
        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Create header with sender name and timestamp
        const header = document.createElement('div');
        header.className = 'message-header';
        
        // Add sender name with appropriate alignment and make it clickable
        const sender = document.createElement('a'); // Change from span to anchor
        sender.className = 'message-sender';
        sender.textContent = msg.displayName || msg.username; // Use display name if available
        sender.href = `/user/${msg.username}`; // Link to user profile
        sender.title = `View ${msg.displayName || msg.username}'s profile`;
        
        // Add timestamp if available
        let timestamp;
        if (msg.timestamp) {
            timestamp = document.createElement('span');
            timestamp.className = 'message-time';
            timestamp.textContent = formatTime(new Date(msg.timestamp));
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
        
        // Add special class for short messages
        if (isShortMessage) {
            messageElement.classList.add('short-message');
        }
        
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

    // Function to add a system message
    function addSystemMessage(text) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container system-message-container';
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message-system';
        messageElement.textContent = text;
        
        messageContainer.appendChild(messageElement);
        messagesContainer.appendChild(messageContainer);
        scrollToBottom();
    }

    // Function to format time
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Function to scroll to the bottom of messages
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}); 