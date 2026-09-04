// controllers/userChangePassController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");
const { generateRandomPassword } = require("../utils/passwordGenerator");

const changePassword = async (req, res) => {
  const { id } = req.params;

  // 1. Fetch the user's current username
  const fetchSql = "SELECT username FROM users WHERE user_id = ?";
  db.query(fetchSql, [id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];

    // 2. Hash the generated temporary password
    const tempPassword = generateRandomPassword(6);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 3. Update the password and set must_change_password = 1
    const updateSql = "UPDATE users SET password = ?, must_change_password = 1, updated_by = ?, updated_at = NOW() WHERE user_id = ?";
    db.query(updateSql, [hashedPassword, req.user.id, id], (err) => {
      if (err) return res.status(500).json({ message: "Database error", err });

      logActivity({
        entity_type: "Account",
        entity_id: id,
        entity_name: user.username,
        action_type: "Password Reset",
        performed_by: req.user.id
      });

      res.status(200).json({ 
        message: "Password reset successfully", 
        temp_password: tempPassword 
      });
    });
  });
};

module.exports = { changePassword };