// controllers/residentImportConfirmController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const confirmImportResidents = (req, res) => {
  const { rows } = req.body;
  const created_by = req.user.id;

  if (!rows || rows.length === 0) {
    return res.status(400).json({ message: "No rows to process." });
  }

  const toProcess = rows.filter(
    (r) => r.enabled && (r.status === "green" || r.status === "yellow")
  );

  if (toProcess.length === 0) {
    return res.status(200).json({
      message: "No rows were selected for import.",
      imported: 0,
      updated: 0,
      errors: [],
    });
  }

  let imported = 0;
  let updated = 0;
  const errorRows = [];
  let processed = 0;

  const checkDone = () => {
    if (processed < toProcess.length) return;
    return res.status(200).json({
      message: "Import complete.",
      imported,
      updated,
      errors: errorRows,
    });
  };

  for (const row of toProcess) {
    if (row.status === "green") {
      const insertSql = `
        INSERT INTO residents (
          f_name, m_name, l_name, suffix, sex, birthdate, birthplace,
          house_no, street, civil_status, occupation, citizenship,
          is_pwd, is_senior, is_solop, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          row.f_name,
          row.m_name || null,
          row.l_name,
          row.suffix || null,
          row.sex,
          row.birthdate,
          row.birthplace,
          row.house_no || null,
          row.street,
          row.civil_status,
          row.occupation || null,
          row.citizenship || "Filipino",
          row.is_pwd ? 1 : 0,
          row.is_senior ? 1 : 0,
          row.is_solop ? 1 : 0,
          created_by,
        ],
        // ✅ renamed to (err, result) so insertId is accessible
        (err, result) => {
          if (err) {
            errorRows.push({
              name: `${row.f_name} ${row.l_name}`,
              reason: "Insert failed: " + err.message,
            });
          } else {
            imported++;

            // ✅ inside callback, after confirming success
            logActivity({
              entity_type:  "Resident",
              entity_id:    result.insertId,
              entity_name:  `${row.f_name} ${row.l_name}`,
              action_type:  "imported",
              performed_by: created_by,
            });
          }
          processed++;
          checkDone();
        }
      );

    } else if (row.status === "yellow") {
      const updateSql = `
        UPDATE residents SET
          f_name = ?, m_name = ?, l_name = ?, suffix = ?,
          sex = ?, birthplace = ?, house_no = ?, street = ?,
          civil_status = ?, occupation = ?, citizenship = ?,
          is_pwd = ?, is_senior = ?, is_solop = ?,
          updated_by = ?
        WHERE resident_id = ?
      `;

      db.query(
        updateSql,
        [
          row.f_name,
          row.m_name || null,
          row.l_name,
          row.suffix || null,
          row.sex,
          row.birthplace,
          row.house_no || null,
          row.street,
          row.civil_status,
          row.occupation || null,
          row.citizenship || "Filipino",
          row.is_pwd ? 1 : 0,
          row.is_senior ? 1 : 0,
          row.is_solop ? 1 : 0,
          created_by,
          row.existing_id,
        ],
        // ✅ inside callback, after confirming success
        (err) => {
          if (err) {
            errorRows.push({
              name: `${row.f_name} ${row.l_name}`,
              reason: "Update failed: " + err.message,
            });
          } else {
            updated++;

            // ✅ inside the else block so it only logs on success
            logActivity({
              entity_type:  "Resident",
              entity_id:    row.existing_id,
              entity_name:  `${row.f_name} ${row.l_name}`,
              action_type:  "updated",
              performed_by: created_by,
            });
          }
          processed++;
          checkDone();
        }
      );
    }
  }
};

module.exports = { confirmImportResidents };