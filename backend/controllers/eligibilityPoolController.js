// controllers/eligibilityPoolController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { normalizeCriteria, describeCriteria, buildPool } = require("../utils/eligibilityPool");

const UNITS = ["Resident", "Household"];

const isValidISODate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; // rejects 2026-02-31
};

/** Helper: rolls back the transaction and sends an error. */
function rollback(connection, res, message, status = 500) {
  connection.rollback(() => {
    connection.release();
    res.status(status).json({ message });
  });
}

/**
 * POST /api/eligibility-forms/pool-preview
 * Body: { distribution_unit, criteria, target_quantity? }
 *
 * Read-only. Returns the pool for the wizard's live "Pool vs Supply" banner
 * and its review step. Nothing is written.
 */
const previewPool = (req, res) => {
  const { distribution_unit, criteria: rawCriteria, target_quantity } = req.body;

  if (!UNITS.includes(distribution_unit)) {
    return res.status(400).json({ message: "Distribution unit must be 'Resident' or 'Household'." });
  }

  const parsed = normalizeCriteria(rawCriteria);
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  buildPool(distribution_unit, parsed.criteria, (err, pool) => {
    if (err) {
      console.error("[previewPool] Failed to build pool:", err.message);
      return res.status(500).json({ message: "Failed to build the pool." });
    }

    const poolSize = pool.candidates.length;
    const response = {
      distribution_unit,
      criteria: parsed.criteria,
      criteria_description: describeCriteria(parsed.criteria, distribution_unit),
      pool_size: poolSize,
      candidates: pool.candidates,
      warnings: pool.warnings,
    };

    // Optional supply comparison, so the frontend doesn't re-implement it.
    const qty = Number(target_quantity);
    if (target_quantity !== undefined && target_quantity !== null && target_quantity !== "" && Number.isInteger(qty) && qty >= 1) {
      response.supply = {
        target_quantity: qty,
        enough: poolSize <= qty,
        shortfall: Math.max(0, poolSize - qty),
        surplus: Math.max(0, qty - poolSize),
      };
    }

    res.status(200).json(response);
  });
};

/**
 * POST /api/eligibility-forms/create
 * Body: { form_name, source_details, distribution_details, target_quantity,
 *         start_date, end_date, distribution_unit, criteria,
 *         expected_pool_size? }
 *
 * Unlike the old POST /, this NEVER accepts resident ids from the client:
 * the server rebuilds the pool from the criteria itself. The form and all
 * its entries are written in one transaction.
 *
 * For now only "All Eligible" forms can be created, so a pool larger than
 * the target quantity is rejected (ranked selection comes later).
 */
