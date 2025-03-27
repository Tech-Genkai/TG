const express = require('express')
const app = express()
const path = require('path')
const { collection, Message } = require("./mongodb")
const multer = require('multer')
const crypto = require('crypto')
const http = require('http')
const socketIo = require('socket.io')

// Create HTTP server and Socket.io instance
const server = http.createServer(app)
const io = socketIo(server)

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

// Add endpoint to check username availability
app.post("/check-username", async(req, res) => {
    try {
        const username = req.body.username;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
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
            // Clear all auth data
            localStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('justLoggedIn');
            sessionStorage.clear();
            localStorage.clear();
            // Redirect to login page
            window.location.href = '/login';
        </script>
    `);
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
            
        // Return all profile data
        res.json({
            username: user.username,
            displayName: user.displayName || user.username,
            profilePic: user.profilePic || '/images/default-profile.png',
            gender: formattedGender,
            dob: user.dateOfBirth ? user.dateOfBirth : 'Not specified'
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
    
    // Handle chat messages
    socket.on('chat message', async (msg) => {
        const messageData = {
            username: socket.username,
            displayName: socket.displayName,
            profilePic: socket.profilePic,
            text: msg.text,
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
    
    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${displayName} (${username})`);
    });
});

// Update listen method to use the HTTP server instead of Express app
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
})