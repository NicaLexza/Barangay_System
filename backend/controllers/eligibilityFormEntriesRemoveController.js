// controllers/eligibilityFormEntriesRemoveController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

/**
 * PUT /api/eligibility-forms/entries/:id/remove
 *
 * Soft-removes a Selected entry — sets selection_status to 'Removed' with a
 * required reason stored in selection_note. Then, within the same transaction,
 * looks for the lowest-rank_no Waitlisted entry on the same form and promotes
 * it to Selected (strict rank order, no gating). Both steps are logged to
 * activity_logs individually.
 *
 * Constraints:
 *  - Only entries with selection_status = 'Selected' can be removed this way.
 *  - A reason is always required.
 *  - Any authenticated role (Admin or Staff) can perform this — promotion
 *    follows strict rank order, which was already agreed to require no extra
 *    gate. Only out-of-order overrides (open item #2) will need Admin re-auth.
 */
const removeEntry = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const performed_by = req.user.id;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "A reason for removal is required." });
  }

  // Use a pooled connection so we can wrap everything in a transaction.
  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("[removeEntry] getConnection failed:", connErr.message);
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

      // ─── Step 1: Fetch the target entry ────────────────────────────────
      const fetchSql = `
        SELECT
          efe.entry_id, efe.form_id, efe.selection_status, efe.resident_id,
          TRIM(CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix)) AS resident_name,
          ef.form_name
        FROM eligibility_forms_entries efe
        LEFT JOIN residents r ON efe.resident_id = r.resident_id
        LEFT JOIN eligibility_forms ef ON efe.form_id = ef.form_id
        WHERE efe.entry_id = ?
        FOR UPDATE
      `;

      connection.query(fetchSql, [id], (fetchErr, fetchRows) => {
        if (fetchErr) return rollback("Database error");
        if (fetchRows.length === 0) return rollback("Entry not found", 404);

        const entry = fetchRows[0];
        if (entry.selection_status !== "Selected") {
          return rollback(
            `Only Selected entries can be removed. This entry is currently "${entry.selection_status}".`,
            400
          );
        }

        // ─── Step 2: Soft-remove ───────────────────────────────────────────
        const removeSql = `
          UPDATE eligibility_forms_entries
          SET selection_status = 'Removed',
              selection_note  = ?
          WHERE entry_id = ?
        `;

        connection.query(removeSql, [reason.trim(), id], (removeErr) => {
          if (removeErr) return rollback("Database error");

          // ─── Step 3: Find the next waitlisted entry to promote ───────────
          const nextSql = `
            SELECT
              efe.entry_id, efe.rank_no, efe.resident_id,
              TRIM(CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix)) AS resident_name
            FROM eligibility_forms_entries efe
            LEFT JOIN residents r ON efe.resident_id = r.resident_id
            WHERE efe.form_id = ?
              AND efe.selection_status = 'Waitlisted'
            ORDER BY efe.rank_no ASC, efe.entry_id ASC
            LIMIT 1
            FOR UPDATE
          `;

          connection.query(nextSql, [entry.form_id], (nextErr, nextRows) => {
            if (nextErr) return rollback("Database error");

            const promoted = nextRows.length > 0 ? nextRows[0] : null;

            const finishTransaction = () => {
              connection.commit((commitErr) => {
                if (commitErr) return rollback("Database error");
                connection.release();

                // ─── Activity logs (fire-and-forget, outside transaction) ────
                logActivity({
                  entity_type: "Eligibility Entry",
                  entity_id: id,
                  entity_name: entry.resident_name || `Entry #${id}`,
                  action_type: "removed",
                  performed_by,
                  details: {
                    form_id: entry.form_id,
                    form_name: entry.form_name,
                    reason: reason.trim(),
                    promoted_entry_id: promoted?.entry_id || null,
                    promoted_resident: promoted?.resident_name || null,
                  },
                });

                if (promoted) {
                  logActivity({
                    entity_type: "Eligibility Entry",
                    entity_id: promoted.entry_id,
                    entity_name: promoted.resident_name || `Entry #${promoted.entry_id}`,
                    action_type: "promoted_from_waitlist",
                    performed_by,
                    details: {
                      form_id: entry.form_id,
                      form_name: entry.form_name,
                      replaced_entry_id: Number(id),
                      replaced_resident: entry.resident_name,
                      rank_no: promoted.rank_no,
                    },
                  });
                }

                res.status(200).json({
                  message: promoted
                    ? `Entry removed. ${promoted.resident_name || "Next waitlisted entry"} has been promoted to Selected.`
                    : "Entry removed. No waitlisted entries to promote.",
                  removed_entry_id: Number(id),
                  promoted: promoted
                    ? { entry_id: promoted.entry_id, resident_name: promoted.resident_name, rank_no: promoted.rank_no }
                    : null,
                });
              });
            };

            if (!promoted) {
              // Nothing to promote — just commit the removal.
              return finishTransaction();
            }

            // ─── Step 4: Promote the waitlisted entry ─────────────────────
            const promoteSql = `
              UPDATE eligibility_forms_entries
              SET selection_status = 'Selected'
              WHERE entry_id = ?
            `;

            connection.query(promoteSql, [promoted.entry_id], (promoteErr) => {
              if (promoteErr) return rollback("Database error");
              finishTransaction();
            });
          });
        });
      });
    });
  });
};

module.exports = { removeEntry };
