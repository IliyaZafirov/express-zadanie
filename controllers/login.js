const jwt = require("jsonwebtoken");
const { client } = require("../config/db-config");
const bcrypt = require("bcryptjs");

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({
      success: false,
      case: "empty-fields",
    });
  }

  try {
    const query = "SELECT * FROM users WHERE username = $1";
    const values = [username];
    const result = await client.query(query, values);

    if (
      result.rows.length === 0 ||
      !(await bcrypt.compare(password, result.rows[0].password))
    ) {
      return res.json({
        success: false,
        case: "incorrect",
      });
    }

    const userId = result.rows[0].id;

    const token = jwt.sign(
      { id: userId, role: result.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
      ),
      // httpOnly: true, // Dangerous! Only for test purposes. httpOnly as comment to use js-cookie on front end for nav btns, but now is xss vulnerable
      secure: true,
      sameSite: "None",
      // domain: ".zadanie.com",
    };
    res.cookie("userRegistered", token, cookieOptions);

    await client.query(
      `
      INSERT INTO events (user_id, type, details)
      VALUES ($1, 'login', $2);
      `,
      [
        userId,
        JSON.stringify({
          login_at: new Date().toISOString(),
          ip: req.ip,
        }),
      ]
    );

    return res.json({ success: true, case: "loggedIn" });
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      case: "error",
    });
  }
};

module.exports = login;
