const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// Set EJS as the view engine
app.set("view engine", "ejs");

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
  const templateVars = { urls: urlDatabase, username: req.cookies.username };
  res.render("urls_index", templateVars);
});

// New route to render the "urls_new" template
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // Assuming your HTML form sends the long URL as "longURL" in the request body
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// New route to render the "urls_show" template for a specific short URL ID
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies.username };
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

// New route to handle the login form submission and set the username cookie
app.post("/login", (req, res) => {
  const { username } = req.body;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
