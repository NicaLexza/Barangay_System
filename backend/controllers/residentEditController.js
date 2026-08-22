//residentEditController.js

const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

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
    // 1. Fetch old data to compute diffs
    db.query("SELECT * FROM residents WHERE resident_id = ?", [resident_id], (err, oldResults) => {
      if (err) return res.status(500).json({ message: "Database error fetching old data" });
      if (oldResults.length === 0) return res.status(404).json({ message: "Resident not found" });
      
      const oldData = oldResults[0];

      // 2. Build dynamic SET
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
      if (data.is_household_head !== undefined) {
        fields.push("is_household_head = ?");
        values.push(data.is_household_head ? 1 : 0);
        // If toggling head OFF, clear the member count
        fields.push("household_member_count = ?");
        values.push(data.is_household_head ? (data.household_member_count || 1) : null);
      } else if (data.household_member_count !== undefined) {
        // Head status unchanged but count was updated
        fields.push("household_member_count = ?");
        values.push(data.household_member_count || null);
      }

      fields.push("updated_by = ?");
      values.push(updated_by);

      if (fields.length === 1) return res.status(400).json({ message: "No fields to update" });

      // 3. Compute Changes (Diffs)
      const changes = [];
      const fieldLabels = {
        f_name: "First Name", m_name: "Middle Name", l_name: "Last Name", suffix: "Suffix",
        sex: "Sex", birthdate: "Birthdate", birthplace: "Birthplace", house_no: "House No.",
        street: "Street", civil_status: "Civil Status", occupation: "Occupation", citizenship: "Citizenship",
        is_pwd: "PWD", is_senior: "Senior Citizen", is_solop: "Solo Parent",
        is_household_head: "Household Head", household_member_count: "Member Count"
      };

      const formatBool = (val) => val ? "Yes" : "No";
      const formatDate = (val) => {
        if (!val) return "";
        const d = new Date(val);
        return isNaN(d) ? val : d.toISOString().split('T')[0];
      };

      const compareAndPush = (key, newVal, formatter = (v) => v) => {
        if (newVal === undefined) return;
        const oldVal = oldData[key];
        
        let formattedOld = formatter(oldVal);
        let formattedNew = formatter(newVal);
        
        if (formattedOld === null) formattedOld = "";
        if (formattedNew === null) formattedNew = "";
        
        if (key === 'birthdate' && oldVal) {
             formattedOld = formatDate(oldVal);
        }

        if (String(formattedOld) !== String(formattedNew)) {
          changes.push({
            field: fieldLabels[key] || key,
            from: String(formattedOld),
            to: String(formattedNew)
          });
        }
      };

      if (data.f_name !== undefined) compareAndPush("f_name", data.f_name);
      if (data.m_name !== undefined) compareAndPush("m_name", data.m_name || null);
      if (data.l_name !== undefined) compareAndPush("l_name", data.l_name);
      if (data.suffix !== undefined) compareAndPush("suffix", data.suffix || null);
      if (data.sex !== undefined) compareAndPush("sex", data.sex);
      if (data.birthdate !== undefined) compareAndPush("birthdate", data.birthdate);
      if (data.birthplace !== undefined) compareAndPush("birthplace", data.birthplace);
      if (data.house_no !== undefined) compareAndPush("house_no", data.house_no || null);
      if (data.street !== undefined) compareAndPush("street", data.street);
      if (data.civil_status !== undefined) compareAndPush("civil_status", data.civil_status);
      if (data.occupation !== undefined) compareAndPush("occupation", data.occupation || null);
      if (data.citizenship !== undefined) compareAndPush("citizenship", data.citizenship || "Filipino");
      if (data.is_pwd !== undefined) compareAndPush("is_pwd", data.is_pwd ? 1 : 0, formatBool);
      if (data.is_senior !== undefined) compareAndPush("is_senior", data.is_senior ? 1 : 0, formatBool);
      if (data.is_solop !== undefined) compareAndPush("is_solop", data.is_solop ? 1 : 0, formatBool);
      if (data.is_household_head !== undefined) {
        compareAndPush("is_household_head", data.is_household_head ? 1 : 0, formatBool);
        compareAndPush("household_member_count", data.is_household_head ? (data.household_member_count || 1) : null);
      } else if (data.household_member_count !== undefined) {
        compareAndPush("household_member_count", data.household_member_count || null);
      }

      const sql = `UPDATE residents SET ${fields.join(", ")} WHERE resident_id = ?`;
      values.push(resident_id);

      db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ message: "Update failed", error: err.message });
        
        res.json({ message: "Resident updated successfully" });

        logActivity({
          entity_type:  "Resident",
          entity_id:    resident_id,
          entity_name:  `${data.f_name || oldData.f_name} ${data.l_name || oldData.l_name}`.trim(),
          action_type:  "updated",
          performed_by: updated_by,
          changes: changes.length > 0 ? changes : null
        });
      });
    });
  }
};

module.exports = { updateResident };