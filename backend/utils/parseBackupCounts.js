// utils/parseBackupCounts.js

/**
 * Best-effort tuple extractor for a mysqldump/phpMyAdmin .sql file. Walks
 * INSERT INTO `table` (...) VALUES (...), (...), ...; statements for a
 * given table and returns the raw text of each top-level value tuple.
 *
 * This is not a full SQL parser — it only understands the specific,
 * consistent format phpMyAdmin/mysqldump produce. It correctly ignores
 * commas and parentheses that appear inside string literals (e.g. a
 * birthplace value like "New York, Makati" contains a comma that a naive
 * comma-count would miscount as a tuple boundary), by tracking string state
 * and paren depth character-by-character.
 */
const extractTuples = (sqlText, tableName) => {
  const insertRegex = new RegExp(
    "INSERT\\s+INTO\\s+`" + tableName + "`[^;]*?VALUES",
    "gi"
  );

  const tuples = [];
  let match;

  while ((match = insertRegex.exec(sqlText)) !== null) {
    let i = match.index + match[0].length;
    let depth = 0;
    let inString = false;
    let tupleStart = -1;

    for (; i < sqlText.length; i++) {
      const ch = sqlText[i];

      if (inString) {
        if (ch === "\\") { i++; continue; }          // skip escaped char
        if (ch === "'") {
          if (sqlText[i + 1] === "'") { i++; continue; } // '' = escaped quote
          inString = false;
        }
        continue;
      }

      if (ch === "'") { inString = true; continue; }

      if (ch === "(") {
        if (depth === 0) tupleStart = i + 1;
        depth++;
        continue;
      }

      if (ch === ")") {
        depth--;
        if (depth === 0 && tupleStart !== -1) {
          tuples.push(sqlText.slice(tupleStart, i));
          tupleStart = -1;
        }
        continue;
      }

      if (ch === ";" && depth === 0) break; // end of this INSERT statement
    }
  }

  return tuples;
};

/**
 * Splits one raw tuple's text into its individual column values (still
 * quoted / unprocessed), respecting the same string-escaping rules as
 * extractTuples so a comma inside a quoted string isn't mistaken for a
 * column boundary.
 */
const splitTupleFields = (tupleText) => {
  const fields = [];
  let depth = 0;
  let inString = false;
  let fieldStart = 0;

  for (let i = 0; i < tupleText.length; i++) {
    const ch = tupleText[i];

    if (inString) {
      if (ch === "\\") { i++; continue; }
      if (ch === "'") {
        if (tupleText[i + 1] === "'") { i++; continue; }
        inString = false;
      }
      continue;
    }

    if (ch === "'") { inString = true; continue; }
    if (ch === "(") { depth++; continue; }
    if (ch === ")") { depth--; continue; }

    if (ch === "," && depth === 0) {
      fields.push(tupleText.slice(fieldStart, i));
      fieldStart = i + 1;
    }
  }
  fields.push(tupleText.slice(fieldStart));
  return fields.map((f) => f.trim());
};

/** Strips SQL quoting/escaping from one raw field, or returns null for NULL. */
const unquote = (raw) => {
  const trimmed = (raw ?? "").trim();
  if (trimmed.toUpperCase() === "NULL") return null;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed
      .slice(1, -1)
      .replace(/''/g, "'")
      .replace(/\\'/g, "'");
  }
  return trimmed;
};

/**
 * Which column indexes (0-based, matching CREATE TABLE order) make up a
 * human-readable label for each tracked table. Null means the table has
 * no natural name column (eligibility_forms_entries), so callers fall
 * back to "Entry #<id>".
 */
const LABEL_FIELD_INDEXES = {
  residents: [1, 2, 3, 4],           // f_name, m_name, l_name, suffix
  users: [3],                        // fullname
  eligibility_forms: [1],            // form_name
  eligibility_forms_entries: null,
};

const buildLabel = (fields, tableName, id) => {
  const indexes = LABEL_FIELD_INDEXES[tableName];
  if (!indexes) return `Entry #${id}`;

  const parts = indexes
    .map((idx) => unquote(fields[idx]))
    .filter((v) => v && v.trim().length > 0);

  return parts.length > 0 ? parts.join(" ") : `Record #${id}`;
};

/**
 * Extracts the leading (first) column value from a raw tuple's already-
 * split fields — for every table this pipeline tracks, the primary key
 * is the first column in CREATE TABLE order, and mysqldump always lists
 * columns in that order, so this reliably recovers each row's ID without
 * a full SQL parser. Returns null if the value isn't a plain integer,
 * which should never happen for these tables' PK columns but is handled
 * defensively.
 */
const extractLeadingId = (fields) => {
  const raw = (fields[0] ?? "").trim();
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
};

const countValueTuples = (sqlText, tableName) => extractTuples(sqlText, tableName).length;

/**
 * For a given table, returns both the set of primary-key IDs the file
 * claims to contain and a label per ID — resolved directly from the
 * file's own row data, since (in the restore-verification case) the
 * database may no longer have that row to look up.
 */
const extractIdsWithLabels = (sqlText, tableName) => {
  const tuples = extractTuples(sqlText, tableName);
  const ids = [];
  const labelsById = {};

  tuples.forEach((tupleText) => {
    const fields = splitTupleFields(tupleText);
    const id = extractLeadingId(fields);
    if (id === null) return;

    ids.push(id);
    labelsById[id] = buildLabel(fields, tableName, id);
  });

  return { ids, labelsById };
};

/**
 * Expected row counts for the four tables the dashboard tracks, parsed
 * directly from the uploaded backup file's raw SQL text — i.e. what the
 * FILE says should end up in the database, independent of what the restore
 * process actually managed to insert.
 */
const parseExpectedCounts = (sqlText) => ({
  residents:           countValueTuples(sqlText, "residents"),
  accounts:            countValueTuples(sqlText, "users"),
  eligibility_forms:   countValueTuples(sqlText, "eligibility_forms"),
  eligibility_entries: countValueTuples(sqlText, "eligibility_forms_entries"),
});

/**
 * Same four tables, but returns { count, ids, labelsById } per table so
 * callers can diff actual vs. expected PRIMARY KEYS — not just row
 * totals — and name any record that's missing. This is what lets a
 * verification report say "Julius Caliao (resident_id 24) is missing"
 * instead of just "3 residents are missing".
 */
const parseExpectedIds = (sqlText) => {
  const build = (tableName) => {
    const { ids, labelsById } = extractIdsWithLabels(sqlText, tableName);
    return { count: ids.length, ids, labelsById };
  };

  return {
    residents:           build("residents"),
    accounts:            build("users"),
    eligibility_forms:   build("eligibility_forms"),
    eligibility_entries: build("eligibility_forms_entries"),
  };
};

module.exports = { parseExpectedCounts, parseExpectedIds };