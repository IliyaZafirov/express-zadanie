const { client } = require("../config/db-config");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  try {
    const { username, email, password: Npassword } = req.body;

    const usernameResult = await client.query(
      "SELECT username FROM users WHERE username = $1;",
      [username]
    );
    if (usernameResult.rows.length > 0) {
      return res.json({
        success: false,
        case: "username-already-exists",
      });
    }

    const emailResult = await client.query(
      "SELECT email FROM users WHERE email = $1;",
      [email]
    );
    if (emailResult.rows.length > 0) {
      return res.json({
        success: false,
        case: "email-already-exists",
      });
    }

    const password = await bcrypt.hash(Npassword, 8);

    const insertUserResult = await client.query(
      `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id;
      `,
      [username.trim(), email.trim(), password]
    );

    const userId = insertUserResult.rows[0].id;

    await client.query(
      `
      INSERT INTO events (user_id, type, details)
      VALUES ($1, 'registration', $2);
      `,
      [
        userId,
        JSON.stringify({
          registered_at: new Date().toISOString(),
          ip: req.ip,
        }),
      ]
    );

    return res.json({
      success: true,
      case: "created",
      user_id: userId,
    });
  } catch (err) {
    console.err(err);
    return res.json({
      success: false,
      case: "error",
    });
  }
};

module.exports = register;
