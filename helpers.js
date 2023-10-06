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

module.exports = { getUserByEmail };