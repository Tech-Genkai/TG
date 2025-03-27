const express = require('express')
const app = express()
const path = require('path')
const { collection, Message, DirectMessage, Conversation, FriendRequest, Friend } = require("./mongodb")
const multer = require('multer')
const crypto = require('crypto')
const http = require('http')
const socketIo = require('socket.io')
const sanitizeHtml = require('sanitize-html')

// Create HTTP server and Socket.io instance
const server = http.createServer(app)
const io = socketIo(server)

// Configure sanitize-html options (stricter than default)
const sanitizeOptions = {
    allowedTags: [], // Don't allow any HTML tags
    allowedAttributes: {}, // Don't allow any HTML attributes
    disallowedTagsMode: 'escape', // Escape disallowed tags
    transformers: [
        // Custom transformer to preserve emoticons
        (tagName, attribs, children, options) => {
            // This is only called for allowed tags, but we're not allowing any tags
            // Just returning null means no transformation
            return null;
        }
    ]
}

// Sanitize function to prevent XSS
function sanitizeText(text) {
    if (!text) return '';
    
    // Preserve common emoticons before sanitizing
    const emoticonRegex = /(?:>\.<?|<\.>?|>\.<|<\w<|>\w>|>\.<|<\.<|>\.>|=\.=|\^\.\^|;\.|;\)|:\)|:\(|:D|:P|:O|:\/|:\\|:'\(|XD|x_x|o_O|O_o|0_0|-_-|\^_\^|\._\.|T_T)/g;
    
    // Replace emoticons with temporary placeholders
    const emoticonMap = new Map();
    let counter = 0;
    
    const markedText = text.replace(emoticonRegex, (match) => {
        const marker = `__EMOTICON_${counter}__`;
        emoticonMap.set(marker, match);
        counter++;
        return marker;
    });
    
    // Sanitize the text
    let sanitized = sanitizeHtml(markedText, sanitizeOptions);
    
    // Restore emoticons
    emoticonMap.forEach((emoticon, marker) => {
        sanitized = sanitized.replace(marker, emoticon);
    });
    
    return sanitized;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'))
    },
    filename: function (req, file, cb) {
        // Generate random filename
        const randomString = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const filename = `${timestamp}-${randomString}${extension}`;
        cb(null, filename);
    }
})

// Add file filter to only accept images
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
})

const staticPath = path.join(__dirname, "../public")
const templatePath = path.join(__dirname, "../templates")

app.use(express.json())
app.use(express.static(staticPath))
app.use(express.static(templatePath))
app.use(express.urlencoded({extended:false}))

// Middleware to prevent caching of protected pages
const preventCaching = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

// Update routes to sendFile instead of render
app.get("/", preventCaching, (req, res) => {
    res.sendFile(path.join(templatePath, "index.html"))
})

// Add a route for /login that serves the login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(templatePath, "login.html"))
})

app.get("/signup", (req, res) => {
    res.sendFile(path.join(templatePath, "signup.html"))
})

app.get("/profile", (req, res) => {
    res.sendFile(path.join(templatePath, "profile.html"))
})

// Add a route for /register that serves the register page
app.get("/register", (req, res) => {
    res.sendFile(path.join(templatePath, "register.html"))
})

// Add route for viewing other user profiles
app.get("/user/:username", (req, res) => {
    res.sendFile(path.join(templatePath, "user-profile.html"))
})

// Add endpoint to check username availability
app.post("/check-username", async(req, res) => {
    try {
        const username = req.body.username;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        // Validate username length
        if (username.length > 15) {
            return res.status(400).json({ error: "Username must be 15 characters or less" });
        }

        // Validate username characters
        const validUsernamePattern = /^[a-z0-9._]+$/;
        if (!validUsernamePattern.test(username)) {
            return res.status(400).json({ error: "Username can only contain lowercase letters, numbers, periods (.) and underscores (_)" });
        }

        // Check if username exists
        const existingUser = await collection.findOne({ username });
        res.json({ exists: !!existingUser });
    } catch (error) {
        console.error('Error checking username:', error);
        res.status(500).json({ error: "Error checking username availability" });
    }
});

