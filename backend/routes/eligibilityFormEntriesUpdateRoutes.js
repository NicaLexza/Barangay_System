// routes/eligibilityFormEntriesUpdateRoutes.js
const express = require("express");
const router = express.Router();
const { updateEntryStatus } = require("../controllers/eligibilityFormEntriesUpdateController");
const { verifyToken } = require("../middleware/authMiddleware");

router.put("/entries/:id/status", verifyToken, updateEntryStatus);

module.exports = router;