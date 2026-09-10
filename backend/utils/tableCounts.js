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

/**
 * One query per tracked table, returning each row's primary key plus a
 * human-readable label. The label is what lets a verification report
 * name a missing record ("Julius Caliao") instead of only reporting its
 * numeric ID — entries don't have a natural name, so they fall back to
 * "Entry #<id>".
 */
const TABLE_ID_QUERIES = {
  residents: "SELECT resident_id AS id, TRIM(CONCAT_WS(' ', f_name, m_name, l_name, suffix)) AS label FROM residents",
  accounts: "SELECT user_id AS id, fullname AS label FROM users",
  eligibility_forms: "SELECT form_id AS id, form_name AS label FROM eligibility_forms",
  eligibility_entries: "SELECT entry_id AS id, CONCAT('Entry #', entry_id) AS label FROM eligibility_forms_entries",
};

/**
 * Fetches the actual set of primary-key IDs (and labels) currently in
 * each tracked table. Used to diff against the ID sets parsed out of a
 * backup file (utils/parseBackupCounts.js's parseExpectedIds) so
 * verification reports can point at specific missing records rather than
 * just a count delta.
 *
 * Callback receives (err, results) where results is keyed the same way
 * as getTableCounts's row object, and each value is { ids, labelsById }.
 * A query failure for one table does not block the others — it resolves
 * that table to an empty set and the first error encountered is passed
 * back as `err` for the caller to log/handle.
 */
const getTableIdMaps = (callback) => {
  const keys = Object.keys(TABLE_ID_QUERIES);
  const results = {};
  let completed = 0;
  let firstError = null;

  keys.forEach((key) => {
    db.query(TABLE_ID_QUERIES[key], (err, rows) => {
      if (err) {
        firstError = firstError || err;
        results[key] = { ids: [], labelsById: {} };
      } else {
        const ids = [];
        const labelsById = {};
        rows.forEach((row) => {
          ids.push(row.id);
          labelsById[row.id] = row.label;
        });
        results[key] = { ids, labelsById };
      }

      completed++;
      if (completed === keys.length) callback(firstError, results);
    });
  });
};

module.exports = { getTableCounts, getTableIdMaps };