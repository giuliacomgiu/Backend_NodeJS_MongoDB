# RESTfull-API
Restful API for a fictitious restaurant.
There are three main endpoints:

- **Home (/)**: 
Where anyone can access the website's homepage
- **Users (/users):** 
Here, the user can sign up and sign in through several methods.
Local registration and login with JWT
Facebook login with JWT
Facebook or Google login using cookie sessions
Logout (when using sessions)
- **Dishes (/dishes):**
Anyone can see the restaurant's dishes and specific dishes by endpoint
If you are logged in, you can review the dishes, and edit and delete your own comment (but not other people's)
If you are an admin, you can delete all dishes, edit and delete individual dishes,
delete all dish comments, (but not edit or delete a single comment)

All data is stored in a MongoDB database.

## Server-side
The server-side was developed with NodeJS, Express and MongoDB.
It uses mongoose for database operations, passport for authentication, Morgan for debug logs, cors for CORS validation and dotenv for environment variables.
