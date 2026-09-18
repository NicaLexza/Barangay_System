// routes/residentTransferHeadRoutes.js
const express = require("express");
const router = express.Router();
const { transferHeadship } = require("../controllers/residentTransferHeadController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/household/:headId/transfer/:memberId", verifyToken, transferHeadship);

module.exports = router;
