// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { getDashboardStats, getRecentActivity } = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/stats",           verifyToken, getDashboardStats);
router.get("/recent-activity", verifyToken, getRecentActivity);

module.exports = router;