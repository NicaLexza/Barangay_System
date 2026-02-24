// routes/residentAddRoutes.js
const express = require("express");
const router = express.Router();

const { deleteHousehold} = require("../controllers/householdDeleteController");
const { verifyToken } = require("../middleware/authMiddleware");

// PUT /api/residents/update - protected

router.delete("/delete/:id", verifyToken, deleteHousehold);

module.exports = router;