// controllers/userController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Add a new account
const addAccount = async (req, res) => {
  const { fullname, username, password, confirmPassword, role } = req.body;

  // 1. Check all fields
  if (!fullname || !username || !password || !confirmPassword || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 2. Check password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // 3. Check if username already exists
  const checkSql = "SELECT * FROM users WHERE Username = ?";
  db.query(checkSql, [username], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    if (results.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 4. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Insert into database
    const insertSql =
      "INSERT INTO users (Fullname, Username, Password, Role, Status, Created_at) VALUES (?, ?, ?, ?, 'Active', NOW())";

    db.query(
      insertSql,
      [fullname, username, hashedPassword, role],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", err });

        res.status(201).json({ message: "Account created successfully" });
      }
    );
  });
};

module.exports = { addAccount };
