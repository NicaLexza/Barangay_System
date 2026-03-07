// routes/userDeleteRoutes.js
const express = require("express");
const router = express.Router();

const { deleteUser } = require("../controllers/userDeleteController");
const { verifyToken } = require("../middleware/authMiddleware");

// PUT /api/users/update - protected

router.delete("/delete/:id", verifyToken, deleteUser);

module.exports = router;