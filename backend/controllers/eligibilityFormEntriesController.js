// controllers/eligibilityFormEntriesController.js
const db = require("../config/db");

/**
 * GET /api/eligibility-forms/:formId/entries
 *
 * Now also returns selection_status, priority_score, rank_no,
 * score_breakdown, and selection_note — added by eligibility_migration_02
 * but never previously exposed here. The frontend (EligibilityEntriesTable)
 * uses these to split the grid into a "Selected" tab and a read-only
 * ranked "Waitlist" tab, so a ranked form's cutoff decision is visible
 * and printable output can exclude waitlisted names.
 *
 * Ordering: ranked entries (rank_no NOT NULL) sort by rank ascending first;
 * unranked entries (plain "All Eligible" forms, where rank_no is always
 * NULL) fall back to insertion order via entry_id. This keeps a ranked
 * form's Selected/Waitlist boundary visually obvious while leaving
 * case-1 forms exactly as before.
 */
const getEntries = (req, res) => {
  const { formId } = req.params;

  const sql = `
    SELECT
      efe.entry_id,
      efe.is_rewarded,
      efe.selection_status,
      efe.priority_score,
      efe.rank_no,
      efe.score_breakdown,
      efe.selection_note,
      DATE_FORMAT(efe.processed_at, '%Y-%m-%d %H:%i:%s') AS processed_at,
      r.f_name, r.m_name, r.l_name, r.suffix,
      u.fullname AS processed_by_name
    FROM eligibility_forms_entries efe
    LEFT JOIN residents r ON efe.resident_id = r.resident_id
    LEFT JOIN users u ON efe.processed_by = u.user_id
    WHERE efe.form_id = ?
    ORDER BY
      (efe.rank_no IS NULL) ASC,
      efe.rank_no ASC,
      efe.entry_id ASC
  `;

  db.query(sql, [formId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });
    res.status(200).json(results);
  });
};

module.exports = { getEntries };