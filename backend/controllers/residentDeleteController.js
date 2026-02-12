const db = require("../config/db");

const deleteResident = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing id' });

  const sql = `DELETE FROM residents WHERE resident_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete resident error:', err);
      return res.status(500).json({ message: 'Failed to delete resident', error: err.message });
    }
    res.json({ message: 'Resident deleted' });
  });
};

module.exports = { deleteResident };
