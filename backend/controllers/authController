// controllers/authController.js
const bcrypt = require("bcryptjs");
const db = require("../config/db"); 
const jwt = require("jsonwebtoken");

// LOGIN function
const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "SELECT * FROM users WHERE Username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", err });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = results[0];

    // bcrypt.compare returns a promise, so we await it
    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.User_id, username: user.Username, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      username: user.Username,
      role: user.Role,
    });
  });
};

module.exports = { login };
