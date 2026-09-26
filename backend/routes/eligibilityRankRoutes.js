// routes/eligibilityRankRoutes.js
const express = require("express");
const router = express.Router();
const {
  rankPreview,
  rankDraw,
  createRankedForm,
  getPriorityFactorsList,
} = require("../controllers/eligibilityRankController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/eligibility-forms/priority-factors?unit=... — factor catalogue for the wizard
router.get("/priority-factors", verifyToken, getPriorityFactorsList);

// POST /api/eligibility-forms/rank-preview — read-only, any authenticated role
router.post("/rank-preview", verifyToken, rankPreview);

// POST /api/eligibility-forms/rank-draw — generates a seed, resolves ties; any authenticated role
router.post("/rank-draw", verifyToken, rankDraw);

// POST /api/eligibility-forms/create-ranked — Admin + re-auth (checked inside the controller)
router.post("/create-ranked", verifyToken, createRankedForm);

module.exports = router;