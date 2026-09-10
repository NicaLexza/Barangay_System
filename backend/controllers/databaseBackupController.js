// controllers/databaseBackupController.js
const { spawn } = require("child_process");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { getTableCounts, getTableIdMaps } = require("../utils/tableCounts");
const { parseExpectedIds } = require("../utils/parseBackupCounts");

const MYSQLDUMP_PATH = process.env.MYSQLDUMP_PATH || "mysqldump";
const DB_HOST     = process.env.DB_HOST || "localhost";
const DB_USER     = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME     = process.env.DB_NAME || "barangay";

// In-memory holding area for a generated-but-not-yet-downloaded backup.
// Keyed by a random, single-use token returned from /generate; consumed
// (and deleted) by /download/:token. Entries expire on their own after
// PENDING_BACKUP_TTL_MS so an abandoned generate never leaks memory —
// this is process-local, which is fine for this app's single-instance
// deployment, but wouldn't survive a server restart or a multi-instance
// setup without moving it to a shared store.
const pendingBackups = new Map();
const PENDING_BACKUP_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
 * Builds the identity-level verification report for a backup: compares
 * the primary keys actually present in the database (captured right
 * before mysqldump ran) against the primary keys found by parsing the
 * dump's own INSERT statements. Any ID present in the DB but absent from
 * the dump text is reported by name, using the label already resolved
 * from the live database (getTableIdMaps) — that row still exists there,
 * it's the dump that's missing it.
 */
const buildVerificationReport = (dbIdMaps, dumpIdData) => {
  const expectedCounts = {};
  const actualCounts = {};
  const missing = {};

  Object.keys(dbIdMaps).forEach((key) => {
    const expected = dbIdMaps[key] || { ids: [], labelsById: {} };
    const actual = dumpIdData[key] || { ids: [] };

    expectedCounts[key] = expected.ids.length;
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
 * POST /api/backup/summary
 * Re-auths the admin and returns current record counts — called right
 * before generation so the frontend can show "X residents, Y accounts..."
 * in the confirmation/snackbar without having to parse anything out of
 * the file itself.
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
 * POST /api/backup/generate
 * Re-verifies admin credentials, runs mysqldump fully server-side
 * (buffered, not streamed straight to the client), verifies the dump's
 * contents against a snapshot of the live database taken right before
 * mysqldump starts, encrypts the result, and holds it in memory under a
 * short-lived token. Returns the verification report + that token — the
 * actual file bytes are fetched separately via /download/:token, so a
 * discrepancy is known and reportable before the browser ever starts
 * downloading anything.
 */
const generateBackup = async (req, res) => {
  let user;
  try {
    user = await verifyAdminCredentials(req);
  } catch (e) {
    return res.status(e.status).json({ message: e.message });
  }

  // Snapshot of what's actually in the database right before mysqldump
  // runs — this is the "expected" side of the verification diff.
  getTableIdMaps((idErr, dbIdMaps) => {
    if (idErr) {
      return res.status(500).json({ message: "Failed to read current record data.", error: idErr.message });
    }

    const args = ["-h", DB_HOST, "-u", DB_USER];
    if (DB_PASSWORD) args.push(`-p${DB_PASSWORD}`);
    args.push("--single-transaction", DB_NAME);

    const child = spawn(MYSQLDUMP_PATH, args);

    const chunks = [];
    let stderrOutput = "";

    child.stdout.on("data", (chunk) => chunks.push(chunk));
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

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`[backup] mysqldump exited with code ${code}: ${stderrOutput}`);
        if (!res.headersSent) {
          res.status(500).json({
            message: "Backup failed.",
            error: stderrOutput || `mysqldump exited with code ${code}`,
          });
        }
        return;
      }

      const dumpText = Buffer.concat(chunks).toString("utf8");

      // What the dump text ACTUALLY contains, parsed the same way a
      // restore verifies an uploaded file — reused here so both
      // directions share one parsing implementation.
      const dumpIdData = parseExpectedIds(dumpText);
      const report = buildVerificationReport(dbIdMaps, dumpIdData);

      // Encrypt exactly as before — same magic header + AES-256-CBC
      // scheme the restore endpoint already knows how to decrypt.
      const algorithm = "aes-256-cbc";
      const secretKey = crypto.createHash("sha256")
        .update(process.env.BACKUP_ENCRYPTION_KEY || "barangay_fallback_secret_key_123!")
        .digest();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const magicHeader = Buffer.from("BRGYENC1");

      const encryptedBody = Buffer.concat([cipher.update(dumpText, "utf8"), cipher.final()]);
      const fileBuffer = Buffer.concat([magicHeader, iv, encryptedBody]);

      const filename = `barangay_backup_${formatTimestamp()}.sql`;
      const token = crypto.randomUUID();

      const timeoutHandle = setTimeout(() => {
        pendingBackups.delete(token);
      }, PENDING_BACKUP_TTL_MS);

      pendingBackups.set(token, { buffer: fileBuffer, filename, timeoutHandle });

      res.status(200).json({
        message: report.status === "warning"
          ? "Backup generated with differences from the live database."
          : "Backup generated and verified successfully.",
        token,
        filename,
        verification: report,
      });

      logActivity({
        entity_type:  "Database",
        entity_id:    null,
        entity_name:  `${filename}.enc`,
        action_type:  "backup_created",
        performed_by: user.user_id,
        details:      report,
      });
    });
  });
};

/**
 * GET /api/backup/download/:token
 * Serves the already-generated, already-verified backup bytes held from
 * a prior /generate call. Single-use — the entry is removed from memory
 * once served (or once it expires, whichever comes first), so a token
 * can't be replayed to re-download the same backup indefinitely. No
 * password re-auth here since /generate already gated the sensitive
 * action; this step only hands over bytes that already exist.
 */
const downloadGeneratedBackup = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can download backups." });
  }

  const { token } = req.params;
  const pending = pendingBackups.get(token);

  if (!pending) {
    return res.status(404).json({ message: "This backup is no longer available. Please generate a new one." });
  }

  clearTimeout(pending.timeoutHandle);
  pendingBackups.delete(token);

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${pending.filename}.enc"`);
  res.send(pending.buffer);
};

module.exports = { getBackupSummary, generateBackup, downloadGeneratedBackup };