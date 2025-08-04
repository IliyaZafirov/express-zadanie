const { client } = require("../config/db-config");
const bcrypt = require("bcryptjs");

const forgot = async (req, res) => {
  try {
    const { email, new_password } = req.body;

    const emailResult = await client.query(
      "SELECT id, email FROM users WHERE email = $1;",
      [email.trim()]
    );

    if (emailResult.rows.length === 0) {
      return res.json({
        success: false,
        case: "email-not-found",
      });
    }

    const userId = emailResult.rows[0].id;
    
    const password = await bcrypt.hash(new_password, 8);
    console.log(userId, email, password);

    await client.query("UPDATE users SET password = $1 WHERE email = $2;", [
      password,
      email.trim(),
    ]);

    await client.query(
      `
      INSERT INTO events (user_id, type, details)
      VALUES ($1, 'change_password', $2);
      `,
      [
        userId,
        JSON.stringify({
          changed_at: new Date().toISOString(),
          ip: req.ip,
        }),
      ]
    );

    return res.json({
      success: true,
      case: "password-updated",
    });
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      case: "error",
    });
  }
};

module.exports = forgot;
