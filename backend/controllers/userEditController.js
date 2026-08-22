// userEditController.js

const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const updateUser = (req, res) => {
  const { user_id, ...data } = req.body;

  if (!user_id) return res.status(400).json({ message: "User ID required" });

  const updated_by = req.user.id;

  const username = data.username;

  // Only perform duplicate check if username is being updated
  if (username) {
    const checkSql = `
      SELECT COUNT(*) AS count
      FROM users
      WHERE username = ?
        AND user_id != ?
    `;

    db.query(checkSql, [username, user_id], (err, results) => {
      if (err) {
        console.error("Duplicate check error:", err);
        return res.status(500).json({ message: "Database error during duplicate check" });
      }

      if (results[0].count > 0) {
        return res.status(409).json({
          message: "Another account with the same username already exists.",
        });
      }

      // No duplicate, proceed with update
      performUpdate();
    });
  } else {
    // No username change, skip duplicate check
    performUpdate();
  }

  function performUpdate() {
    // Build dynamic SET clause
    const fields = [];
    const values = [];

    if (data.fullname)            { fields.push("fullname = ?");  values.push(data.fullname); }
    if (data.username)            { fields.push("username = ?");  values.push(data.username); }
    if (data.role)                { fields.push("role = ?");      values.push(data.role); }
    if (data.status)              { fields.push("status = ?");    values.push(data.status); }

    fields.push("updated_by = ?");
    values.push(updated_by);

    if (fields.length === 1)
      return res.status(400).json({ message: "No fields to update" });

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`;
    values.push(user_id);

    db.query(sql, values, (err, results) => {
      if (err)                          return res.status(500).json({ message: "Update failed", error: err.message });
      if (results.affectedRows === 0)   return res.status(404).json({ message: "User not found" });
      
      // Fetch the updated username to log it
      db.query("SELECT username FROM users WHERE user_id = ?", [user_id], (err, resUser) => {
        const entity_name = !err && resUser.length > 0 ? resUser[0].username : "User";
        logActivity({
          entity_type: "Account",
          entity_id: user_id,
          entity_name,
          action_type: "updated",
          performed_by: updated_by
        });
      });
      
      res.json({ message: "User updated successfully" });
    });
  }
};

module.exports = { updateUser };

module.exports = { updateUser };