// controllers/eligibilityFormReportController.js
const db = require("../config/db");

/**
 * GET /api/eligibility-forms/:id/report
 *
 * Compiles a complete audit report for an eligibility form:
 *  - Form metadata (name, distribution unit, target quantity, pool size, list type)
 *  - Criteria snapshot & priority configuration (factors, weights, lookback, seed)
 *  - Statistics (pool size, selected count, waitlisted count, removed count, received count)
 *  - Categorized entries (Selected, Waitlisted, Removed)
 *  - Audit log activity trail for this form (removals, auto-promotions, override swaps)
 */
const getFormReport = (req, res) => {
  const { id } = req.params;

  const formSql = `
    SELECT 
      ef.form_id,
      ef.form_name,
      ef.source_details,
      ef.distribution_details,
      ef.target_quantity,
      ef.distribution_unit,
      ef.list_type,
      ef.pool_size,
      ef.criteria_snapshot,
      ef.priority_config,
      DATE_FORMAT(ef.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(ef.end_date, '%Y-%m-%d') AS end_date,
      ef.status,
      DATE_FORMAT(ef.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      u.fullname AS created_by_name
    FROM eligibility_forms ef
    LEFT JOIN users u ON ef.created_by = u.user_id
    WHERE ef.form_id = ?
  `;

  db.query(formSql, [id], (formErr, formRows) => {
    if (formErr) {
      console.error("[getFormReport] Form query error:", formErr);
      return res.status(500).json({ message: "Failed to load form report." });
    }

    if (!formRows || formRows.length === 0) {
      return res.status(404).json({ message: "Eligibility form not found." });
    }

    const form = formRows[0];

    // Parse JSON configurations safely
    let criteria = null;
    let priorityConfig = null;
    try {
      criteria = form.criteria_snapshot ? JSON.parse(form.criteria_snapshot) : null;
    } catch {
      criteria = null;
    }
    try {
      priorityConfig = form.priority_config ? JSON.parse(form.priority_config) : null;
    } catch {
      priorityConfig = null;
    }

    const entriesSql = `
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
        r.is_archived AS resident_is_archived,
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

    db.query(entriesSql, [id], (entriesErr, entriesRows) => {
      if (entriesErr) {
        console.error("[getFormReport] Entries query error:", entriesErr);
        return res.status(500).json({ message: "Failed to load entries for report." });
      }

      const allEntries = (entriesRows || []).map((e) => {
        let breakdown = [];
        try {
          breakdown = e.score_breakdown ? JSON.parse(e.score_breakdown) : [];
        } catch {
          breakdown = [];
        }
        return {
          entry_id: e.entry_id,
          fullName: [e.f_name, e.m_name, e.l_name, e.suffix].filter(Boolean).join(" "),
          is_rewarded: e.is_rewarded,
          selection_status: e.selection_status || "Selected",
          resident_is_archived: e.resident_is_archived === 1,
          priority_score: e.priority_score,
          rank_no: e.rank_no,
          breakdown: Array.isArray(breakdown) ? breakdown : [],
          selection_note: e.selection_note,
          processed_at: e.processed_at,
          processed_by_name: e.processed_by_name,
        };
      });

      const selectedEntries = allEntries.filter((e) => e.selection_status === "Selected");
      const waitlistEntries = allEntries.filter((e) => e.selection_status === "Waitlisted");
      const removedEntries  = allEntries.filter((e) => e.selection_status === "Removed");
      const rewardedCount   = selectedEntries.filter((e) => e.is_rewarded === 1).length;

      const activitySql = `
        SELECT
          al.log_id,
          al.action_type,
          al.entity_name,
          al.details,
          DATE_FORMAT(al.performed_at, '%Y-%m-%d %H:%i:%s') AS performed_at,
          u.fullname AS performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.performed_by = u.user_id
        WHERE JSON_EXTRACT(al.details, '$.form_id') = ?
        ORDER BY al.performed_at ASC, al.log_id ASC
      `;

      db.query(activitySql, [id], (actErr, actRows) => {
        if (actErr) {
          console.error("[getFormReport] Activity logs error:", actErr);
        }

        const logs = (actRows || []).map((l) => {
          let detailsObj = {};
          try {
            detailsObj = l.details ? JSON.parse(l.details) : {};
          } catch {
            detailsObj = {};
          }
          return {
            log_id: l.log_id,
            action_type: l.action_type,
            entity_name: l.entity_name,
            performed_at: l.performed_at,
            performed_by_name: l.performed_by_name || "Admin",
            details: detailsObj,
          };
        });

        res.status(200).json({
          form: {
            ...form,
            criteria,
            priorityConfig,
          },
          summary: {
            pool_size: form.pool_size ?? allEntries.length,
            target_quantity: form.target_quantity,
            selected_count: selectedEntries.length,
            waitlist_count: waitlistEntries.length,
            removed_count: removedEntries.length,
            rewarded_count: rewardedCount,
          },
          entries: {
            selected: selectedEntries,
            waitlist: waitlistEntries,
            removed: removedEntries,
          },
          audit_trail: logs,
        });
      });
    });
  });
};

module.exports = { getFormReport };
