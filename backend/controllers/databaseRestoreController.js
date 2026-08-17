// controllers/databaseRestoreController.js
const { spawn } = require("child_process");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { getTableCounts } = require("../utils/tableCounts");
const { parseExpectedCounts } = require("../utils/parseBackupCounts");

const MYSQL_PATH  = process.env.MYSQL_PATH || "mysql";
const DB_HOST     = process.env.DB_HOST || "localhost";
const DB_USER     = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME     = process.env.DB_NAME || "barangay";

const restoreDatabase = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can restore the database." });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No backup file uploaded." });
  }

  const fetchSql = "SELECT * FROM users WHERE username = ? AND user_id = ?";
  db.query(fetchSql, [username, req.user.id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is inactive." });
    }

    // Read what the FILE itself claims to contain, before we run it. This
    // is the baseline we'll compare the post-restore database against —
    // catches truncated/incomplete files that run cleanly (exit code 0)
    // but never actually contained all the rows they should have.
    const expectedCounts = parseExpectedCounts(req.file.buffer.toString("utf8"));

    const args = ["-h", DB_HOST, "-u", DB_USER];
    if (DB_PASSWORD) args.push(`-p${DB_PASSWORD}`);
    args.push(DB_NAME);

    const child = spawn(MYSQL_PATH, args);

    let stderrOutput = "";
    child.stderr.on("data", (chunk) => { stderrOutput += chunk.toString(); });

    child.on("error", (spawnErr) => {
      console.error("[restore] Failed to start mysql:", spawnErr.message);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to start the mysql client. If it isn't on PATH, set MYSQL_PATH in .env.",
          error: spawnErr.message,
        });
      }
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`[restore] mysql exited with code ${code}: ${stderrOutput}`);
        if (!res.headersSent) {
          return res.status(500).json({
            message: "Restore failed partway through. The database may be in an inconsistent state — consider re-running the same .sql file via phpMyAdmin's Import tab to retry.",
            error: stderrOutput || `mysql exited with code ${code}`,
          });
        }
        return;
      }

      // mysql exited cleanly — but that only means the script ran without
      // a hard SQL error. Compare what actually landed against what the
      // file claimed to catch silent gaps (e.g. a truncated upload).
      getTableCounts((countErr, counts) => {
        if (countErr) {
          res.status(200).json({
            message: "Database restored successfully.",
            counts: null,
            expectedCounts,
            mismatches: [],
          });
        } else {
          const TABLE_LABELS = {
            residents: "Residents",
            accounts: "Accounts",
            eligibility_forms: "Eligibility Forms",
            eligibility_entries: "Eligibility Entries",
          };

          const mismatches = Object.keys(expectedCounts)
            .filter((key) => counts[key] !== expectedCounts[key])
            .map((key) => ({
              table: TABLE_LABELS[key] || key,
              expected: expectedCounts[key],
              actual: counts[key],
            }));

          res.status(200).json({
            message: mismatches.length > 0
              ? "Database restored with differences from the backup file."
              : "Database restored successfully.",
            counts,
            expectedCounts,
            mismatches,
          });
        }

        logActivity({
          entity_type:  "Database",
          entity_id:    null,
          entity_name:  req.file.originalname,
          action_type:  "restored",
          performed_by: req.user.id,
        });
      });
    });

    child.stdin.write(req.file.buffer);
    child.stdin.end();
  });
};

module.exports = { restoreDatabase };