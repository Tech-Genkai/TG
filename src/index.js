const express = require('express')
const app = express()
const path = require('path')
const collection = require("./mongodb")

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

app.listen(4000, () => {
    console.log("port connected on 4000");
})