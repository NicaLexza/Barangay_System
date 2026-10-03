// controllers/eligibilityFormDeleteController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { verifyActionCredentials, requestDetails } = require("../utils/actionCredentials");

/**
 * DELETE /api/eligibility-forms/delete/:id
 * Body: { username, password }
 *
 * Archives the form (soft-delete). Requires credentials — see
 * utils/actionCredentials.js (Staff submit any active Admin's, Admins
 * submit their own).
 */
const deleteForm = async (req, res) => {
  const { id } = req.params;

  let auth;
  try {
    auth = await verifyActionCredentials(req);
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.message || "Server error" });
  }

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
        entity_type: "Eligibility Form",
        entity_id: id,
        entity_name: formName,
        action_type: "archived",
        performed_by: auth.actingAdmin.user_id,
        details: requestDetails(auth.requestedBy),
      });
    });
  });
};

module.exports = { deleteForm };