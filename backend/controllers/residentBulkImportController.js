// controllers/residentBulkImportController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { logActivity } = require("../utils/activityLogger");
const { computeIsSenior } = require("../utils/seniorStatus");

// Column mapping from Google Form export headers to DB fields
const COLUMN_MAP = {
  "Timestamp":                         "form_submitted_at",
  "First Name":                        "f_name",
  "MIddle Name":                       "m_name",
  "Middle Name":                       "m_name",  // fallback clean version
  "Last Name":                         "l_name",
  "Suffix":                            "suffix",
  "Sex":                               "sex",
  "BIrthdate":                         "birthdate",
  "Birthdate":                         "birthdate", // fallback clean version
  "Birthplace":                        "birthplace",
  "House No. / Block /Lot":            "house_no",
  "House No. / Block / Lot":           "house_no", // fallback with extra space
  "Street":                            "street",
  "Civil Status":                      "civil_status",
  "Occupation":                        "occupation",
  "Citizenship":                       "citizenship",
  "Is Person with Disability (PWD)?":  "is_pwd",
  // NOTE: no "Is Senior Citizen?" mapping — is_senior is always derived
  // from Birthdate (see computeIsSenior below), never read from a
  // spreadsheet answer.
  "Is Solo Parent?":                   "is_solop",
};

// `form_submitted_at` (the Google Form's own "Timestamp" column) is required
// so a resident's created_at always reflects when they actually registered,
// not when an admin happened to run the import.
const REQUIRED_FIELDS = ["f_name", "l_name", "sex", "birthdate", "birthplace", "street", "civil_status", "form_submitted_at"];

const FIELD_LABELS = {
  f_name: "First Name",
  l_name: "Last Name",
  sex: "Sex",
  birthdate: "Birthdate",
  birthplace: "Birthplace",
  street: "Street",
  civil_status: "Civil Status",
  form_submitted_at: "Timestamp",
};

const parseYesNo = (value) => {
  if (!value) return 0;
  return String(value).trim().toLowerCase() === "yes" ? 1 : 0;
};

const formatDate = (value) => {
  if (!value) return null;

  // If it's already a JS Date object (xlsx parses dates automatically)
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // If it's a string, try to parse common formats
  const str = String(value).trim();

  // MM/DD/YYYY
  const mmddyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, m, d, y] = mmddyyyy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // YYYY-MM-DD (already correct)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Try native Date parse as last resort
  const parsed = new Date(str);
  if (!isNaN(parsed)) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
};

