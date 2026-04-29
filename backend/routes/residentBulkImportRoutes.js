// routes/residentBulkImportRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { bulkImportResidents } = require("../controllers/residentBulkImportController");
const { previewImportResidents } = require("../controllers/residentImportPreviewController");
const { confirmImportResidents } = require("../controllers/residentImportConfirmController");
const { verifyToken } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx, .xls, or .csv files are allowed"));
    }
  },
});

// Original direct import (kept for backward compatibility)
router.post("/bulk-import", verifyToken, upload.single("file"), bulkImportResidents);

// New two-step import flow
router.post("/import-preview", verifyToken, upload.single("file"), previewImportResidents);
router.post("/import-confirm", verifyToken, confirmImportResidents);

module.exports = router;