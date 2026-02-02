// controllers/residentController.js
const db = require("../config/db");

// Get all residents with computed fields
const getAllResidents = (req, res) => {
  const sql = `
    SELECT 
      resident_id,
      CONCAT_WS(' ', f_name, m_name, l_name, suffix) AS fullName,
      DATE_FORMAT(birthdate, '%Y-%m-%d') AS birthdate,   -- ← format as YYYY-MM-DD string
      CONCAT_WS(' ', house_no, street) AS address,
      CONCAT(
        IF(is_pwd = 1, 'PD, ', ''),
        IF(is_senior = 1, 'S, ', ''),
        IF(is_solop = 1, 'SP', '')
      ) AS specialSector,
      sex,
      civil_status AS civilStatus,
      occupation,
      citizenship
    FROM residents
    ORDER BY l_name, f_name
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

module.exports = { getAllResidents };