// Like formatDate, but preserves the time component — used for the Google
// Form's "Timestamp" column since residents.created_at is a DATETIME.
const formatDateTime = (value) => {
  if (!value) return null;

  let d;
  if (value instanceof Date) {
    d = value;
  } else {
    d = new Date(String(value).trim());
  }

  if (isNaN(d.getTime())) return null;

  const y   = d.getFullYear();
  const mo  = String(d.getMonth() + 1).padStart(2, "0");
  const da  = String(d.getDate()).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const mi  = String(d.getMinutes()).padStart(2, "0");
  const ss  = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${da} ${hh}:${mi}:${ss}`;
};

const normalizeStr = (v) => String(v == null ? "" : v).trim().toLowerCase();

// Same identity key the duplicate-check query below uses
// (l_name + f_name + birthdate), applied here to catch two rows in the
// SAME file that would resolve to the same person.
const rowIdentityKey = (row) =>
  `${normalizeStr(row.l_name)}|${normalizeStr(row.f_name)}|${normalizeStr(row.birthdate)}`;

const bulkImportResidents = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const created_by = req.user.id;

  let workbook;
  try {
    workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
  } catch (err) {
    return res.status(400).json({ message: "Failed to parse file. Make sure it is a valid .xlsx or .csv file." });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  if (rawRows.length === 0) {
    return res.status(400).json({ message: "The file is empty or has no data rows." });
  }

  // Map raw rows to DB fields
  const mapped = rawRows.map((raw, index) => {
    const row = {};
    for (const [header, field] of Object.entries(COLUMN_MAP)) {
      if (raw[header] !== undefined) {
        row[field] = raw[header];
      }
    }

    // Normalize
    row.form_submitted_at = formatDateTime(row.form_submitted_at);
    row.f_name      = String(row.f_name || "").trim();
    row.m_name      = String(row.m_name || "").trim() || null;
    row.l_name      = String(row.l_name || "").trim();
    row.suffix      = String(row.suffix || "").trim() || null;
    row.sex         = String(row.sex || "").trim();
    row.birthdate   = formatDate(row.birthdate);
    row.birthplace  = String(row.birthplace || "").trim();
    row.house_no    = String(row.house_no || "").trim() || null;
    row.street      = String(row.street || "").trim();
    row.civil_status = String(row.civil_status || "").trim();
    row.occupation  = String(row.occupation || "").trim() || null;
    row.citizenship = String(row.citizenship || "").trim() || "Filipino";
    row.is_pwd      = parseYesNo(row.is_pwd);
    // Derived purely from birthdate — never from a spreadsheet answer.
    row.is_senior   = computeIsSenior(row.birthdate);
    row.is_solop    = parseYesNo(row.is_solop);
    row._rowNumber  = index + 2; // +2 because row 1 is header

    return row;
  });

  // Validate required fields
  const validRows = [];
  const errorRows = [];

  for (const row of mapped) {
    const missing = REQUIRED_FIELDS.filter((f) => !row[f]);
    if (missing.length > 0) {
      errorRows.push({
        row: row._rowNumber,
        name: `${row.f_name || ""} ${row.l_name || ""}`.trim() || "(unnamed)",
        reason: `Missing required fields: ${missing.map((f) => FIELD_LABELS[f] || f).join(", ")}`,
      });
    } else {
      validRows.push(row);
    }
  }

  // ── Intra-file duplicate detection ────────────────────────────────────
  // Without this, two identical rows in the same file would both query
  // the DB for a match, both find nothing (neither is inserted yet), and
  // both proceed to insert — worse, since checkAndInsert below fires all
  // rows' duplicate-check queries without waiting on each other, this was
  // a genuine race condition, not just a logic gap. Collapsing to one
  // occurrence per identity key before any DB query runs closes both
  // issues at once: only the first occurrence of a given person is ever
  // checked/inserted; every repeat is skipped up front.
  const seenKeys = new Map(); // identityKey -> first-seen row number
  const dedupedRows = [];
  const skippedRows = [];

  for (const row of validRows) {
    const key = rowIdentityKey(row);
    if (seenKeys.has(key)) {
      skippedRows.push({
        row: row._rowNumber,
        name: `${row.f_name} ${row.l_name}`,
        reason: `Duplicate within this file — same name & birthdate as row ${seenKeys.get(key)}`,
      });
    } else {
      seenKeys.set(key, row._rowNumber);
      dedupedRows.push(row);
    }
  }

  if (dedupedRows.length === 0) {
    return res.status(400).json({
      message: "No valid rows found to import.",
      imported: 0,
      skipped: skippedRows.length,
      errors: errorRows,
      skippedDetails: skippedRows,
    });
  }

  // Process each remaining (de-duplicated) row: check duplicate then insert
  let imported = 0;
  let skipped = skippedRows.length; // intra-file duplicates already counted
  let processed = 0;

  // Collected so the whole run is written as ONE activity_logs row instead
  // of one row per resident — see residentImportConfirmController.js for
  // the identical rationale/shape (added: [{resident_id, name}]). This
  // legacy endpoint has no update path, so `updated` is always empty, but
  // the shape is kept consistent in case anything downstream parses it.
  const addedRecords = [];

  const checkAndInsert = (row) => {
    const checkSql = `
      SELECT COUNT(*) AS count 
      FROM residents 
      WHERE l_name = ? AND f_name = ? AND birthdate = ?
    `;

    db.query(checkSql, [row.l_name, row.f_name, row.birthdate], (err, results) => {
      if (err) {
        errorRows.push({
          row: row._rowNumber,
          name: `${row.f_name} ${row.l_name}`,
          reason: "Database error during duplicate check",
        });
        processed++;
        checkDone();
        return;
      }

      if (results[0].count > 0) {
        skipped++;
        skippedRows.push({
          row: row._rowNumber,
          name: `${row.f_name} ${row.l_name}`,
          reason: "Duplicate — resident with same name and birthdate already exists",
        });
        processed++;
        checkDone();
        return;
      }

      // created_at is explicitly set from the parsed Google Form Timestamp
      // instead of being omitted from the column list — previously that
      // omission let MySQL's DEFAULT current_timestamp() silently stamp
      // every imported resident with the import moment, not their actual
      // registration date.
      const insertSql = `
        INSERT INTO residents (
          f_name, m_name, l_name, suffix, sex, birthdate, birthplace,
          house_no, street, civil_status, occupation, citizenship,
          is_pwd, is_senior, is_solop, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          row.f_name, row.m_name, row.l_name, row.suffix,
          row.sex, row.birthdate, row.birthplace,
          row.house_no, row.street, row.civil_status,
          row.occupation, row.citizenship,
          row.is_pwd, row.is_senior, row.is_solop,
          created_by,
          row.form_submitted_at,
        ],
        (err2, result) => {
          if (err2) {
            errorRows.push({
              row: row._rowNumber,
              name: `${row.f_name} ${row.l_name}`,
              reason: "Insert failed: " + err2.message,
            });
          } else {
            imported++;
            addedRecords.push({
              resident_id: result.insertId,
              name: `${row.f_name} ${row.l_name}`,
            });
          }
          processed++;
          checkDone();
        }
      );
    });
  };

  const checkDone = () => {
    if (processed !== dedupedRows.length) return;

    if (addedRecords.length > 0) {
      // No performed_at override — this log entry represents the import
      // action itself (happening right now), distinct from the resident
      // records' own historically-accurate created_at values.
      logActivity({
        entity_type:  "Resident",
        entity_id:    null,
        entity_name:  `${addedRecords.length} added`,
        action_type:  "imported",
        performed_by: created_by,
        details: {
          added: addedRecords,
          updated: [],
        },
      });
    }

    return res.status(200).json({
      message: `Import complete.`,
      imported,
      skipped,
      errors: errorRows,
      skippedDetails: skippedRows,
    });
  };

  // Kick off all (already de-duplicated) rows
  for (const row of dedupedRows) {
    checkAndInsert(row);
  }
};

module.exports = { bulkImportResidents };