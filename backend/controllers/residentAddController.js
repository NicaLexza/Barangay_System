// controllers/residentAddController.js
const db = require("../config/db");

const addResident = (req, res) => {
  const {
    f_name,
    m_name,
    l_name,
    suffix,
    sex,
    birthdate,
    house_no,
    street,
    civil_status,
    occupation,
    citizenship,
    is_pwd = 0,
    is_senior = 0,
    is_solop = 0,
  } = req.body;

  // Required fields validation (basic server-side)
  if (!f_name || !l_name || !sex || !birthdate || !civil_status || !street) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const created_by = req.user.id; // From JWT (authMiddleware)

  const sql = `
    INSERT INTO residents (
      f_name, m_name, l_name, suffix, sex, birthdate,
      house_no, street, civil_status, occupation, citizenship,
      is_pwd, is_senior, is_solop, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      f_name,
      m_name || null,
      l_name,
      suffix || null,
      sex,
      birthdate,
      house_no || null,
      street,
      civil_status,
      occupation || null,
      citizenship || "Filipino",
      is_pwd ? 1 : 0,
      is_senior ? 1 : 0,
      is_solop ? 1 : 0,
      created_by,
    ],
    (err, result) => {
      if (err) {
        console.error("Add resident error:", err);
        return res.status(500).json({ message: "Failed to add resident", error: err.message });
      }

      res.status(201).json({
        message: "Resident added successfully",
        resident_id: result.insertId,
      });
    }
  );
};

module.exports = { addResident };