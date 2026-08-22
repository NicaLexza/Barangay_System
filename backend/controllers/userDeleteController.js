// controllers/userDeleteController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const deleteUser = (req, res) => {
  const { id } = req.params;
  const performed_by = req.user.id;
  
  if (!id) return res.status(400).json({ message: 'Missing id' });

  // Fetch user details first to log the name/username
  db.query("SELECT username FROM users WHERE user_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const deletedUsername = results[0].username;

    const sql = `DELETE FROM users WHERE user_id = ?`;
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ message: 'Failed to delete user', error: err.message });
      }
      
      logActivity({
        entity_type: "Account",
        entity_id: id,
        entity_name: deletedUsername,
        action_type: "deleted",
        performed_by
      });
      
      res.json({ message: 'User deleted' });
    });
  });
};

module.exports = { deleteUser };
