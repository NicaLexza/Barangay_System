// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { changePassword } = require("../controllers/userChangePassController");
const { verifyToken } = require("../middleware/authMiddleware");

// PUT /api/users/:id/password
router.put("/:id/password", verifyToken, changePassword);

module.exports = router;
