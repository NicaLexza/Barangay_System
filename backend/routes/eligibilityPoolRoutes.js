// routes/eligibilityPoolRoutes.js
const express = require("express");
const router = express.Router();
const {
  previewPool,
  createFormFromPool,
  getPoolOptions,
} = require("../controllers/eligibilityPoolController");
const { createProvidedForm } = require("../controllers/eligibilityProvidedController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET  /api/eligibility-forms/pool-options — streets for the criteria step
router.get("/pool-options", verifyToken, getPoolOptions);

// POST /api/eligibility-forms/pool-preview — read-only, builds the pool
router.post("/pool-preview", verifyToken, previewPool);

// POST /api/eligibility-forms/create — server rebuilds the pool, then saves form + entries
router.post("/create", verifyToken, createFormFromPool);

// POST /api/eligibility-forms/create-provided — manually selected from provided agency list
router.post("/create-provided", verifyToken, createProvidedForm);

module.exports = router;