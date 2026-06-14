// controllers/eligibilityFormArchiveController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");

const getArchivedForms = (req, res) => {
  const sql = `
    SELECT
      ef.form_id,
      ef.form_name,
      ef.status,
      ef.created_at,
      u.fullname AS created_by_name,
      COUNT(efe.entry_id)  AS total_entries,
      SUM(efe.is_rewarded) AS rewarded_count
    FROM eligibility_forms ef
    LEFT JOIN users u
      ON ef.created_by = u.user_id
    LEFT JOIN eligibility_forms_entries efe
      ON ef.form_id = efe.form_id
    WHERE ef.status = 'Archived'
    GROUP BY
      ef.form_id, ef.form_name, ef.status, ef.created_at, u.fullname
    ORDER BY ef.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });
    res.status(200).json(results);
  });
};

const restoreForm = (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can restore archived forms." });
  }

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const fetchSql = "SELECT * FROM users WHERE username = ? AND user_id = ?";
  db.query(fetchSql, [username, req.user.id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is inactive." });
    }

    // ✅ Fetch form name first, then update
    const nameSql = "SELECT form_name FROM eligibility_forms WHERE form_id = ?";
    db.query(nameSql, [id], (nameErr, nameResults) => {
      if (nameErr) return res.status(500).json({ message: "Database error", err: nameErr });

      const formName = nameResults?.[0]?.form_name || null;

      const updateSql = `
        UPDATE eligibility_forms
        SET status = 'Disabled'
        WHERE form_id = ? AND status = 'Archived'
      `;

      db.query(updateSql, [id], (err2, result) => {
        if (err2) return res.status(500).json({ message: "Database error", err: err2 });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Archived form not found." });
        }

        res.status(200).json({ message: "Form restored successfully." });

        logActivity({
          entity_type:  "Eligibility Form",
          entity_id:    id,
          entity_name:  formName,
          action_type:  "restored",
          performed_by: req.user.id,
        });
      });
    });
  });
};

const permanentDeleteForm = (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can permanently delete archived forms." });
  }

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const fetchSql = "SELECT * FROM users WHERE username = ? AND user_id = ?";
  db.query(fetchSql, [username, req.user.id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is inactive." });
    }

    // ✅ Fetch form name first, then delete
    const nameSql = "SELECT form_name FROM eligibility_forms WHERE form_id = ?";
    db.query(nameSql, [id], (nameErr, nameResults) => {
      if (nameErr) return res.status(500).json({ message: "Database error", err: nameErr });

      const formName = nameResults?.[0]?.form_name || null;

      const deleteSql = "DELETE FROM eligibility_forms WHERE form_id = ? AND status = 'Archived'";

      db.query(deleteSql, [id], (err2, result) => {
        if (err2) return res.status(500).json({ message: "Database error", err: err2 });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Archived form not found." });
        }

        res.status(200).json({ message: "Form permanently deleted." });

        logActivity({
          entity_type:  "Eligibility Form",
          entity_id:    id,
          entity_name:  formName, // ✅ now populated
          action_type:  "deleted",
          performed_by: req.user.id,
        });
      });
    });
  });
};

module.exports = { getArchivedForms, restoreForm, permanentDeleteForm };