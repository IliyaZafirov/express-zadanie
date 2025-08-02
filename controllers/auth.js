const express = require("express");
const register = require("./register");
const login = require("./login");
const forgot = require("./forgot");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot", forgot);

module.exports = router;
