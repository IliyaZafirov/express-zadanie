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

    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/", // важно
      expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    };

    res.cookie("userRegistered", token, cookieOptions);
    return res.json({ success: true, case: "loggedIn" });
  } catch (err) {
    console.log(`Error in login function ${err}`);
    return res.json({
      success: false,
      case: "error",
    });
  }
};

module.exports = login;
