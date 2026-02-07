// routes/residentRoutes.js
const express = require("express");
const router = express.Router();
const { getAllResidents, updateResident, deleteResident } = require("../controllers/residentController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET all residents (protected route)
router.get("/", verifyToken, getAllResidents);

// Update resident (expects JSON body with resident_id and fields)
router.put('/update', verifyToken, updateResident);

// Delete resident by id
router.delete('/delete/:id', verifyToken, deleteResident);

module.exports = router;