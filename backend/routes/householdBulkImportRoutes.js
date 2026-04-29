// routes/householdBulkImportRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { previewImportHouseholds } = require("../controllers/householdImportPreviewController");
const { confirmImportHouseholds } = require("../controllers/householdImportConfirmController");
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

// Two-step import flow
router.post("/import-preview", verifyToken, upload.single("file"), previewImportHouseholds);
router.post("/import-confirm", verifyToken, confirmImportHouseholds);

module.exports = router;