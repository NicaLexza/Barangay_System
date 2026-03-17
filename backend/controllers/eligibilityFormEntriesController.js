// controllers/eligibilityFormEntriesController.js
const db = require("../config/db");

const getEntries = (req, res) => {
  const { formId } = req.params;

  const sql = `
    SELECT
      efe.entry_id,
      efe.is_rewarded, 
      DATE_FORMAT(efe.processed_at, '%Y-%m-%d %H:%i:%s') AS processed_at,
      r.f_name, r.m_name, r.l_name, r.suffix,
      u.fullname AS processed_by_name
    FROM eligibility_forms_entries efe
    LEFT JOIN residents r ON efe.resident_id = r.resident_id
    LEFT JOIN users u ON efe.processed_by = u.user_id
    WHERE efe.form_id = ?
    ORDER BY efe.entry_id ASC
  `;

  db.query(sql, [formId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });
    res.status(200).json(results);
  });
};

module.exports = { getEntries };