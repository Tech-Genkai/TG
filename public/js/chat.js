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
    });

    // Handle system messages from server
    socket.on('system message', (data) => {
        addSystemMessage(data.text);
    });

    // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);

    // Send message when Enter key is pressed
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Function to send a message
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            // Send the message to the server
            socket.emit('chat message', { text: messageText });
            // Clear input field
            messageInput.value = '';
            // Focus on input field
            messageInput.focus();
        }
    }

    // Function to add a message to the chat
    function addMessage(msg) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        
        // Create header with sender name and timestamp
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const isOwnMessage = msg.username === username;
        
        // Add sender name with appropriate alignment
        const sender = document.createElement('span');
        sender.className = 'message-sender';
        sender.textContent = msg.displayName || msg.username; // Use display name if available
        
        // Add timestamp if available
        let timestamp;
        if (msg.timestamp) {
            timestamp = document.createElement('span');
            timestamp.className = 'message-time';
            timestamp.textContent = formatTime(new Date(msg.timestamp));
            timestamp.style.marginLeft = '8px';
            timestamp.style.fontSize = '0.7rem';
            timestamp.style.opacity = '0.7';
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
        
        messageContainer.appendChild(header);
        
        // Add message content
        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + 
            (isOwnMessage ? 'message-own' : 'message-other');
        messageElement.textContent = msg.text;
        messageContainer.appendChild(messageElement);
        
        // Add to container and scroll to bottom
        messagesContainer.appendChild(messageContainer);
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