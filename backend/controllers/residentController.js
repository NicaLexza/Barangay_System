// controllers/residentController.js
const db = require("../config/db");

// Get all residents with computed fields
const getAllResidents = (req, res) => {
  const sql = `
    SELECT 
      r.resident_id,
      CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix) AS fullName,
      DATE_FORMAT(r.birthdate, '%Y-%m-%d') AS birthdate,
      r.birthplace,
      CONCAT_WS(' ', r.house_no, r.street) AS address,
      CONCAT(
        IF(r.is_pwd = 1, 'PD, ', ''),
        IF(r.is_senior = 1, 'S, ', ''),
        IF(r.is_solop = 1, 'SP', '')
      ) AS specialSector,
      r.sex,
      r.civil_status AS civilStatus,
      r.occupation,
      r.citizenship,
      DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      r.created_by,
      cu.Fullname AS created_by_name,
      DATE_FORMAT(r.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
      r.updated_by,
      uu.Fullname AS updated_by_name
    FROM residents r
    LEFT JOIN users cu ON cu.User_id = r.created_by
    LEFT JOIN users uu ON uu.User_id = r.updated_by
    ORDER BY r.l_name, r.f_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Failed to fetch residents", error: err });
    }

    // Clean up specialSector (remove trailing comma)
    const formattedResults = results.map(row => {
      let sector = row.specialSector.trim();
      if (sector.endsWith(',')) {
        sector = sector.slice(0, -1).trim();
      }
      return {
        ...row,
        specialSector: sector || "None",
      };
    });

    res.json(formattedResults);
  });
};

// === NEW FUNCTION: Fetch one resident by ID (raw fields) ===
const getResident = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      resident_id,
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
      is_pwd,
      is_senior,
      is_solop
    FROM residents
    WHERE resident_id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get resident error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Resident not found" });
    }

    // Return the raw row directly (no concatenation)
    res.json(results[0]);
  });
};

module.exports = { getAllResidents, getResident };
