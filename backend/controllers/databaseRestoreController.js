// controllers/databaseRestoreController.js
const { spawn } = require("child_process");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { getTableIdMaps } = require("../utils/tableCounts");
const { parseExpectedIds } = require("../utils/parseBackupCounts");

const MYSQL_PATH  = process.env.MYSQL_PATH || "mysql";
const DB_HOST     = process.env.DB_HOST || "localhost";
const DB_USER     = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME     = process.env.DB_NAME || "barangay";

const TABLE_LABELS = {
  residents: "Residents",
  accounts: "Accounts",
  eligibility_forms: "Eligibility Forms",
  eligibility_entries: "Eligibility Entries",
};

/**
 * Builds the identity-level verification report: for each tracked table,
 * compares the set of primary keys the uploaded file claimed to contain
 * against the set actually present in the database after the restore ran.
 * Any ID present in the file but absent from the DB is reported by name,
 * resolved from the file's own parsed data — the database no longer has
 * that row to look up, since it's the one that's missing.
 */
const buildVerificationReport = (expectedIds, actualIdMaps) => {
  const expectedCounts = {};
  const actualCounts = {};
  const missing = {};

  Object.keys(expectedIds).forEach((key) => {
    const expected = expectedIds[key];
    const actual = actualIdMaps[key] || { ids: [], labelsById: {} };

    expectedCounts[key] = expected.count;
    actualCounts[key] = actual.ids.length;

    const actualIdSet = new Set(actual.ids);
    const missingIds = expected.ids.filter((id) => !actualIdSet.has(id));

    if (missingIds.length > 0) {
      missing[key] = missingIds.map((id) => ({
        id,
        name: expected.labelsById[id] || `Record #${id}`,
      }));
    }
  });

  return {
    status: Object.keys(missing).length > 0 ? "warning" : "success",
    expected: expectedCounts,
    actual: actualCounts,
    missing,
  };
};

/**
 * Flattened, count-only view of the verification report — kept so the
 * existing `mismatches` response field (and anything already reading it)
 * keeps working unchanged while richer detail is now also available
 * under `verification`.
 */
const buildLegacyMismatches = (report) =>
  Object.keys(report.missing).map((key) => ({
    table: TABLE_LABELS[key] || key,
    expected: report.expected[key],
    actual: report.actual[key],
  }));

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
    const buffer = req.file.buffer;
    let sqlContent;

    const MAGIC_HEADER = "BRGYENC1";
    const magicHeaderBuffer = Buffer.from(MAGIC_HEADER);

    if (buffer.length > 24 && buffer.subarray(0, 8).equals(magicHeaderBuffer)) {
      // Encrypted file
      const algorithm = "aes-256-cbc";
      const secretKey = crypto.createHash("sha256").update(process.env.BACKUP_ENCRYPTION_KEY || "barangay_fallback_secret_key_123!").digest();
      const iv = buffer.subarray(8, 24);
      const encryptedData = buffer.subarray(24);
      const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

      try {
        const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        sqlContent = decryptedBuffer.toString("utf8");
      } catch (err) {
        return res.status(400).json({ message: "Failed to decrypt backup file. Invalid key or corrupted file." });
      }
    } else {
      // Plain text file (backward compatibility)
      sqlContent = buffer.toString("utf8");
    }

    // { residents: { count, ids, labelsById }, accounts: {...}, ... } —
    // parsed once, up front, before mysql touches the database.
    const expectedIds = parseExpectedIds(sqlContent);

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
      // a hard SQL error. Compare the actual primary keys now in the
      // database against the ones the file claimed to contain, so any
      // silent gap (e.g. a truncated upload) is caught and named, not
      // just counted.
      getTableIdMaps((idErr, actualIdMaps) => {
        if (idErr) {
          console.error("[restore] Failed to fetch post-restore record IDs:", idErr.message);
        }

        const report = buildVerificationReport(expectedIds, actualIdMaps || {});
        const mismatches = buildLegacyMismatches(report);

        res.status(200).json({
          message: mismatches.length > 0
            ? "Database restored with differences from the backup file."
            : "Database restored successfully.",
          counts: report.actual,
          expectedCounts: report.expected,
          mismatches,
          verification: report,
        });

        logActivity({
          entity_type:  "Database",
          entity_id:    null,
          entity_name:  req.file.originalname,
          action_type:  "restored",
          performed_by: req.user.id,
          details:      report,
        });
      });
    });

    child.stdin.write(sqlContent);
    child.stdin.end();
  });
};

module.exports = { restoreDatabase };