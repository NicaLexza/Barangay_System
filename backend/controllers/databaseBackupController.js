// controllers/databaseBackupController.js
const { spawn } = require("child_process");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { getTableCounts } = require("../utils/tableCounts");

const MYSQLDUMP_PATH = process.env.MYSQLDUMP_PATH || "mysqldump";
const DB_HOST     = process.env.DB_HOST || "localhost";
const DB_USER     = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME     = process.env.DB_NAME || "barangay";

const formatTimestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
};

// Shared re-auth check — identical pattern to databaseRestoreController.js
// and eligibilityFormArchiveController.js. Resolves with the verified user
// row, or rejects with { status, message } for the caller to respond with.
const verifyAdminCredentials = (req) => {
  return new Promise((resolve, reject) => {
    if (req.user.role !== "Admin") {
      return reject({ status: 403, message: "Only admins can perform this action." });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return reject({ status: 400, message: "Username and password are required." });
    }

    const fetchSql = "SELECT * FROM users WHERE username = ? AND user_id = ?";
    db.query(fetchSql, [username, req.user.id], async (err, results) => {
      if (err) return reject({ status: 500, message: "Database error" });
      if (results.length === 0) return reject({ status: 401, message: "Invalid credentials." });

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return reject({ status: 401, message: "Invalid credentials." });
      if (user.status !== "Active") return reject({ status: 403, message: "Account is inactive." });

      resolve(user);
    });
  });
};

/**
 * POST /api/backup/summary
 * Re-auths the admin and returns current record counts — called right
 * before the actual download so the frontend can show "X residents,
 * Y accounts..." in the confirmation/snackbar without having to parse
 * anything out of the file stream itself.
 */
const getBackupSummary = async (req, res) => {
  try {
    await verifyAdminCredentials(req);
  } catch (e) {
    return res.status(e.status).json({ message: e.message });
  }

  getTableCounts((countErr, counts) => {
    if (countErr) {
      return res.status(500).json({ message: "Failed to compute record counts.", error: countErr.message });
    }
    res.status(200).json({ counts });
  });
};

/**
 * POST /api/backup/download
 * Now requires { username, password } in the body and re-verifies them
 * before touching mysqldump — previously this endpoint ran off the JWT
 * alone with no re-auth step, unlike restore.
 */
const backupDatabase = async (req, res) => {
  let user;
  try {
    user = await verifyAdminCredentials(req);
  } catch (e) {
    return res.status(e.status).json({ message: e.message });
  }

  const filename = `barangay_backup_${formatTimestamp()}.sql`;

  const args = ["-h", DB_HOST, "-u", DB_USER];
  if (DB_PASSWORD) args.push(`-p${DB_PASSWORD}`);
  args.push("--single-transaction", DB_NAME);

  const child = spawn(MYSQLDUMP_PATH, args);

  let stderrOutput = "";
  child.stderr.on("data", (chunk) => { stderrOutput += chunk.toString(); });

  child.on("error", (err) => {
    console.error("[backup] Failed to start mysqldump:", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to start mysqldump. If it isn't on PATH, set MYSQLDUMP_PATH in .env.",
        error: err.message,
      });
    }
  });

  child.stdout.once("data", () => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
  });

  child.stdout.pipe(res, { end: false });

  child.on("close", (code) => {
    if (code !== 0) {
      console.error(`[backup] mysqldump exited with code ${code}: ${stderrOutput}`);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Backup failed.",
          error: stderrOutput || `mysqldump exited with code ${code}`,
        });
      } else {
        res.end();
      }
      return;
    }

    res.end();

    logActivity({
      entity_type:  "Database",
      entity_id:    null,
      entity_name:  filename,
      action_type:  "backup_created",
      performed_by: user.user_id,
    });
  });
};

module.exports = { backupDatabase, getBackupSummary };