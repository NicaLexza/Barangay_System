// utils/activityLogger.js
const db = require("../config/db");

/**
 * logActivity — fire-and-forget audit log insert.
 * Never throws; errors are only logged to console so they
 * never interrupt the calling controller's response.
 *
 * @param {object} opts
 * @param {string} opts.entity_type   e.g. 'Resident', 'Household', 'Account', 'Eligibility Form'
 * @param {number} [opts.entity_id]   primary key of the affected record
 * @param {string} [opts.entity_name] display name (full name, form name, username…)
 * @param {string} opts.action_type   e.g. 'added', 'updated', 'deleted', 'archived', 'restored', 'imported'
 * @param {number} [opts.performed_by] user_id from req.user.id
 * @param {object} [opts.changes]     array of { field, from, to } diffs, JSON-stringified into `changes`
 * @param {object} [opts.details]     structured payload JSON-stringified into `details` — used for
 *                                    backup/restore verification reports (expected vs. actual counts,
 *                                    and any specific missing records), kept separate from `changes`
 *                                    since it describes a different kind of information (a report,
 *                                    not a before/after diff)
 */
const logActivity = ({
  entity_type,
  entity_id = null,
  entity_name = null,
  action_type,
  performed_by = null,
  changes = null,
  details = null,
}) => {
  const changesJson = changes ? JSON.stringify(changes) : null;
  const detailsJson = details ? JSON.stringify(details) : null;

  const sql = `
    INSERT INTO activity_logs
      (entity_type, entity_id, entity_name, action_type, performed_by, changes, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [entity_type, entity_id, entity_name, action_type, performed_by, changesJson, detailsJson],
    (err) => {
      if (err) console.error("[activityLogger] Failed to log activity:", err.message);
    }
  );
};

module.exports = { logActivity };