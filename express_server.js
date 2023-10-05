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

//which returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id) => {
  const userUrls = []
  for (key in urlDatabase) {
    if (urlDatabase[key].userId === id) {
      userUrls.push({
        shortURL: key,
        longURL: urlDatabase[key].longURL
      });
    }
  }
  return userUrls;
}

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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userId: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "aJ48lW",
  },
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "a@a.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "123",
  },
};

// arr.forEach(x => {
//   x.shortURL
//   x.longURL
// });


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send("Please login first");
  } 
  const userIdArr = urlsForUser(userId);
  const templateVars = {
    urls: urlDatabase,
    user: users[userId],
    arr: userIdArr,
  };
  res.render("urls_index", templateVars);
})

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send("Please login first");
  }
  const longURL = req.body.longURL;
  const shortURL = gen(6);
  // create a new url long and short
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: userId
  };
  res.redirect("/urls/${shortURL}");
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login")
  }
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_register", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const id = req.params.id;
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
})


// POST edit a new longURL based on the current shortURL
//used to test for the a hacker edit the url
//curl -b "user_id=b6UTxQ" -X POST -d "longURL=http://www.lighthouselabs.com" localhost:8080/urls/b6UTxQ
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userId = req.cookies["user_id"];
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
    userId: "aJ48lW",
  };
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userId = req.cookies["user_id"];
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
  res.redirect("/urls");
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


