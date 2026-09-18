// controllers/residentController.js
const db = require("../config/db");

// Get all residents with computed fields — excludes archived residents.
// Archived residents have their own list at GET /api/residents/archived
// (residentArchiveController.js) and are intentionally invisible here so
// they don't show up in the active roster or get pulled into eligibility
// form resident-selection.
//
// Household changes:
// - `head_resident_id` returned so the frontend can group heads + members.
// - `member_count` computed live (number of non-archived members + 1 for the
//   head) instead of the old stored `household_member_count` column.
// - Address for members is resolved via LEFT JOIN to their head row, so
//   editing a head's address propagates instantly with no sync step.
const getAllResidents = (req, res) => {
  const sql = `
    SELECT 
      r.resident_id,
      r.f_name,
      r.l_name,
      CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix) AS fullName,
      DATE_FORMAT(r.birthdate, '%Y-%m-%d') AS birthdate,
      r.birthplace,
      CASE
        WHEN r.is_household_head = 1 THEN CONCAT_WS(' ', r.house_no, r.street)
        ELSE CONCAT_WS(' ', h.house_no, h.street)
      END AS address,
      CONCAT(
        IF(r.is_pwd = 1, 'PD, ', ''),
        IF(r.is_senior = 1, 'S, ', ''),
        IF(r.is_solop = 1, 'SP', '')
      ) AS specialSector,
      r.sex,
      r.civil_status AS civilStatus,
      r.occupation,
      r.citizenship,
      r.is_household_head,
      r.head_resident_id,
      CASE
        WHEN r.is_household_head = 1 THEN (
          SELECT COUNT(*) + 1
          FROM residents m
          WHERE m.head_resident_id = r.resident_id
            AND m.is_archived = 0
        )
        ELSE NULL
      END AS member_count,
      DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      r.created_by,
      cu.Fullname AS created_by_name,
      DATE_FORMAT(r.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
      r.updated_by,
      uu.Fullname AS updated_by_name
    FROM residents r
    LEFT JOIN users cu ON cu.User_id = r.created_by
    LEFT JOIN users uu ON uu.User_id = r.updated_by
    LEFT JOIN residents h ON h.resident_id = r.head_resident_id
    WHERE r.is_archived = 0
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

// Fetch one resident by ID (raw fields for edit modal). Intentionally not
// filtered by is_archived — this is a direct lookup by primary key used
// internally (e.g. the edit modal), not a browsing list.
//
// For members, the response also includes the head's address and full name
// so the edit modal can display "Lives at [head's address]" read-only.
const getResident = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      r.resident_id,
      r.f_name,
      r.m_name,
      r.l_name,
      r.suffix,
      r.sex,
      DATE_FORMAT(r.birthdate, '%Y-%m-%d') AS birthdate,
      r.birthplace,
      r.house_no,
      r.street,
      r.civil_status,
      r.occupation,
      r.citizenship,
      r.is_pwd,
      r.is_senior,
      r.is_solop,
      r.is_household_head,
      r.head_resident_id,
      CASE WHEN r.head_resident_id IS NOT NULL THEN
        CONCAT_WS(' ', h.f_name, h.m_name, h.l_name, h.suffix)
      ELSE NULL END AS head_fullName,
      CASE WHEN r.head_resident_id IS NOT NULL THEN
        CONCAT_WS(' ', h.house_no, h.street)
      ELSE NULL END AS head_address
    FROM residents r
    LEFT JOIN residents h ON h.resident_id = r.head_resident_id
    WHERE r.resident_id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get resident error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Resident not found" });
    }

    res.json(results[0]);
  });
};

// Return all non-archived household heads for the "Add Member" modal's
// head-selection dropdown. Lightweight — just id, name, and address.
const getHeads = (req, res) => {
  const sql = `
    SELECT
      r.resident_id,
      CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix) AS fullName,
      CONCAT_WS(' ', r.house_no, r.street) AS address,
      (
        SELECT COUNT(*) + 1
        FROM residents m
        WHERE m.head_resident_id = r.resident_id
          AND m.is_archived = 0
      ) AS member_count
    FROM residents r
    WHERE r.is_household_head = 1
      AND r.is_archived = 0
    ORDER BY r.l_name, r.f_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get heads error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
};

module.exports = { getAllResidents, getResident, getHeads };