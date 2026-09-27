// controllers/eligibilityProvidedController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const UNITS = ["Resident", "Household"];

const isValidISODate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

function rollback(connection, res, message, status = 500) {
  connection.rollback(() => {
    connection.release();
    res.status(status).json({ message });
  });
}

/**
 * POST /api/eligibility-forms/create-provided
 *
 * Case 3 — Pre-provided list from an outside agency (e.g., DSWD, City Hall).
 * Staff manually selects eligible residents/households matching the hard-copy list.
 *
 * Body:
 *  - form_name, source_details, distribution_details, target_quantity,
 *    start_date, end_date, distribution_unit
 *  - resident_ids: number[] (unique list of selected active resident IDs)
 */
const createProvidedForm = (req, res) => {
  const {
    form_name,
    source_details,
    distribution_details,
    target_quantity,
    start_date,
    end_date,
    distribution_unit,
    resident_ids,
  } = req.body;

  const created_by = req.user?.id;

  if (
    !form_name?.trim() ||
    !source_details?.trim() ||
    !distribution_details?.trim() ||
    !target_quantity ||
    !start_date ||
    !end_date ||
    !distribution_unit
  ) {
    return res.status(400).json({ message: "All required form fields must be provided." });
  }

  const quantity = Number(target_quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: "Target quantity must be an integer of at least 1." });
  }

  if (!isValidISODate(start_date) || !isValidISODate(end_date)) {
    return res.status(400).json({ message: "Start and end dates must be valid YYYY-MM-DD strings." });
  }
  if (start_date > end_date) {
    return res.status(400).json({ message: "Start date cannot be after end date." });
  }

  if (!UNITS.includes(distribution_unit)) {
    return res.status(400).json({ message: "Distribution unit must be 'Resident' or 'Household'." });
  }

  if (!Array.isArray(resident_ids) || resident_ids.length === 0) {
    return res.status(400).json({ message: "Please select at least one resident from the provided list." });
  }

  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(resident_ids.map(Number))).filter((id) => Number.isInteger(id) && id > 0);
  if (uniqueIds.length === 0) {
    return res.status(400).json({ message: "Invalid resident selection." });
  }

  if (uniqueIds.length > quantity) {
    return res.status(400).json({
      message: `You selected ${uniqueIds.length} recipients, which exceeds the target quantity of ${quantity}.`,
    });
  }

  // Verify all chosen residents exist, are active (not archived), and match the unit type
  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ message: "Database connection error." });

    const verifySql =
      distribution_unit === "Household"
        ? `SELECT resident_id, f_name, l_name FROM residents WHERE resident_id IN (?) AND is_archived = 0 AND is_household_head = 1`
        : `SELECT resident_id, f_name, l_name FROM residents WHERE resident_id IN (?) AND is_archived = 0`;

    connection.query(verifySql, [uniqueIds], (verifyErr, validRows) => {
      if (verifyErr) {
        connection.release();
        return res.status(500).json({ message: "Database error validating recipients." });
      }

      const validIdSet = new Set(validRows.map((r) => r.resident_id));
      const invalidIds = uniqueIds.filter((id) => !validIdSet.has(id));

      if (invalidIds.length > 0) {
        connection.release();
        return res.status(400).json({
          message: `${invalidIds.length} selected resident(s) are no longer active or are not eligible ${
            distribution_unit === "Household" ? "household heads" : "residents"
          }. Please refresh and re-select.`,
        });
      }

      // Begin transaction to create form + entries
      connection.beginTransaction((txErr) => {
        if (txErr) {
          connection.release();
          return res.status(500).json({ message: "Transaction start failed." });
        }

        const insertFormSql = `
          INSERT INTO eligibility_forms
            (form_name, source_details, distribution_details, target_quantity,
             start_date, end_date, distribution_unit, list_type,
             criteria_snapshot, pool_size, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Provided List', ?, ?, ?, NOW())
        `;

        const snapshotJson = JSON.stringify({
          mode: "provided_list",
          count: uniqueIds.length,
          note: "Manually entered from external agency provided list",
        });

        connection.query(
          insertFormSql,
          [
            form_name.trim(),
            source_details.trim(),
            distribution_details.trim(),
            quantity,
            start_date,
            end_date,
            distribution_unit,
            snapshotJson,
            uniqueIds.length,
            created_by,
          ],
          (formErr, formResult) => {
            if (formErr) {
              console.error("[createProvidedForm] Insert form error:", formErr.message);
              return rollback(connection, res, "Failed to create eligibility form.");
            }

            const formId = formResult.insertId;
            const entriesData = uniqueIds.map((rid) => [formId, rid, "Selected"]);

            const insertEntriesSql = `
              INSERT INTO eligibility_forms_entries (form_id, resident_id, selection_status)
              VALUES ?
            `;

            connection.query(insertEntriesSql, [entriesData], (entriesErr) => {
              if (entriesErr) {
                console.error("[createProvidedForm] Insert entries error:", entriesErr.message);
                return rollback(connection, res, "Failed to add selected recipients.");
              }

              connection.commit((commitErr) => {
                if (commitErr) {
                  return rollback(connection, res, "Transaction commit failed.");
                }
                connection.release();

                res.status(201).json({
                  message: `Eligibility form created with ${uniqueIds.length} ${
                    distribution_unit === "Household" ? "household(s)" : "resident(s)"
                  } from provided list.`,
                  form_id: formId,
                  pool_size: uniqueIds.length,
                  distribution_unit,
                });

                logActivity({
                  entity_type: "Eligibility Form",
                  entity_id: formId,
                  entity_name: form_name.trim(),
                  action_type: "created",
                  performed_by: created_by,
                  details:
                    `${distribution_unit === "Household" ? "Per household" : "Per resident"} · ` +
                    `Provided List (${uniqueIds.length} selected) · target ${quantity}`,
                });
              });
            });
          }
        );
      });
    });
  });
};

module.exports = { createProvidedForm };
