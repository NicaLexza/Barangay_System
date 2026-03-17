// controllers/eligibilityFormEntriesDeleteController.js
const db = require("../config/db");

const deleteEntry = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM eligibility_forms_entries WHERE entry_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(200).json({ message: "Entry deleted successfully" });
  });
};

module.exports = { deleteEntry };