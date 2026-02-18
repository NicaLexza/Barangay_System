const express = require("express");
const router = express.Router();

const { getAllHouseholds, getHousehold } = require("../controllers/householdController");
const { verifyToken } = require("../middleware/authMiddleware");

// List all households
router.get("/", verifyToken, getAllHouseholds);

// Single household by ID
router.get("/:id", verifyToken, getHousehold);

// Later: add POST /add, PUT /update, DELETE /:id

module.exports = router;