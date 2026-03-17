// controllers/eligibilityFormEntriesUpdateController.js
const db = require("../config/db");

const updateEntryStatus = (req, res) => {
  const { id } = req.params;
  const { is_rewarded } = req.body;
  const processed_by = req.user.id;

  if (is_rewarded === undefined) {
    return res.status(400).json({ message: "is_rewarded field is required" });
  }

  const sql = `
    UPDATE eligibility_forms_entries
    SET is_rewarded = ?, processed_by = ?, processed_at = NOW()
    WHERE entry_id = ?
  `;

  db.query(sql, [is_rewarded, processed_by, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(200).json({ message: "Entry status updated successfully" });
  });
};

module.exports = { updateEntryStatus };