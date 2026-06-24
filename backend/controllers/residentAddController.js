// controllers/residentAddController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const addResident = (req, res) => {
  const {
    f_name,
    m_name,
    l_name,
    suffix,
    sex,
    birthdate,
    birthplace,
    house_no,
    street,
    civil_status,
    occupation,
    citizenship,
    is_pwd = 0,
    is_senior = 0,
    is_solop = 0,
    is_household_head = 0,
    household_member_count,
  } = req.body;

  // Required fields validation (basic server-side)
  if (!f_name || !l_name || !sex || !birthdate || !birthplace || !civil_status || !street) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const created_by = req.user.id; // From JWT (authMiddleware)

  const checkSql = `
    SELECT COUNT(*) AS count 
    FROM residents 
    WHERE l_name = ? AND f_name = ? AND birthdate = ?
  `;

  db.query(checkSql, [l_name, f_name, birthdate], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    if (results[0].count > 0) {
      return res.status(409).json({
        message: "Resident already exists.",
      });
    }

    const sql = `
      INSERT INTO residents (
        f_name, m_name, l_name, suffix, sex, birthdate, birthplace,
        house_no, street, civil_status, occupation, citizenship,
        is_pwd, is_senior, is_solop, is_household_head, household_member_count, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        birthplace,
        house_no || null,
        street,
        civil_status,
        occupation || null,
        citizenship || "Filipino",
        is_pwd ? 1 : 0,
        is_senior ? 1 : 0,
        is_solop ? 1 : 0,
        is_household_head ? 1 : 0,
        is_household_head ? (household_member_count || 1) : null,
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

        logActivity({
          entity_type:  "Resident",
          entity_id:    result.insertId,
          entity_name:  `${f_name} ${l_name}`,
          action_type:  "added",
          performed_by: created_by,
        });
      }
    );
  });
};

module.exports = { addResident };