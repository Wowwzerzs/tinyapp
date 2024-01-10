const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
const { getUserByEmail, generateRandomString, urlsForUser, checkUserPermission, getUserById } = require('./helpers'); // Importing the getUserByEmail function from helpers.js

// Set EJS as the view engine
app.set("view engine", "ejs");

const cookieSession = require('cookie-session'); // Add this middleware to set and read cookies
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'] // Add your secret keys here for encryption
}));

// Middleware to initialize req.session if undefined
app.use((req, res, next) => {
  if (!req.session) {
    req.session = {};
  }
  next();
});

// Global users object to store user data
const hashedPassword1 = bcrypt.hashSync("purple-monkey-dinosaur", 10);
const hashedPassword2 = bcrypt.hashSync("dishwasher-funk", 10);

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: hashedPassword1, // Replace existing plain text with hashed password
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashedPassword2, // Replace existing plain text with hashed password
  },
  // ... other users
};

// Modify the structure of urlDatabase
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  // ... Other URLs
};

// Preparing the express.js to handle POST
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// New route to respond with the urlDatabase in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// New route to respond with an HTML response
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// New route to render the "urls_index" template
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const user = getUserById(user_id, users); // Retrieve user data based on session ID

  if (!user_id) {
    res.send("<html><body>Please <a href='/login'>login</a> or <a href='/register'>register</a> first.</body></html>\n");
  } else {
    const userURLs = urlsForUser(user_id, urlDatabase);
    const templateVars = { urls: userURLs, user }; // Pass 'user' to the template
    res.render("urls_index", templateVars);
  }
});

// New route to render the "urls_new" template
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const user = getUserById(user_id, users); // Retrieve user data based on session ID

  if (!user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { user_id, user }; // Pass 'user' to the template
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send("You must be logged in to create a new URL.");
  } else {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    const userId = req.session.user_id;
    urlDatabase[shortURL] = { longURL, userID: userId };
    res.redirect(`/urls/${shortURL}`);
  }
});

// New route to render the "urls_show" template for secure individual URL page access
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (!checkUserPermission(res, user_id, urlData)) {
    return;
  }

  const user = getUserById(user_id, users); // Fetch user data

  const templateVars = { id: shortURL, longURL: urlData.longURL, user_id, user }; // Pass 'user' to the template
  res.render("urls_show", templateVars);
});

app.get("/urls/:id/show", (req, res) => {
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (!urlData) {
    return res.status(404).send("Short URL not found.");
  }

  const templateVars = {
    id: shortURL,
    longURL: urlData.longURL,
    user_id: req.session.user_id,
    user: users[req.session.user_id] // Pass the user information
  };

  res.render("urls_show", templateVars);
});

// Handling Short URL Redirection
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (urlData) {
    res.redirect(urlData.longURL);
  } else {
    res.status(404).render("error", { errorMessage: "Short URL not found" });
  }
});

// New POST route to handle URL updates and deletes
app.post("/urls/:id/update", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (!checkUserPermission(res, userId, urlData)) {
    return;
  }

  const newLongURL = req.body.newLongURL;
  urlData.longURL = newLongURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (!checkUserPermission(res, userId, urlData)) {
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Route to handle user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  // Check if user exists and passwords match
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid email or password");
    return;
  }

  req.session.user_id = user.id; // Set user_id cookie with the matching user's ID

  // Log the user_id and associated URLs after successful login
  const user_id = req.session.user_id;
  const userURLs = urlsForUser(user_id, urlDatabase);
  console.log("User ID:", user_id);
  console.log("User's URLs:", userURLs);

  res.redirect('/urls');
});

// Route to render the login form
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  const user = getUserById(user_id, users); // Fetch user data

  const templateVars = { user_id, user }; // Pass 'user' to the template
  res.render("login", templateVars);
});

// New route to handle the logout action
app.post("/logout", (req, res) => {
  req.session = null; // Clear the user_id cookie
  res.redirect('/login'); // Redirect to the login page
});

// Route to render the registration form
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  const user = getUserById(user_id, users); // Fetch user data

  const templateVars = { user_id, user }; // Pass 'user' to the template
  res.render("register", templateVars);
});

// POST route for user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password are required");
    return;
  }

  // Check if email already exists
  if (Object.values(users).find(u => u.email === email)) {
    res.status(400).send("Email already registered");
    return;
  }
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password

  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password: hashedPassword, // Store the hashed password
  };
  users[userId] = newUser;

  // Set user_id cookie with the newly generated user ID
  req.session.user_id = userId;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
