// utils/eligibilityPool.js
//
// Builds the "pool" for an eligibility form: every resident (or household)
// that passes the form's criteria RIGHT NOW. Used by BOTH the preview and
// the create endpoints, so what staff review is exactly what gets saved.
//
// Criteria are evaluated in JS over ONE query of active residents. They are
// never interpolated into SQL (no injection surface), and the household rule
// below stays simple. That's fine at barangay scale (hundreds to low
// thousands of residents).
//
// Rules that always apply:
//  - Archived residents are never in a pool.
//  - Age is calculated from birthdate as of today.
//  - A member's street/house comes from their household head.
//  - Senior status is computed live from birthdate (computeIsSenior), not
//    read from the stored is_senior flag, which only refreshes on save.
const db = require("../config/db");
const { computeIsSenior } = require("./seniorStatus");

const SEX_VALUES = ["Male", "Female", "Other"];
const CIVIL_STATUS_VALUES = ["Single", "Married", "Widowed", "Divorced", "Separated", "Annulled"];
const SECTOR_VALUES = ["pwd", "senior", "solop"];
const SECTOR_LABELS = { pwd: "PWD", senior: "Senior", solop: "Solo parent" };

// ── Criteria validation ─────────────────────────────────────────────────
const parseAgeBound = (value, label) => {
  if (value === undefined || value === null || value === "") return { value: null };
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 130) {
    return { error: `${label} must be a whole number between 0 and 130.` };
  }
  return { value: n };
};

const parseEnumList = (value, allowed, label) => {
  if (value === undefined || value === null) return { value: [] };
  if (!Array.isArray(value)) return { error: `${label} must be a list.` };
  const unique = [...new Set(value)];
  const bad = unique.find((v) => !allowed.includes(v));
  if (bad !== undefined) return { error: `Invalid ${label}: ${String(bad)}` };
  return { value: unique };
};

const parseStreets = (value) => {
  if (value === undefined || value === null) return { value: [] };
  if (!Array.isArray(value)) return { error: "Streets must be a list." };
  if (value.length > 200) return { error: "Too many streets selected." };

  const seen = new Set();
  const out = [];
  for (const s of value) {
    if (typeof s !== "string") return { error: "Each street must be text." };
    const t = s.trim();
    if (!t) continue;
    if (t.length > 150) return { error: "A street name is too long." };
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return { value: out };
};

/**
 * Cleans raw criteria from the client into the exact object that will be
 * applied AND saved as the form's criteria_snapshot. Only keys that actually
 * restrict something are kept; unknown keys are dropped. An empty object
 * means "no restriction".
 *
 * Returns { criteria } or { error: "message" }.
 */
const normalizeCriteria = (raw) => {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const criteria = {};

  const min = parseAgeBound(input.ageMin, "Minimum age");
  if (min.error) return { error: min.error };
  const max = parseAgeBound(input.ageMax, "Maximum age");
  if (max.error) return { error: max.error };
  if (min.value !== null && max.value !== null && min.value > max.value) {
    return { error: "Minimum age cannot be greater than maximum age." };
  }
  if (min.value !== null) criteria.ageMin = min.value;
  if (max.value !== null) criteria.ageMax = max.value;

  if (input.sex !== undefined && input.sex !== null && input.sex !== "" && input.sex !== "All") {
    if (!SEX_VALUES.includes(input.sex)) return { error: "Invalid sex value." };
    criteria.sex = input.sex;
  }

  const civil = parseEnumList(input.civilStatuses, CIVIL_STATUS_VALUES, "civil status");
  if (civil.error) return { error: civil.error };
  if (civil.value.length > 0) criteria.civilStatuses = civil.value;

  const sectors = parseEnumList(input.sectors, SECTOR_VALUES, "sector");
  if (sectors.error) return { error: sectors.error };
  if (sectors.value.length > 0) criteria.sectors = sectors.value;

  if (input.occupationContains !== undefined && input.occupationContains !== null) {
    if (typeof input.occupationContains !== "string") {
      return { error: "Occupation filter must be text." };
    }
    const t = input.occupationContains.trim();
    if (t.length > 100) return { error: "Occupation filter is too long." };
    if (t) criteria.occupationContains = t;
  }

  const streets = parseStreets(input.streets);
  if (streets.error) return { error: streets.error };
  if (streets.value.length > 0) criteria.streets = streets.value;

  return { criteria };
};

/** Human-readable one-liner of the criteria (used in audit log details). */
const describeCriteria = (c, unit) => {
  const parts = [];
  if (c.ageMin !== undefined && c.ageMax !== undefined) parts.push(`Age ${c.ageMin}–${c.ageMax}`);
  else if (c.ageMin !== undefined) parts.push(`Age ${c.ageMin}+`);
  else if (c.ageMax !== undefined) parts.push(`Age up to ${c.ageMax}`);
  if (c.sex) parts.push(`Sex: ${c.sex}`);
  if (c.civilStatuses) parts.push(`Civil status: ${c.civilStatuses.join(", ")}`);
  if (c.sectors) parts.push(`Sector (any of): ${c.sectors.map((s) => SECTOR_LABELS[s]).join(", ")}`);
  if (c.occupationContains) parts.push(`Occupation contains "${c.occupationContains}"`);
  if (c.streets) parts.push(`Street: ${c.streets.join(", ")}`);
  return parts.length > 0
    ? parts.join(" · ")
    : `No restrictions (all active ${unit === "Household" ? "households" : "residents"})`;
};

// ── Pool building ───────────────────────────────────────────────────────
// Age from a 'YYYY-MM-DD' string, parsed by hand so no timezone can shift it.
const ageFromISO = (iso, today) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - mo;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
  return age >= 0 ? age : null;
};

