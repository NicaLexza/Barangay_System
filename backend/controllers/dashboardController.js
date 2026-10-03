// controllers/dashboardController.js
const db = require("../config/db");
const { sweepExpiredForms } = require("../utils/eligibilityAutoLock");

/**
 * GET /api/dashboard/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Both query params are optional and must be supplied together to take
 * effect. When present, every resident-based stat below becomes a STRICT
 * WINDOW count — only residents whose created_at falls within
 * [startDate 00:00:00, endDate 23:59:59] — rather than the default
 * all-time cumulative total. This is a deliberate choice: "Total
 * Residents" under a date filter means "how many registered in this
 * period", not "how many existed as of this period's end".
 *
 * ARCHIVED RESIDENTS: excluded by default. Pass includeArchived=true to
 * count them too. The flag applies to every resident-based figure below —
 * stat cards, breakdowns, and Recently Added Records — with or without a
 * date range. (Recently Added Records still ignores the date range.)
 *
 * "+X this month" trend chips only make sense for the unfiltered all-time
 * view, so they're zeroed out whenever a date range is active.
 *
 * (The old GET /recent-activity endpoint was removed along with the
 * Dashboard's Recent Activity card — the Audit Logs page is the single
 * place to review activity now.)
 */
const getDashboardStats = (req, res) => {
  // Auto-lock sweep runs first so "active_forms" below reflects any form
  // that just crossed its end_date — see utils/eligibilityAutoLock.js.
  // Sweep failures don't block the dashboard.
  sweepExpiredForms((sweepErr) => {
    if (sweepErr) {
      console.error("[getDashboardStats] Auto-lock sweep failed, continuing anyway:", sweepErr.message);
    }
    runDashboardQueries(req, res);
  });
};

const runDashboardQueries = (req, res) => {
  const { startDate, endDate } = req.query;
  const hasRange = !!(startDate && endDate);
  const rangeStart = hasRange ? `${startDate} 00:00:00` : null;
  const rangeEnd   = hasRange ? `${endDate} 23:59:59`   : null;

  // Archived residents are EXCLUDED by default; ?includeArchived=true opts in.
  // This flag affects every resident-based query below, including Recently
  // Added Records. (Users/forms counts are unrelated to resident archiving.)
  const includeArchived = req.query.includeArchived === "true";
  const archivedAnd = includeArchived ? "" : " AND is_archived = 0";
  const rangeAnd    = hasRange ? " AND created_at BETWEEN ? AND ?" : "";
  const rangeParams = hasRange ? [rangeStart, rangeEnd] : [];

  const residentWhereClause = `WHERE 1=1${rangeAnd}${archivedAnd}`;
  const residentWhereParams = rangeParams;

  const countsSql = `
    SELECT
      (SELECT COUNT(*) FROM residents WHERE 1=1${rangeAnd}${archivedAnd}) AS total_residents,
      ${hasRange
        ? "0"
        : `(SELECT COUNT(*) FROM residents
            WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')${archivedAnd})`} AS residents_this_month,
      (SELECT COUNT(*) FROM residents WHERE is_household_head = 1${rangeAnd}${archivedAnd}) AS total_households,
      ${hasRange
        ? "0"
        : `(SELECT COUNT(*) FROM residents
            WHERE is_household_head = 1
            AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')${archivedAnd})`} AS households_this_month,
      (SELECT COUNT(*) FROM users WHERE status = 'Active')              AS active_users,
      (SELECT COUNT(*) FROM eligibility_forms WHERE status = 'Enabled') AS active_forms,
      (SELECT COUNT(*) FROM eligibility_forms)                          AS total_forms
  `;
  // One range pair per subquery that uses rangeAnd (total_residents, total_households).
  const countsParams = [...rangeParams, ...rangeParams];

  const queries = {
    counts: { sql: countsSql, params: countsParams },

    ageDistribution: {
      sql: `
        SELECT
          SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 0  AND 17  THEN 1 ELSE 0 END) AS age_0_17,
          SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 18 AND 30  THEN 1 ELSE 0 END) AS age_18_30,
          SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 31 AND 45  THEN 1 ELSE 0 END) AS age_31_45,
          SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 46 AND 60  THEN 1 ELSE 0 END) AS age_46_60,
          SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) > 60               THEN 1 ELSE 0 END) AS age_60_plus
        FROM residents
        ${residentWhereClause}
      `,
      params: residentWhereParams,
    },

    genderBreakdown: {
      sql: `
        SELECT sex, COUNT(*) AS count
        FROM residents
        ${residentWhereClause}
        GROUP BY sex
        ORDER BY count DESC
      `,
      params: residentWhereParams,
    },

    specialSectors: {
      sql: `
        SELECT
          SUM(is_pwd)    AS pwd_count,
          SUM(is_senior) AS senior_count,
          SUM(is_solop)  AS solop_count
        FROM residents
        ${residentWhereClause}
      `,
      params: residentWhereParams,
    },

    // Recently added residents — intentionally NEVER date-filtered, even
    // when a range is active elsewhere on the dashboard. Always shows the
    // absolute latest 10 (respecting only the archived toggle).
    recentRecords: {
      sql: `
        SELECT
          TRIM(CONCAT_WS(' ',
            NULLIF(f_name, ''), NULLIF(m_name, ''),
            NULLIF(l_name, ''), NULLIF(suffix, '')
          ))          AS name,
          CASE WHEN is_household_head = 1 THEN 'Head' ELSE 'Resident' END AS type,
          resident_id AS id,
          created_at
        FROM residents
        WHERE created_at IS NOT NULL${archivedAnd}
        ORDER BY created_at DESC
        LIMIT 10
      `,
      params: [],
    },

    civilStatus: {
      sql: `
        SELECT civil_status, COUNT(*) AS count
        FROM residents
        ${residentWhereClause}
        GROUP BY civil_status
        ORDER BY count DESC
      `,
      params: residentWhereParams,
    },
  };

  const results  = {};
  const keys     = Object.keys(queries);
  let   completed = 0;

  const scalar = new Set(["counts", "ageDistribution", "specialSectors"]);

  keys.forEach((key) => {
    const { sql, params } = queries[key];
    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error(`Dashboard query error [${key}]:`, err);
        results[key] = scalar.has(key) ? {} : [];
      } else {
        results[key] = scalar.has(key) ? rows[0] : rows;
      }

      completed++;
      if (completed === keys.length) {
        res.status(200).json(results);
      }
    });
  });
};

module.exports = { getDashboardStats };