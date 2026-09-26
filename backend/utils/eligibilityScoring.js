// utils/eligibilityScoring.js
//
// Turns a pool (from eligibilityPool.buildPool) into a RANKED list, used
// only when the pool is larger than the target quantity. Eligibility (who
// is in the pool) and priority (how the pool is ordered) are kept separate
// on purpose — see eligibilityPool.js's household rule for why.
//
// Every factor here reads from data ALREADY in the database (PWD/senior/
// solo-parent flags, age, occupation, past receipts). None of it measures
// need directly — it's the best available proxy, which is why every ranked
// form still allows an Admin override with a written reason.
const db = require("../config/db");
const crypto = require("crypto");
const { buildPool } = require("./eligibilityPool");

// ── Factor catalogue ────────────────────────────────────────────────────
// cap = the most "units" of this factor that can count, per unit type.
// E.g. pwd caps at 2 for a household (a 3rd PWD member adds no more points)
// but at 1 for a resident (a person is or isn't PWD).
const FACTOR_DEFS = [
  {
    id: "pwd",
    label: "PWD",
    appliesTo: ["Household", "Resident"],
    cap: { Household: 2, Resident: 1 },
    defaultEnabled: true,
    defaultWeight: 3,
  },
  {
    id: "senior",
    label: "Senior citizen",
    appliesTo: ["Household", "Resident"],
    cap: { Household: 2, Resident: 1 },
    defaultEnabled: true,
    defaultWeight: 3,
  },
  {
    id: "solop",
    label: "Solo parent",
    appliesTo: ["Household", "Resident"],
    cap: { Household: 2, Resident: 1 },
    defaultEnabled: true,
    defaultWeight: 3,
  },
  {
    id: "noWorkingAdult",
    label: "No working adult",
    appliesTo: ["Household", "Resident"],
    cap: { Household: 1, Resident: 1 },
    defaultEnabled: true,
    defaultWeight: 2,
  },
  {
    id: "largeHousehold",
    label: "Large household",
    appliesTo: ["Household"],
    cap: { Household: 4 },
    defaultEnabled: true,
    defaultWeight: 1,
  },
  {
    id: "children",
    label: "Children in household",
    appliesTo: ["Household"],
    cap: { Household: 4 },
    defaultEnabled: false,
    defaultWeight: 1,
  },
  {
    id: "notHelpedRecently",
    label: "Not helped recently",
    appliesTo: ["Household", "Resident"],
    cap: { Household: 1, Resident: 1 },
    defaultEnabled: true,
    defaultWeight: 2,
    hasLookback: true,
  },
];

const FACTORS_BY_ID = Object.fromEntries(FACTOR_DEFS.map((f) => [f.id, f]));
const DEFAULT_LOOKBACK_DAYS = 90;
const MIN_WEIGHT = 0;
const MAX_WEIGHT = 5;

const factorsForUnit = (unit) => FACTOR_DEFS.filter((f) => f.appliesTo.includes(unit));

// ── Config validation ───────────────────────────────────────────────────
/**
 * Cleans raw priority config from the client into the exact object that
 * gets applied AND saved as the form's priority_config (minus the seed,
 * which is attached separately once a draw happens — see the controller).
 *
 * Only factors that apply to this distribution unit are kept; an unknown
 * factor id or one that doesn't apply to this unit is rejected outright,
 * so a mismatched request can't silently score on the wrong basis.
 *
 * Returns { config } or { error: "message" }.
 */
const normalizePriorityConfig = (raw, unit) => {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const rawFactors = input.factors && typeof input.factors === "object" ? input.factors : {};
  const applicable = factorsForUnit(unit);
  const applicableIds = new Set(applicable.map((f) => f.id));

  const unknown = Object.keys(rawFactors).find((id) => !applicableIds.has(id));
  if (unknown !== undefined) {
    return {
      error: FACTORS_BY_ID[unknown]
        ? `"${unknown}" does not apply to this distribution unit.`
        : `Unknown factor: ${unknown}`,
    };
  }

  const factors = {};
  for (const def of applicable) {
    const r = rawFactors[def.id] || {};
    const enabled = r.enabled === undefined ? def.defaultEnabled : !!r.enabled;
    const weightRaw = r.weight === undefined ? def.defaultWeight : Number(r.weight);
    if (!Number.isInteger(weightRaw) || weightRaw < MIN_WEIGHT || weightRaw > MAX_WEIGHT) {
      return { error: `${def.label}'s weight must be a whole number from ${MIN_WEIGHT} to ${MAX_WEIGHT}.` };
    }
    factors[def.id] = { enabled, weight: weightRaw };
  }

  let lookbackDays = DEFAULT_LOOKBACK_DAYS;
  if (input.lookbackDays !== undefined && input.lookbackDays !== null && input.lookbackDays !== "") {
    const n = Number(input.lookbackDays);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      return { error: "Lookback period must be a whole number of days from 1 to 365." };
    }
    lookbackDays = n;
  }

  return { config: { factors, lookbackDays } };
};

