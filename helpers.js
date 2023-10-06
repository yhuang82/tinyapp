// helper function:
const getUserByEmail = (inputEmail, database) => {
  for (const userId in database) {
    let user = database[userId];
    if (user.email === inputEmail) {
      return user;
    }
  }
  return undefined;
};


//which returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id, database) => {
  const userUrls = []
  for (key in database) {
    if (database[key].userId === id) {
      userUrls.push({
        shortURL: key,
        longURL: database[key].longURL,
      });
    }
  }
  return userUrls;
}


module.exports = { getUserByEmail, urlsForUser };