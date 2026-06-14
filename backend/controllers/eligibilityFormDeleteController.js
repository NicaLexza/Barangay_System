// controllers/eligibilityFormDeleteController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const deleteForm = (req, res) => {
  const { id } = req.params;

  // ✅ Fetch form name first, then archive
  const nameSql = "SELECT form_name FROM eligibility_forms WHERE form_id = ?";
  db.query(nameSql, [id], (nameErr, nameResults) => {
    if (nameErr) return res.status(500).json({ message: "Database error", err: nameErr });

    const formName = nameResults?.[0]?.form_name || null;

    const sql = `
      UPDATE eligibility_forms
      SET status = 'Archived'
      WHERE form_id = ? AND status != 'Archived'
    `;

    db.query(sql, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error", err });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Form not found or already archived" });
      }

      res.status(200).json({ message: "Eligibility form archived successfully" });

      logActivity({
        entity_type:  "Eligibility Form",
        entity_id:    id,
        entity_name:  formName, // ✅ now populated
        action_type:  "archived",
        performed_by: req.user.id,
      });
    });
  });
};

module.exports = { deleteForm };