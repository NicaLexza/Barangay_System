// controllers/residentController.js
const db = require("../config/db");

// Get all residents with computed fields and creator/updater info
const getAllResidents = (req, res) => {
  const sql = `
    SELECT 
      r.resident_id,
      CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix) AS fullName,
      DATE_FORMAT(r.birthdate, '%Y-%m-%d') AS birthdate,
      r.place_of_birth,
      r.age,
      CONCAT_WS(' ', r.house_no, r.street) AS address,
      r.house_no,
      r.street,
      CONCAT(
        IF(r.is_pwd = 1, 'PD, ', ''),
        IF(r.is_senior = 1, 'S, ', ''),
        IF(r.is_solop = 1, 'SP', '')
      ) AS specialSector,
      r.sex,
      r.civil_status AS civilStatus,
      r.occupation,
      r.citizenship,
      r.created_by,
      DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      cu.Fullname AS created_by_name,
      r.updated_by,
      DATE_FORMAT(r.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
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

    const formattedResults = results.map(row => {
      let sector = (row.specialSector || '').trim();
      if (sector.endsWith(',')) sector = sector.slice(0, -1).trim();
      return {
        ...row,
        specialSector: sector || "None",
        created_by: row.created_by_name || row.created_by,
        updated_by: row.updated_by_name || row.updated_by,
      };
    });

    res.json(formattedResults);
  });
};

// Update resident
const updateResident = (req, res) => {
  const {
    resident_id,
    f_name,
    m_name,
    l_name,
    suffix,
    sex,
    birthdate,
    place_of_birth,
    age,
    house_no,
    street,
    civil_status,
    occupation,
    citizenship,
    is_pwd = 0,
    is_senior = 0,
    is_solop = 0,
  } = req.body;

  if (!resident_id) return res.status(400).json({ message: 'Missing resident_id' });

  const updated_by = req.user.id;

  const sql = `
    UPDATE residents SET
      f_name = ?, m_name = ?, l_name = ?, suffix = ?, sex = ?, birthdate = ?, place_of_birth = ?, age = ?,
      house_no = ?, street = ?, civil_status = ?, occupation = ?, citizenship = ?,
      is_pwd = ?, is_senior = ?, is_solop = ?, updated_by = ?
    WHERE resident_id = ?
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
      place_of_birth || null,
      age || null,
      house_no || null,
      street || null,
      civil_status,
      occupation || null,
      citizenship || 'Filipino',
      is_pwd ? 1 : 0,
      is_senior ? 1 : 0,
      is_solop ? 1 : 0,
      updated_by,
      resident_id,
    ],
    (err, result) => {
      if (err) {
        console.error('Update resident error:', err);
        return res.status(500).json({ message: 'Failed to update resident', error: err.message });
      }

      res.json({ message: 'Resident updated successfully' });
    }
  );
};

// Delete resident
const deleteResident = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing id' });

  const sql = `DELETE FROM residents WHERE resident_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete resident error:', err);
      return res.status(500).json({ message: 'Failed to delete resident', error: err.message });
    }
    res.json({ message: 'Resident deleted' });
  });
};

module.exports = { getAllResidents, updateResident, deleteResident };