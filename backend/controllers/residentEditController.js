//residentEditController.js

const db = require("../config/db");

const updateResident = (req, res) => {
  const { resident_id, ...data } = req.body;

  if (!resident_id) return res.status(400).json({ message: "Resident ID required" });

  const updated_by = req.user.id;

  // Extract values for duplicate check (use existing values if not being updated)
  const l_name = data.l_name;
  const f_name = data.f_name;
  const birthdate = data.birthdate;

  // Only perform duplicate check if any of these fields are being updated
  if (l_name || f_name || birthdate) {
    const checkSql = `
      SELECT COUNT(*) AS count 
      FROM residents 
      WHERE (? IS NULL OR l_name = ?) 
        AND (? IS NULL OR f_name = ?) 
        AND (? IS NULL OR birthdate = ?)
        AND resident_id != ?
    `;

    db.query(
      checkSql, 
      [l_name, l_name, f_name, f_name, birthdate, birthdate, resident_id], 
      (err, results) => {
        if (err) {
          console.error("Duplicate check error:", err);
          return res.status(500).json({ message: "Database error during duplicate check" });
        }

        if (results[0].count > 0) {
          return res.status(409).json({
            message: "Another resident with the same first name, last name, and birthdate already exists.",
          });
        }

        // If no duplicate, proceed with update
        performUpdate();
      }
    );
  } else {
    // No name/birthdate change, skip duplicate check
    performUpdate();
  }

  // Extracted update logic
  function performUpdate() {
    // Build dynamic SET
    const fields = [];
    const values = [];

    if (data.f_name) { fields.push("f_name = ?"); values.push(data.f_name); }
    if (data.m_name !== undefined) { fields.push("m_name = ?"); values.push(data.m_name || null); }
    if (data.l_name) { fields.push("l_name = ?"); values.push(data.l_name); }
    if (data.suffix !== undefined) { fields.push("suffix = ?"); values.push(data.suffix || null); }
    if (data.sex) { fields.push("sex = ?"); values.push(data.sex); }
    if (data.birthdate) { fields.push("birthdate = ?"); values.push(data.birthdate); }
    if (data.birthplace !== undefined) { fields.push("birthplace = ?"); values.push(data.birthplace); }
    if (data.house_no !== undefined) { fields.push("house_no = ?"); values.push(data.house_no || null); }
    if (data.street) { fields.push("street = ?"); values.push(data.street); }
    if (data.civil_status) { fields.push("civil_status = ?"); values.push(data.civil_status); }
    if (data.occupation !== undefined) { fields.push("occupation = ?"); values.push(data.occupation || null); }
    if (data.citizenship !== undefined) { fields.push("citizenship = ?"); values.push(data.citizenship || "Filipino"); }
    if (data.is_pwd !== undefined) { fields.push("is_pwd = ?"); values.push(data.is_pwd ? 1 : 0); }
    if (data.is_senior !== undefined) { fields.push("is_senior = ?"); values.push(data.is_senior ? 1 : 0); }
    if (data.is_solop !== undefined) { fields.push("is_solop = ?"); values.push(data.is_solop ? 1 : 0); }

    fields.push("updated_by = ?");
    values.push(updated_by);

    if (fields.length === 1) return res.status(400).json({ message: "No fields to update" });

    const sql = `UPDATE residents SET ${fields.join(", ")} WHERE resident_id = ?`;
    values.push(resident_id);

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ message: "Update failed", error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Resident not found" });

      res.json({ message: "Resident updated successfully" });
    });
  }
};

module.exports = { updateResident };