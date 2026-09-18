// routes/residentRoutes.js
const express = require("express");
const router = express.Router();

const { getAllResidents, getResident, getHeads } = require("../controllers/residentController");
const { verifyToken } = require("../middleware/authMiddleware");

// Existing list route
router.get("/", verifyToken, getAllResidents);

// Heads-only list for the "Add Member" modal dropdown.
// Must be registered BEFORE /:id so Express doesn't treat "heads" as an id.
router.get("/heads", verifyToken, getHeads);

// Single resident by ID (edit modal)
router.get("/:id", verifyToken, getResident);

module.exports = router;