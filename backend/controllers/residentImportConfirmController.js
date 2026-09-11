// controllers/residentImportConfirmController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

// Same field labels/formatters as residentEditController.js so import-driven
// "updated" logs render identically in the ActivityRow "SHOW DETAILS" panel.
const fieldLabels = {
  f_name: "First Name", m_name: "Middle Name", l_name: "Last Name", suffix: "Suffix",
  sex: "Sex", birthplace: "Birthplace", house_no: "House No.",
  street: "Street", civil_status: "Civil Status", occupation: "Occupation", citizenship: "Citizenship",
  is_pwd: "PWD", is_senior: "Senior Citizen", is_solop: "Solo Parent",
  is_household_head: "Household Head", household_member_count: "Member Count",
};

const formatBool = (val) => (val ? "Yes" : "No");

// Builds the changes[] diff array for a yellow (update) import row by
// comparing the incoming row's values against the existing DB record.
// Only compares the fields the yellow-path UPDATE statement actually
// touches (birthdate is intentionally excluded — it's never updated here).
const buildChanges = (oldData, row) => {
  const changes = [];

  const compareAndPush = (key, newVal, formatter = (v) => v) => {
    const oldVal = oldData[key];
    let formattedOld = formatter(oldVal);
    let formattedNew = formatter(newVal);
    if (formattedOld === null || formattedOld === undefined) formattedOld = "";
    if (formattedNew === null || formattedNew === undefined) formattedNew = "";
    if (String(formattedOld) !== String(formattedNew)) {
      changes.push({
        field: fieldLabels[key] || key,
        from: String(formattedOld),
        to: String(formattedNew),
      });
    }
  };

  compareAndPush("f_name", row.f_name);
  compareAndPush("m_name", row.m_name || null);
  compareAndPush("l_name", row.l_name);
  compareAndPush("suffix", row.suffix || null);
  compareAndPush("sex", row.sex);
  compareAndPush("birthplace", row.birthplace);
  compareAndPush("house_no", row.house_no || null);
  compareAndPush("street", row.street);
  compareAndPush("civil_status", row.civil_status);
  compareAndPush("occupation", row.occupation || null);
  compareAndPush("citizenship", row.citizenship || "Filipino");
  compareAndPush("is_pwd", row.is_pwd ? 1 : 0, formatBool);
  compareAndPush("is_senior", row.is_senior ? 1 : 0, formatBool);
  compareAndPush("is_solop", row.is_solop ? 1 : 0, formatBool);
  compareAndPush("is_household_head", row.is_household_head ? 1 : 0, formatBool);
  compareAndPush("household_member_count", row.is_household_head ? (row.household_member_count || null) : null);

  return changes;
};

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
          is_pwd, is_senior, is_solop, is_household_head, household_member_count, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          row.is_household_head ? 1 : 0,
          row.household_member_count,
          created_by,
        ],
        (err, result) => {
          if (err) {
            errorRows.push({
              name: `${row.f_name} ${row.l_name}`,
              reason: "Insert failed: " + err.message,
            });
          } else {
            imported++;

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
      // Fetch the existing record first so we can diff it against the
      // incoming import row — mirrors residentEditController.js's flow,
      // so this update produces the same "changes" shape a manual edit does.
      db.query(
        "SELECT * FROM residents WHERE resident_id = ?",
        [row.existing_id],
        (fetchErr, oldResults) => {
          if (fetchErr || oldResults.length === 0) {
            errorRows.push({
              name: `${row.f_name} ${row.l_name}`,
              reason: fetchErr
                ? "Database error fetching existing record: " + fetchErr.message
                : "Existing record not found",
            });
            processed++;
            checkDone();
            return;
          }

          const oldData = oldResults[0];
          const changes = buildChanges(oldData, row);

          const updateSql = `
            UPDATE residents SET
              f_name = ?, m_name = ?, l_name = ?, suffix = ?,
              sex = ?, birthplace = ?, house_no = ?, street = ?,
              civil_status = ?, occupation = ?, citizenship = ?,
              is_pwd = ?, is_senior = ?, is_solop = ?,
              is_household_head = ?, household_member_count = ?,
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
              row.is_household_head ? 1 : 0,
              row.household_member_count,
              created_by,
              row.existing_id,
            ],
            (err) => {
              if (err) {
                errorRows.push({
                  name: `${row.f_name} ${row.l_name}`,
                  reason: "Update failed: " + err.message,
                });
              } else {
                updated++;

                logActivity({
                  entity_type:  "Resident",
                  entity_id:    row.existing_id,
                  entity_name:  `${row.f_name} ${row.l_name}`,
                  action_type:  "updated",
                  performed_by: created_by,
                  changes:      changes.length > 0 ? changes : null,
                });
              }
              processed++;
              checkDone();
            }
          );
        }
      );
    }
  }
};

module.exports = { confirmImportResidents };