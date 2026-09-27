// routes/eligibilityFormEntriesRemoveRoutes.js
const express = require("express");
const router = express.Router();
const { removeEntry } = require("../controllers/eligibilityFormEntriesRemoveController");
const { verifyToken } = require("../middleware/authMiddleware");

router.put("/entries/:id/remove", verifyToken, removeEntry);

module.exports = router;
