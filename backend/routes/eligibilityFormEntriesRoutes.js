// routes/eligibilityFormEntriesRoutes.js
const express = require("express");
const router = express.Router();

const { getEntries } = require("../controllers/eligibilityFormEntriesController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/:formId/entries", verifyToken, getEntries);

module.exports = router;