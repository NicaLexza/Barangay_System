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
    // 1. Fetch old data to compute diffs
    db.query("SELECT fullname, username, role, status FROM users WHERE user_id = ?", [user_id], (err, oldResults) => {
      if (err) return res.status(500).json({ message: "Database error fetching old data" });
      if (oldResults.length === 0) return res.status(404).json({ message: "User not found" });

      const oldData = oldResults[0];

      // 2. Build dynamic SET clause
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

      // 3. Compute Changes (Diffs)
      const changes = [];
      const fieldLabels = {
        fullname: "Full Name",
        username: "Username",
        role: "Role",
        status: "Status"
      };

      const compareAndPush = (key, newVal) => {
        if (newVal === undefined) return;
        const oldVal = oldData[key] ?? "";
        if (String(oldVal) !== String(newVal)) {
          changes.push({
            field: fieldLabels[key] || key,
            from: String(oldVal),
            to: String(newVal)
          });
        }
      };

      if (data.fullname !== undefined) compareAndPush("fullname", data.fullname);
      if (data.username !== undefined) compareAndPush("username", data.username);
      if (data.role !== undefined)     compareAndPush("role", data.role);
      if (data.status !== undefined)   compareAndPush("status", data.status);

      const sql = `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`;
      values.push(user_id);

      db.query(sql, values, (err, results) => {
        if (err)                          return res.status(500).json({ message: "Update failed", error: err.message });
        if (results.affectedRows === 0)   return res.status(404).json({ message: "User not found" });

        logActivity({
          entity_type: "Account",
          entity_id: user_id,
          entity_name: data.username || oldData.username,
          action_type: "updated",
          performed_by: updated_by,
          changes: changes.length > 0 ? changes : null
        });

        res.json({ message: "User updated successfully" });
      });
    });
  }
};

module.exports = { updateUser };