// Members get street/house_no from their head via the join (same rule as
// residentController.getAllResidents).
const ACTIVE_RESIDENTS_SQL = `
  SELECT
    r.resident_id, r.f_name, r.m_name, r.l_name, r.suffix, r.sex,
    DATE_FORMAT(r.birthdate, '%Y-%m-%d') AS birthdate,
    r.civil_status, r.occupation,
    r.is_pwd, r.is_solop,
    r.is_household_head, r.head_resident_id,
    CASE WHEN r.is_household_head = 1 THEN r.street   ELSE h.street   END AS street,
    CASE WHEN r.is_household_head = 1 THEN r.house_no ELSE h.house_no END AS house_no
  FROM residents r
  LEFT JOIN residents h ON h.resident_id = r.head_resident_id
  WHERE r.is_archived = 0
  ORDER BY r.l_name, r.f_name
`;

const toPerson = (row, today) => ({
  resident_id: row.resident_id,
  full_name: [row.f_name, row.m_name, row.l_name, row.suffix].filter(Boolean).join(" "),
  sex: row.sex,
  age: ageFromISO(row.birthdate, today),
  civil_status: row.civil_status,
  occupation: row.occupation,
  is_pwd: !!row.is_pwd,
  is_solop: !!row.is_solop,
  is_senior: computeIsSenior(row.birthdate) === 1,
  is_household_head: !!row.is_household_head,
  head_resident_id: row.head_resident_id,
  street: row.street,
  address: [row.house_no, row.street].filter(Boolean).join(" "),
});

/** Turns normalized criteria into a fast (person) => boolean test. */
const compilePredicate = (c) => {
  const streetSet = c.streets ? new Set(c.streets.map((s) => s.toLowerCase())) : null;
  const occNeedle = c.occupationContains ? c.occupationContains.toLowerCase() : null;

  return (p) => {
    if (c.ageMin !== undefined && (p.age === null || p.age < c.ageMin)) return false;
    if (c.ageMax !== undefined && (p.age === null || p.age > c.ageMax)) return false;
    if (c.sex && p.sex !== c.sex) return false;
    if (c.civilStatuses && !c.civilStatuses.includes(p.civil_status)) return false;

    // Sectors are OR: a person qualifies if they belong to ANY selected sector.
    if (
      c.sectors &&
      !c.sectors.some(
        (s) => (s === "pwd" && p.is_pwd) || (s === "senior" && p.is_senior) || (s === "solop" && p.is_solop)
      )
    ) {
      return false;
    }

    if (occNeedle && !(p.occupation || "").toLowerCase().includes(occNeedle)) return false;
    if (streetSet && !streetSet.has((p.street || "").trim().toLowerCase())) return false;
    return true;
  };
};

/**
 * Builds the pool.
 *
 * unit = "Resident":  every active person who matches ALL criteria.
 * unit = "Household": one entry per household, recorded under the HEAD. A
 *   household qualifies if at least one active member (head included)
 *   matches ALL criteria — the same person must satisfy every criterion.
 *
 * Callback: (err, { candidates, warnings })
 */
const buildPool = (unit, criteria, callback) => {
  db.query(ACTIVE_RESIDENTS_SQL, (err, rows) => {
    if (err) return callback(err);

    const today = new Date();
    const people = rows.map((r) => toPerson(r, today));
    const matches = compilePredicate(criteria);

    if (unit === "Resident") {
      const candidates = people.filter(matches).map((p) => ({
        resident_id: p.resident_id,
        full_name: p.full_name,
        age: p.age,
        sex: p.sex,
        address: p.address,
        is_household_head: p.is_household_head,
      }));
      return callback(null, { candidates, warnings: [] });
    }

    // Household unit: group active residents under their head.
    const households = new Map(); // headId -> { head, members[] }
    people.forEach((p) => {
      if (p.is_household_head) households.set(p.resident_id, { head: p, members: [p] });
    });

    let orphaned = 0;
    people.forEach((p) => {
      if (p.is_household_head) return;
      const group = p.head_resident_id != null ? households.get(p.head_resident_id) : undefined;
      if (group) group.members.push(p);
      else orphaned++;
    });

    const candidates = [];
    households.forEach(({ head, members }) => {
      const matched = members.filter(matches);
      if (matched.length === 0) return;

      candidates.push({
        resident_id: head.resident_id,
        full_name: head.full_name,
        age: head.age,
        sex: head.sex,
        address: head.address,
        is_household_head: true,
        household_size: members.length,
        matching_members: matched.length,
        matched_names: matched.map((m) => m.full_name),
      });
    });

    const warnings = [];
    if (orphaned > 0) {
      warnings.push({
        code: "ORPHANED_MEMBERS",
        message: `${orphaned} active resident(s) are linked to a household head who is missing or archived, so they were left out of the household pool.`,
      });
    }

    callback(null, { candidates, warnings });
  });
};

module.exports = { normalizeCriteria, describeCriteria, buildPool };