// controllers/databaseRestoreController.js
const { spawn } = require("child_process");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

// mysql (the import/restore client) usually sits in the same bin folder as
// mysqldump — e.g. C:\xampp\mysql\bin\mysql.exe — so MYSQLDUMP_PATH being
// set doesn't automatically cover this one. Override via MYSQL_PATH in .env
// if it's not on PATH.
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

  // Re-auth: credentials must match the currently logged-in admin — same
  // pattern already used for restoring/deleting archived eligibility forms.
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

    // Credentials confirmed — pipe the uploaded .sql straight into the
    // mysql client's stdin. Never written to disk.
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

      res.status(200).json({ message: "Database restored successfully." });

      // Logged AFTER the restore completes, not before — see the note in
      // the controller's header comment. This entry becomes the first new
      // row in the now-restored activity_logs table.
      logActivity({
        entity_type:  "Database",
        entity_id:    null,
        entity_name:  req.file.originalname,
        action_type:  "restored",
        performed_by: req.user.id,
      });
    });

    child.stdin.write(req.file.buffer);
    child.stdin.end();
  });
};

module.exports = { restoreDatabase };