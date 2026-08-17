// utils/parseBackupCounts.js

/**
 * Best-effort row counter for a mysqldump/phpMyAdmin .sql file. Counts the
 * number of top-level value tuples inside INSERT INTO `table` (...) VALUES
 * (...), (...), ...; statements for a given table, so the restored database's
 * ACTUAL row counts can be compared against what the uploaded FILE itself
 * claims to contain.
 *
 * This is not a full SQL parser — it only understands the specific,
 * consistent format phpMyAdmin/mysqldump produce. It correctly ignores
 * commas and parentheses that appear inside string literals (e.g. a
 * birthplace value like "New York, Makati" contains a comma that a naive
 * comma-count would miscount as a tuple boundary), by tracking string state
 * and paren depth character-by-character.
 */
const countValueTuples = (sqlText, tableName) => {
  const insertRegex = new RegExp(
    "INSERT\\s+INTO\\s+`" + tableName + "`[^;]*?VALUES",
    "gi"
  );

  let total = 0;
  let match;

  while ((match = insertRegex.exec(sqlText)) !== null) {
    let i = match.index + match[0].length;
    let depth = 0;
    let inString = false;
    let tupleOpened = false;

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
        if (depth === 0) tupleOpened = true;
        depth++;
        continue;
      }

      if (ch === ")") {
        depth--;
        if (depth === 0 && tupleOpened) {
          total++;
          tupleOpened = false;
        }
        continue;
      }

      if (ch === ";" && depth === 0) break; // end of this INSERT statement
    }
  }

  return total;
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

module.exports = { parseExpectedCounts };