/** Human-readable one-liner of the priority config (used in audit log / report). */
const describePriorityConfig = (config, unit) => {
  const applicable = factorsForUnit(unit);
  const parts = applicable
    .filter((def) => config.factors[def.id]?.enabled)
    .map((def) => {
      const w = config.factors[def.id].weight;
      return def.hasLookback ? `${def.label} (${config.lookbackDays}d) +${w}` : `${def.label} +${w}`;
    });
  return parts.length > 0 ? parts.join(" · ") : "No priority factors enabled (ranking is by tie-break only)";
};

// ── "Helped recently" lookup ────────────────────────────────────────────
/**
 * For the given resident ids, finds the most recent Received entry from a
 * PAST form of the SAME distribution unit — a household's history never
 * counts against a resident-unit form and vice versa (per design: an
 * individual's own aid, like school supplies, is never held against their
 * household, and a household's relief aid is never held against one member).
 *
 * Only entries with selection_status = 'Selected' AND is_rewarded = 1 count
 * — being picked but never collecting isn't "helped".
 *
 * Known limitation: this is keyed by resident_id, so if headship transfers,
 * the new head's own history starts blank even though the household
 * received aid before under the old head.
 *
 * Callback: (err, Map<resident_id, Date|null lastHelpedAt>)
 */
const fetchLastHelpedMap = (unit, residentIds, callback) => {
  if (residentIds.length === 0) return callback(null, new Map());

  const sql = `
    SELECT efe.resident_id, MAX(efe.processed_at) AS last_helped_at
    FROM eligibility_forms_entries efe
    JOIN eligibility_forms ef ON ef.form_id = efe.form_id
    WHERE efe.resident_id IN (?)
      AND efe.selection_status = 'Selected'
      AND efe.is_rewarded = 1
      AND ef.distribution_unit = ?
    GROUP BY efe.resident_id
  `;

  db.query(sql, [residentIds, unit], (err, rows) => {
    if (err) return callback(err);
    const map = new Map();
    rows.forEach((r) => map.set(r.resident_id, r.last_helped_at));
    callback(null, map);
  });
};

// ── Per-candidate scoring ───────────────────────────────────────────────
const isWorkingAdult = (person) => {
  if (person.age === null || person.age < 18 || person.age > 59) return false;
  const occ = (person.occupation || "").trim();
  if (!occ) return false;
  return !occ.toLowerCase().includes("student");
};

/** Raw (uncapped) count of "units" for one factor, before weight is applied. */
const rawUnitsFor = (factorId, unit, scoringCandidate, lastHelpedAt, lookbackDays, now) => {
  if (unit === "Household") {
    const members = scoringCandidate.members;
    switch (factorId) {
      case "pwd":
        return members.filter((m) => m.is_pwd).length;
      case "senior":
        return members.filter((m) => m.is_senior).length;
      case "solop":
        return members.filter((m) => m.is_solop).length;
      case "noWorkingAdult":
        return members.some(isWorkingAdult) ? 0 : 1;
      case "largeHousehold":
        return Math.max(scoringCandidate.household_size - 3, 0);
      case "children":
        return members.filter((m) => m.age !== null && m.age < 18).length;
      case "notHelpedRecently": {
        if (!lastHelpedAt) return 1;
        const days = (now - new Date(lastHelpedAt)) / 86400000;
        return days >= lookbackDays ? 1 : 0;
      }
      default:
        return 0;
    }
  }

  // Resident unit — the candidate IS the person.
  const p = scoringCandidate;
  switch (factorId) {
    case "pwd":
      return p.is_pwd ? 1 : 0;
    case "senior":
      return p.is_senior ? 1 : 0;
    case "solop":
      return p.is_solop ? 1 : 0;
    case "noWorkingAdult":
      return p.age !== null && p.age >= 18 && p.age <= 59 && !(p.occupation || "").trim() ? 1 : 0;
    case "notHelpedRecently": {
      if (!lastHelpedAt) return 1;
      const days = (now - new Date(lastHelpedAt)) / 86400000;
      return days >= lookbackDays ? 1 : 0;
    }
    default:
      return 0;
  }
};

