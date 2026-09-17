// controllers/dashboardController.js
const db = require("../config/db");

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
 * IMPORTANT: is_archived is intentionally NEVER filtered in this
 * controller, with or without a date range. Archiving only affects
 * eligibility-form qualification (a separate, not-yet-built feature) —
 * for reporting/statistics purposes every resident counts, archived or
 * not, since they're still a real historical record.
 *
 * "+X this month" trend chips only make sense for the unfiltered all-time
 * view (they answer "how many were added this calendar month"), so they're
 * zeroed out whenever a date range is active — the filtered total already
 * represents "this period" on its own, and showing a separate "this month"
 * figure alongside an arbitrary custom range would be confusing.
 */
const getDashboardStats = (req, res) => {
  const { startDate, endDate } = req.query;
  const hasRange = !!(startDate && endDate);
  const rangeStart = hasRange ? `${startDate} 00:00:00` : null;
  const rangeEnd   = hasRange ? `${endDate} 23:59:59`   : null;

  const residentWhereClause = hasRange ? "WHERE created_at BETWEEN ? AND ?" : "";
  const residentWhereParams = hasRange ? [rangeStart, rangeEnd] : [];

  const countsSql = hasRange
    ? `
      SELECT
        (SELECT COUNT(*) FROM residents WHERE created_at BETWEEN ? AND ?) AS total_residents,
        0 AS residents_this_month,
        (SELECT COUNT(*) FROM residents WHERE is_household_head = 1 AND created_at BETWEEN ? AND ?) AS total_households,
        0 AS households_this_month,
        (SELECT COUNT(*) FROM users WHERE status = 'Active')          AS active_users,
        (SELECT COUNT(*) FROM eligibility_forms WHERE status = 'Enabled') AS active_forms,
        (SELECT COUNT(*) FROM eligibility_forms)                          AS total_forms
    `
    : `
      SELECT
        (SELECT COUNT(*) FROM residents)  AS total_residents,
        (SELECT COUNT(*) FROM residents
          WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS residents_this_month,
        (SELECT COUNT(*) FROM residents WHERE is_household_head = 1) AS total_households,
        (SELECT COUNT(*) FROM residents
          WHERE is_household_head = 1
          AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS households_this_month,
        (SELECT COUNT(*) FROM users WHERE status = 'Active')          AS active_users,
        (SELECT COUNT(*) FROM eligibility_forms WHERE status = 'Enabled') AS active_forms,
        (SELECT COUNT(*) FROM eligibility_forms)                          AS total_forms
    `;
  const countsParams = hasRange ? [rangeStart, rangeEnd, rangeStart, rangeEnd] : [];

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
    // absolute latest 10 (households table removed).
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
        WHERE created_at IS NOT NULL
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

/**
 * GET /api/dashboard/recent-activity
 * Intentionally NEVER date-filtered — always shows the absolute latest
 * activity regardless of any Dashboard stats filter being applied.
 */
const getRecentActivity = (req, res) => {
  const sql = `
    SELECT
      al.log_id,
      al.entity_type,
      al.entity_id,
      al.entity_name,
      al.action_type,
      al.performed_at  AS action_time,
      al.changes,
      al.details,
      u.fullname       AS performed_by
    FROM activity_logs al
    LEFT JOIN users u ON al.performed_by = u.user_id
    ORDER BY al.performed_at DESC
    LIMIT 50
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Dashboard activity error:", err);
      return res.status(500).json({ message: "Database error", err });
    }
    res.status(200).json(results);
  });
};

module.exports = { getDashboardStats, getRecentActivity };