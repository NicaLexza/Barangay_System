// routes/residentRoutes.js (or residentAddRoutes.js)
const express = require("express");
const router = express.Router();

const { getAllResidents, getResident } = require("../controllers/residentController");
const { verifyToken } = require("../middleware/authMiddleware");

// Existing list route
router.get("/", verifyToken, getAllResidents);

// NEW: single resident
router.get("/:id", verifyToken, getResident);

// Your other routes (POST /add, PUT /update, etc.)

module.exports = router;