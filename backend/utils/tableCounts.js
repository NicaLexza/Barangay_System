// utils/tableCounts.js
const db = require("../config/db");

/**
 * Shared record-count query used by both the backup summary endpoint
 * and the restore endpoint's success response, so the two stay in sync
 * instead of duplicating the same four COUNT(*) queries twice.
 */
const getTableCounts = (callback) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM residents)                 AS residents,
      (SELECT COUNT(*) FROM users)                      AS accounts,
      (SELECT COUNT(*) FROM eligibility_forms)          AS eligibility_forms,
      (SELECT COUNT(*) FROM eligibility_forms_entries)  AS eligibility_entries
  `;

  db.query(sql, (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows[0]);
  });
};

module.exports = { getTableCounts };