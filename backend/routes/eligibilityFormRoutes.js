const express = require('express');
const router = express.Router();

const {getForms, updateFormStatus} = require('../controllers/EligibilityFormController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get("/", verifyToken, getForms);
router.put("/:id/status", verifyToken, updateFormStatus);

module.exports = router;