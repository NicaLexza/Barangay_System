// controllers/eligibilityFormDeleteController.js
const db = require("../config/db");

/**
 * DELETE /api/eligibility-forms/delete/:id
 * Soft-deletes by setting status to 'Archived' instead of a hard DELETE.
 */
const deleteForm = (req, res) => {
  const { id } = req.params;

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
  });
};

module.exports = { deleteForm };