// routes/eligibilityPoolRoutes.js
const express = require("express");
const router = express.Router();
const {
  previewPool,
  createFormFromPool,
  getPoolOptions,
} = require("../controllers/eligibilityPoolController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET  /api/eligibility-forms/pool-options — streets for the criteria step
router.get("/pool-options", verifyToken, getPoolOptions);

// POST /api/eligibility-forms/pool-preview — read-only, builds the pool
router.post("/pool-preview", verifyToken, previewPool);

// POST /api/eligibility-forms/create — server rebuilds the pool, then saves form + entries
router.post("/create", verifyToken, createFormFromPool);

module.exports = router;