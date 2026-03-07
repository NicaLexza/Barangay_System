// controllers/userDeleteController.js
const db = require("../config/db");

const deleteUser = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing id' });

  const sql = `DELETE FROM users WHERE user_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete user error:', err);
      return res.status(500).json({ message: 'Failed to delete user', error: err.message });
    }
    res.json({ message: 'User deleted' });
  });
};

module.exports = { deleteUser };
