const express = require('express');
const app = express();
const port = 3000;

// Tells Express I'm using EJS for my views
app.set('view engine', 'ejs');

// Tell Express to serve static files (like CSS) from the 'public' folder
app.use(express.static('public'));

// --- ROUTES ---

// Route 1: The Homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});