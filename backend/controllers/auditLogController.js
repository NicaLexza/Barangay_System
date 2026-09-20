// controllers/auditLogController.js
const db = require("../config/db");

/**
 * GET /api/audit-logs
 * Retrieves paginated and filtered activity logs.
 */
const getAuditLogs = (req, res) => {
  const { search, entityType, actionType, performedBy, startDate, endDate, page = 1, pageSize = 25 } = req.query;
  
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("al.entity_name LIKE ?");
    params.push(`%${search}%`);
  }

  if (entityType) {
    conditions.push("al.entity_type = ?");
    params.push(entityType);
  }

  if (actionType) {
    conditions.push("al.action_type = ?");
    params.push(actionType);
  }

  if (performedBy) {
    conditions.push("al.performed_by = ?");
    params.push(performedBy);
  }

  if (startDate && endDate) {
    conditions.push("al.performed_at BETWEEN ? AND ?");
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // 1. Get total count for pagination
  const countSql = `SELECT COUNT(*) as total FROM activity_logs al ${whereClause}`;
  
  db.query(countSql, params, (countErr, countResult) => {
    if (countErr) {
      console.error("Audit Logs count error:", countErr);
      return res.status(500).json({ message: "Database error counting logs", error: countErr });
    }
    
    const total = countResult[0].total;

    // 2. Get paginated rows
    const dataSql = `
      SELECT
        al.log_id,
        al.entity_type,
        al.entity_id,
        al.entity_name,
        al.action_type,
        al.performed_at AS action_time,
        al.changes,
        al.details,
        u.fullname AS performed_by
      FROM activity_logs al
      LEFT JOIN users u ON al.performed_by = u.user_id
      ${whereClause}
      ORDER BY al.performed_at DESC
      LIMIT ? OFFSET ?
    `;

    // Clone params and add limit/offset
    const dataParams = [...params, sizeNum, offset];

    db.query(dataSql, dataParams, (dataErr, rows) => {
      if (dataErr) {
        console.error("Audit Logs data error:", dataErr);
        return res.status(500).json({ message: "Database error fetching logs", error: dataErr });
      }

      res.status(200).json({
        rows,
        total,
        page: pageNum,
        pageSize: sizeNum
      });
    });
  });
};

/**
 * GET /api/audit-logs/filters
 * Retrieves distinct values for dropdown filters to stay in sync with actual data.
 */
const getAuditLogFilters = (req, res) => {
  const queries = {
    entityTypes: "SELECT DISTINCT entity_type FROM activity_logs WHERE entity_type IS NOT NULL AND entity_type != '' ORDER BY entity_type ASC",
    actionTypes: "SELECT DISTINCT action_type FROM activity_logs WHERE action_type IS NOT NULL AND action_type != '' ORDER BY action_type ASC",
    performedByUsers: "SELECT DISTINCT u.user_id as id, u.fullname as name FROM activity_logs al JOIN users u ON al.performed_by = u.user_id WHERE u.fullname IS NOT NULL ORDER BY u.fullname ASC"
  };

  const results = {};
  const keys = Object.keys(queries);
  let completed = 0;
  let hasError = false;

  keys.forEach((key) => {
    db.query(queries[key], (err, rows) => {
      if (hasError) return;

      if (err) {
        hasError = true;
        console.error(`Audit Logs filter error [${key}]:`, err);
        return res.status(500).json({ message: "Database error fetching filters", error: err });
      }

      if (key === 'performedByUsers') {
        results[key] = rows;
      } else {
        // Flatten the array of objects into an array of strings
        results[key] = rows.map(r => r.entity_type || r.action_type);
      }

      completed++;
      if (completed === keys.length) {
        res.status(200).json(results);
      }
    });
  });
};

module.exports = { getAuditLogs, getAuditLogFilters };
