// routes/eligibilityFormAddRoutes.js
const express = require("express");
const router = express.Router();
const { addEligibilityForm } = require("../controllers/AddEligibilityFormController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, addEligibilityForm);

module.exports = router;