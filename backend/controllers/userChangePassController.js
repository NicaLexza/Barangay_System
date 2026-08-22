// controllers/changePasswordController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");

const changePassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { id } = req.params;

  // 1. Check all fields
  if (!password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 2. Check password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // 3. Fetch the user's current password and username
  const fetchSql = "SELECT username, password FROM users WHERE user_id = ?";
  db.query(fetchSql, [id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];

    // 4. Check if new password is the same as the old one
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be the same as the current password" });
    }

    // 5. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Update the password
    const updateSql = "UPDATE users SET password = ?, updated_by = ?, updated_at = NOW() WHERE user_id = ?";
    db.query(updateSql, [hashedPassword, req.user.id, id], (err) => {
      if (err) return res.status(500).json({ message: "Database error", err });

      logActivity({
        entity_type: "Account",
        entity_id: id,
        entity_name: user.username,
        action_type: "updated",
        performed_by: req.user.id
      });

      res.status(200).json({ message: "Password changed successfully" });
    });
  });
};

module.exports = { changePassword };