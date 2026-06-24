// routes/backupRoutes.js
const express = require("express");
const router = express.Router();
const { backupDatabase } = require("../controllers/databaseBackupController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/download", verifyToken, backupDatabase);

module.exports = router;