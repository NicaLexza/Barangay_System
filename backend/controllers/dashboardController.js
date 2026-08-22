// controllers/dashboardController.js
const db = require("../config/db");

/**
 * GET /api/dashboard/stats
 */
const getDashboardStats = (req, res) => {
  const queries = {

    counts: `
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
    `,

    ageDistribution: `
      SELECT
        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 0  AND 17  THEN 1 ELSE 0 END) AS age_0_17,
        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 18 AND 30  THEN 1 ELSE 0 END) AS age_18_30,
        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 31 AND 45  THEN 1 ELSE 0 END) AS age_31_45,
        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 46 AND 60  THEN 1 ELSE 0 END) AS age_46_60,
        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) > 60               THEN 1 ELSE 0 END) AS age_60_plus
      FROM residents
    `,

    genderBreakdown: `
      SELECT sex, COUNT(*) AS count
      FROM residents
      GROUP BY sex
      ORDER BY count DESC
    `,

    specialSectors: `
      SELECT
        SUM(is_pwd)    AS pwd_count,
        SUM(is_senior) AS senior_count,
        SUM(is_solop)  AS solop_count
      FROM residents
    `,

    // Recently added residents only (households table removed)
    recentRecords: `
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

    civilStatus: `
      SELECT civil_status, COUNT(*) AS count
      FROM residents
      GROUP BY civil_status
      ORDER BY count DESC
    `,
  };

  const results  = {};
  const keys     = Object.keys(queries);
  let   completed = 0;

  const scalar = new Set(["counts", "ageDistribution", "specialSectors"]);

  keys.forEach((key) => {
    db.query(queries[key], (err, rows) => {
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
 */
const getRecentActivity = (req, res) => {
  const sql = `
    SELECT
      al.log_id,
      al.entity_type,
      al.entity_name,
      al.action_type,
      al.performed_at  AS action_time,
      al.changes,
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