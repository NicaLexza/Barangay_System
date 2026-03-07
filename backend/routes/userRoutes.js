const express = require("express");
const router = express.Router();

const { getAllUsers, getUser } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

// List all users
router.get("/", verifyToken, getAllUsers);

// Single user by ID
router.get("/:id", verifyToken, getUser);

// Later: add POST /add, PUT /update, DELETE /:id 

module.exports = router;