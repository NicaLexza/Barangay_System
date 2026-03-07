// routes/userEditRoutes.js
const express = require("express");
const router = express.Router();

const { updateUser } = require("../controllers/userEditController");
const { verifyToken } = require("../middleware/authMiddleware");

// PUT /api/users/update - protected

router.put("/update", verifyToken, updateUser);

module.exports = router;