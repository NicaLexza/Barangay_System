// controllers/databaseBackupController.js
const { spawn } = require("child_process");
const { logActivity } = require("../utils/activityLogger");

// Falls back to the same values db.js connects with, so this works out of
// the box with no .env changes. Override via .env if mysqldump isn't on
// PATH (common on Windows/XAMPP) or if credentials ever diverge from db.js.
const MYSQLDUMP_PATH = process.env.MYSQLDUMP_PATH || "mysqldump";
const DB_HOST     = process.env.DB_HOST || "localhost";
const DB_USER     = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME     = process.env.DB_NAME || "barangay";

// "YYYY-MM-DD_HHmmss" using only the native Date object — avoids pulling
// in dayjs as a new backend dependency just for one filename timestamp.
const formatTimestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
};

const backupDatabase = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can perform database backups." });
  }

  const filename = `barangay_backup_${formatTimestamp()}.sql`;

  const args = ["-h", DB_HOST, "-u", DB_USER];
  // Only pass -p when a password is actually set. "-p" with nothing
  // immediately after it makes mysqldump wait for an interactive prompt,
  // which would hang this request forever.
  if (DB_PASSWORD) args.push(`-p${DB_PASSWORD}`);
  args.push("--single-transaction", DB_NAME);

  const child = spawn(MYSQLDUMP_PATH, args);

  let stderrOutput = "";
  child.stderr.on("data", (chunk) => { stderrOutput += chunk.toString(); });

  // Covers the most common failure: mysqldump not found on PATH at all.
  child.on("error", (err) => {
    console.error("[backup] Failed to start mysqldump:", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to start mysqldump. If it isn't on PATH, set MYSQLDUMP_PATH in .env.",
        error: err.message,
      });
    }
  });

  // Only commit to a 200 + file-download response once mysqldump has
  // actually produced output — guards against sending success headers
  // for a dump that fails before writing anything.
  child.stdout.once("data", () => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
  });

  // { end: false } is the important part: by default .pipe() calls res.end()
  // the moment mysqldump's stdout closes — even if it closed because the
  // process failed and produced zero bytes. That would send an empty 200
  // response before the close handler below gets a chance to send the real
  // error. Ending the response manually, only after checking the exit code,
  // avoids that.
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

    // Logged only here, after a confirmed-clean exit — no file is ever
    // written to disk, the dump streams straight through to the browser.
    logActivity({
      entity_type:  "Database",
      entity_id:    null,
      entity_name:  filename,
      action_type:  "backup_created",
      performed_by: req.user.id,
    });
  });
};

module.exports = { backupDatabase };