// Update signup endpoint to include validation
app.post("/signup", async(req, res) => {
    const data = {
        username: req.body.username,
        password: req.body.password
    }

    try {
        // Validate username length
        if (data.username.length > 15) {
            return res.status(400).send("Username must be 15 characters or less");
        }

        // Validate username characters
        const validUsernamePattern = /^[a-z0-9._]+$/;
        if (!validUsernamePattern.test(data.username)) {
            return res.status(400).send("Username can only contain lowercase letters, numbers, periods (.) and underscores (_)");
        }

        // Validate password length
        if (data.password.length < 8) {
            return res.status(400).send("Password must be at least 8 characters long");
        }

        // Check if username already exists
        const existingUser = await collection.findOne({ username: data.username });
        if (existingUser) {
            return res.status(400).send("Username is already taken");
        }

        await collection.insertMany([data])
        // Send HTML with script to set login status
        res.send(`
            <script>
                // Set login status to true
                localStorage.setItem('isLoggedIn', 'true');
                // Store username
                localStorage.setItem('username', '${req.body.username}');
                // Redirect to register page
                window.location.href = '/register';
            </script>
        `);
    } catch (error) {
        res.status(500).send("Error during signup: " + error.message)
    }
});

// Update login endpoint to include login script and store username
app.post("/login", async(req, res) => {
    try {
        // First check if username exists
        const user = await collection.findOne({ username: req.body.username });
        
        if (!user) {
            return res.status(401).json({ 
                error: "Invalid Username",
                message: "Username does not exist"
            });
        }

        // Then check if password matches
        if (user.password !== req.body.password) {
            return res.status(401).json({ 
                error: "Invalid Password",
                message: "Incorrect password"
            });
        }

        // If both checks pass, send success response with redirect script
        res.json({
            success: true,
            script: `
                // Set login status to true
                localStorage.setItem('isLoggedIn', 'true');
                // Store username
                localStorage.setItem('username', '${user.username}');
                // Set flag that user just logged in (for showing modal)
                sessionStorage.setItem('justLoggedIn', 'true');
                // Redirect to root URL (dashboard)
                window.location.href = '/';
            `
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Login Error",
            message: "An error occurred during login. Please try again."
        });
    }
});

// Add a route for the home page
app.get("/home", preventCaching, (req, res) => {
    res.sendFile(path.join(templatePath, "index.html"));
});

// Update logout route to clear login status and all session data
app.get("/logout", (req, res) => {
    res.send(`
        <script>
            // Get current username for account switching
            const username = localStorage.getItem('username');
            const displayName = localStorage.getItem('displayName') || username;
            
            // Handle profile picture properly
            let profilePic = '/images/default-profile.png';
            const storedProfilePic = localStorage.getItem('profilePic');
            if (storedProfilePic && 
                storedProfilePic !== 'undefined' && 
                storedProfilePic !== 'null') {
                profilePic = storedProfilePic;
            }
            
            // Clear login status but keep account info in localStorage
            localStorage.removeItem('isLoggedIn');
            
            // Handle account switching
            if (username) {
                // Get active accounts
                const activeAccountsJSON = localStorage.getItem('activeAccounts');
                let activeAccounts = activeAccountsJSON ? JSON.parse(activeAccountsJSON) : [];
                
                // Find user in active accounts
                const accountIndex = activeAccounts.findIndex(account => account.username === username);
                
                if (accountIndex >= 0) {
                    // Store all account data
                    const accountData = {...activeAccounts[accountIndex]};
                    
                    // Remove current account from active accounts
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
            
            // Clear session storage
            sessionStorage.removeItem('justLoggedIn');
            sessionStorage.clear();
            
            // Redirect to account switch page
            window.location.href = '/account-switch';
        </script>
    `);
});

// Add route for account switching page
app.get("/account-switch", preventCaching, (req, res) => {
    res.sendFile(path.join(templatePath, "account-switch.html"));
});

// Update endpoint to get user profile data
app.get("/api/user/profile", async(req, res) => {
    try {
        // Get username from localStorage (sent in request headers)
        const username = req.headers['x-username'];
        if (!username) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const user = await collection.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Format gender with first letter capitalized
        const formattedGender = user.gender 
            ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) 
            : 'Not specified';
        
        // Get friend count
        const friendCount = await Friend.countDocuments({ user: username });
        
        // Return all profile data
        res.json({
            username: user.username,
            displayName: user.displayName || user.username,
            profilePic: user.profilePic || '/images/default-profile.png',
            gender: formattedGender,
            dob: user.dateOfBirth ? user.dateOfBirth : 'Not specified',
            friendCount: friendCount
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: "Error fetching profile data" });
    }
});

// Add endpoint to update profile data
app.post("/api/user/profile/update", upload.single('profilePic'), async(req, res) => {
    try {
        const username = req.headers['x-username'];
        if (!username) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const updateData = {};
        
        // Only include fields that were provided
        if (req.body.displayName) updateData.displayName = req.body.displayName;
        if (req.body.gender) updateData.gender = req.body.gender;
        if (req.body.dateOfBirth) updateData.dateOfBirth = req.body.dateOfBirth;
        
        // Handle profile picture upload
        if (req.file) {
            updateData.profilePic = '/uploads/' + req.file.filename;
        }

        // Update the user's profile in the database
        await collection.updateOne(
            { username },
            { $set: updateData }
        );

        res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: "Error updating profile data" });
    }
});

