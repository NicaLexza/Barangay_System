// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController.js"); // make sure this is correct

// POST /login endpoint
router.post("/login", login);

module.exports = router;
//potangina mo wala ako database di ako makalogin