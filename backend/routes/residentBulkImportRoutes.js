// routes/residentBulkImportRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
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

// Old single-shot /bulk-import endpoint RETIRED — under the household model
// it would silently create orphaned residents (is_household_head defaults to
// 0 with no head_resident_id), violating the invariant that every resident
// is either a head or linked to one. Use the two-step flow below instead.

// Two-step import flow (the only supported import path going forward).
// Imported residents default to heads-of-one (is_household_head = 1).
router.post("/import-preview", verifyToken, upload.single("file"), previewImportResidents);
router.post("/import-confirm", verifyToken, confirmImportResidents);

module.exports = router;