// controllers/authController.js
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", err });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is inactive. Please contact support." });
    }

    // ✅ include must_change_password in the token
    const token = jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        role: user.role,
        must_change_password: user.must_change_password,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      username: user.username,
      role: user.role,
      must_change_password: user.must_change_password, // ✅ include in response
    });
  });
};

module.exports = { login };