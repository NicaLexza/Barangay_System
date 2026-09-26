// controllers/eligibilityRankController.js
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { normalizeCriteria, describeCriteria } = require("../utils/eligibilityPool");
const {
  normalizePriorityConfig,
  describePriorityConfig,
  buildRanking,
  generateSeed,
  factorsForUnit,
} = require("../utils/eligibilityScoring");

const UNITS = ["Resident", "Household"];

const isValidISODate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

// Same re-auth pattern as databaseBackupController.js / eligibilityFormArchiveController.js.
const verifyAdminCredentials = (req) => {
  return new Promise((resolve, reject) => {
    if (req.user.role !== "Admin") {
      return reject({ status: 403, message: "Only admins can finalize a ranked selection." });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return reject({ status: 400, message: "Username and password are required." });
    }

    const fetchSql = "SELECT * FROM users WHERE username = ? AND user_id = ?";
    db.query(fetchSql, [username, req.user.id], async (err, results) => {
      if (err) return reject({ status: 500, message: "Database error" });
      if (results.length === 0) return reject({ status: 401, message: "Invalid credentials." });

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return reject({ status: 401, message: "Invalid credentials." });
      if (user.status !== "Active") return reject({ status: 403, message: "Account is inactive." });

      resolve(user);
    });
  });
};

function rollback(connection, res, message, status = 500) {
  connection.rollback(() => {
    connection.release();
    res.status(status).json({ message });
  });
}

/** Shared input parsing for all three endpoints below. Returns { unit, criteria, priorityConfig, quantity } or writes an error response and returns null. */
const parseRankingInput = (req, res) => {
  const { distribution_unit, criteria: rawCriteria, priority_config: rawPriorityConfig, target_quantity } = req.body;

  if (!UNITS.includes(distribution_unit)) {
    res.status(400).json({ message: "Distribution unit must be 'Resident' or 'Household'." });
    return null;
  }

  const parsedCriteria = normalizeCriteria(rawCriteria);
  if (parsedCriteria.error) {
    res.status(400).json({ message: parsedCriteria.error });
    return null;
  }

  const parsedPriority = normalizePriorityConfig(rawPriorityConfig, distribution_unit);
  if (parsedPriority.error) {
    res.status(400).json({ message: parsedPriority.error });
    return null;
  }

  const quantity = Number(target_quantity);
  if (!target_quantity || !Number.isInteger(quantity) || quantity < 1) {
    res.status(400).json({ message: "Target quantity must be a whole number of at least 1." });
    return null;
  }

  return { unit: distribution_unit, criteria: parsedCriteria.criteria, priorityConfig: parsedPriority.config, quantity };
};

/**
 * POST /api/eligibility-forms/rank-preview
 * Read-only. Any authenticated role. Never breaks ties (no seed) — a tie
 * spanning the cutoff comes back flagged in `tie.needsDraw` so the wizard
 * can prompt for a draw before allowing creation.
 */
const rankPreview = (req, res) => {
  const parsed = parseRankingInput(req, res);
  if (!parsed) return;

  buildRanking({ ...parsed, targetQuantity: parsed.quantity, seed: null }, (err, result) => {
    if (err) {
      console.error("[rankPreview] Failed to build ranking:", err.message);
      return res.status(500).json({ message: "Failed to build the ranking." });
    }

    res.status(200).json({
      distribution_unit: parsed.unit,
      criteria_description: describeCriteria(parsed.criteria, parsed.unit),
      priority_description: describePriorityConfig(parsed.priorityConfig, parsed.unit),
      target_quantity: parsed.quantity,
      ...result,
    });
  });
};

/**
 * POST /api/eligibility-forms/rank-draw
 * Any authenticated role — the draw is transparent record-keeping (a
 * verifiable seed), not the sensitive step. Generates a fresh seed and
 * returns the ranking resolved with it. Finalizing still requires Admin
 * re-auth at /create-ranked.
 */
const rankDraw = (req, res) => {
  const parsed = parseRankingInput(req, res);
  if (!parsed) return;

  const seed = generateSeed();

  buildRanking({ ...parsed, targetQuantity: parsed.quantity, seed }, (err, result) => {
    if (err) {
      console.error("[rankDraw] Failed to build ranking:", err.message);
      return res.status(500).json({ message: "Failed to draw." });
    }

    res.status(200).json({
      seed,
      distribution_unit: parsed.unit,
      criteria_description: describeCriteria(parsed.criteria, parsed.unit),
      priority_description: describePriorityConfig(parsed.priorityConfig, parsed.unit),
      target_quantity: parsed.quantity,
      ...result,
    });
  });
};

/**
 * POST /api/eligibility-forms/create-ranked
 * Admin + re-auth (username/password in body, independently re-verified —
 * see verifyAdminCredentials). Only for forms where the pool is LARGER than
 * the target quantity; a form that fits everyone should go through the
 * plain /create endpoint instead.
 *
 * The server recomputes the full ranking itself from unit/criteria/
 * priority_config/seed — nothing about WHO is selected is trusted from the
 * client, same principle as the plain /create endpoint.
 */
