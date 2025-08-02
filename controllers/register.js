const { client } = require("../config/db-config");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  try {
    const { username, email, password: Npassword } = req.body;

    const checkUsernameQuery =
      "SELECT username FROM users WHERE username = $1;";
    const usernameResult = await client.query(checkUsernameQuery, [username]);
    if (usernameResult.rows.length > 0) {
      return res.json({
        success: false,
        case: "username-already-exists",
      });
    }

    const checkEmailQuery = "SELECT email FROM users WHERE email = $1;";
    const emailResult = await client.query(checkEmailQuery, [email]);
    if (emailResult.rows.length > 0) {
      return res.json({
        success: false,
        case: "email-already-exists",
      });
    }

    const password = await bcrypt.hash(Npassword, 8);

    const insertUserQuery =
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3);";
    const insertUserResult = await client.query(insertUserQuery, [
      username.trim(),
      email.trim(),
      password.trim(),
    ]);

    return res.json({
      success: true,
      case: "created", 
    });
  } catch (err) {
    console.log(`Error in register function ${err}`);
    return res.json({
      success: false,
      case: "error",
    });
  }
};

module.exports = register;
