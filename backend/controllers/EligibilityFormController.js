// controllers/EligibilityFormController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { sweepExpiredForms } = require("../utils/eligibilityAutoLock");
const { verifyActionCredentials, requestDetails } = require("../utils/actionCredentials");

const isValidISODate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; // rejects 2026-02-31
};

/**
 * GET /api/eligibility-forms
 * Returns Enabled + Disabled forms only (Archived are excluded).
 *
 * Runs the auto-lock sweep first, so any form whose end_date has passed
 * shows up already Disabled in this response rather than stale-Enabled —
 * see utils/eligibilityAutoLock.js for the check-on-read rationale.
 *
 * Counts only cover entries with selection_status = 'Selected'.
 */
const getForms = (req, res) => {
  sweepExpiredForms((sweepErr) => {
    if (sweepErr) {
      console.error("[getForms] Auto-lock sweep failed, continuing anyway:", sweepErr.message);
    }

    const sql = `
      SELECT 
        ef.form_id,
        ef.form_name,
        ef.source_details,
        ef.distribution_details,
        ef.target_quantity,
        ef.distribution_unit,
        ef.list_type,
        ef.pool_size,
        DATE_FORMAT(ef.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(ef.end_date, '%Y-%m-%d') AS end_date,
        ef.status,
        ef.created_at,
        u.fullname AS created_by_name,
        COUNT(CASE WHEN efe.selection_status = 'Selected' THEN 1 END) AS total_entries,
        COUNT(CASE WHEN efe.selection_status = 'Selected' AND efe.is_rewarded = 1 THEN 1 END) AS rewarded_count
      FROM eligibility_forms ef
      LEFT JOIN users u
        ON ef.created_by = u.user_id
      LEFT JOIN eligibility_forms_entries efe
        ON ef.form_id = efe.form_id
      WHERE ef.status IN ('Enabled', 'Disabled')
      GROUP BY
        ef.form_id, ef.form_name, ef.source_details, ef.distribution_details,
        ef.target_quantity, ef.distribution_unit, ef.list_type, ef.pool_size,
        ef.start_date, ef.end_date, ef.status,
        ef.created_at, u.fullname
      ORDER BY ef.created_at DESC
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", err });
      res.status(200).json(results);
    });
  });
};

/**
 * PUT /api/eligibility-forms/:id/status
 * Body: { status, username, password, end_date? }
 *
 * Toggles between Enabled and Disabled only. Requires credentials (see
 * utils/actionCredentials.js — Staff submit any active Admin's, Admins
 * submit their own).
 *
 * Enabling a form whose end_date has already passed REQUIRES a new end_date
 * (>= today and >= start_date). Without it the auto-lock sweep would flip
 * the form straight back to Disabled on the next list load. Enforced here,
 * not just in the UI. "Passed" is decided by the database's CURDATE(), the
 * same clock the sweep uses.
 */
const updateFormStatus = async (req, res) => {
  const { id } = req.params;
  const { status, end_date } = req.body;

  if (!["Enabled", "Disabled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  let auth;
  try {
    auth = await verifyActionCredentials(req);
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.message || "Server error" });
  }

  const fetchSql = `
    SELECT
      form_name,
      status,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d')   AS end_date,
      (end_date IS NOT NULL AND end_date < CURDATE()) AS is_expired,
      DATE_FORMAT(CURDATE(), '%Y-%m-%d')  AS today
    FROM eligibility_forms
    WHERE form_id = ?
  `;

  db.query(fetchSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Form not found" });

    const form = results[0];

    if (form.status === "Archived") {
      return res.status(400).json({ message: "Archived forms must be restored before their status can change." });
    }

    let newEndDate = null;
    if (status === "Enabled" && form.is_expired) {
      if (!isValidISODate(end_date)) {
        return res.status(400).json({
          code: "END_DATE_REQUIRED",
          message: "This form's end date has passed. Choose a new end date to re-enable it.",
        });
      }
      if (end_date < form.today) {
        return res.status(400).json({ message: "The new end date cannot be in the past." });
      }
      if (form.start_date && end_date < form.start_date) {
        return res.status(400).json({ message: "The new end date cannot be before the form's start date." });
      }
      newEndDate = end_date;
    }

    const sql = newEndDate
      ? "UPDATE eligibility_forms SET status = ?, end_date = ? WHERE form_id = ? AND status != 'Archived'"
      : "UPDATE eligibility_forms SET status = ? WHERE form_id = ? AND status != 'Archived'";
    const params = newEndDate ? [status, newEndDate, id] : [status, id];

    db.query(sql, params, (updateErr, result) => {
      if (updateErr) return res.status(500).json({ message: "Database error", err: updateErr });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Form not found or archived." });

      res.status(200).json({ message: `Form ${status.toLowerCase()} successfully` });

      logActivity({
        entity_type: "Eligibility Form",
        entity_id: id,
        entity_name: form.form_name,
        action_type: status.toLowerCase(),
        performed_by: auth.actingAdmin.user_id,
        details: requestDetails(auth.requestedBy),
        changes: newEndDate ? [{ field: "End Date", from: form.end_date || "", to: newEndDate }] : null,
      });
    });
  });
};

/**
 * PUT /api/eligibility-forms/:id/details
 * Body: { form_name, source_details, distribution_details, start_date, end_date, username, password }
 *
 * Edits the descriptive fields of a form. Does NOT allow changing
 * target_quantity, distribution_unit, or criteria/priority config.
 * Archived forms are read-only. Editing dates does NOT change status.
 * Requires credentials (see utils/actionCredentials.js).
 */
const updateFormDetails = async (req, res) => {
  const { id } = req.params;
  const { form_name, source_details, distribution_details, start_date, end_date } = req.body;

  if (typeof form_name !== "string" || !form_name.trim()) {
    return res.status(400).json({ message: "Form name is required." });
  }
  if (form_name.trim().length > 150) {
    return res.status(400).json({ message: "Form name must be 150 characters or fewer." });
  }
  if (typeof source_details !== "string" || !source_details.trim()) {
    return res.status(400).json({ message: "Source details are required." });
  }
  if (typeof distribution_details !== "string" || !distribution_details.trim()) {
    return res.status(400).json({ message: "Distribution details are required." });
  }
  if (!isValidISODate(start_date) || !isValidISODate(end_date)) {
    return res.status(400).json({ message: "Start date and end date are required (YYYY-MM-DD)." });
  }
  if (end_date < start_date) {
    return res.status(400).json({ message: "End date cannot be before start date." });
  }

  let auth;
  try {
    auth = await verifyActionCredentials(req);
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.message || "Server error" });
  }

  const fetchSql = `
    SELECT
      form_name, source_details, distribution_details, status,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d')   AS end_date
    FROM eligibility_forms
    WHERE form_id = ?
  `;

  db.query(fetchSql, [id], (fetchErr, rows) => {
    if (fetchErr) return res.status(500).json({ message: "Database error" });
    if (rows.length === 0) return res.status(404).json({ message: "Form not found." });

    const old = rows[0];
    if (old.status === "Archived") {
      return res.status(400).json({ message: "Archived forms are read-only. Restore the form before editing it." });
    }

    const next = {
      form_name: form_name.trim(),
      source_details: source_details.trim(),
      distribution_details: distribution_details.trim(),
      start_date,
      end_date,
    };

    const labels = {
      form_name: "Form Name",
      source_details: "Source",
      distribution_details: "Distribution",
      start_date: "Start Date",
      end_date: "End Date",
    };

    const changes = Object.keys(labels)
      .filter((key) => String(old[key] ?? "") !== String(next[key]))
      .map((key) => ({
        field: labels[key],
        from: String(old[key] ?? ""),
        to: String(next[key]),
      }));

    if (changes.length === 0) {
      return res.status(400).json({ message: "No changes to save." });
    }

    const updateSql = `
      UPDATE eligibility_forms
      SET form_name = ?, source_details = ?, distribution_details = ?,
          start_date = ?, end_date = ?
      WHERE form_id = ? AND status != 'Archived'
    `;

    db.query(
      updateSql,
      [next.form_name, next.source_details, next.distribution_details, next.start_date, next.end_date, id],
      (updateErr, result) => {
        if (updateErr) return res.status(500).json({ message: "Database error", err: updateErr });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Form not found or already archived." });
        }

        res.status(200).json({ message: "Form details updated successfully." });

        logActivity({
          entity_type: "Eligibility Form",
          entity_id: id,
          entity_name: next.form_name,
          action_type: "updated",
          performed_by: auth.actingAdmin.user_id,
          details: requestDetails(auth.requestedBy),
          changes,
        });
      }
    );
  });
};

module.exports = { getForms, updateFormStatus, updateFormDetails };