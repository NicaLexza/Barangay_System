// controllers/residentAddController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { computeIsSenior } = require("../utils/seniorStatus");

/**
 * POST /api/residents/add
 *
 * Two request shapes, decided by the presence of `head_resident_id`:
 *
 * 1. **New Household** (head_resident_id absent/null)
 *    Full form: name, birthdate, address, etc. → becomes a head
 *    (is_household_head = 1, head_resident_id = NULL).
 *
 * 2. **Add Member** (head_resident_id present)
 *    Requires `head_resident_id` referencing an existing, non-archived head.
 *    No address fields accepted — address is resolved live via JOIN to head.
 *    Sets is_household_head = 0.
 */
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
    is_solop = 0,
    head_resident_id = null,
  } = req.body;

  // NOTE: `is_senior` is intentionally NOT read from req.body. It is always
  // derived from `birthdate` below — see utils/seniorStatus.js — so it can
  // never drift out of sync with the resident's actual age, the way a
  // manually-checked box could.

  const isMember = !!head_resident_id;

  // --- Validation ---
  // Common required fields (both head and member)
  if (!f_name || !l_name || !sex || !birthdate || !birthplace || !civil_status) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  // Head-specific: address is required
  if (!isMember && !street) {
    return res.status(400).json({ message: "Street is required for a new household head" });
  }

  // Member-specific: address fields must NOT be supplied (they live at head's address)
  // We silently ignore them rather than erroring, to be lenient.

  const created_by = req.user.id;
  const is_senior = computeIsSenior(birthdate);

  // If adding a member, first verify the head exists and is valid
  if (isMember) {
    const headCheckSql = `
      SELECT resident_id, is_household_head, is_archived
      FROM residents
      WHERE resident_id = ?
    `;

    db.query(headCheckSql, [head_resident_id], (err, headResults) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });

      if (headResults.length === 0) {
        return res.status(404).json({ message: "Household head not found" });
      }
      if (headResults[0].is_archived) {
        return res.status(400).json({ message: "Cannot add member to an archived household head" });
      }
      if (!headResults[0].is_household_head) {
        return res.status(400).json({ message: "The specified resident is not a household head" });
      }

      // Head is valid — proceed with duplicate check + insert
      checkDuplicateAndInsert();
    });
  } else {
    // New head — proceed directly with duplicate check + insert
    checkDuplicateAndInsert();
  }

  function checkDuplicateAndInsert() {
    const checkSql = `
      SELECT COUNT(*) AS count 
      FROM residents 
      WHERE l_name = ? AND f_name = ? AND birthdate = ?
    `;

    db.query(checkSql, [l_name, f_name, birthdate], (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });

      if (results[0].count > 0) {
        return res.status(409).json({ message: "Resident already exists." });
      }

      const sql = `
        INSERT INTO residents (
          f_name, m_name, l_name, suffix, sex, birthdate, birthplace,
          house_no, street, civil_status, occupation, citizenship,
          is_pwd, is_senior, is_solop,
          is_household_head, head_resident_id,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Members get NULL address — their address is always resolved from
      // their head via JOIN, never stored directly.
      const effectiveHouseNo = isMember ? null : (house_no || null);
      const effectiveStreet = isMember ? null : street;

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
          effectiveHouseNo,
          effectiveStreet,
          civil_status,
          occupation || null,
          citizenship || "Filipino",
          is_pwd ? 1 : 0,
          is_senior,
          is_solop ? 1 : 0,
          isMember ? 0 : 1,              // is_household_head
          isMember ? head_resident_id : null, // head_resident_id
          created_by,
        ],
        (err, result) => {
          if (err) {
            console.error("Add resident error:", err);
            return res.status(500).json({ message: "Failed to add resident", error: err.message });
          }

          res.status(201).json({
            message: isMember
              ? "Household member added successfully"
              : "Resident added successfully",
            resident_id: result.insertId,
          });

          logActivity({
            entity_type:  "Resident",
            entity_id:    result.insertId,
            entity_name:  `${f_name} ${l_name}`,
            action_type:  isMember ? "member_added" : "added",
            performed_by: created_by,
          });
        }
      );
    });
  }
};

module.exports = { addResident };