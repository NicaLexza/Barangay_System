// routes/residentAddRoutes.js
const express = require("express");
const router = express.Router();

const { deleteResident } = require("../controllers/residentDeleteController");
const { verifyToken } = require("../middleware/authMiddleware");

// PUT /api/residents/update - protected

router.delete("/delete/:id", verifyToken, deleteResident);

module.exports = router;