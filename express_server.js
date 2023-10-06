// configuration
const express = require("express");
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail, urlsForUser } = require("./helpers.js");

// middleware
app.use(express.urlencoded({ extended: true })); //cretes req.body
//creates req.session
app.use(
  cookieSession({
    name: "whatever",
    keys: ["abc"],
  })
);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userId: "aJ48",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "aJ48",
  },
};

//Users' registration data
const users = {
  aJ48: {
    id: "aJ48",
    email: "a@a.com",
    password: "$2a$10$IFSkPnH2zOx2mnb/Yj4OLui57mBszPIZkbgFqumHg2dvhltR/6VQS",
  },
  abc3: {
    id: "abc3",
    email: "b@b.com",
    password: "$2a$10$IFSkPnH2zOx2mnb/Yj4OLui57mBszPIZkbgFqumHg2dvhltR/6VQS",
  },
};

// render the index
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

// render the main page for listing URL
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("Please login first");
  }
  const userIdArr = urlsForUser(userId, urlDatabase);
  const templateVars = {
    urls: urlDatabase,
    user: users[userId],
    arr: userIdArr,
  };
  res.render("urls_index", templateVars);
});

// create a shortURL
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("Please login first");
  }
  const longURL = req.body.longURL;
  const shortURL = Math.random().toString(36).substring(2, 8);
  // create a new url long and short
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: userId,
  };
  res.redirect(`/urls/${shortURL}`);
});

//render the page to create a new shortURL
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_new", templateVars);
});

//access to our shortURL
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;
  // If someone makes a request for a url that doesn't exist (no url with provided id in our database), they should see a relevant error message
  if (!urlDatabase[id]) {
    return res.status(404).send("invalid shortURL or id");
  }

  //The individual URL pages should not be accessible to users who are not logged in.
  if (!userId) {
    return res.status(403).send("Please login first");
  }

  //The individual URL pages should not be accesible if the URL does not belong to them.
  if (userId !== urlDatabase[id].userId) {
    return res.status(404).send("No permision here");
  }
  const longURL = urlDatabase[id].longURL;
  const templateVars = {
    id,
    longURL,
    user: users[userId],
  };
  res.render("urls_show", templateVars);
});

// POST edit a new longURL based on the current shortURL
//used to test for the a hacker edit the url
//curl -b "user_id=b6UTxQ" -X POST -d "longURL=http://www.lighthouselabs.com" localhost:8080/urls/b6UTxQ
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userId = req.session.user_id;
  // return a relevant error message if id does not exist
  if (!urlDatabase[id]) {
    return res.status(404).send("Error 404: URL Not Found");
  }

  // return a relevant error message if the user is not logged in
  if (!userId) {
    return res.status(403).send("Please login first");
  }

  //return a relevant error message if the user does not own the URL
  if (urlDatabase[id].userId !== userId) {
    return res.status(403).send("No permision to add");
  }

  urlDatabase[id] = {
    longURL: req.body.longURL,
    userId: userId,
  };
  res.redirect("/urls");
});

//delete a shortURL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userId = req.session.user_id;
  // return a relevant error message if id does not exist
  if (!urlDatabase[id]) {
    return res.status(404).send("Error 404: URL Not Found");
  }

  // return a relevant error message if the user is not logged in
  if (!userId) {
    return res.status(403).send("Please login first");
  }

  //return a relevant error message if the user does not own the URL
  if (urlDatabase[id].userId !== userId) {
    return res.status(403).send("No permision to delete");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

// redirect to the longURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  for (key in urlDatabase) {
    if (key === id) {
      const longURL = urlDatabase[id].longURL;
      return res.redirect(longURL);
    }
  }
  res.status(404).send("Error 404: URL Not Found");
});

//GET /register
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_register", templateVars);
});

//POST /register
app.post("/register", (req, res) => {
  // grab the information from the incoing body
  const email = req.body.email;
  const password = req.body.password;

  //did they NOT submit an email and password?
  if (!email || !password) {
    return res.status(400).send("please provide an email and password");
  }

  //look for a user based on the email provided
  const foundUser = getUserByEmail(email, users);

  // did we find a user?
  if (foundUser) {
    return res.status(400).send("a user with that email is already registered");
  }

  // the email must be unique
  // add the user to the userobj
  const id = Math.random().toString(36).substring(2, 6);

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const user = {
    id: id,
    email: email,
    password: hash,
  };
  users[id] = user;
  console.log(users);
  req.session.user_id = id;
  res.redirect("/urls");
});

// GET /login
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_login", templateVars);
});

// POST /login
app.post("/login", (req, res) => {
  // grab the information from the incoing body
  const email = req.body.email;
  const password = req.body.password;

  // did they NOT submit an email and password?
  if (!email || !password) {
    return res.status(400).send("passwords do not match");
  }

  //lookup the user based on their email address
  const foundUser = getUserByEmail(email, users);

  //did we Not find a user?
  if (!foundUser) {
    return res.status(403).send("no user with that email found");
  }

  //do the password NOT match
  const result = bcrypt.compareSync(password, foundUser.password);
  if (!result) {
    res.status(403).send("passwords do not match");
  }

  //the user is who they say they are!!!
  //set a cookie
  req.session.user_id = foundUser.id;

  //send the user somewhere
  res.redirect("/urls");
});

// logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});
