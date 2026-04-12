// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController.js"); // make sure this is correct
const { changeDefaultPassword } = require("../controllers/changeDefaultPasswordController");
const {verifyToken}  = require("../middleware/authMiddleware");


// POST /login endpoint
router.post("/login", login);
// PUT /change-default-password endpoint
router.put("/change-default-password", verifyToken, changeDefaultPassword);

module.exports = router;