function checkAdminRole(req, res, next) {
    if (req.user.role === "admin" || req.user.role === "power_admin") {
      return next();
    }
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  
  module.exports = checkAdminRole;