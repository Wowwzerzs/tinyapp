// Function to get a user by their email
const getUserByEmail = function(email, database) {
  return Object.values(database).find(user => user.email === email);
};

// Function to get a user by their ID
const getUserById = function(id, users) {
  return users[id];
};

// Function to generate a random short URL ID
const generateRandomString = function() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to get URLs specific to a user
const urlsForUser = function(id, urlDatabase) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

// Function to check user permission
const checkUserPermission = (res, userId, urlData) => {
  if (!userId) {
    res.status(403).send("You must be logged in to perform this action.");
    return false;
  } else if (!urlData) {
    res.status(404).send("Short URL not found.");
    return false;
  } else if (urlData.userID !== userId) {
    res.status(403).send("You do not have permission to perform this action.");
    return false;
  }
  return true;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  checkUserPermission,
  getUserById
};