// Add route to handle registration form submission
app.post("/register", upload.single('profilePic'), async(req, res) => {
    try {
        const data = {
            displayName: req.body.displayName,
            gender: req.body.gender,
            dateOfBirth: req.body.dateOfBirth,
            username: req.body.username
        };

        // Handle profile picture upload
        if (req.file) {
            console.log('Profile picture uploaded:', req.file);
            data.profilePic = '/uploads/' + req.file.filename;
        }

        // Update user profile in database
        await collection.updateOne(
            { username: data.username },
            { $set: data }
        );

        // Send success response with redirect script
        res.send(`
            <script>
                window.location.href = '/';
            </script>
        `);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send(`
            <script>
                notifications.error('Registration Failed', 'An error occurred during registration. Please try again.');
            </script>
        `);
    }
});

// Add endpoint to get chat history
app.get("/api/chat/history", async(req, res) => {
    try {
        // Get the last 50 messages
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .exec();
        
        // Return the messages in reverse order (oldest first)
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: "Error fetching chat history" });
    }
});

// Add endpoint to get specific user profile data
app.get("/api/user/:username/profile", async(req, res) => {
    try {
        // Get current username and target username
        const currentUsername = req.headers['x-username'];
        const targetUsername = req.params.username;
        
        if (!currentUsername) {
            return res.status(401).json({ error: "You must be logged in to view profiles" });
        }

        const user = await collection.findOne({ username: targetUsername });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Format gender with first letter capitalized
        const formattedGender = user.gender 
            ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) 
            : 'Not specified';

        // Get friend count
        const friendCount = await Friend.countDocuments({ user: targetUsername });

        // Check friendship status
        let friendshipStatus = 'not_friends';
        
        // Check if they are friends
        const areFriends = await Friend.findOne({
            $or: [
                { user: currentUsername, friend: targetUsername },
                { user: targetUsername, friend: currentUsername }
            ]
        });
        
        if (areFriends) {
            friendshipStatus = 'friends';
        } else {
            // Check for pending requests
            const sentRequest = await FriendRequest.findOne({
                sender: currentUsername,
                recipient: targetUsername,
                status: 'pending'
            });
            
            if (sentRequest) {
                friendshipStatus = 'pending_sent';
            } else {
                const receivedRequest = await FriendRequest.findOne({
                    sender: targetUsername,
                    recipient: currentUsername,
                    status: 'pending'
                });
                
                if (receivedRequest) {
                    friendshipStatus = 'pending_received';
                }
            }
        }
            
        // Return user profile data with friendship status
        res.json({
            username: user.username,
            displayName: user.displayName || user.username,
            profilePic: user.profilePic || '/images/default-profile.png',
            gender: formattedGender,
            dob: user.dateOfBirth ? user.dateOfBirth : 'Not specified',
            isCurrentUser: currentUsername === targetUsername,
            friendshipStatus: friendshipStatus,
            friendCount: friendCount
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: "Error fetching profile data" });
    }
});

// Add endpoint to search for users
app.get("/api/search/users", async(req, res) => {
    try {
        const query = req.query.q;
        console.log('User search query:', query);
        
        if (!query || query.trim().length === 0) {
            console.log('Empty search query, returning empty results');
            return res.json({ users: [], message: "Please enter a search term" });
        }
        
        // Get current username from headers
        const currentUsername = req.headers['x-username'];
        if (!currentUsername) {
            console.warn('User search attempted without authentication');
            return res.status(401).json({ 
                error: "User not authenticated", 
                message: "You must be logged in to search for users" 
            });
        }
        
        console.log(`User ${currentUsername} searching for: "${query}"`);
        
        // Search for users matching the query in username or displayName
        // Use case-insensitive regex search
        const users = await collection.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { displayName: { $regex: query, $options: "i" } }
            ]
        }).limit(10).exec();
        
        console.log(`Found ${users.length} users matching query '${query}'`);
        
        // Format the results
        const formattedUsers = users.map(user => ({
            username: user.username,
            displayName: user.displayName || user.username,
            profilePic: user.profilePic || '/images/default-profile.png',
            isCurrentUser: user.username === currentUsername
        }));
        
        // Send appropriate response based on results
        if (formattedUsers.length === 0) {
            return res.json({ 
                users: [], 
                message: `No users found matching "${query}"` 
            });
        }
        
        res.json({ 
            users: formattedUsers,
            message: `Found ${formattedUsers.length} user(s)` 
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ 
            error: "Error searching users",
            message: "An error occurred while searching for users. Please try again."
        });
    }
});

