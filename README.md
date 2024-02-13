**Installation Steps:**

1. **Clone the Repository:**
   - Open your terminal or command prompt.
   - Navigate to the directory where you want to clone the repository.
   - Run the following command to clone the repository:
     ```
     git clone https://https://github.com/Faresa/swapi.git
     ```

2. **Navigate to Project Directory:**
   - After cloning, navigate into the project directory using the `cd` command:
     ```
     cd swapi
     ```

3. **Install Dependencies:**
   - Once inside the project directory, run the following command to install the project dependencies:
     ```
     npm install
     ```

4. **Start the Server:**
   - After installing the dependencies, you can start the server using:
     ```
     node server.js
     ```
   - This command will start the Express.js server, and it will be ready to accept incoming requests.

5. **Accessing the Application:**
   - Once the server is running, you can access the application by navigating to `http://localhost:3000` in your web browser.
   - Replace `3000` with the port number specified in your application if it's different.

---

**Using Postman:**

1. **Open Postman:**
   - Launch the Postman application or navigate to the Postman web interface.

2. **Signup Endpoint:**
   - Method: `POST`
   - URL: `http://localhost:3000/signup`
   - Body (JSON):
     ```json
     {
       "firstName": "YourFirstName",
       "lastName": "YourLastName",
       "email": "your.email@example.com",
       "password": "YourPassword"
     }
     ```
   - Description: Register a new user with the provided details.

3. **Login Endpoint:**
   - Method: `POST`
   - URL: `http://localhost:3000/login`
   - Body (JSON):
     ```json
     {
       "email": "your.email@example.com",
       "password": "YourPassword"
     }
     ```
   - Description: Authenticate the user with the provided credentials and receive a JWT token.

4. **Search Endpoint:**
   - Method: `GET`
   - URL: `http://localhost:3000/search?query=<search_query>`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer <JWT-Token>`
   - Description: Search for Star Wars characters based on the provided query. Replace `<JWT-Token>` with the JWT token obtained after successful login.

5. **Check Cache Endpoint:**
   - Method: `GET`
   - URL: `http://localhost:3000/check-cache?query=<search_query>`
   - Description: Check if there is cached data for the specified search query.
