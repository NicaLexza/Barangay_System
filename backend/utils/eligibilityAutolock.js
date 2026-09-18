// utils/eligibilityAutoLock.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

/**
 * sweepExpiredForms — check-on-read auto-lock for eligibility forms.
 *
 * Finds every form that is currently 'Enabled' but whose end_date has
 * already passed, flips each to 'Disabled', and logs the change. Designed
 * to be called at the top of any read path that lists or counts eligibility
 * forms (getForms, dashboard stats) — since Staff/Admin visit those pages
 * routinely, this keeps the "auto-lock" effectively near-real-time without
 * needing a background scheduler process.
 *
 * Forms with a NULL end_date (including every form created before this
 * feature existed) are never touched — `end_date < CURDATE()` is never
 * true for NULL, so they're naturally excluded without special-casing.
 *
 * Reuses the existing 'Disabled' status rather than introducing a new
 * 'Expired' state (per decision) — an auto-locked form is indistinguishable
 * in status from a manually-disabled one, though the activity log entry's
 * entity_name is suffixed "(auto-locked)" and performed_by is left null
 * (a system action, not a person) so the distinction is still visible in
 * Recent Activity / the audit trail.
 *
 * @param {(err: Error|null) => void} callback
 */
const sweepExpiredForms = (callback) => {
  const findSql = `
    SELECT form_id, form_name
    FROM eligibility_forms
    WHERE status = 'Enabled'
      AND end_date IS NOT NULL
      AND end_date < CURDATE()
  `;

  db.query(findSql, (err, expiredForms) => {
    if (err) {
      console.error("[eligibilityAutoLock] Failed to check for expired forms:", err.message);
      return callback(err);
    }

    if (expiredForms.length === 0) {
      return callback(null);
    }

    const ids = expiredForms.map((f) => f.form_id);
    const updateSql = `
      UPDATE eligibility_forms
      SET status = 'Disabled'
      WHERE form_id IN (?)
    `;

    db.query(updateSql, [ids], (updateErr) => {
      if (updateErr) {
        console.error("[eligibilityAutoLock] Failed to auto-disable expired forms:", updateErr.message);
        return callback(updateErr);
      }

      expiredForms.forEach((form) => {
        logActivity({
          entity_type: "Eligibility Form",
          entity_id: form.form_id,
          entity_name: `${form.form_name} (auto-locked)`,
          action_type: "disabled",
          performed_by: null, // system action — no human performed this
        });
      });

      callback(null);
    });
  });
};

module.exports = { sweepExpiredForms };