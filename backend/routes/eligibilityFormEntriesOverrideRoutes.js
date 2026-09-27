// routes/eligibilityFormEntriesOverrideRoutes.js
const express = require("express");
const router = express.Router();
const { overridePromote } = require("../controllers/eligibilityFormEntriesOverrideController");
const { verifyToken } = require("../middleware/authMiddleware");

router.put("/entries/:id/override-promote", verifyToken, overridePromote);

module.exports = router;
