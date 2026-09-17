// routes/residentArchiveRoutes.js
const express = require("express");
const router = express.Router();
const {
  archiveResident,
  getArchivedResidents,
  restoreResident,
} = require("../controllers/residentArchiveController");
const { verifyToken } = require("../middleware/authMiddleware");

// NOTE: /archived must be registered before residentRoutes.js's GET /:id
// (this file is mounted first in server.js) so Express doesn't treat the
// literal string "archived" as a resident_id param — same reasoning as
// /Eligibility/Archived needing to precede /Eligibility/:formId on the
// frontend.
router.get("/archived", verifyToken, getArchivedResidents);
router.put("/archived/:id/restore", verifyToken, restoreResident);

// Admin + Staff can archive (role not restricted here — matches the old
// delete endpoint's permission level, just repointed to archive instead).
router.put("/archive/:id", verifyToken, archiveResident);

module.exports = router;