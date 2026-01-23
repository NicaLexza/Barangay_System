// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { addAccount } = require("../controllers/userController");

// POST /api/users/add
router.post("/add", addAccount);

module.exports = router;
