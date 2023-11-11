const express = require("express");
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Function to generate a random short URL ID
function generateRandomString() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

// New route to render the "urls_new" template
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // Assuming your HTML form sends the long URL as "longURL" in the request body
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// New route to render the "urls_show" template for a specific short URL ID
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

// Handling Short URL Redirection
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});

// New POST route to handle URL updates
app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.params.id; // Get the short URL ID from the route parameter
  const newLongURL = req.body.newLongURL; // Get the new long URL from the request body

  // Update the long URL in the urlDatabase
  urlDatabase[shortURL] = newLongURL;

  // Redirect the client back to the URLs index page
  res.redirect("/urls");
});

// New route to handle the login form submission and set the user_id cookie
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find(u => u.email === email && u.password === password);
  if (user) {
    res.cookie('user_id', user.id);
  }
  res.redirect('/urls');
});

// New route to render the login form
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("login", templateVars);
});

// New route to handle the logout action
app.post("/logout", (req, res) => {
  // Clear the user_id cookie
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// GET route for the registration page
app.get("/register", (req, res) => {
  res.render("register");
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

  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password,
  };
  users[userId] = newUser;

  // Set user_id cookie with the newly generated user ID
  res.cookie('user_id', userId);

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
