// utils/seniorStatus.js

/**
 * Single source of truth for "Senior Citizen" status.
 *
 * Previously `is_senior` was a free-standing checkbox value that staff
 * (or an imported spreadsheet column) set independently of the resident's
 * actual birthdate — which meant a resident could turn 60 and never get
 * flagged as a senior unless someone remembered to tick the box, or a
 * bulk import could silently mis-set it from a "Yes"/"No" column that
 * disagreed with the birthdate in the same row.
 *
 * `is_senior` is now always DERIVED from `birthdate` at write time
 * (add, edit, and every import path) rather than trusted as user input.
 * Any `is_senior` value coming from the client/request body should be
 * ignored — this function is the only thing allowed to set it.
 *
 * @param {string|Date|null|undefined} birthdate — 'YYYY-MM-DD' string, Date, or null
 * @param {Date} [referenceDate] — defaults to now; overridable for tests/backfills
 * @returns {0|1}
 */
const computeIsSenior = (birthdate, referenceDate = new Date()) => {
  if (!birthdate) return 0;

  const birth = birthdate instanceof Date ? birthdate : new Date(birthdate);
  if (isNaN(birth.getTime())) return 0;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 60 ? 1 : 0;
};

module.exports = { computeIsSenior };