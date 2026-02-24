const db = require("../config/db");

const deleteHousehold = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing id' });

  const sql = `DELETE FROM households WHERE household_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete household error:', err);
      return res.status(500).json({ message: 'Failed to delete household', error: err.message });
    }
    res.json({ message: 'Household deleted' });
  });
};

module.exports = { deleteHousehold };
