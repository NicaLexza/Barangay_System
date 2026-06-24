// controllers/userAddController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");
const { generateRandomPassword } = require("../utils/passwordGenerator");

const TEMP_PASSWORD_LENGTH = 6;

const addAccount = async (req, res) => {
  const { fullname, username, role } = req.body;

  // 1. Check all fields
  if (!fullname || !username || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 2. Check if username already exists
  const checkSql = "SELECT * FROM users WHERE username = ?";
  db.query(checkSql, [username], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const createdBy = req.user.id;

    // 3. Generate a unique random temp password and hash it
    //    (never logged or stored anywhere in plaintext)
    const tempPassword = generateRandomPassword(TEMP_PASSWORD_LENGTH);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4. Insert into database with must_change_password = 1
    const insertSql = `
      INSERT INTO users (fullname, username, password, role, status, must_change_password, created_by, created_at)
      VALUES (?, ?, ?, ?, 'Active', 1, ?, NOW())
    `;

    db.query(insertSql, [fullname, username, hashedPassword, role, createdBy], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error", err });

      res.status(201).json({
        message: "Account created successfully.",
        temp_password: tempPassword,
      });

      logActivity({
        entity_type:  "Account",
        entity_id:    result?.insertId,
        entity_name:  fullname,
        action_type:  "created",
        performed_by: createdBy,
      });
    });
  });
};

module.exports = { addAccount };