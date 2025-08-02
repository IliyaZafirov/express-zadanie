const jwt = require("jsonwebtoken");

const checkUserCookie = (req, res, next) => {
  const token = req.cookies.userRegistered;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

module.exports = checkUserCookie;
