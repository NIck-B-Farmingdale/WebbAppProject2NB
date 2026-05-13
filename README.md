EZ-Help-Desk: AI-Powered IT Support agent

This is a full-stack tier-1 IT help desk application built with Node.JS and Express, utilizing Google's Gemini API (3.1-flash-lite) for all AI functionality. It features custom-built authentication system with a persistent database (via MongoDB Atlas) which stores/manages account info (username, passwords, emails) and a brief memory of the AI chat history of each account.



*****FEATURES DEVELOPED*****

1. Secure User Authentication: Registration and login system using bcrypt for password hashing and secure credential storage.

2. Persistent Session Management: Integration of connect-mongodb-session to maintain user login states across server restarts.

3. AI Context Memory: A "Context Window" method that retrieves the last 10 messages from the database to give the AI assistant a brief memory of what was done during the last troubleshooting session(s).

4. Dynamic Response System: Altered the backend to handle Gemini API responses and format them for seamless and easy-to-read frontend display.

5. Tier 1 Help Desk Persona: Utilizes Custom systemInstruction logic that focuses the AI on technical support and professional customer service.


*****DATABASE SCHEMA*****

-----USER SCHEMA-----
username: String (Unique, Required)
email: String (Unique, Required)
password: String (Hashed via bcrypt)

-----MESSAGE SCHEMA (CHAT HISTORY)-----
userId: ObjectId (Reference to User model)
role: String (Enum: 'user' or 'model')
parts: Array of Objects (contains text string)
createdAt: Date (Default: now)


*****API DOCUMENTATION*****

API Name: Google Generative AI (Gemini API)
Model used: Gemini-3.1-flash-lite
Endpoint: POST /api/chat (protected by requireLogin middleware)


*****HOW TO RUN SERVER LOCALLY*****

1. Install dependencies -

RUN: npm install

2. Environment setup: Create a .env file with PORT, MONGODB_URI, SESSION_SECRET, and GEMINI_API_KEY

3. Star the server - 
//development mode
RUN: npm run dev

//production mode
RUN: node server.js

4. Access: navigate to http://localhost:3000 in your browser


*****Development Timeline/Changelog*****

5/9/2026:

 1. added header and footer partials for easier universal page application.

 2. added SQLite dependency and code to interact with the database by creating a new user table if one doesn't exist and code to handle registration form submission and use of bcrypt to scramble/encrypt user passwords.

 5/10/2026:

 1. added registration view which sends newly registered user info to the /register POST route which will then save said info into the database.

 2. integrated express-session to generate secure browser cookies, allowing the server to remember logged-in users across different pages.

 3. built a custom route-protection function (requireLogin) which acts as a sort of "security guard", pushing unauthenticated users back to the login screen if they try to access the main app through the url or otherwise.

 4. updated the EJS views to accept server-side variables and to dynamically display various conditional UI alerts ("Invalid password" or "logged in successfully").

 6. added complete, secure routing for user registratiom, login, and logout.


5/12/2026 (FULL API INTEGRATION ACHIEVED):

1. Added @google/generative-ai and dotenv dependencies to connect my app to Google's AI services and securely manage environment variables.

2. created a .env file to securely store any sensitive information (Gemini api key and session secret) ensuring that version control isn't exposed.

3. integrated gemini-3.1-flash-lite model into the backend and created a new POST route (/api/chat) to handle AI requests, this is protected by the requireLogin middleware so that only authenticated users can use the API.

4. Designed and implemented the main chat interface in app.ejs with a fully scrollable chat history and an input for user prompts.

5. Wrote client-side asynchronous javascript code using the Fetch API to send messages from the front-end to the back-end and dynamically update the UI with the AI's custom-formatted response, all without having to refresh the page.

6. Added comprehensive error handling to both the front-end and back-end to allow both developers and users to more easily see when an API error is happening and what kind of error so that they know how they should proceed when troubleshooting.

5/13/2026:

1. Fully migrated dayabase from SQLite3 to MongoDB Atlas for cloud storage.

2. Refactored session storage to use MongoDB instead of local memory.

3. Implemented data sanitization to strip hidden _id tags from AI-payload to resolve 400 Bad Request errors.

4. Implementation of req.session.save() to prevent race conditions during login redirects.

5. Added new Message schema in MongoDB to handle persistent conversation history.

6. Added "Context Window" logic to /api/chat to provide the AI with the last 10 messages of history.


