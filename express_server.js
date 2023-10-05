const express = require("express");
const app = express();
const PORT = 8080;
app.set("view engine", "ejs"); // configuration
app.use(express.urlencoded({ extended: true })); //cretes req.body
const cookieParser = require("cookie-parser");
app.use(cookieParser()); // creates req.cookies


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const getUserByEmail = (inputEmail) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === inputEmail) {
      return user;
    }
  }
  return null;
};

const gen = function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

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



app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    urls: urlDatabase,
    user: users[userId],
  };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = gen(6);
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
})


app.get("/urls/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_register", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const userId = req.cookies["user_id"]
  const templateVars = {
    id, longURL,
    user: users[userId]
  };
  res.render("urls_show", templateVars)
})


app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
})

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls`);
});



//GET /register
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
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
    return res.status(400).send('please provide an email and password')
  }

  //look for a user based on the email provided
  const foundUser = getUserByEmail(email);

  // did we find a user?
  if (foundUser) {
    return res.status(400).send("a user with that email is already registered");
  }

  // the email must be unique
  // add the user to the userobj
  const id = Math.random().toString(36).substring(2, 6);

  const user = {
    id: id,
    email: email,
    password: password
  }

  users[id] = user;
  res.cookie("user_id", id);
  //send the user somewhere
  res.redirect(`/urls`);
})

// GET /login
app.get('/login', (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_login", templateVars);
})

// POST /login
app.post("/login", (req, res) => {
  // grab the information from the incoing body
  const email = req.body.email;
  const password = req.body.password;

  // did they NOT submit an email and password?
  if (!email || !password) {
    return res.status(400).send('passwords do not match')
  }

  //lookup the user based on their email address
  const foundUser = getUserByEmail(email);

  //did we Not find a user?
  if (!foundUser) {
    return res.status(403).send('no user with that email found')
  }

  //do the password NOT match
  if (foundUser.password !== password) {
    res.status(403).send('passwords do not match')
  }

  //the user is who they say they are!!!
  //set a cookie
  res.cookie("user_id", foundUser.id);

  //send the user somewhere
  res.redirect("/urls");
});



// logout 
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});


