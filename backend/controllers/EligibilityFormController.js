// controllers/EligibilityFormController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

/**
 * GET /api/eligibility-forms
 * Returns Enabled + Disabled forms only (Archived are excluded).
 */
const getForms = (req, res) => {
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
    WHERE ef.status IN ('Enabled', 'Disabled')
    GROUP BY
      ef.form_id, ef.form_name, ef.status, ef.created_at, u.fullname
    ORDER BY ef.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });
    res.status(200).json(results);
  });
};

/**
 * PUT /api/eligibility-forms/:id/status
 * Toggles between Enabled and Disabled only (Archived is handled separately).
 */
const updateFormStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const performed_by = req.user.id;

  if (!["Enabled", "Disabled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  // Fetch form name first for logging
  db.query("SELECT form_name FROM eligibility_forms WHERE form_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Form not found" });

    const formName = results[0].form_name;

    const sql = "UPDATE eligibility_forms SET status = ? WHERE form_id = ?";
    db.query(sql, [status, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error", err });

      logActivity({
        entity_type: "Eligibility Form",
        entity_id: id,
        entity_name: formName,
        action_type: status.toLowerCase(),
        performed_by
      });

      res.status(200).json({ message: `Form ${status.toLowerCase()} successfully` });
    });
  });
};

module.exports = { getForms, updateFormStatus };