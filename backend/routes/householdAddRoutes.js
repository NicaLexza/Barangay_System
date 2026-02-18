const express = require('express');
const router = express.Router();

const { addHousehold } = require('../controllers/householdAddController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/households/add - protected
router.post('/add', verifyToken, addHousehold);

module.exports = router;