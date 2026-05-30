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
        (SELECT COUNT(*) FROM households) AS total_households,
        (SELECT COUNT(*) FROM households
          WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS households_this_month,
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

    // Combined residents + households, most recent 10
    recentRecords: `
      SELECT name, type, id, created_at FROM (
        (
          SELECT
            TRIM(CONCAT_WS(' ',
              NULLIF(f_name, ''), NULLIF(m_name, ''),
              NULLIF(l_name, ''), NULLIF(suffix, '')
            ))                       AS name,
            'Resident'               AS type,
            resident_id              AS id,
            created_at
          FROM residents
          WHERE created_at IS NOT NULL
        )
        UNION ALL
        (
          SELECT
            TRIM(CONCAT_WS(' ',
              NULLIF(f_name, ''), NULLIF(m_name, ''),
              NULLIF(l_name, ''), NULLIF(suffix, '')
            ))                       AS name,
            'Household'              AS type,
            household_id             AS id,
            created_at
          FROM households
          WHERE created_at IS NOT NULL
        )
      ) combined
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
    (
      SELECT 'Resident' AS entity_type,
             CONCAT_WS(' ', f_name, l_name) AS entity_name,
             'added'    AS action_type,
             r.created_at AS action_time,
             u.fullname   AS performed_by
      FROM residents r
      LEFT JOIN users u ON r.created_by = u.user_id
      WHERE r.created_at IS NOT NULL
    )
    UNION ALL
    (
      SELECT 'Resident', CONCAT_WS(' ', f_name, l_name),
             'updated', r.updated_at, u.fullname
      FROM residents r
      LEFT JOIN users u ON r.updated_by = u.user_id
      WHERE r.updated_at IS NOT NULL
    )
    UNION ALL
    (
      SELECT 'Household', CONCAT_WS(' ', f_name, l_name),
             'added', h.created_at, u.fullname
      FROM households h
      LEFT JOIN users u ON h.created_by = u.user_id
      WHERE h.created_at IS NOT NULL
    )
    UNION ALL
    (
      SELECT 'Household', CONCAT_WS(' ', f_name, l_name),
             'updated', h.updated_at, u.fullname
      FROM households h
      LEFT JOIN users u ON h.updated_by = u.user_id
      WHERE h.updated_at IS NOT NULL
    )
    UNION ALL
    (
      SELECT 'Account', us.fullname,
             'created', us.created_at, u.fullname
      FROM users us
      LEFT JOIN users u ON us.created_by = u.user_id
      WHERE us.created_at IS NOT NULL
    )
    UNION ALL
    (
      SELECT 'Eligibility Form', ef.form_name,
             'created', ef.created_at, u.fullname
      FROM eligibility_forms ef
      LEFT JOIN users u ON ef.created_by = u.user_id
      WHERE ef.created_at IS NOT NULL
    )
    ORDER BY action_time DESC
    LIMIT 30
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