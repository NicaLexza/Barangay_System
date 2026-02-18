const db = require("../config/db");

const addHousehold = (req, res) => {
  const {
    f_name,
    m_name,
    l_name,
    suffix,
    house_no,
    street,
    head_count = 1,
  } = req.body;

  // Required fields validation (basic server-side)
  if (!f_name || !l_name || !house_no || !street || !head_count) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const created_by = req.user.id; // From JWT (authMiddleware)

  const checkSql = `
    SELECT COUNT(*) AS count 
    FROM households 
    WHERE l_name = ? AND f_name = ? AND house_no = ? AND street = ?
  `;

  db.query(checkSql, [l_name, f_name, house_no, street], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    if (results[0].count > 0) {
      return res.status(409).json({
        message: "Household already exists.",
      });
    }

  const sql = `
    INSERT INTO households (
      f_name, m_name, l_name, suffix, house_no, street, head_count, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      f_name,
      m_name || null,
      l_name,
      suffix || null,
      house_no,
      street,
      head_count,
      created_by,
    ],
    (err, results) => {
      if (err) {
        console.error("Add household error:", err);
        return res.status(500).json({ message: "Failed to add household", error: err });
      }
      res.status(201).json({ message: "Household added successfully", household: results.insertId
      });
    }
  );
});
}

module.exports = { addHousehold };