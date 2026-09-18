// controllers/AddEligibilityFormController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const addEligibilityForm = (req, res) => {
  const {
    form_name,
    resident_ids,
    source_details,
    distribution_details,
    target_quantity,
    start_date,
    end_date,
  } = req.body;
  const created_by = req.user.id;

  if (!form_name) {
    return res.status(400).json({ message: "Form name is required" });
  }
  if (!resident_ids || resident_ids.length === 0) {
    return res.status(400).json({ message: "No records in current view" });
  }

  // All of the following are now required on creation — this is the
  // "additional details" block (where/who it's from, what's being
  // distributed, how many, and the time span) that replaces the old
  // bare form_name, per the eligibility-forms security/integrity overhaul.
  if (!source_details || !source_details.trim()) {
    return res.status(400).json({ message: "Source details (where/who it came from) are required" });
  }
  if (!distribution_details || !distribution_details.trim()) {
    return res.status(400).json({ message: "Distribution details (what is being distributed) are required" });
  }
  const quantity = Number(target_quantity);
  if (!target_quantity || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: "Target quantity must be a whole number of at least 1" });
  }
  if (!start_date || !end_date) {
    return res.status(400).json({ message: "Start date and end date are required" });
  }
  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ message: "End date cannot be before start date" });
  }

  // Step 1: Insert the form
  const insertFormSql = `
    INSERT INTO eligibility_forms
      (form_name, source_details, distribution_details, target_quantity, start_date, end_date, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    insertFormSql,
    [form_name, source_details.trim(), distribution_details.trim(), quantity, start_date, end_date, created_by],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error", err });

      const form_id = result.insertId;

      // Step 2: Bulk insert entries
      const entries = resident_ids.map((resident_id) => [form_id, resident_id]);

      const insertEntriesSql = "INSERT INTO eligibility_forms_entries (form_id, resident_id) VALUES ?";

      db.query(insertEntriesSql, [entries], (err) => {
        if (err) return res.status(500).json({ message: "Database error on entries", err });

        res.status(201).json({
          message: `Eligibility form created with ${resident_ids.length} resident(s)`,
          form_id,
        });

        logActivity({
          entity_type:  "Eligibility Form",
          entity_id:    form_id,
          entity_name:  form_name,
          action_type:  "created",
          performed_by: created_by,
        });
      });
    }
  );
};

module.exports = { addEligibilityForm };