// Socket.io connection handling
io.use(async (socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("Invalid username"));
    }
    
    // Fetch user's display name from database
    try {
        const user = await collection.findOne({ username });
        if (user) {
            socket.username = username;
            socket.displayName = user.displayName || username; // Use display name or fall back to username
        } else {
            socket.username = username;
            socket.displayName = username;
        }
        next();
    } catch (error) {
        console.error('Error fetching user:', error);
        return next(new Error("Error authenticating user"));
    }
});

// Handle socket connections
io.on('connection', async (socket) => {
    const username = socket.username;
    const displayName = socket.displayName;
    console.log(`User connected: ${displayName} (${username})`);
    
    // Get user's profile picture
    let profilePic = '/images/default-profile.png';
    try {
        const currentUser = await collection.findOne({ username });
        if (currentUser && currentUser.profilePic) {
            profilePic = currentUser.profilePic;
        }
        socket.profilePic = profilePic;
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }
    
    // Send chat history to the newly connected user
    try {
        const messages = await Message.find()
            .sort({ timestamp: 1 }) // Sort by timestamp ascending (oldest first)
            .exec();
        
        // Create maps for user data
        const userDisplayNames = new Map();
        const userProfilePics = new Map();
        
        // Add current user to maps
        userDisplayNames.set(username, displayName);
        userProfilePics.set(username, profilePic);
        
        // Get unique usernames from messages
        const uniqueUsernames = [...new Set(messages
            .filter(msg => msg.type === 'user')
            .map(msg => msg.username))];
            
        // Fetch user data for all users in messages
        if (uniqueUsernames.length > 0) {
            const users = await collection.find({ 
                username: { $in: uniqueUsernames } 
            }).exec();
            
            users.forEach(user => {
                userDisplayNames.set(user.username, user.displayName || user.username);
                userProfilePics.set(user.username, user.profilePic || '/images/default-profile.png');
            });
        }
        
        // Emit messages one by one
        messages.forEach(msg => {
            if (msg.type === 'system') {
                socket.emit('system message', {
                    text: msg.text,
                    timestamp: msg.timestamp
                });
            } else {
                socket.emit('chat message', {
                    username: msg.username,
                    displayName: userDisplayNames.get(msg.username) || msg.username,
                    profilePic: userProfilePics.get(msg.username) || '/images/default-profile.png',
                    text: msg.text,
                    timestamp: msg.timestamp
                });
            }
        });
    } catch (error) {
        console.error('Error sending chat history:', error);
    }
    
    // Socket rooms for private messaging
    socket.join(username); // Join a personal room for receiving private messages
    
    // Handle chat messages
    socket.on('chat message', async (msg) => {
        // Sanitize message text
        const sanitizedText = sanitizeText(msg.text);
        
        const messageData = {
            username: socket.username,
            displayName: socket.displayName,
            profilePic: socket.profilePic,
            text: sanitizedText,
            timestamp: new Date()
        };
        
        // Save the message to the database
        try {
            const newMessage = new Message({
                username: messageData.username,
                text: messageData.text,
                timestamp: messageData.timestamp,
                type: 'user'
            });
            
            await newMessage.save();
        } catch (error) {
            console.error('Error saving message:', error);
        }
        
        // Broadcast the message to all connected clients
        io.emit('chat message', messageData);
    });
    
    // Handle private messages
    socket.on('private message', async (data) => {
        const { recipient, text } = data;
        
        if (!recipient || !text.trim()) {
            console.log('Invalid private message data:', data);
            return socket.emit('error', { message: 'Invalid message data' });
        }
        
        // Sanitize message text
        const sanitizedText = sanitizeText(text);
        
        try {
            console.log(`Private message from ${socket.username} to ${recipient}: "${sanitizedText.substring(0, 30)}${sanitizedText.length > 30 ? '...' : ''}"`);
            
            // Get recipient user
            const recipientUser = await collection.findOne({ username: recipient });
            if (!recipientUser) {
                console.warn(`Recipient not found: ${recipient}`);
                return socket.emit('error', { message: 'Recipient user not found' });
            }
            
            // Create the message data
            const messageData = {
                sender: socket.username,
                senderDisplayName: socket.displayName,
                senderProfilePic: socket.profilePic,
                recipient: recipient,
                recipientDisplayName: recipientUser.displayName || recipient,
                recipientProfilePic: recipientUser.profilePic || '/images/default-profile.png',
                text: sanitizedText,
                timestamp: new Date()
            };
            
            // Save to database
            const newDirectMessage = new DirectMessage({
                sender: messageData.sender,
                recipient: messageData.recipient,
                text: messageData.text,
                timestamp: messageData.timestamp,
                read: false
            });
            
            await newDirectMessage.save();
            console.log(`Saved direct message with ID: ${newDirectMessage._id}`);
            
            // Update or create conversation
            const participantsArray = [socket.username, recipient].sort();
            let conversation = await Conversation.findOne({
                participants: { $all: participantsArray, $size: 2 }
            });
            
            if (conversation) {
                // Update existing conversation
                console.log(`Updating existing conversation: ${conversation._id}`);
                conversation.lastMessage = sanitizedText;
                conversation.lastMessageTime = messageData.timestamp;
                conversation.updatedAt = messageData.timestamp;
                await conversation.save();
            } else {
                // Create new conversation
                console.log(`Creating new conversation for users: ${participantsArray.join(', ')}`);
                conversation = new Conversation({
                    participants: participantsArray,
                    lastMessage: sanitizedText,
                    lastMessageTime: messageData.timestamp,
                    updatedAt: messageData.timestamp
                });
                await conversation.save();
                console.log(`Created new conversation with ID: ${conversation._id}`);
            }
            
            // Add message ID to the message data for the client
            messageData.id = newDirectMessage._id;
            
            // Emit to sender
            console.log(`Emitting private message to sender: ${socket.username}`);
            socket.emit('private message', {
                ...messageData,
                isSelf: true
            });
            
            // Emit to recipient if online
            console.log(`Emitting private message to recipient: ${recipient}`);
            socket.to(recipient).emit('private message', {
                ...messageData,
                isSelf: false
            });
            
            // Also emit conversation update
            const conversationData = {
                id: conversation._id,
                participants: conversation.participants,
                lastMessage: conversation.lastMessage,
                lastMessageTime: conversation.lastMessageTime,
                updatedAt: conversation.updatedAt
            };
            
            console.log('Emitting conversation update to both users');
            socket.emit('conversation update', conversationData);
            socket.to(recipient).emit('conversation update', conversationData);
            
        } catch (error) {
            console.error('Error sending private message:', error);
            socket.emit('error', { message: 'Error sending message: ' + error.message });
        }
    });
    
    // Handle marking messages as read
    socket.on('mark messages read', async (data) => {
        const { conversationWith } = data;
        
        if (!conversationWith) {
            console.warn('Invalid mark messages read data:', data);
            return;
        }
        
        try {
            console.log(`Marking messages from ${conversationWith} to ${socket.username} as read`);
            
            const updateResult = await DirectMessage.updateMany(
                { sender: conversationWith, recipient: socket.username, read: false },
                { $set: { read: true } }
            );
            
            console.log(`Marked ${updateResult.modifiedCount} messages as read`);
            
            // Notify the other user that their messages were read
            if (updateResult.modifiedCount > 0) {
                console.log(`Notifying ${conversationWith} that messages were read by ${socket.username}`);
                socket.to(conversationWith).emit('messages read', { 
                    by: socket.username,
                    count: updateResult.modifiedCount
                });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
            socket.emit('error', { message: 'Error marking messages as read' });
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${displayName} (${username})`);
    });
});

// Add routes for direct messaging
app.get('/messages/:username', (req, res) => {
    res.sendFile(path.join(templatePath, 'private-messages.html'));
});

// Add route for the main messages page
app.get('/messages', (req, res) => {
    res.sendFile(path.join(templatePath, 'private-messages.html'));
});

// Add endpoint to get conversation list
app.get('/api/conversations', async (req, res) => {
    try {
        const username = req.headers['x-username'];
        if (!username) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        console.log(`Fetching conversations for user: ${username}`);
        
        // Find all conversations where the user is a participant
        const conversations = await Conversation.find({
            participants: username
        }).sort({ updatedAt: -1 }).limit(50);
        
        console.log(`Found ${conversations.length} conversations`);
        
        // Get the other participant details for each conversation
        const conversationsWithDetails = await Promise.all(
            conversations.map(async (conversation) => {
                // Determine the other participant
                const otherParticipant = conversation.participants.find(p => p !== username);
                
                if (!otherParticipant) {
                    console.warn(`No other participant found in conversation: ${conversation._id}`);
                    return null;
                }
                
                // Get other participant's details
                const user = await collection.findOne({ username: otherParticipant });
                
                // Count unread messages
                const unreadCount = await DirectMessage.countDocuments({
                    sender: otherParticipant,
                    recipient: username,
                    read: false
                });
                
                // Get the last message and sanitize it to preserve emoticons
                const lastMessage = conversation.lastMessage || 'Start a conversation';
                const sanitizedLastMessage = lastMessage ? sanitizeText(lastMessage) : lastMessage;
                
                return {
                    id: conversation._id,
                    withUser: otherParticipant,
                    withUserDisplayName: user ? (user.displayName || otherParticipant) : otherParticipant,
                    withUserProfilePic: user ? (user.profilePic || '/images/default-profile.png') : '/images/default-profile.png',
                    lastMessage: sanitizedLastMessage,
                    lastMessageTime: conversation.lastMessageTime || conversation.updatedAt,
                    updatedAt: conversation.updatedAt,
                    unreadCount: unreadCount
                };
            })
        );
        
        // Filter out any null values and send response
        const validConversations = conversationsWithDetails.filter(conv => conv !== null);
        res.json({ conversations: validConversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Error fetching conversations' });
    }
});

// Add endpoint to get chat history between two users
app.get('/api/messages/:username', async (req, res) => {
    try {
        const currentUser = req.headers['x-username'];
        const otherUser = req.params.username;
        
        if (!currentUser) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        console.log(`Fetching messages between ${currentUser} and ${otherUser}`);
        
        // Validate other user exists
        const user = await collection.findOne({ username: otherUser });
        if (!user) {
            console.warn(`User not found: ${otherUser}`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get messages exchanged between the two users (in both directions)
        const messages = await DirectMessage.find({
            $or: [
                { sender: currentUser, recipient: otherUser },
                { sender: otherUser, recipient: currentUser }
            ]
        }).sort({ timestamp: 1 }).limit(100);
        
        console.log(`Found ${messages.length} messages`);
        
        // Get profile information for both users
        const currentUserProfile = await collection.findOne({ username: currentUser });
        const otherUserProfile = user;
        
        // Format the messages for the client
        const formattedMessages = messages.map(msg => {
            const isSelf = msg.sender === currentUser;
            const sender = isSelf ? currentUserProfile : otherUserProfile;
            
            return {
                id: msg._id,
                sender: msg.sender,
                senderDisplayName: sender ? (sender.displayName || msg.sender) : msg.sender,
                senderProfilePic: sender ? (sender.profilePic || '/images/default-profile.png') : '/images/default-profile.png',
                recipient: msg.recipient,
                text: msg.text,
                timestamp: msg.timestamp,
                read: msg.read,
                isSelf: isSelf
            };
        });
        
        // Mark messages as read
        const updateResult = await DirectMessage.updateMany(
            { sender: otherUser, recipient: currentUser, read: false },
            { $set: { read: true } }
        );
        
        console.log(`Marked ${updateResult.modifiedCount} messages as read`);
        
        // Return messages and user profile info
        res.json({
            messages: formattedMessages,
            user: {
                username: otherUser,
                displayName: otherUserProfile.displayName || otherUser,
                profilePic: otherUserProfile.profilePic || '/images/default-profile.png'
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages', details: error.message });
    }
});

// Add a route to start a conversation from user profile
app.get('/messages/new/:username', async (req, res) => {
    try {
        const targetUsername = req.params.username;
        const currentUsername = req.headers['x-username'] || req.query.from;
        
        if (!currentUsername) {
            // If not authenticated, redirect to login page
            return res.redirect('/login');
        }
        
        // Check if the target user exists
        const targetUser = await collection.findOne({ username: targetUsername });
        if (!targetUser) {
            return res.status(404).send('User not found');
        }
        
        // Check if current user exists
        const currentUser = await collection.findOne({ username: currentUsername });
        if (!currentUser) {
            return res.status(401).send('Invalid user');
        }
        
        console.log(`Starting conversation between ${currentUsername} and ${targetUsername}`);
        
        // Redirect to the messages page with the target user
        res.redirect(`/messages/${targetUsername}`);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).send('An error occurred');
    }
});

// Add endpoint to get friendship status between two users
app.get('/api/friends/status/:username', async (req, res) => {
    try {
        const currentUsername = req.headers['x-username'];
        const targetUsername = req.params.username;
        
        if (!currentUsername) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Check if they are already friends
        const areFriends = await Friend.findOne({
            $or: [
                { user: currentUsername, friend: targetUsername },
                { user: targetUsername, friend: currentUsername }
            ]
        });
        
        if (areFriends) {
            return res.json({ status: 'friends' });
        }
        
        // Check if there's a pending request from current user to target
        const sentRequest = await FriendRequest.findOne({
            sender: currentUsername,
            recipient: targetUsername,
            status: 'pending'
        });
        
        if (sentRequest) {
            return res.json({ status: 'pending_sent' });
        }
        
        // Check if there's a pending request from target to current user
        const receivedRequest = await FriendRequest.findOne({
            sender: targetUsername,
            recipient: currentUsername,
            status: 'pending'
        });
        
        if (receivedRequest) {
            return res.json({ status: 'pending_received' });
        }
        
        // No relationship found
        return res.json({ status: 'not_friends' });
    } catch (error) {
        console.error('Error checking friendship status:', error);
        res.status(500).json({ error: 'Error checking friendship status' });
    }
});

// Add endpoint to perform friend actions (add, accept, remove)
app.post('/api/friends/action/:username', async (req, res) => {
    try {
        const currentUsername = req.headers['x-username'];
        const targetUsername = req.params.username;
        
        if (!currentUsername) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Check if target user exists
        const targetUser = await collection.findOne({ username: targetUsername });
        if (!targetUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Get current friendship status
        const areFriends = await Friend.findOne({
            $or: [
                { user: currentUsername, friend: targetUsername },
                { user: targetUsername, friend: currentUsername }
            ]
        });
        
        const sentRequest = await FriendRequest.findOne({
            sender: currentUsername,
            recipient: targetUsername,
            status: 'pending'
        });
        
        const receivedRequest = await FriendRequest.findOne({
            sender: targetUsername,
            recipient: currentUsername,
            status: 'pending'
        });
        
        // Handle action based on current status
        if (areFriends) {
            // If they're already friends, remove friendship
            await Friend.deleteMany({
                $or: [
                    { user: currentUsername, friend: targetUsername },
                    { user: targetUsername, friend: currentUsername }
                ]
            });
            
            return res.json({
                success: true,
                title: 'Friend Removed',
                message: `You are no longer friends with ${targetUser.displayName || targetUsername}`
            });
        } else if (sentRequest) {
            // If there's a pending request from current user, cancel it
            await FriendRequest.deleteOne({ _id: sentRequest._id });
            
            return res.json({
                success: true,
                title: 'Request Cancelled',
                message: `Friend request to ${targetUser.displayName || targetUsername} cancelled`
            });
        } else if (receivedRequest) {
            // If there's a pending request from target user, accept it
            await FriendRequest.updateOne(
                { _id: receivedRequest._id },
                { $set: { status: 'accepted', updatedAt: new Date() } }
            );
            
            // Create friend relationship (bidirectional)
            await Friend.create([
                { user: currentUsername, friend: targetUsername },
                { user: targetUsername, friend: currentUsername }
            ]);
            
            return res.json({
                success: true,
                title: 'Friend Added',
                message: `You are now friends with ${targetUser.displayName || targetUsername}`
            });
        } else {
            // No existing relationship, create new friend request
            await FriendRequest.create({
                sender: currentUsername,
                recipient: targetUsername,
                status: 'pending'
            });
            
            return res.json({
                success: true,
                title: 'Request Sent',
                message: `Friend request sent to ${targetUser.displayName || targetUsername}`
            });
        }
    } catch (error) {
        console.error('Error performing friend action:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing friend action' 
        });
    }
});

// Add endpoint to get friends list
app.get('/api/friends', async (req, res) => {
    try {
        const username = req.headers['x-username'];
        
        if (!username) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Find friends
        const friendships = await Friend.find({ user: username });
        
        if (friendships.length === 0) {
            return res.json({ friends: [] });
        }
        
        // Get friend usernames
        const friendUsernames = friendships.map(f => f.friend);
        
        // Get profile details for each friend
        const friendProfiles = await collection.find({ 
            username: { $in: friendUsernames } 
        });
        
        // Format friend data
        const friends = friendProfiles.map(profile => ({
            username: profile.username,
            displayName: profile.displayName || profile.username,
            profilePic: profile.profilePic || '/images/default-profile.png'
        }));
        
        res.json({ friends });
    } catch (error) {
        console.error('Error getting friends list:', error);
        res.status(500).json({ error: 'Error getting friends list' });
    }
});

// Add endpoint to get friend requests
app.get('/api/friends/requests', async (req, res) => {
    try {
        const username = req.headers['x-username'];
        
        if (!username) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Find received pending requests
        const receivedRequests = await FriendRequest.find({ 
            recipient: username,
            status: 'pending'
        });
        
        if (receivedRequests.length === 0) {
            return res.json({ requests: [] });
        }
        
        // Get sender usernames
        const senderUsernames = receivedRequests.map(req => req.sender);
        
        // Get profile details for each sender
        const senderProfiles = await collection.find({ 
            username: { $in: senderUsernames } 
        });
        
        // Create a map of username to profile data for faster lookup
        const profileMap = new Map();
        senderProfiles.forEach(profile => {
            profileMap.set(profile.username, profile);
        });
        
        // Format request data
        const requests = receivedRequests.map(request => {
            const profile = profileMap.get(request.sender);
            return {
                requestId: request._id,
                username: request.sender,
                displayName: profile ? (profile.displayName || request.sender) : request.sender,
                profilePic: profile ? (profile.profilePic || '/images/default-profile.png') : '/images/default-profile.png',
                createdAt: request.createdAt
            };
        });
        
        res.json({ requests });
    } catch (error) {
        console.error('Error getting friend requests:', error);
        res.status(500).json({ error: 'Error getting friend requests' });
    }
});

// Add endpoint to handle friend request response (accept/reject)
app.post('/api/friends/requests/:requestId', async (req, res) => {
    try {
        const username = req.headers['x-username'];
        const requestId = req.params.requestId;
        const { action } = req.body;
        
        if (!username) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        if (!action || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action specified' 
            });
        }
        
        // Find the request
        const request = await FriendRequest.findById(requestId);
        
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Friend request not found' 
            });
        }
        
        // Verify the current user is the recipient
        if (request.recipient !== username) {
            return res.status(403).json({ 
                success: false, 
                message: 'You are not authorized to respond to this request' 
            });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'This request has already been processed' 
            });
        }
        
        // Get sender profile for the response message
        const senderProfile = await collection.findOne({ username: request.sender });
        const senderName = senderProfile ? (senderProfile.displayName || request.sender) : request.sender;
        
        if (action === 'accept') {
            // Update request status
            await FriendRequest.updateOne(
                { _id: requestId },
                { $set: { status: 'accepted', updatedAt: new Date() } }
            );
            
            // Create bidirectional friendship
            await Friend.create([
                { user: username, friend: request.sender },
                { user: request.sender, friend: username }
            ]);
            
            return res.json({
                success: true,
                message: `You are now friends with ${senderName}`
            });
        } else {
            // Reject the request
            await FriendRequest.updateOne(
                { _id: requestId },
                { $set: { status: 'rejected', updatedAt: new Date() } }
            );
            
            return res.json({
                success: true,
                message: `Friend request from ${senderName} rejected`
            });
        }
    } catch (error) {
        console.error('Error processing friend request response:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing friend request' 
        });
    }
});

// Add route for viewing a specific user's friends
app.get('/friends/:username', preventCaching, (req, res) => {
    console.log(`Route hit: /friends/${req.params.username}`);
    res.sendFile(path.join(templatePath, 'friends.html'));
});

// Add route for friends page
app.get('/friends', preventCaching, (req, res) => {
    res.sendFile(path.join(templatePath, 'friends.html'));
});

// Add endpoint to get another user's friends list
app.get('/api/friends/:username', async (req, res) => {
    try {
        const currentUsername = req.headers['x-username'];
        const targetUsername = req.params.username;
        
        console.log(`API Request: Get friends list for ${targetUsername} by ${currentUsername}`);
        
        if (!currentUsername) {
            console.log('Error: User not authenticated');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Check if the target user exists
        const targetUser = await collection.findOne({ username: targetUsername });
        if (!targetUser) {
            console.log(`Error: User not found - ${targetUsername}`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if users are friends or if viewing own friends
        if (currentUsername !== targetUsername) {
            const areFriends = await Friend.findOne({
                $or: [
                    { user: currentUsername, friend: targetUsername },
                    { user: targetUsername, friend: currentUsername }
                ]
            });
            
            if (!areFriends) {
                console.log(`Error: Not friends - ${currentUsername} and ${targetUsername}`);
                return res.status(403).json({ error: 'You must be friends with this user to view their friends list' });
            }
        }
        
        // Find friends
        const friendships = await Friend.find({ user: targetUsername });
        console.log(`Found ${friendships.length} friends for ${targetUsername}`);
        
        if (friendships.length === 0) {
            return res.json({ friends: [] });
        }
        
        // Get friend usernames
        const friendUsernames = friendships.map(f => f.friend);
        
        // Get profile details for each friend
        const friendProfiles = await collection.find({ 
            username: { $in: friendUsernames } 
        });
        
        // Format friend data
        const friends = friendProfiles.map(profile => ({
            username: profile.username,
            displayName: profile.displayName || profile.username,
            profilePic: profile.profilePic || '/images/default-profile.png'
        }));
        
        console.log(`Sending ${friends.length} formatted friends`);
        res.json({ friends });
    } catch (error) {
        console.error('Error getting user friends list:', error);
        res.status(500).json({ error: 'Error getting friends list' });
    }
});

// Update listen method to use the HTTP server instead of Express app
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
})