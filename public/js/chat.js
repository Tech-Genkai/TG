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
    
    // For compatibility with both pages
    const attachmentButton = document.getElementById('attachment-btn') || document.getElementById('media-upload');
    const emojiButton = document.getElementById('emoji-btn') || document.getElementById('emoji-button');
    const fileInput = document.getElementById('file-input') || document.getElementById('media-input');
    const emojiPicker = document.getElementById('emoji-picker');
    
    // Emoji categories and data
    const emojiCategories = {
        'smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🫣', '🤗', '🫡', '🤔', '🫢', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🫨', '🫠', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🫥', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'],
        'people': ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱', '👩‍🦰', '👨‍🦰', '👱‍♀️', '👱‍♂️', '👩‍🦳', '👨‍🦳', '👩‍🦲', '👨‍🦲', '🧔', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '👮‍♀️', '👮‍♂️', '👷‍♀️', '👷‍♂️', '💂‍♀️', '💂‍♂️', '🕵️‍♀️', '🕵️‍♂️', '👨‍⚕️', '👩‍⚕️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🎓', '👩‍🎓', '👨‍🎤', '👩‍🎤', '👨‍🏫', '👩‍🏫', '👨‍🏭', '👩‍🏭', '👨‍💻', '👩‍💻', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🚀', '👩‍🚀', '👨‍⚖️', '👨‍⚖️', '👰‍♀️', '👰‍♂️', '🤵‍♀️', '🤵‍♂️', '🫃', '🫄', '🤰', '🤱', '👼', '🎅', '🤶', '🦸‍♀️', '🦸‍♂️', '🦹‍♀️', '🦹‍♂️', '🧙‍♀️', '🧙‍♂️', '🧚‍♀️', '🧚‍♂️', '🧚‍♀️', '🧛‍♂️', '🧜‍♀️', '🧜‍♂️', '🧝‍♀️', '🧝‍♂️', '🧞‍♀️', '🧞‍♂️', '🧟‍♀️', '🧟‍♂️', '🧌', '💆‍♀️', '💆‍♂️', '💇‍♀️', '💇‍♂️', '🚶‍♀️', '🚶‍♂️', '🧍‍♀️', '🧍‍♂️', '🧎‍♀️', '🧎‍♂️', '🏃‍♀️', '🏃‍♂️', '💃', '🕺', '👯‍♀️', '👯‍♂️', '🧖‍♀️', '🧖‍♂️', '🧗‍♀️', '🧗‍♂️', '🤺', '🏇', '⛷️', '🏂', '🏌️‍♀️', '🏌️‍♂️', '🏄‍♀️', '🏄‍♂️', '🚣‍♀️', '🚣‍♂️', '🏊‍♀️', '🏊‍♂️', '⛹️‍♀️', '⛹️‍♂️', '🏋️‍♀️', '🏋️‍♂️', '🚴‍♀️', '🚴‍♂️', '🚵‍♀️', '🚵‍♂️', '🤸‍♀️', '🤸‍♂️', '🤼‍♀️', '🤼‍♂️', '🤽‍♀️', '🤽‍♂️', '🤾‍♀️', '🤾‍♂️', '🤹‍♀️', '🤹‍♂️', '🧘‍♀️', '🧘‍♂️', '🛀', '🛌'],
        'gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '🫦', '💋', '🩺'],
        'love': ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'],
        'animals': ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🪸', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🪳', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠'],
        'nature': ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🫘', '🌰'],
        'food': ['🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🫗', '🥤', '🧋', '🧃', '🧉', '🧊'],
        'activities': ['🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🎪', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢'],
        'travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🛹', '🛼', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚥', '🚦', '🛑', '🚧'],
        'objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
        'symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
    };

    // Category icons for tabs
    const categoryIcons = {
        'smileys': '😊',
        'people': '👥',
        'gestures': '👋',
        'love': '❤️',
        'animals': '🐱',
        'nature': '🌸',
        'food': '🍔',
        'activities': '⚽',
        'travel': '✈️',
        'objects': '💡',
        'symbols': '💠'
    };

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

    // Store incoming messages until we're ready to display them
    let pendingMessages = [];
    let initialLoadComplete = false;
    
    // Track online users
    const onlineUsers = new Set();

    // Handle connection
    socket.on('connect', () => {
        console.log('Connected to chat server');
        
        // Reset message container and add loading indicator
        messagesContainer.innerHTML = `
            <div class="loading-messages">
                <div class="loading-spinner">
                    <i class="bi bi-arrow-repeat"></i> Loading messages...
                </div>
            </div>
        `;
        
        // Reset variables for new connection
        pendingMessages = [];
        initialLoadComplete = false;
        
        // Add a class to force scroll position to bottom without animation
        messagesContainer.classList.add('loading-messages-no-scroll');
        
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

    // Handle incoming messages
    socket.on('chat message', (msg) => {
        // If we're still loading initial messages, store this for later
        if (!initialLoadComplete) {
            pendingMessages.push({type: 'chat', data: msg});
            return;
        }
        
        // Otherwise add the message immediately (normal case)
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
        
        // If we're still loading initial messages, store this for later
        if (!initialLoadComplete) {
            pendingMessages.push({type: 'system', data});
            return;
        }
        
        addSystemMessage(data.text);
    });

    // Handle online users list
    socket.on('online users', (users) => {
        console.log('Received online users list with', users.length, 'users');
        onlineUsers.clear();
        users.forEach(user => onlineUsers.add(user));
        
        // Update message containers with online status
        updateOnlineStatusInMessages();
    });
    
    // Handle user status updates
    socket.on('user status', (data) => {
        console.log('User status update:', data.username, data.status);
        
        if (data.status === 'online') {
            onlineUsers.add(data.username);
        } else {
            onlineUsers.delete(data.username);
        }
        
        // Update message containers for this specific user
        updateOnlineStatusInMessages(data.username);
    });

    // Once we have all the messages, display them
    socket.on('history complete', () => {
        console.log(`Received ${pendingMessages.length} historical messages`);
        
        // Clear loading indicator
        messagesContainer.innerHTML = '';
        
        // Process all pending messages
        for (const item of pendingMessages) {
            if (item.type === 'chat') {
                addMessage(item.data);
            } else if (item.type === 'system') {
                addSystemMessage(item.data.text);
            }
        }
        
        // Mark initial load as complete
        initialLoadComplete = true;
        
        // Clear the pending messages
        pendingMessages = [];
        
        // Scroll to bottom without animation
        scrollToBottom(false);
        
        console.log('Chat history loaded and displayed');
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
        // Use the new function that preserves emoticons and handles line breaks
        return sanitizeWithEmoticonsAndLineBreaks(text);
    }

    // Function to add a message to the chat
    function addMessage(msg, noScroll = false) {
        const currentSender = msg.username;
        const currentTime = msg.timestamp;
        
        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        
        // Store username as data attribute for online status updates
        messageContainer.dataset.username = currentSender;
        
        // Check if this message should be grouped with the previous one
        if (shouldGroupMessages(currentSender, currentTime)) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message ' + (currentSender === username ? 'message-own' : 'message-other');
            
            if (isShortMessage(msg.text)) {
                messageElement.classList.add('short-message');
            }
            
            // Create message content
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            
            const messageText = document.createElement('div');
            messageText.className = 'message-text';
            
            // Handle media content if present
            if (msg.media && typeof msg.media === 'object' && msg.media.url) {
                const mediaContent = createMediaElement(msg.media);
                if (mediaContent) {
                    messageText.appendChild(mediaContent);
                }
            }
            
            // Add text content if present
            if (msg.text && msg.text.trim()) {
                const textSpan = document.createElement('span');
                textSpan.innerHTML = formatMessageText(msg.text);
                messageText.appendChild(textSpan);
            }
            
            messageElement.appendChild(messageText);
            messageContent.appendChild(messageElement);
            
            lastMessageWrapper.querySelector('.message-content').appendChild(messageContent);
            
            // Update last message time
            lastMessageTime = currentTime;
            
            // Scroll to bottom if needed
            if (!noScroll) {
                scrollToBottom(true);
            }
            
            return;
        }
        
        // Create a new message wrapper for non-consecutive messages
        const messageWrapper = document.createElement('div');
        messageWrapper.className = currentSender === username ? 'message-wrapper own' : 'message-wrapper';
        
        // Add profile picture
        const profilePic = document.createElement('div');
        profilePic.className = 'message-profile-pic';
        
        const profilePicLink = document.createElement('a');
        profilePicLink.href = currentSender === username ? '/profile' : `/user/${currentSender}`;
        profilePicLink.title = `View ${currentSender === username ? 'your' : `${msg.displayName}'s`} profile`;
        
        const profileImg = document.createElement('img');
        profileImg.src = msg.profilePic || '/images/default-profile.png';
        profileImg.alt = msg.displayName || currentSender;
        profileImg.loading = 'lazy'; // Add lazy loading
        
        profilePicLink.appendChild(profileImg);
        profilePic.appendChild(profilePicLink);
        
        // Add online indicator if the user is online (and not the current user)
        if (currentSender !== username && onlineUsers.has(currentSender)) {
            const onlineIndicator = document.createElement('div');
            onlineIndicator.className = 'online-indicator';
            profilePic.appendChild(onlineIndicator);
        }
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Add message header with username and timestamp
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const sender = document.createElement('a');
        sender.className = 'message-sender';
        sender.href = currentSender === username ? '/profile' : `/user/${currentSender}`;
        sender.textContent = (currentSender === username) ? 'You' : (msg.displayName || currentSender);
        
        const timestamp = document.createElement('span');
        timestamp.className = 'message-time';
        timestamp.textContent = formatTimestamp(new Date(currentTime));
        
        // Arrange header differently for own vs others' messages
        if (currentSender === username) {
            // For own messages, show timestamp then You (right-aligned)
            header.style.flexDirection = 'row-reverse';
            header.style.textAlign = 'right';
            timestamp.style.marginRight = '8px';
            header.appendChild(timestamp);
            header.appendChild(sender);
        } else {
            // For others' messages, show name then timestamp (left-aligned)
            header.appendChild(sender);
            header.appendChild(timestamp);
        }
        
        messageContent.appendChild(header);
        
        // Create message bubble
        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + (currentSender === username ? 'message-own' : 'message-other');
        
        if (isShortMessage(msg.text)) {
            messageElement.classList.add('short-message');
        }
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // Handle media content if present
        if (msg.media && typeof msg.media === 'object' && msg.media.url) {
            const mediaContent = createMediaElement(msg.media);
            if (mediaContent) {
                messageText.appendChild(mediaContent);
            }
        }
        
        // Add text content if present
        if (msg.text && msg.text.trim()) {
            const textSpan = document.createElement('span');
            textSpan.innerHTML = formatMessageText(msg.text);
            messageText.appendChild(textSpan);
        }
        
        messageElement.appendChild(messageText);
        messageContent.appendChild(messageElement);
        
        // Assemble the message container
        messageWrapper.appendChild(profilePic);
        messageWrapper.appendChild(messageContent);
        messageContainer.appendChild(messageWrapper);
        
        // Add to messages container
        messagesContainer.appendChild(messageContainer);
        
        // Update tracking variables for message grouping
        lastMessageSender = currentSender;
        lastMessageTime = currentTime;
        lastMessageWrapper = messageWrapper;
        
        // Scroll to bottom if needed
        if (!noScroll) {
            scrollToBottom(true);
        }
    }

    // Function to add a system message
    function addSystemMessage(text, targetContainer = null) {
        // Create a system message element
        const systemMessage = document.createElement('div');
        systemMessage.className = 'system-message';
        
        // Sanitize the text to prevent XSS attacks but preserve emoticons
        const sanitizedText = sanitizeWithEmoticons(text);
        
        systemMessage.innerHTML = sanitizedText;
        
        // Add to the specified container or default messagesContainer
        (targetContainer || messagesContainer).appendChild(systemMessage);
        
        // Only scroll to bottom if we're not using a fragment
        if (!targetContainer) {
            scrollToBottom();
        }
    }

    // Function to format time
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Function to scroll to the bottom of messages
    function scrollToBottom(smooth = true) {
        if (!smooth) {
            messagesContainer.classList.add('loading-messages-no-scroll');
        }
        
        // Use requestAnimationFrame to ensure the DOM has updated
        requestAnimationFrame(() => {
            // Ensure we're at the very bottom by using a large value
            messagesContainer.scrollTop = messagesContainer.scrollHeight + 1000;
            
            // Re-enable smooth scrolling after a short delay if it was disabled
            if (!smooth) {
                setTimeout(() => {
                    messagesContainer.classList.remove('loading-messages-no-scroll');
                }, 50);
            }
        });
    }

    // Initialize emoji picker
    let picker = null;
    let isPickerVisible = false;

    // Initialize emoji picker
    function initializeEmojiPicker() {
        try {
            const container = document.createElement('div');
            container.className = 'emoji-picker-container';
            
            // Create category tabs
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'emoji-tabs';
            
            // Create emoji grid
            const gridContainer = document.createElement('div');
            gridContainer.className = 'emoji-grid-container';
            
            // Add category tabs
            Object.keys(emojiCategories).forEach(category => {
                const tab = document.createElement('button');
                tab.className = 'emoji-tab';
                tab.innerHTML = `${categoryIcons[category]} <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>`;
                tab.onclick = () => showEmojiCategory(category, gridContainer);
                tabsContainer.appendChild(tab);
            });
            
            container.appendChild(tabsContainer);
            container.appendChild(gridContainer);
            
            // Clear any existing content
            emojiPicker.innerHTML = '';
            emojiPicker.appendChild(container);
            
            // Show first category by default
            showEmojiCategory('smileys', gridContainer);
            
        } catch (error) {
            console.error('Error initializing emoji picker:', error);
        }
    }

    // Show emoji category
    function showEmojiCategory(category, container) {
        // Update active tab
        const tabs = document.querySelectorAll('.emoji-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.toLowerCase() === category) {
                tab.classList.add('active');
            }
        });
        
        // Clear and populate grid
        container.innerHTML = '';
        
        const emojis = emojiCategories[category];
        emojis.forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-button';
            button.textContent = emoji;
            button.onclick = () => {
                insertEmoji(emoji);
                toggleEmojiPicker();
            };
            container.appendChild(button);
        });
    }

    // Toggle emoji picker visibility
    function toggleEmojiPicker() {
        if (emojiPicker.style.display === 'block') {
            emojiPicker.style.display = 'none';
        } else {
                initializeEmojiPicker();
            
            // Position the emoji picker
            const inputRect = messageInput.getBoundingClientRect();
            emojiPicker.style.bottom = (window.innerHeight - inputRect.top + 10) + 'px';
            emojiPicker.style.left = (inputRect.left + inputRect.width / 2 - 200) + 'px';
            
            emojiPicker.style.display = 'block';
        }
    }

    // Insert emoji into message input
    function insertEmoji(emoji) {
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;
        messageInput.value = text.substring(0, start) + emoji + text.substring(end);
        messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
        messageInput.focus();
    }

    // Handle file attachment
    if (attachmentButton) {
    attachmentButton.addEventListener('click', () => {
        fileInput.click();
    });
    }

    // Handle file input
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            handleFileUpload(this.files[0]);
        });
    }

    // Function to create media element
    function createMediaElement(media) {
        // Check if media object is valid and has a URL
        if (!media || typeof media !== 'object' || !media.url) {
            // Remove console warning that's causing log spam
            // Return an empty div instead of logging an error
            return document.createElement('div');
        }
        
        const container = document.createElement('div');
        container.className = 'media-container';
        container.style.border = 'none';
        container.style.outline = 'none';
        container.style.boxShadow = 'none';
        container.style.background = 'transparent';
        
        let mediaElement;
        
        // Check if media.type exists before using startsWith
        if (media.type && typeof media.type === 'string') {
            if (media.type.startsWith('image/')) {
                mediaElement = document.createElement('img');
                mediaElement.src = media.url;
                mediaElement.alt = 'Image';
                mediaElement.style.maxWidth = '100%';
                mediaElement.style.maxHeight = '400px';
                mediaElement.style.objectFit = 'contain';
                mediaElement.style.border = 'none';
                mediaElement.style.outline = 'none';
                mediaElement.style.boxShadow = 'none';
            } else if (media.type.startsWith('video/')) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.url;
                mediaElement.controls = true;
                mediaElement.style.maxWidth = '100%';
                mediaElement.style.maxHeight = '400px';
                mediaElement.style.objectFit = 'contain';
                mediaElement.style.border = 'none';
                mediaElement.style.outline = 'none';
                mediaElement.style.boxShadow = 'none';
            }
        } else {
            // If media.type is missing, try to guess from URL
            const url = media.url.toLowerCase();
            if (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || 
                url.endsWith('.gif') || url.endsWith('.webp')) {
                mediaElement = document.createElement('img');
                mediaElement.src = media.url;
                mediaElement.alt = 'Image';
                mediaElement.style.maxWidth = '100%';
                mediaElement.style.maxHeight = '400px';
                mediaElement.style.objectFit = 'contain';
                mediaElement.style.border = 'none';
                mediaElement.style.outline = 'none';
                mediaElement.style.boxShadow = 'none';
            } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.url;
                mediaElement.controls = true;
                mediaElement.style.maxWidth = '100%';
                mediaElement.style.maxHeight = '400px';
                mediaElement.style.objectFit = 'contain';
                mediaElement.style.border = 'none';
                mediaElement.style.outline = 'none';
                mediaElement.style.boxShadow = 'none';
            } else {
                // Create a link if we can't determine the type
                mediaElement = document.createElement('a');
                mediaElement.href = media.url;
                mediaElement.target = '_blank';
                mediaElement.textContent = media.name || 'View Media';
                mediaElement.className = 'media-link';
            }
        }
        
        if (mediaElement) {
            container.appendChild(mediaElement);
            
            // Add media actions
            const actions = document.createElement('div');
            actions.className = 'media-actions';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.innerHTML = '<i class="bi bi-download"></i>';
            downloadBtn.onclick = () => window.open(media.url, '_blank');
            
            const expandBtn = document.createElement('button');
            expandBtn.className = 'expand-btn';
            expandBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
            expandBtn.onclick = () => window.open(media.url, '_blank');
            
            actions.appendChild(downloadBtn);
            actions.appendChild(expandBtn);
            container.appendChild(actions);
        }
        
        return container;
    }

    // Function to handle file uploads
    function handleFileUpload(file) {
        if (!file) return;

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            notifications.error('File Too Large', 'Maximum file size is 5MB');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            notifications.error('Invalid File Type', 'Only images, GIFs, and videos are allowed');
            return;
        }

        // Create and show upload progress
        const progress = createUploadProgress();
        const progressFill = progress.querySelector('.upload-progress-fill');
        const progressInfo = progress.querySelector('.upload-info');
        const preview = progress.querySelector('.upload-preview');

        // Show preview
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            preview.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.style.maxWidth = '100%';
            video.style.maxHeight = '100%';
            video.style.objectFit = 'contain';
            preview.appendChild(video);
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('username', username);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload-media', true);

            // Track upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    progressFill.style.width = percentComplete + '%';
                    progressInfo.textContent = Math.round(percentComplete) + '%';
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    socket.emit('chat message', {
                        text: messageInput.value.trim(),
                        media: {
                            url: data.url,
                            type: data.type,
                            name: file.name
                        }
                    });

                    messageInput.value = '';
                    messageInput.style.height = 'auto';
                    messageInput.focus();
                } else {
                    notifications.error('Upload Failed', 'Failed to upload media');
                }
                progress.remove();
            };

            xhr.onerror = () => {
                notifications.error('Upload Failed', 'Failed to upload media');
                progress.remove();
            };

            xhr.send(formData);
        } catch (error) {
            console.error('Upload error:', error);
            notifications.error('Upload Failed', 'Failed to upload media');
            progress.remove();
        }
    }

    // Create upload progress element
    function createUploadProgress() {
        const progress = document.createElement('div');
        progress.className = 'upload-progress';
        progress.innerHTML = `
            <div class="upload-progress-header">
                <h3 class="upload-progress-title">Uploading Media</h3>
                <button class="upload-progress-close">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div class="upload-progress-bar">
                <div class="upload-progress-fill"></div>
            </div>
            <div class="upload-preview"></div>
            <p class="upload-info">0%</p>
        `;
        
        // Add close button functionality
        const closeBtn = progress.querySelector('.upload-progress-close');
        closeBtn.onclick = () => {
            progress.remove();
        };
        
        document.body.appendChild(progress);
        return progress;
    }

    // Function to update online status in message containers
    function updateOnlineStatusInMessages(specificUsername = null) {
        const messageContainers = document.querySelectorAll('.message-container');
        
        messageContainers.forEach(container => {
            const username = container.dataset.username;
            
            // If we only want to update a specific user, skip others
            if (specificUsername && username !== specificUsername) {
                return;
            }
            
            // Skip user's own messages
            if (username === localStorage.getItem('username')) {
                return;
            }
            
            // Only proceed if we have a username
            if (!username) return;
            
            const profilePic = container.querySelector('.message-profile-pic');
            if (!profilePic) return;
            
            // Remove existing indicator if any
            const existingIndicator = profilePic.querySelector('.online-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Add indicator if user is online
            if (onlineUsers.has(username)) {
                const indicator = document.createElement('div');
                indicator.className = 'online-indicator';
                profilePic.appendChild(indicator);
            }
        });
    }

    // Helper function to check if a message is short
    function isShortMessage(text) {
        if (!text) return true;
        const trimmedText = text.trim();
        return trimmedText.length <= 30 && !trimmedText.includes('\n');
    }

    // Format timestamp for display
    function formatTimestamp(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Initialize emoji picker
    initializeEmojiPicker();
}); 