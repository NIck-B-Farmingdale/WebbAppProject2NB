// Loads environment variables from the .env file FIRST
require('dotenv').config();

const express = require('express');

// bcrypt allows me to encrypt user passwords in the database
const bcrypt = require('bcrypt');

// Imports session management
const session = require('express-session');

// CODE REFACTOR: replacing all sqlite3 functionality with MongoDB functionality
// Imports MongoDB tools
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);

// Import and initialize the Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Use environment port for Render, default to 3000 for local
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tells Express I'm using EJS for my views
app.set('view engine', 'ejs');

// Tell Express to serve static files (like CSS) from the 'public' folder
app.use(express.static('public'));

// Middleware to read data submitted from HTML forms
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Defines the new User schema and model (replacing SQLite CREATE TABLE)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

//New mongoose schema for storing chat history
const messageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'model'], required: true },
    parts: [{ text: { type: String, required: true } }], // Matching Gemini's format
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// 1. Initialize the new store
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'mySessions' // This creates a 'mySessions' folder in your database
});

// 2. Catch any connection errors specifically for the session
store.on('error', function(error) {
    console.error('Session store error:', error);
});

// 3. Configure the session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store, // Plugs into the new store That I just built above
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

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
// (now refactored for compatibility with MongoDB)
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Creates the user in MongoDB
        await User.create({ username, email, password: hashedPassword });
        res.redirect('/login?msg=Registered successfully! Please log in.');
    } catch (error) {
        // Mongoose throws error code 11000 if a unique field (like username) is taken
        if (error.code === 11000) {
            return res.render('register', { error: 'Username or Email already exists.' });
        }
        console.error(error);
        res.status(500).send('Server error.');
    }
});


// Displays the Login Page
app.get('/login', (req, res) => {
    // Grabs the message from the URL if it exists
    const msg = req.query.msg || null;
    res.render('login', { msg: msg, error: null });
});

// Handles Login Form Submission
// (refactored for compatibility with MongoDB)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Search MongoDB for the user
        const user = await User.findOne({ username: username });
        
        if (!user) return res.render('login', { error: 'Invalid credentials.', msg: null });
        
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user._id.toString(); 
            req.session.username = user.username;
            
            // Force the session to save to the database BEFORE redirecting
            req.session.save((err) => {
                if (err) {
                    console.error("Session save error:", err);
                    return res.status(500).send('Server error during login.');
                }
                // Only redirect after the session is safely in the database
                res.redirect('/app');
            });
        } else {
            res.render('login', { error: 'Invalid credentials.', msg: null });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
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
// Now 
app.post('/api/chat', requireLogin, async (req, res) => {
    const userPrompt = req.body.prompt;

    try {
        // 1. Fetch the last 10 messages for this specific user
        const history = await Message.find({ userId: req.session.userId })
            .sort({ createdAt: -1 }) 
            .limit(10);
        
        // 2. Reverse and clean the data
        const chatHistory = history.reverse().map(msg => ({
            role: msg.role,
            parts: msg.parts.map(part => ({
                text: part.text 
            }))
        }));

        // 3. Start the chat with history
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite", 
            systemInstruction: "You are a Tier 1 IT Help Desk assistant. Provide concise, helpful technical support." 
        });

        const chatSession = model.startChat({
            history: chatHistory,
        });

        const result = await chatSession.sendMessage(userPrompt);
        const aiResponse = result.response.text();

        // 4. SAVE BOTH MESSAGES to MongoDB
        await Message.insertMany([
            { userId: req.session.userId, role: 'user', parts: [{ text: userPrompt }] },
            { userId: req.session.userId, role: 'model', parts: [{ text: aiResponse }] }
        ]);

        // UNIVERSAL RESPONSE: sends the text in every format a frontend might expect
        const payload = { 
            response: aiResponse, 
            reply: aiResponse,    
            text: aiResponse      
        };

        console.log("--- OUTGOING AI RESPONSE ---");
        console.log(payload);

        res.json(payload);

    } catch (error) {
        console.error("--- DETAILED CHAT ERROR ---");
        console.error(error);
        
        // Returns a universal error object
        res.status(500).json({ 
            response: "IT Help Desk Error: Connection issue.",
            reply: "IT Help Desk Error: Connection issue.",
            text: "IT Help Desk Error: Connection issue."
        });
    }
});




// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});