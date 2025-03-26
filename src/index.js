const express = require('express')
const app = express()
const path = require('path')
const collection = require("./mongodb")
const multer = require('multer')

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'))
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })

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

// Update signup endpoint to include login script and store username
app.post("/signup", async(req, res) => {
    const data = {
        username: req.body.username,
        password: req.body.password
    }

    try {
        await collection.insertMany([data])
        // Send HTML with script to set login status
        res.send(`
            <script>
                // Set login status to true
                localStorage.setItem('isLoggedIn', 'true');
                // Store username
                localStorage.setItem('username', '${req.body.username}');
                // Set flag that user just logged in (for showing modal)
                sessionStorage.setItem('justLoggedIn', 'true');
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
        const user = await collection.findOne({
            username: req.body.username,
            password: req.body.password
        })
        
        if (user) {
            // Send HTML with script to set login status
            res.send(`
                <script>
                    // Set login status to true
                    localStorage.setItem('isLoggedIn', 'true');
                    // Store username
                    localStorage.setItem('username', '${user.username}');
                    // Set flag that user just logged in (for showing modal)
                    sessionStorage.setItem('justLoggedIn', 'true');
                    // Redirect to root URL (dashboard)
                    window.location.href = '/';
                </script>
            `);
        } else {
            res.send("Invalid username or password");
        }
    } catch (error) {
        res.status(500).send("Error during login: " + error.message)
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

// Add endpoint to get user profile data
app.get("/api/profile", async(req, res) => {
    try {
        const username = req.query.username;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const user = await collection.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            displayName: user.displayName || username,
            profilePic: user.profilePic || '/images/default-avatar.png'
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: "Error fetching profile data" });
    }
});

// Add route to handle registration form submission
app.post("/register", upload.single('profilePic'), async(req, res) => {
    const data = {
        displayName: req.body.displayName,
        gender: req.body.gender,
        dateOfBirth: req.body.dateOfBirth,
        username: req.body.username // This will come from the logged-in user
    }

    // If a profile picture was uploaded, add its path to the data
    if (req.file) {
        data.profilePic = '/uploads/' + req.file.filename;
    }

    try {
        // Update the user's profile in the database
        await collection.updateOne(
            { username: req.body.username },
            { $set: data }
        );
        
        // Send success response with redirect to index
        res.send(`
            <script>
                // Redirect to index page without setting justLoggedIn flag
                window.location.href = '/';
            </script>
        `);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send("Error during registration: " + error.message);
    }
});

app.listen(4000, () => {
    console.log("port connected on 4000");
})