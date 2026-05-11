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



