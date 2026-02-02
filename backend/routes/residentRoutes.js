// routes/residentRoutes.js
const express = require("express");
const router = express.Router();
const { getAllResidents } = require("../controllers/residentController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET all residents (protected route)
router.get("/", verifyToken, getAllResidents);

// Later: we'll add POST /add, PUT /:id, DELETE /:id

module.exports = router;