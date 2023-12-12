const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

// Set EJS as the view engine
app.set("view engine", "ejs");

// Global users object to store user data
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
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

// Function to generate a random short URL ID
function generateRandomString() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to get a user by their email
function getUserByEmail(email) {
  return Object.values(users).find(user => user.email === email);
};

// Function to get URLs specific to a user
function urlsForUser(id) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}

// Preparing the express.js to handle POST
app.use(express.urlencoded({ extended: true }));

// Add this middleware to set and read cookies
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
  res.send("Hello!");
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
  const userId = req.cookies.user_id;
  if (!userId) {
    res.send("<html><body>Please <a href='/login'>login</a> or <a href='/register'>register</a> first.</body></html>\n");
  } else {
    const userURLs = urlsForUser(userId);
    const templateVars = { urls: userURLs, user_id: users[userId] };
    res.render("urls_index", templateVars);
  }
});

// New route to render the "urls_new" template
app.get("/urls/new", (req, res) => {
  // Check if the user is not logged in, redirect to the login page
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { user_id: users[req.cookies.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.status(403).send("You must be logged in to create a new URL.");
  } else {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

// New route to render the "urls_show" template for secure individual URL page access
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (!userId) {
    res.status(403).render("error", { errorMessage: "You must be logged in to view this URL." });
  } else if (!urlData) {
    res.status(404).render("error", { errorMessage: "Short URL not found" });
  } else if (urlData.userID !== userId) {
    res.status(403).render("error", { errorMessage: "You do not have permission to view this URL." });
  } else {
    const templateVars = { id: shortURL, longURL: urlData.longURL, user_id: users[userId] };
    res.render("urls_show", templateVars);
  }
});

// Handling Short URL Redirection
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).render("error", { errorMessage: "Short URL not found" });
  }
});

// New POST route to handle URL updates and deletes
app.post("/urls/:id/update", (req, res) => {
  const userId = req.cookies.user_id;
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (!userId) {
    res.status(403).send("You must be logged in to edit this URL.");
  } else if (!urlData) {
    res.status(404).send("Short URL not found");
  } else if (urlData.userID !== userId) {
    res.status(403).send("You do not have permission to edit this URL.");
  } else {
    const newLongURL = req.body.newLongURL;
    urlData.longURL = newLongURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies.user_id;
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];

  if (!userId) {
    res.status(403).send("You must be logged in to delete this URL.");
  } else if (!urlData) {
    res.status(404).send("Short URL not found");
  } else if (urlData.userID !== userId) {
    res.status(403).send("You do not have permission to delete this URL.");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// New route to handle the login form submission and set the user_id cookie
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // Use the getUserByEmail function to find the user by email
  const user = getUserByEmail(email);
  // Check if hashed user exists and if passwords match
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid email or password");
    return;
  }
  // Set user_id cookie with the matching user's random ID
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

// New route to render the login form
app.get("/login", (req, res) => {
  const templateVars = { user_id: users[req.cookies.user_id] };
  res.render("login", templateVars);
});

// New route to handle the logout action
app.post("/logout", (req, res) => {
  // Clear the user_id cookie
  res.clearCookie('user_id');
  // Redirect to the login page
  res.redirect('/login');
});

// GET route for the registration page
app.get("/register", (req, res) => {
  const templateVars = { user_id: req.cookies.user_id }; // Provide user_id here
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
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
