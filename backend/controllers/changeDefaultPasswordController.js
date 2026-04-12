// controllers/changeDefaultPasswordController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");

const changeDefaultPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const userId = req.user.id;

  // 1. Check all fields
  if (!password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 2. Check password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // 3. Fetch current password to check against default
  const fetchSql = "SELECT password FROM users WHERE user_id = ?";
  db.query(fetchSql, [userId], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];

    // 4. Prevent using the same password as the current one
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be the same as your current password" });
    }

    // 5. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Update password and flip must_change_password to 0
    const updateSql = `
      UPDATE users 
      SET password = ?, must_change_password = 0, updated_by = ?, updated_at = NOW() 
      WHERE user_id = ?
    `;

    db.query(updateSql, [hashedPassword, userId, userId], (err) => {
      if (err) return res.status(500).json({ message: "Database error", err });

      res.status(200).json({ message: "Password changed successfully" });
    });
  });
};

module.exports = { changeDefaultPassword };