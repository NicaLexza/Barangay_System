// controllers/AddEligibilityFormController.js
const db = require("../config/db");

const addEligibilityForm = (req, res) => {
  const { form_name, resident_ids } = req.body;
  const created_by = req.user.id;

  if (!form_name) {
    return res.status(400).json({ message: "Form name is required" });
  }

  if (!resident_ids || resident_ids.length === 0) {
    return res.status(400).json({ message: "No residents in current view" });
  }

  // Step 1: Insert the form
  const insertFormSql = "INSERT INTO eligibility_forms (form_name, created_by, created_at) VALUES (?, ?, NOW())";

  db.query(insertFormSql, [form_name, created_by], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    const form_id = result.insertId;

    // Step 2: Bulk insert all visible residents as entries
    const entries = resident_ids.map((id) => [form_id, id]);
    const insertEntriesSql = "INSERT INTO eligibility_forms_entries (form_id, resident_id) VALUES ?";

    db.query(insertEntriesSql, [entries], (err) => {
      if (err) return res.status(500).json({ message: "Database error on entries", err });

      res.status(201).json({
        message: `Eligibility form created with ${resident_ids.length} resident(s)`,
        form_id,
      });
    });
  });
};

module.exports = { addEligibilityForm };