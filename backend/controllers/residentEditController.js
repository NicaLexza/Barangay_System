// residentEditController.js

const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { computeIsSenior } = require("../utils/seniorStatus");

/**
 * PUT /api/residents/update
 *
 * Editing rules depend on whether the resident is a head or member:
 *
 * - **Head**: address fields editable as normal. Updating a head's address
 *   propagates instantly to all members via JOIN (no sync step).
 *
 * - **Member**: no address fields editable directly (address comes from
 *   head). Supports a **"Remove from household"** action via
 *   `remove_from_household = true` — clears head_resident_id, sets
 *   is_household_head = 1, requires `house_no` + `street` in the same
 *   request (the member becomes head of a new household-of-one).
 */
const updateResident = (req, res) => {
  const { resident_id, remove_from_household, ...data } = req.body;

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
      const isMember = !oldData.is_household_head;

      // ── "Remove from household" action ──────────────────────────
      // Member becomes an independent head-of-one. Requires address.
      if (remove_from_household) {
        if (!isMember) {
          return res.status(400).json({ message: "Only household members can be removed from a household" });
        }
        if (!data.street) {
          return res.status(400).json({ message: "Street is required when removing a member from their household" });
        }

        const removeSql = `
          UPDATE residents
          SET is_household_head = 1,
              head_resident_id = NULL,
              house_no = ?,
              street = ?,
              updated_by = ?
          WHERE resident_id = ?
        `;

        db.query(removeSql, [data.house_no || null, data.street, updated_by, resident_id], (err2) => {
          if (err2) {
            console.error("Remove from household error:", err2);
            return res.status(500).json({ message: "Failed to remove from household", error: err2.message });
          }

          res.json({ message: "Resident removed from household and is now an independent head" });

          logActivity({
            entity_type:  "Resident",
            entity_id:    resident_id,
            entity_name:  `${oldData.f_name} ${oldData.l_name}`.trim(),
            action_type:  "removed_from_household",
            performed_by: updated_by,
          });
        });

        return; // Early exit — no further update logic
      }

      // ── Standard update ─────────────────────────────────────────
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

      // Address fields: only heads can edit these.
      // Members silently ignore address fields — their address comes from
      // their head and is never stored on their own row.
      if (!isMember) {
        if (data.house_no !== undefined) { fields.push("house_no = ?"); values.push(data.house_no || null); }
        if (data.street) { fields.push("street = ?"); values.push(data.street); }
      }

      if (data.civil_status) { fields.push("civil_status = ?"); values.push(data.civil_status); }
      if (data.occupation !== undefined) { fields.push("occupation = ?"); values.push(data.occupation || null); }
      if (data.citizenship !== undefined) { fields.push("citizenship = ?"); values.push(data.citizenship || "Filipino"); }
      if (data.is_pwd !== undefined) { fields.push("is_pwd = ?"); values.push(data.is_pwd ? 1 : 0); }
      if (data.is_solop !== undefined) { fields.push("is_solop = ?"); values.push(data.is_solop ? 1 : 0); }

      // `is_senior` is NEVER taken from `data` (the client no longer sends
      // it, and even if it did it would be ignored) — it is always
      // recomputed from whichever birthdate is now in effect, so editing a
      // birthdate automatically corrects the senior flag instead of
      // leaving it stale.
      const effectiveBirthdate = data.birthdate || oldData.birthdate;
      const newIsSenior = computeIsSenior(effectiveBirthdate);
      fields.push("is_senior = ?");
      values.push(newIsSenior);

      fields.push("updated_by = ?");
      values.push(updated_by);

      if (fields.length === 2) return res.status(400).json({ message: "No fields to update" });
      // fields.length === 2 means only is_senior + updated_by were added (no real changes)

      // 3. Compute Changes (Diffs)
      const changes = [];
      const fieldLabels = {
        f_name: "First Name", m_name: "Middle Name", l_name: "Last Name", suffix: "Suffix",
        sex: "Sex", birthdate: "Birthdate", birthplace: "Birthplace", house_no: "House No.",
        street: "Street", civil_status: "Civil Status", occupation: "Occupation", citizenship: "Citizenship",
        is_pwd: "PWD", is_senior: "Senior Citizen", is_solop: "Solo Parent",
        is_household_head: "Household Head",
      };

      const formatBool = (val) => val ? "Yes" : "No";
      const formatDate = (val) => {
        if (!val) return "";
        const d = val instanceof Date ? val : new Date(val);
        if (isNaN(d.getTime())) return String(val);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
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
      // Address diffs only for heads
      if (!isMember) {
        if (data.house_no !== undefined) compareAndPush("house_no", data.house_no || null);
        if (data.street !== undefined) compareAndPush("street", data.street);
      }
      if (data.civil_status !== undefined) compareAndPush("civil_status", data.civil_status);
      if (data.occupation !== undefined) compareAndPush("occupation", data.occupation || null);
      if (data.citizenship !== undefined) compareAndPush("citizenship", data.citizenship || "Filipino");
      if (data.is_pwd !== undefined) compareAndPush("is_pwd", data.is_pwd ? 1 : 0, formatBool);
      if (data.is_solop !== undefined) compareAndPush("is_solop", data.is_solop ? 1 : 0, formatBool);
      // Log the senior flag flipping too — most often this will happen
      // silently as a side effect of a birthdate correction, which is
      // exactly the kind of change an admin reviewing activity history
      // should be able to see.
      compareAndPush("is_senior", newIsSenior, formatBool);

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