// routes/residentAddRoutes.js
const express = require("express");
const router = express.Router();

const { updateResident } = require("../controllers/residentEditController");
const { verifyToken } = require("../middleware/authMiddleware");

// PUT /api/residents/update - protected

router.put("/update", verifyToken, updateResident);

module.exports = router;