const createRankedForm = async (req, res) => {
  let admin;
  try {
    admin = await verifyAdminCredentials(req);
  } catch (e) {
    return res.status(e.status).json({ message: e.message });
  }

  const {
    form_name,
    source_details,
    distribution_details,
    start_date,
    end_date,
    seed,
    expected_pool_size,
  } = req.body;

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
  if (!isValidISODate(start_date) || !isValidISODate(end_date)) {
    return res.status(400).json({ message: "Start date and end date are required (YYYY-MM-DD)" });
  }
  if (end_date < start_date) {
    return res.status(400).json({ message: "End date cannot be before start date" });
  }
  if (seed !== undefined && seed !== null && typeof seed !== "string") {
    return res.status(400).json({ message: "Invalid seed." });
  }

  const parsed = parseRankingInput(req, res);
  if (!parsed) return;
  const { unit, criteria, priorityConfig, quantity } = parsed;

  buildRanking({ unit, criteria, priorityConfig, targetQuantity: quantity, seed: seed || null }, (rankErr, result) => {
    if (rankErr) {
      console.error("[createRankedForm] Failed to build ranking:", rankErr.message);
      return res.status(500).json({ message: "Failed to build the ranking." });
    }

    const { pool_size: poolSize, ranked, tie, warnings } = result;

    if (poolSize === 0) {
      return res.status(400).json({
        code: "EMPTY_POOL",
        message: "No residents match these criteria, so there is nobody to add to the form.",
      });
    }

    if (poolSize <= quantity) {
      return res.status(400).json({
        code: "NO_SELECTION_NEEDED",
        message: `${poolSize} qualify, which fits within the target quantity of ${quantity}. Use the standard create endpoint instead — no ranking is needed.`,
        pool_size: poolSize,
      });
    }

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

    if (tie && tie.needsDraw) {
      return res.status(409).json({
        code: "TIE_UNRESOLVED",
        message: `${tie.tiedCount} candidates are tied at the cutoff for ${tie.slotsAtStake} remaining slot(s). Draw lots to decide the order before creating the form.`,
        tie,
      });
    }

    const finalPriorityConfig = { ...priorityConfig, seed: seed || null };

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
             criteria_snapshot, priority_config, pool_size, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Prioritized', ?, ?, ?, ?, NOW())
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
            unit,
            JSON.stringify(criteria),
            JSON.stringify(finalPriorityConfig),
            poolSize,
            admin.user_id,
          ],
          (formErr, formResult) => {
            if (formErr) {
              console.error("[createRankedForm] Insert form failed:", formErr.message);
              return rollback(connection, res, "Failed to create the eligibility form.");
            }

            const formId = formResult.insertId;
            const entries = ranked.map((c) => [
              formId,
              c.resident_id,
              c.status, // 'Selected' | 'Waitlisted'
              c.score,
              c.rank_no,
              JSON.stringify(c.breakdown),
            ]);

            connection.query(
              `INSERT INTO eligibility_forms_entries
                 (form_id, resident_id, selection_status, priority_score, rank_no, score_breakdown)
               VALUES ?`,
              [entries],
              (entriesErr) => {
                if (entriesErr) {
                  console.error("[createRankedForm] Insert entries failed:", entriesErr.message);
                  return rollback(connection, res, "Failed to add the recipients to the form.");
                }

                connection.commit((commitErr) => {
                  if (commitErr) {
                    console.error("[createRankedForm] Commit failed:", commitErr.message);
                    return rollback(connection, res, "Transaction commit failed");
                  }
                  connection.release();

                  const selectedCount = ranked.filter((c) => c.status === "Selected").length;
                  const waitlistedCount = ranked.length - selectedCount;

                  res.status(201).json({
                    message: `Eligibility form created: ${selectedCount} selected, ${waitlistedCount} waitlisted`,
                    form_id: formId,
                    pool_size: poolSize,
                    selected_count: selectedCount,
                    waitlisted_count: waitlistedCount,
                    distribution_unit: unit,
                    warnings,
                  });

                  logActivity({
                    entity_type: "Eligibility Form",
                    entity_id: formId,
                    entity_name: form_name.trim(),
                    action_type: "created",
                    performed_by: admin.user_id,
                    details:
                      `${unit === "Household" ? "Per household" : "Per resident"} · Ranked selection · ` +
                      `${selectedCount} selected of ${poolSize} in pool · target ${quantity} · ` +
                      `${describeCriteria(criteria, unit)} · ${describePriorityConfig(priorityConfig, unit)}` +
                      (seed ? ` · tie-break seed ${seed}` : ""),
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
 * GET /api/eligibility-forms/priority-factors?unit=Household|Resident
 * Read-only, any authenticated role. Tells the wizard which priority
 * factors apply to this distribution unit, their defaults, and their caps
 * — so the Selection step can render toggles/weight fields without the
 * factor catalogue being hardcoded on the frontend too.
 */
const getPriorityFactorsList = (req, res) => {
  const unit = req.query.unit;
  if (!UNITS.includes(unit)) {
    return res.status(400).json({ message: "Query param 'unit' must be 'Resident' or 'Household'." });
  }

  const factors = factorsForUnit(unit).map((f) => ({
    id: f.id,
    label: f.label,
    defaultEnabled: f.defaultEnabled,
    defaultWeight: f.defaultWeight,
    cap: f.cap[unit],
    hasLookback: !!f.hasLookback,
  }));

  res.status(200).json({ distribution_unit: unit, factors });
};

module.exports = { rankPreview, rankDraw, createRankedForm, getPriorityFactorsList };