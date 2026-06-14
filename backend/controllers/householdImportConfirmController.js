// controllers/householdImportConfirmController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const confirmImportHouseholds = (req, res) => {
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
        INSERT INTO households (
          f_name, m_name, l_name, suffix,
          house_no, street, head_count, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          row.f_name,
          row.m_name || null,
          row.l_name,
          row.suffix || null,
          row.house_no,
          row.street,
          row.head_count,
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

            // ✅ inside else block, inside callback
            logActivity({
              entity_type:  "Household",
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
        UPDATE households SET
          f_name = ?, m_name = ?, l_name = ?, suffix = ?,
          house_no = ?, street = ?, head_count = ?,
          updated_by = ?
        WHERE household_id = ?
      `;

      db.query(
        updateSql,
        [
          row.f_name,
          row.m_name || null,
          row.l_name,
          row.suffix || null,
          row.house_no,
          row.street,
          row.head_count,
          created_by,
          row.existing_id,
        ],
        // ✅ inside else block, inside callback
        (err) => {
          if (err) {
            errorRows.push({
              name: `${row.f_name} ${row.l_name}`,
              reason: "Update failed: " + err.message,
            });
          } else {
            updated++;

            logActivity({
              entity_type:  "Household",
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

module.exports = { confirmImportHouseholds };