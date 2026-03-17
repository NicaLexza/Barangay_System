// controllers/eligibilityFormDeleteController.js
const db = require("../config/db");

const deleteForm = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM eligibility_forms WHERE form_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(200).json({ message: "Eligibility form deleted successfully" });
  });
};

module.exports = {deleteForm};