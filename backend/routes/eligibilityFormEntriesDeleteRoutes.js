// routes/eligibilityFormEntriesDeleteRoutes.js
const express = require("express");
const router = express.Router();
const { deleteEntry } = require("../controllers/eligibilityFormEntriesDeleteController");
const { verifyToken } = require("../middleware/authMiddleware");

router.delete("/entries/delete/:id", verifyToken, deleteEntry);

module.exports = router;