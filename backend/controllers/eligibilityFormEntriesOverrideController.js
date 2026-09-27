// controllers/eligibilityFormEntriesOverrideController.js
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

/**
 * PUT /api/eligibility-forms/entries/:id/override-promote
 *
 * Admin-gated override: promotes a specific Waitlisted entry to Selected by
 * swapping it with a currently Selected entry. Always requires Admin re-auth
 * and a written reason, regardless of rank order.
 *
 * Body:
 *   replace_entry_id  — entry_id of the Selected entry to remove
 *   reason            — required explanation for the override
 *   username          — admin username (re-auth)
 *   password          — admin password (re-auth)
 *
 * In one transaction:
 *   1. Soft-remove the Selected entry → 'Removed', reason in selection_note
 *   2. Promote the Waitlisted entry → 'Selected'
 *   3. Two activity_logs entries (override_removed + override_promoted)
 */
const overridePromote = async (req, res) => {
  const promoteEntryId = req.params.id;
  const { replace_entry_id, reason, username, password } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!replace_entry_id) {
    return res.status(400).json({ message: "A Selected entry to replace is required." });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "A reason for this override is required." });
  }
  if (!username || !password) {
    return res.status(400).json({ message: "Admin username and password are required." });
  }

  // ── Admin re-auth ───────────────────────────────────────────────────────
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can perform an override promotion." });
  }

  const authSql = "SELECT * FROM users WHERE username = ? AND user_id = ?";
  db.query(authSql, [username, req.user.id], async (authErr, authResults) => {
    if (authErr) return res.status(500).json({ message: "Database error" });
    if (authResults.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const adminUser = authResults[0];
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });
    if (adminUser.status !== "Active") {
      return res.status(403).json({ message: "Account is inactive." });
    }

    const performed_by = req.user.id;

    // ── Transaction ─────────────────────────────────────────────────────
    db.getConnection((connErr, connection) => {
      if (connErr) {
        console.error("[overridePromote] getConnection failed:", connErr.message);
        return res.status(500).json({ message: "Database error" });
      }

      const rollback = (msg, status = 500) => {
        connection.rollback(() => {
          connection.release();
          res.status(status).json({ message: msg });
        });
      };

      connection.beginTransaction((txErr) => {
        if (txErr) {
          connection.release();
          return res.status(500).json({ message: "Database error" });
        }

        // ─── Fetch both entries ─────────────────────────────────────────
        const fetchSql = `
          SELECT
            efe.entry_id, efe.form_id, efe.selection_status, efe.rank_no,
            efe.resident_id,
            TRIM(CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix)) AS resident_name,
            ef.form_name
          FROM eligibility_forms_entries efe
          LEFT JOIN residents r ON efe.resident_id = r.resident_id
          LEFT JOIN eligibility_forms ef ON efe.form_id = ef.form_id
          WHERE efe.entry_id IN (?, ?)
          FOR UPDATE
        `;

        connection.query(fetchSql, [promoteEntryId, replace_entry_id], (fetchErr, rows) => {
          if (fetchErr) return rollback("Database error");

          const promoteEntry = rows.find((r) => String(r.entry_id) === String(promoteEntryId));
          const replaceEntry = rows.find((r) => String(r.entry_id) === String(replace_entry_id));

          if (!promoteEntry) return rollback("Waitlisted entry not found.", 404);
          if (!replaceEntry) return rollback("Selected entry to replace not found.", 404);

          if (promoteEntry.selection_status !== "Waitlisted") {
            return rollback(
              `The entry to promote must be Waitlisted. Current status: "${promoteEntry.selection_status}".`,
              400
            );
          }
          if (replaceEntry.selection_status !== "Selected") {
            return rollback(
              `The entry to replace must be Selected. Current status: "${replaceEntry.selection_status}".`,
              400
            );
          }
          if (promoteEntry.form_id !== replaceEntry.form_id) {
            return rollback("Both entries must belong to the same form.", 400);
          }

          // ─── Step 1: Soft-remove the Selected entry ───────────────────
          const removeSql = `
            UPDATE eligibility_forms_entries
            SET selection_status = 'Removed',
                selection_note  = ?
            WHERE entry_id = ?
          `;

          connection.query(removeSql, [reason.trim(), replace_entry_id], (removeErr) => {
            if (removeErr) return rollback("Database error");

            // ─── Step 2: Promote the Waitlisted entry ─────────────────────
            const promoteSql = `
              UPDATE eligibility_forms_entries
              SET selection_status = 'Selected'
              WHERE entry_id = ?
            `;

            connection.query(promoteSql, [promoteEntryId], (promoteErr) => {
              if (promoteErr) return rollback("Database error");

              connection.commit((commitErr) => {
                if (commitErr) return rollback("Database error");
                connection.release();

                // ─── Activity logs (fire-and-forget) ──────────────────────
                logActivity({
                  entity_type: "Eligibility Entry",
                  entity_id: replace_entry_id,
                  entity_name: replaceEntry.resident_name || `Entry #${replace_entry_id}`,
                  action_type: "override_removed",
                  performed_by,
                  details: {
                    form_id: replaceEntry.form_id,
                    form_name: replaceEntry.form_name,
                    reason: reason.trim(),
                    replaced_by_entry_id: Number(promoteEntryId),
                    replaced_by_resident: promoteEntry.resident_name,
                  },
                });

                logActivity({
                  entity_type: "Eligibility Entry",
                  entity_id: promoteEntryId,
                  entity_name: promoteEntry.resident_name || `Entry #${promoteEntryId}`,
                  action_type: "override_promoted",
                  performed_by,
                  details: {
                    form_id: promoteEntry.form_id,
                    form_name: promoteEntry.form_name,
                    reason: reason.trim(),
                    rank_no: promoteEntry.rank_no,
                    replaced_entry_id: Number(replace_entry_id),
                    replaced_resident: replaceEntry.resident_name,
                  },
                });

                res.status(200).json({
                  message: `${promoteEntry.resident_name || "Waitlisted entry"} promoted to Selected, replacing ${replaceEntry.resident_name || "removed entry"}.`,
                  promoted: {
                    entry_id: Number(promoteEntryId),
                    resident_name: promoteEntry.resident_name,
                    rank_no: promoteEntry.rank_no,
                  },
                  removed: {
                    entry_id: Number(replace_entry_id),
                    resident_name: replaceEntry.resident_name,
                  },
                });
              });
            });
          });
        });
      });
    });
  });
};

module.exports = { overridePromote };