const createFormFromPool = (req, res) => {
  const {
    form_name,
    source_details,
    distribution_details,
    target_quantity,
    start_date,
    end_date,
    distribution_unit,
    criteria: rawCriteria,
    expected_pool_size,
  } = req.body;
  const created_by = req.user.id;

  // ── Field validation (same rules as the old create endpoint) ──────────
  if (typeof form_name !== "string" || !form_name.trim()) {
    return res.status(400).json({ message: "Form name is required" });
  }
  if (form_name.trim().length > 150) {
    return res.status(400).json({ message: "Form name must be 150 characters or fewer" });
  }
  if (typeof source_details !== "string" || !source_details.trim()) {
    return res.status(400).json({ message: "Source details (where/who it came from) are required" });
  }
  if (typeof distribution_details !== "string" || !distribution_details.trim()) {
    return res.status(400).json({ message: "Distribution details (what is being distributed) are required" });
  }
  const quantity = Number(target_quantity);
  if (!target_quantity || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: "Target quantity must be a whole number of at least 1" });
  }
  if (!isValidISODate(start_date) || !isValidISODate(end_date)) {
    return res.status(400).json({ message: "Start date and end date are required (YYYY-MM-DD)" });
  }
  if (end_date < start_date) {
    return res.status(400).json({ message: "End date cannot be before start date" });
  }
  if (!UNITS.includes(distribution_unit)) {
    return res.status(400).json({ message: "Distribution unit must be 'Resident' or 'Household'." });
  }

  const parsed = normalizeCriteria(rawCriteria);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const criteria = parsed.criteria;

  // ── Build the pool on the server ──────────────────────────────────────
  buildPool(distribution_unit, criteria, (poolErr, pool) => {
    if (poolErr) {
      console.error("[createFormFromPool] Failed to build pool:", poolErr.message);
      return res.status(500).json({ message: "Failed to build the pool." });
    }

    const poolSize = pool.candidates.length;

    if (poolSize === 0) {
      return res.status(400).json({
        code: "EMPTY_POOL",
        message: "No residents match these criteria, so there is nobody to add to the form.",
      });
    }

    // Guards against the roster changing between "review" and "create".
    if (
      expected_pool_size !== undefined &&
      expected_pool_size !== null &&
      Number(expected_pool_size) !== poolSize
    ) {
      return res.status(409).json({
        code: "POOL_CHANGED",
        message: `The pool changed while you were reviewing it (was ${expected_pool_size}, now ${poolSize}). Please review it again.`,
        pool_size: poolSize,
      });
    }

    if (poolSize > quantity) {
      return res.status(400).json({
        code: "POOL_EXCEEDS_SUPPLY",
        message: `${poolSize} qualify but the target quantity is only ${quantity}. Raise the quantity or narrow the criteria (ranked selection is not available yet).`,
        pool_size: poolSize,
        target_quantity: quantity,
      });
    }

    // ── One transaction: form + all entries ─────────────────────────────
    db.getConnection((connErr, connection) => {
      if (connErr) return res.status(500).json({ message: "Database connection error" });

      connection.beginTransaction((txErr) => {
        if (txErr) {
          connection.release();
          return res.status(500).json({ message: "Transaction start failed" });
        }

        const insertFormSql = `
          INSERT INTO eligibility_forms
            (form_name, source_details, distribution_details, target_quantity,
             start_date, end_date, distribution_unit, list_type,
             criteria_snapshot, pool_size, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'All Eligible', ?, ?, ?, NOW())
        `;

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
            JSON.stringify(criteria),
            poolSize,
            created_by,
          ],
          (formErr, formResult) => {
            if (formErr) {
              console.error("[createFormFromPool] Insert form failed:", formErr.message);
              return rollback(connection, res, "Failed to create the eligibility form.");
            }

            const formId = formResult.insertId;
            const entries = pool.candidates.map((c) => [formId, c.resident_id, "Selected"]);

            connection.query(
              "INSERT INTO eligibility_forms_entries (form_id, resident_id, selection_status) VALUES ?",
              [entries],
              (entriesErr) => {
                if (entriesErr) {
                  console.error("[createFormFromPool] Insert entries failed:", entriesErr.message);
                  return rollback(connection, res, "Failed to add the recipients to the form.");
                }

                connection.commit((commitErr) => {
                  if (commitErr) {
                    console.error("[createFormFromPool] Commit failed:", commitErr.message);
                    return rollback(connection, res, "Transaction commit failed");
                  }
                  connection.release();

                  res.status(201).json({
                    message: `Eligibility form created with ${poolSize} ${
                      distribution_unit === "Household" ? "household(s)" : "resident(s)"
                    }`,
                    form_id: formId,
                    pool_size: poolSize,
                    distribution_unit,
                    warnings: pool.warnings,
                  });

                  // Plain-text details => shows up in the Audit Logs "View details" popup.
                  logActivity({
                    entity_type: "Eligibility Form",
                    entity_id: formId,
                    entity_name: form_name.trim(),
                    action_type: "created",
                    performed_by: created_by,
                    details:
                      `${distribution_unit === "Household" ? "Per household" : "Per resident"} · ` +
                      `${poolSize} in pool · target ${quantity} · ${describeCriteria(criteria, distribution_unit)}`,
                  });
                });
              }
            );
          }
        );
      });
    });
  });
};

/**
 * GET /api/eligibility-forms/pool-options
 * Distinct streets of active household heads, for the wizard's street picker.
 * (Members have no street of their own; theirs comes from their head.)
 */
const getPoolOptions = (req, res) => {
  const sql = `
    SELECT DISTINCT TRIM(street) AS street
    FROM residents
    WHERE is_archived = 0
      AND is_household_head = 1
      AND street IS NOT NULL
      AND TRIM(street) <> ''
    ORDER BY street ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("[getPoolOptions] Failed to load streets:", err.message);
      return res.status(500).json({ message: "Failed to load street options." });
    }
    res.status(200).json({ streets: rows.map((r) => r.street) });
  });
};

module.exports = { previewPool, createFormFromPool, getPoolOptions };