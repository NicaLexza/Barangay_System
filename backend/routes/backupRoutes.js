// routes/backupRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { backupDatabase, getBackupSummary } = require("../controllers/databaseBackupController");
const { restoreDatabase } = require("../controllers/databaseRestoreController");
const { verifyToken } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.sql$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only .sql files are allowed"));
    }
  },
});

// Backup is now two calls: summary (re-auth + counts) then download
// (re-auth again + actual dump) — mirrors the restore flow's re-auth pattern.
router.post("/summary",  verifyToken, getBackupSummary);
router.post("/download", verifyToken, backupDatabase);
router.post("/restore",  verifyToken, upload.single("file"), restoreDatabase);

module.exports = router;