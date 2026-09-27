const express = require('express');
const router = express.Router();

const { getForms, updateFormStatus } = require('../controllers/EligibilityFormController');
const { getFormReport } = require('../controllers/eligibilityFormReportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get("/", verifyToken, getForms);
router.get("/:id/report", verifyToken, getFormReport);
router.put("/:id/status", verifyToken, updateFormStatus);

module.exports = router;