/**
 * Scores one candidate. Returns { score, breakdown } where breakdown is a
 * list of { factor, label, units, weight, points } for every factor that
 * is ENABLED and contributed at least one point — disabled factors, and
 * enabled ones that scored 0, are left out to keep the breakdown readable.
 */
const computeCandidateScore = (unit, scoringCandidate, config, lastHelpedAt, now) => {
  const applicable = factorsForUnit(unit);
  const breakdown = [];
  let score = 0;

  applicable.forEach((def) => {
    const setting = config.factors[def.id];
    if (!setting || !setting.enabled) return;

    const rawUnits = rawUnitsFor(def.id, unit, scoringCandidate, lastHelpedAt, config.lookbackDays, now);
    const cappedUnits = Math.min(rawUnits, def.cap[unit]);
    const points = cappedUnits * setting.weight;

    if (cappedUnits > 0) {
      const label = def.hasLookback
        ? lastHelpedAt
          ? `${def.label} (last: ${new Date(lastHelpedAt).toISOString().slice(0, 10)})`
          : `${def.label} (no prior record)`
        : def.label;
      breakdown.push({ factor: def.id, label, units: cappedUnits, weight: setting.weight, points });
      score += points;
    }
  });

  return { score, breakdown };
};

// ── Tie-break ────────────────────────────────────────────────────────────
// Deterministic given a seed: the same seed always produces the same order,
// so a saved seed can always reproduce (and prove) a past ranking.
const tieBreakKey = (seed, residentId) =>
  crypto.createHash("sha256").update(`${seed}:${residentId}`).digest("hex");

const generateSeed = () => crypto.randomBytes(8).toString("hex");

// ── Full ranking pipeline ────────────────────────────────────────────────
/**
 * Builds a full ranking for a form that needs selection (pool > target).
 *
 * seed: if provided, used to break ties deterministically. If omitted,
 * ties are ordered by name only (stable but arbitrary) and flagged via
 * `tie.needsDraw` — the caller (controller) decides whether that blocks
 * creation.
 *
 * Callback: (err, {
 *   pool_size, ranked: [{ resident_id, full_name, age, sex, address,
 *     household_size?, matched_names?, score, breakdown, rank_no, status }],
 *   tie: { needsDraw, atScore, tiedCount, slotsAtStake } | null,
 *   warnings,
 * })
 */
const buildRanking = ({ unit, criteria, priorityConfig, targetQuantity, seed }, callback) => {
  buildPool(unit, criteria, (poolErr, pool) => {
    if (poolErr) return callback(poolErr);

    const { candidates, scoringCandidates, warnings } = pool;
    if (candidates.length === 0) {
      return callback(null, { pool_size: 0, ranked: [], tie: null, warnings });
    }

    const residentIds = scoringCandidates.map((c) => c.resident_id);
    fetchLastHelpedMap(unit, residentIds, (helpedErr, helpedMap) => {
      if (helpedErr) return callback(helpedErr);

      const now = new Date();
      const byId = new Map(scoringCandidates.map((c) => [c.resident_id, c]));

      const scored = candidates.map((c) => {
        const sc = byId.get(c.resident_id);
        const { score, breakdown } = computeCandidateScore(
          unit,
          sc,
          priorityConfig,
          helpedMap.get(c.resident_id) || null,
          now
        );
        return { ...c, score, breakdown };
      });

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (seed) return tieBreakKey(seed, a.resident_id) < tieBreakKey(seed, b.resident_id) ? -1 : 1;
        return a.full_name.localeCompare(b.full_name); // stable, arbitrary fallback
      });

      scored.forEach((c, i) => {
        c.rank_no = i + 1;
        c.status = c.rank_no <= targetQuantity ? "Selected" : "Waitlisted";
      });

      // Tie detection: does the score at the cutoff also appear just past it?
      let tie = null;
      if (targetQuantity >= 1 && targetQuantity < scored.length) {
        const atScore = scored[targetQuantity - 1].score;
        if (scored[targetQuantity].score === atScore) {
          const tiedGroup = scored.filter((c) => c.score === atScore);
          const firstTiedRank = tiedGroup[0].rank_no;
          tie = {
            needsDraw: !seed,
            atScore,
            tiedCount: tiedGroup.length,
            slotsAtStake: targetQuantity - firstTiedRank + 1,
          };
        }
      }

      callback(null, { pool_size: scored.length, ranked: scored, tie, warnings });
    });
  });
};

module.exports = {
  FACTOR_DEFS,
  factorsForUnit,
  normalizePriorityConfig,
  describePriorityConfig,
  buildRanking,
  generateSeed,
};