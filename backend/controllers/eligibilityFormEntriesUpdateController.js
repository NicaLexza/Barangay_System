// controllers/eligibilityFormEntriesUpdateController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");

/**
 * PUT /api/eligibility-forms/entries/:id/status
 *
 * Pending -> Received is a normal one-click action, available to Admin and
 * Staff, no extra confirmation needed.
 *
 * Received -> Pending is treated as a REVERSAL and requires supervised
 * admin intervention: the request must include a valid admin username and
 * password, independently re-verified here — this is NOT just a frontend
 * gate, since a determined caller could otherwise hit this endpoint
 * directly and bypass a UI-only restriction. Mirrors the same re-auth
 * pattern already used for backup/restore/archive-restore.
 *
 * Both directions are now logged to activity_logs (previously this
 * endpoint logged nothing at all) — entity_type "Eligibility Entry",
 * distinguishing a forward mark from a reversal via action_type.
 */
const updateEntryStatus = (req, res) => {
  const { id } = req.params;
  const { is_rewarded, username, password } = req.body;
  const performed_by = req.user.id;

  if (is_rewarded === undefined) {
    return res.status(400).json({ message: "is_rewarded field is required" });
  }

  const newValue = is_rewarded ? 1 : 0;

  // Fetch current state + resident name (for logging) before deciding
  // whether this change is a forward mark or a reversal.
  const fetchSql = `
    SELECT efe.is_rewarded,
           TRIM(CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix)) AS resident_name
    FROM eligibility_forms_entries efe
    LEFT JOIN residents r ON efe.resident_id = r.resident_id
    WHERE efe.entry_id = ?
  `;

  db.query(fetchSql, [id], (fetchErr, results) => {
    if (fetchErr) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Entry not found" });

    const current = results[0];
    const isReversal = current.is_rewarded === 1 && newValue === 0;

    const performUpdate = () => {
      const sql = `
        UPDATE eligibility_forms_entries
        SET is_rewarded = ?, processed_by = ?, processed_at = NOW()
        WHERE entry_id = ?
      `;

      db.query(sql, [newValue, performed_by, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", err });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Entry not found" });
        }

        res.status(200).json({ message: "Entry status updated successfully" });

        logActivity({
          entity_type: "Eligibility Entry",
          entity_id: id,
          entity_name: current.resident_name || `Entry #${id}`,
          action_type: isReversal
            ? "reverted_to_pending"
            : (newValue === 1 ? "marked_received" : "updated"),
          performed_by,
        });
      });
    };

    if (!isReversal) {
      // Forward change (Pending -> Received), or no real change (e.g.
      // re-submitting the same value) — proceed without re-authentication.
      return performUpdate();
    }

    // ── Reversal path — require and independently verify admin credentials ──
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only admins can revert a Received status back to Pending." });
    }
    if (!username || !password) {
      return res.status(400).json({ message: "Admin username and password are required to revert this status." });
    }

    const authSql = "SELECT * FROM users WHERE username = ? AND user_id = ?";
    db.query(authSql, [username, req.user.id], async (authErr, authResults) => {
      if (authErr) return res.status(500).json({ message: "Database error" });
      if (authResults.length === 0) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const user = authResults[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
      if (user.status !== "Active") {
        return res.status(403).json({ message: "Account is inactive." });
      }

      performUpdate();
    });
  });
};

module.exports = { updateEntryStatus };