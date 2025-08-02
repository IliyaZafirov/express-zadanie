const { client } = require("../config/db-config");
const bcrypt = require("bcryptjs");

const forgot = async (req, res) => {
  try {
    const { email, new_password } = req.body;

    const checkEmailQuery = "SELECT email FROM users WHERE email = $1;";
    const emailResult = await client.query(checkEmailQuery, [email.trim()]);

    if (emailResult.rows.length === 0) {
      return res.json({
        success: false,
        case: "email-not-found",
      });
    }

    const password = await bcrypt.hash(new_password, 8);

    const updatePasswordQuery =
      "UPDATE users SET password = $1 WHERE email = $2;";
    await client.query(updatePasswordQuery, [password, email.trim()]);

    return res.json({
      success: true,
      case: "password-updated",
    });
  } catch (err) {
    console.log(`Error in forgot function: ${err}`);
    return res.json({
      success: false,
      case: "error",
    });
  }
};

module.exports = forgot;
