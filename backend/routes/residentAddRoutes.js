// routes/residentAddRoutes.js
const express = require("express");
const router = express.Router();

const { addResident } = require("../controllers/residentAddController");
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/residents/add - protected
router.post("/add", verifyToken, addResident);

module.exports = router;