//householdEditController.js

const db = require("../config/db");

const updateHousehold = (req, res) => {
  const { household_id, ...data } = req.body;

  if (!household_id) return res.status(400).json({ message: "Household ID required" });

  const updated_by = req.user.id;

  // Extract values for duplicate check (use existing values if not being updated)
  const l_name = data.l_name;
  const f_name = data.f_name;
  const house_no = data.house_no;
  const street = data.street;

  // Only perform duplicate check if any of these fields are being updated
  if (l_name || f_name || house_no || street) {
    const checkSql = `
      SELECT COUNT(*) AS count 
      FROM households 
      WHERE (? IS NULL OR l_name = ?)
        AND (? IS NULL OR f_name = ?)
        AND (? IS NULL OR house_no = ?)
        AND (? IS NULL OR street = ?)
        AND household_id != ? 
    `;

    db.query(
      checkSql, 
      [l_name, l_name, f_name, f_name, house_no, house_no, street, street, household_id], 
      (err, results) => {
        if (err) {
          console.error("Duplicate check error:", err);
          return res.status(500).json({ message: "Database error during duplicate check" });
        }

        if (results[0].count > 0) {
          return res.status(409).json({
            message: "Another household with the same first name, last name, house number, and street already exists.",
          });
        }

        // If no duplicate, proceed with update
        performUpdate();
      }
    );
  } else {
    // No name/house_no/street change, skip duplicate check
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
    if (data.house_no) { fields.push("house_no = ?"); values.push(data.house_no); }
    if (data.street) { fields.push("street = ?"); values.push(data.street); }
    if (data.head_count) { fields.push("head_count = ?"); values.push(data.head_count); }

    fields.push("updated_by = ?"); 
    values.push(updated_by);

    if (fields.length === 1) 
      return res.status(400).json({ message: "No fields to update" });
    
    const sql = `UPDATE households SET ${fields.join(", ")} WHERE household_id = ?`;
    values.push(household_id);

    db.query(sql, values, (err, results) => {
      if (err) return res.status(500).json({ message: "Update failed", error: err.message });
      if (results.affectedRows === 0) return res.status(404).json({ message: "Household not found" });
      res.json({ message: "Household updated successfully" });
    });
  }
};

module.exports = { updateHousehold };



