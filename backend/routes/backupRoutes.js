// routes/backupRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { getBackupSummary, generateBackup, downloadGeneratedBackup } = require("../controllers/databaseBackupController");
const { restoreDatabase } = require("../controllers/databaseRestoreController");
const { verifyToken } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(sql|enc)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only .sql and .enc files are allowed"));
    }
  },
});

// Backup is now a three-step flow:
//   1. /summary        — re-auth + current record counts (for the confirmation UI)
//   2. /generate        — re-auth + runs mysqldump server-side, verifies the dump
//                          against a live-DB snapshot, holds the encrypted result
//                          in memory, returns a verification report + a one-time
//                          download token
//   3. /download/:token — fetches the already-generated, already-verified file
//                          bytes; no re-auth needed here since /generate already
//                          gated the sensitive action
router.post("/summary",        verifyToken, getBackupSummary);
router.post("/generate",       verifyToken, generateBackup);
router.get("/download/:token", verifyToken, downloadGeneratedBackup);

router.post("/restore", verifyToken, upload.single("file"), restoreDatabase);

module.exports = router;