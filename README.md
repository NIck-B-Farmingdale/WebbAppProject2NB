# WebbAppProject2NB
A web app which utilizes GenAI api to act as a virtual IT help assistant

Development Timeline/Changelog-

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


