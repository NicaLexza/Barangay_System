// routes/backupRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { backupDatabase } = require("../controllers/databaseBackupController");
const { restoreDatabase } = require("../controllers/databaseRestoreController");
const { verifyToken } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — generous for a growing dataset
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.sql$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only .sql files are allowed"));
    }
  },
});

router.get("/download", verifyToken, backupDatabase);
router.post("/restore", verifyToken, upload.single("file"), restoreDatabase);

module.exports = router;