// routes/householdEditRoutes.js
const express = require("express");
const router = express.Router();

const { updateHousehold } = require("../controllers/householdEditController");
const { verifyToken } = require("../middleware/authMiddleware");

// PUT /api/households/update - protected

router.put("/update", verifyToken, updateHousehold);

module.exports = router;