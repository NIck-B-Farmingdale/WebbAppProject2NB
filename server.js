// Loads environment variables from the .env file FIRST
require('dotenv').config();

const express = require('express');
// Imports the database and security tools
const sqlite3 = require('sqlite3').verbose();

// bcrypt allows me to encrypt user passwords in the database
const bcrypt = require('bcrypt');

// Imports session management
const session = require('express-session');

// Import and initialize the Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const port = 3000;

// Tells Express I'm using EJS for my views
app.set('view engine', 'ejs');

// Tell Express to serve static files (like CSS) from the 'public' folder
app.use(express.static('public'));

// Middleware to read data submitted from HTML forms
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configures Sessions - securely pulls the secret from the .env file
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false
}));

// Database setup - this creates a file called 'users.db' automatically.
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Creates the users table if it doesn't already exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT
)`);

// ROUTES:

// Route 1: the Homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Route 2 - display the Registration page
app.get('/register', (req, res) => {
    // passes an 'error' variable set to null initially.
    res.render('register', { error: null });
});

// Route 3 - handle the Registration form submission
app.post('/register', async (req, res) => {
    // Extract the data from the form
    const { username, email, password } = req.body;
    
    try {
        // Scrambles the password using bcrypt with 10 "salt" rounds
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Saves the new user to the database
        db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, 
            [username, email, hashedPassword], 
            function(err) {
                if (err) {
                    // SQLite throws an error if the username or email already exists
                    return res.render('register', { error: 'Username or Email already exists.' });
                }
                // If successful, redirect them to the login page
                res.redirect('/login?msg=Registered successfully! Please log in.');
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error during registration.');
    }
});

// Displays the Login Page
app.get('/login', (req, res) => {
    // Grabs the message from the URL if it exists (like the success message above)
    const msg = req.query.msg || null;
    res.render('login', { msg: msg, error: null });
});

// Handles Login Form Submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // 1. Find the user in the database
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) {
            return res.render('login', { error: 'Invalid username or password.', msg: null });
        }
        
        // 2. Compare the typed password with the hashed password in the database
        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            // 3. Passwords match, save their ID to the session and send them to the app
            req.session.userId = user.id; 
            req.session.username = user.username; // Saving this to say "Hello, [Name]" later
            res.redirect('/app');
        } else {
            res.render('login', { error: 'Invalid username or password.', msg: null });
        }
    });
});

// "Security" middleware
// This checks if a user is logged in before letting them see a page
const requireLogin = (req, res, next) => {
    if (req.session.userId) {
        next(); // They are logged in, let them through
    } else {
        res.redirect('/login?msg=You must log in to view that page.');
    }
};

// The main app page (protected by requireLogin)
app.get('/app', requireLogin, (req, res) => {
    // This code passes the username to the template
    res.render('app', { username: req.session.username });
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(); // Destroy the session cookie
    res.redirect('/login?msg=You have been logged out.');
});

// AI ROUTE: GEMINI AI CHAT ENDPOINT
// IMPORTANT: This is protected by requireLogin, unregistered users cannot use the API.
app.post('/api/chat', requireLogin, async (req, res) => {
    const { prompt } = req.body;
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite",
            systemInstruction: "You are a Tier 1 IT Help Desk assistant. Be polite, concise, and help the user diagnose their tech issue step-by-step."
        });
        
        // This passes the user's prompt directly
        const result = await model.generateContent(`User says: ${prompt}`);
        const response = await result.response;
        
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: 'Failed to communicate with the AI.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});