// routes/eligibilityFormArchiveRoutes.js
const express = require("express");
const router = express.Router();
const {
  getArchivedForms,
  restoreForm,
  permanentDeleteForm,
} = require("../controllers/eligibilityFormArchiveController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET  /api/eligibility-forms/archived          — all roles
router.get("/archived", verifyToken, getArchivedForms);

// POST /api/eligibility-forms/archived/:id/restore — admin only (re-auth in controller)
router.post("/archived/:id/restore", verifyToken, restoreForm);

// DELETE /api/eligibility-forms/archived/:id    — admin only (re-auth in controller)
router.delete("/archived/:id", verifyToken, permanentDeleteForm);

module.exports = router;