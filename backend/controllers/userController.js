// userController.js
const db = require("../config/db");

// Get all users with computed fields
const getAllUsers = (req, res) => {
  const sql = `
    SELECT 
      u.user_id,
      u.username,
      u.fullname,
      u.role,
      u.status,
      DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      u.created_by,
      cu.Fullname AS created_by_name,
      DATE_FORMAT(u.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
      u.updated_by,
      uu.Fullname AS updated_by_name
    FROM users u
    LEFT JOIN users cu ON cu.User_id = u.created_by
    LEFT JOIN users uu ON uu.User_id = u.updated_by
    ORDER BY u.fullname
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Failed to fetch users", error: err });
    }

    res.json(results);
  });
};

// Get single user by ID (full raw fields)
const getUser = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      user_id,
      username,
      fullname,
      role,
      status
    FROM users
    WHERE user_id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get user error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return raw row (no concatenation)
    res.json(results[0]);
  });
};

module.exports = { getAllUsers, getUser };
      