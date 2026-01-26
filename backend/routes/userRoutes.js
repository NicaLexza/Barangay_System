// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { addAccount } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/users/add
router.post("/add", verifyToken, addAccount);

module.exports = router;
