// routes/eligibilityFormDeleteRoutes.js
const express = require('express');
const router = express.Router();
const { deleteForm } = require('../controllers/eligibilityFormDeleteController');
const { verifyToken } = require('../middleware/authMiddleware');

router.delete("/delete/:id", verifyToken, deleteForm);

module.exports = router;