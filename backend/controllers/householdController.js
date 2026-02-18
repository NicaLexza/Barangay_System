// controllers/householdController.js
const db = require("../config/db");

// Get all households with computed fields
const getAllHouseholds = (req, res) => {
  const sql = `
    SELECT 
      h.household_id,
      CONCAT_WS(' ', h.f_name, h.m_name, h.l_name, h.suffix) AS headFullName,
      CONCAT_WS(' ', h.house_no, h.street) AS address,
      h.head_count AS headCount,
      DATE_FORMAT(h.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      h.created_by,
      cu.Fullname AS created_by_name,
      DATE_FORMAT(h.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
      h.updated_by,
      uu.Fullname AS updated_by_name
    FROM households h
    LEFT JOIN users cu ON cu.User_id = h.created_by
    LEFT JOIN users uu ON uu.User_id = h.updated_by
    ORDER BY h.l_name, h.f_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Failed to fetch households", error: err });
    }

    res.json(results);
  });
};

// Get single household by ID (full raw fields)
const getHousehold = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      household_id,
      f_name,
      m_name,
      l_name,
      suffix,
      house_no,
      street,
      head_count
    FROM households
    WHERE household_id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get household error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Household not found" });
    }

    // Return raw row (no concatenation)
    res.json(results[0]);
  });
};

module.exports = { getAllHouseholds, getHousehold };