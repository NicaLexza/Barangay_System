// controllers/AddEligibilityFormController.js
const db = require("../config/db");

const addEligibilityForm = (req, res) => {
  const { form_name, resident_ids, household_ids } = req.body;
  const created_by = req.user.id;

  if (!form_name) {
    return res.status(400).json({ message: "Form name is required" });
  }

  const ids = resident_ids || household_ids;
  const isHousehold = !!household_ids;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: "No records in current view" });
  }

  // Step 1: Insert the form
  const insertFormSql = "INSERT INTO eligibility_forms (form_name, created_by, created_at) VALUES (?, ?, NOW())";

  db.query(insertFormSql, [form_name, created_by], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    const form_id = result.insertId;

    // Step 2: Bulk insert entries with the correct column filled
    const entries = ids.map((id) =>
      isHousehold
        ? [form_id, null, id]   // form_id, resident_id, household_id
        : [form_id, id,   null] // form_id, resident_id, household_id
    );

    const insertEntriesSql = "INSERT INTO eligibility_forms_entries (form_id, resident_id, household_id) VALUES ?";

    db.query(insertEntriesSql, [entries], (err) => {
      if (err) return res.status(500).json({ message: "Database error on entries", err });

      res.status(201).json({
        message: `Eligibility form created with ${ids.length} ${isHousehold ? "household(s)" : "resident(s)"}`,
        form_id,
      });
    });
  });
};

module.exports = { addEligibilityForm };