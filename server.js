const express = require('express');
// Imports new database and security tools
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Tells Express I'm using EJS for my views
app.set('view engine', 'ejs');

// Tell Express to serve static files (like CSS) from the 'public' folder
app.use(express.static('public'));

// Middleware to read data submitted from HTML forms
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database Setup. This creates a file called 'users.db' automatically.
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

// --- ROUTES ---

// Route 1: The Homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Route 2 - Display the Registration Page
app.get('/register', (req, res) => {
    // We pass an 'error' variable set to null initially.
    res.render('register', { error: null });
});

// Route 3 - Handle the Registration Form Submission
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

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});