// controllers/residentImportPreviewController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { computeIsSenior } = require("../utils/seniorStatus");

// ── Column mappings ─────────────────────────────────────────────────────
// Shared columns present in BOTH head and member forms.
const SHARED_COLUMN_MAP = {
  "timestamp":                         "form_submitted_at",
  "first name":                        "f_name",
  "middle name":                       "m_name",
  "last name":                         "l_name",
  "suffix":                            "suffix",
  "sex":                               "sex",
  "birthdate":                         "birthdate",
  "birthplace":                        "birthplace",
  "civil status":                      "civil_status",
  "occupation":                        "occupation",
  "citizenship":                       "citizenship",
  "is person with disability (pwd)?":  "is_pwd",
  "is solo parent?":                   "is_solop",
};

// HEAD-only columns (address fields — members inherit from their head).
const HEAD_ONLY_COLUMN_MAP = {
  "house no. / block /lot":            "house_no",
  "house no. / block / lot":           "house_no",
  "street":                            "street",
  "are you the household head?":       "_ignored_head_flag",
  "household member count":            "household_member_count",
};

// MEMBER-only columns (head lookup fields).
const MEMBER_ONLY_COLUMN_MAP = {
  "(head) first name":                 "head_f_name",
  "(head) last name":                  "head_l_name",
  "(head) birthdate":                  "head_birthdate",
};

// ── Required fields (differ by type) ────────────────────────────────────
// `form_submitted_at` (the Google Form's own "Timestamp" column) is required
// so a resident's created_at always reflects when they actually registered,
// not when an admin happened to run the import.
const HEAD_REQUIRED_FIELDS = [
  "f_name", "l_name", "sex", "birthdate", "birthplace", "street",
  "civil_status", "form_submitted_at",
];

const MEMBER_REQUIRED_FIELDS = [
  "f_name", "l_name", "sex", "birthdate", "birthplace",
  "civil_status", "form_submitted_at",
  "head_f_name", "head_l_name", "head_birthdate",
];

// Friendly labels for "Missing required fields" error messages.
const FIELD_LABELS = {
  f_name: "First Name",
  l_name: "Last Name",
  sex: "Sex",
  birthdate: "Birthdate",
  birthplace: "Birthplace",
  street: "Street",
  civil_status: "Civil Status",
  form_submitted_at: "Timestamp",
  head_f_name: "(HEAD) First Name",
  head_l_name: "(HEAD) Last Name",
  head_birthdate: "(HEAD) Birthdate",
};

// Non-constant fields — things that can change about a person
const NON_CONSTANT_FIELDS = [
  "m_name", "suffix", "sex", "birthplace", "house_no", "street",
  "civil_status", "occupation", "citizenship", "is_pwd", "is_senior", "is_solop",
  "is_household_head", "household_member_count",
];

const parseYesNo = (value) => {
  if (!value) return 0;
  const v = String(value).trim().toLowerCase();
  return (v === "yes" || v === "true" || v === "1") ? 1 : 0;
};

const formatDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Handle Excel serial date numbers
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(value).trim();
  const mmddyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, mo, da, yr] = mmddyyyy;
    return `${yr}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed)) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
};

// Like formatDate, but keeps the time component — used for the Google
// Form's "Timestamp" column.
const formatDateTime = (value) => {
  if (!value) return null;

  let d;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "number") {
    // Excel serial date/time number
    const excelEpoch = new Date(1899, 11, 30);
    d = new Date(excelEpoch.getTime() + value * 86400000);
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
const normalizeBool = (v) => (v ? 1 : 0);

// Identity key: l_name + f_name + birthdate (used for duplicate detection)
const rowIdentityKey = (row) =>
  `${normalizeStr(row.l_name)}|${normalizeStr(row.f_name)}|${normalizeStr(row.birthdate)}`;

const rowsMatch = (incoming, existing) => {
  for (const field of NON_CONSTANT_FIELDS) {
    // Members do not own address fields or member counts in the DB, 
    // even though we attach them to the incoming object for UI preview purposes.
    if (incoming.is_household_head === 0 && (field === "house_no" || field === "street" || field === "household_member_count")) {
      continue;
    }

    if (field === "is_pwd" || field === "is_senior" || field === "is_solop" || field === "is_household_head") {
      if (normalizeBool(incoming[field]) !== normalizeBool(existing[field])) return false;
    } else {
      if (normalizeStr(incoming[field]) !== normalizeStr(existing[field])) return false;
    }
  }
  return true;
};

// ── Main handler ────────────────────────────────────────────────────────
const previewImportResidents = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // importType comes from the frontend: "head" or "member"
  const importType = req.body.importType || "head";

  let workbook;
  try {
    workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: false });
  } catch (err) {
    return res.status(400).json({ message: "Failed to parse file. Make sure it is a valid .xlsx or .csv file." });
  }

  const sheetName = workbook.SheetNames[0];
  const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  if (rawRows.length === 0) {
    return res.status(400).json({ message: "The file is empty or has no data rows." });
  }

  // Build the column map based on import type
  const columnMap = {
    ...SHARED_COLUMN_MAP,
    ...(importType === "member" ? MEMBER_ONLY_COLUMN_MAP : HEAD_ONLY_COLUMN_MAP),
  };

  const requiredFields = importType === "member" ? MEMBER_REQUIRED_FIELDS : HEAD_REQUIRED_FIELDS;

  // Map raw rows to DB fields
  const mapped = rawRows.map((raw, index) => {
    const row = {};
    // Normalize keys (trim whitespace and BOM characters, to lowercase)
    const normalizedRaw = {};
    for (const key of Object.keys(raw)) {
      const cleanKey = key.replace(/^[\uFEFF\u200B]+/, '').trim().toLowerCase();
      normalizedRaw[cleanKey] = raw[key];
    }

    for (const [header, field] of Object.entries(columnMap)) {
      if (normalizedRaw[header] !== undefined && field !== "_ignored_head_flag") {
        row[field] = normalizedRaw[header];
      }
    }

    row.form_submitted_at = formatDateTime(row.form_submitted_at);
    row.f_name       = String(row.f_name || "").trim();
    row.m_name       = String(row.m_name || "").trim() || null;
    row.l_name       = String(row.l_name || "").trim();
    row.suffix       = String(row.suffix || "").trim() || null;
    row.sex          = String(row.sex || "").trim();
    row.birthdate    = formatDate(row.birthdate);
    row.birthplace   = String(row.birthplace || "").trim();
    row.civil_status = String(row.civil_status || "").trim();
    row.occupation   = String(row.occupation || "").trim() || null;
    row.citizenship  = String(row.citizenship || "").trim() || "Filipino";
    row.is_pwd       = parseYesNo(row.is_pwd);
    row.is_senior    = computeIsSenior(row.birthdate);
    row.is_solop     = parseYesNo(row.is_solop);

    if (importType === "head") {
      row.is_household_head = 1; // HEAD form always = head
      row.house_no     = String(row.house_no || "").trim() || null;
      row.street       = String(row.street || "").trim();
      row.household_member_count = parseInt(row.household_member_count, 10) || 1;
      row.head_resident_id = null;
    } else {
      row.is_household_head = 0; // MEMBER form always = member
      row.head_f_name    = String(row.head_f_name || "").trim();
      row.head_l_name    = String(row.head_l_name || "").trim();
      row.head_birthdate = formatDate(row.head_birthdate);
      row.house_no       = null;
      row.street         = null;
      row.household_member_count = null;
      row.head_resident_id = null; // will be resolved via DB lookup
    }

    row._id          = `row_${index}`;
    row._rowNumber   = index + 2;
    row._importType  = importType;

    return row;
  });

  // Separate valid from invalid (missing required fields)
  const validRows = [];
  const errorRows = [];

  for (const row of mapped) {
    const missing = requiredFields.filter((f) => !row[f]);
    if (missing.length > 0) {
      errorRows.push({
        ...row,
        status: "error",
        statusReason: `Missing required fields: ${missing.map((f) => FIELD_LABELS[f] || f).join(", ")}`,
        enabled: false,
        existing_id: null,
      });
    } else {
      validRows.push(row);
    }
  }

  // ── Intra-file duplicate detection ──────────────────────────────────
  const seenKeys = new Map();
  const dedupedValidRows = [];
  const inFileDuplicateRows = [];

  for (const row of validRows) {
    const key = rowIdentityKey(row);

    if (seenKeys.has(key)) {
      inFileDuplicateRows.push({
        ...row,
        status: "red",
        statusReason: `Duplicate within this file — same name & birthdate as row ${seenKeys.get(key)}`,
        enabled: false,
        existing_id: null,
      });
    } else {
      seenKeys.set(key, row._rowNumber);
      dedupedValidRows.push(row);
    }
  }

  if (dedupedValidRows.length === 0) {
    const allRows = [...inFileDuplicateRows, ...errorRows].sort((a, b) => a._rowNumber - b._rowNumber);
    const summary = {
      green: 0,
      yellow: 0,
      red: inFileDuplicateRows.length,
      error: errorRows.length,
    };
    return res.status(200).json({ rows: allRows, summary, importType });
  }

  // ── For MEMBER imports: batch-resolve household heads ──────────────
  if (importType === "member") {
    // Collect unique head lookup keys from all member rows
    const headLookupKeys = new Map(); // key -> [rowIndices]
    for (let i = 0; i < dedupedValidRows.length; i++) {
      const row = dedupedValidRows[i];
      const key = `${normalizeStr(row.head_f_name)}|${normalizeStr(row.head_l_name)}|${normalizeStr(row.head_birthdate)}`;
      if (!headLookupKeys.has(key)) headLookupKeys.set(key, []);
      headLookupKeys.get(key).push(i);
    }

    // Look up each unique head in the DB
    const resultRows = [...inFileDuplicateRows];
    let headLookupsProcessed = 0;
    const totalHeadLookups = headLookupKeys.size;

    const headLookupDone = () => {
      if (headLookupsProcessed < totalHeadLookups) return;

      // Now do per-row DB check (duplicate detection for the member themselves)
      let rowsProcessed = 0;
      const dedupedWithHeads = dedupedValidRows.filter((r) => r.status !== "error");
      const memberErrorRows = dedupedValidRows.filter((r) => r.status === "error");

      if (dedupedWithHeads.length === 0) {
        const allRows = [...resultRows, ...memberErrorRows, ...errorRows].sort(
          (a, b) => a._rowNumber - b._rowNumber
        );
        const summary = {
          green:  resultRows.filter((r) => r.status === "green").length,
          yellow: resultRows.filter((r) => r.status === "yellow").length,
          red:    resultRows.filter((r) => r.status === "red").length,
          error:  errorRows.length + memberErrorRows.length,
        };
        return res.status(200).json({ rows: allRows, summary, importType });
      }

      const checkRowsDone = () => {
        if (rowsProcessed < dedupedWithHeads.length) return;

        const allRows = [...resultRows, ...memberErrorRows, ...errorRows].sort(
          (a, b) => a._rowNumber - b._rowNumber
        );
        const summary = {
          green:  resultRows.filter((r) => r.status === "green").length,
          yellow: resultRows.filter((r) => r.status === "yellow").length,
          red:    resultRows.filter((r) => r.status === "red").length,
          error:  errorRows.length + memberErrorRows.length,
        };
        return res.status(200).json({ rows: allRows, summary, importType });
      };

      for (const row of dedupedWithHeads) {
        const checkSql = `
          SELECT * FROM residents
          WHERE l_name = ? AND f_name = ? AND birthdate = ?
          LIMIT 1
        `;

        db.query(checkSql, [row.l_name, row.f_name, row.birthdate], (err, results) => {
          let categorized;

          if (err || results.length === 0) {
            categorized = {
              ...row,
              status: "green",
              statusReason: "New member — will be inserted under found household head",
              enabled: true,
              existing_id: null,
            };
          } else {
            const existing = results[0];
            const allSame = rowsMatch(row, existing);

            if (allSame) {
              categorized = {
                ...row,
                status: "red",
                statusReason: "Exact duplicate — no changes detected, will be skipped",
                enabled: false,
                existing_id: existing.resident_id,
              };
            } else {
              categorized = {
                ...row,
                status: "yellow",
                statusReason: "Existing record with changes — will be updated",
                enabled: true,
                existing_id: existing.resident_id,
              };
            }
          }

          resultRows.push(categorized);
          rowsProcessed++;
          checkRowsDone();
        });
      }
    };

    for (const [key, indices] of headLookupKeys.entries()) {
      const [hfName, hlName, hBirthdate] = key.split("|");

      const headSql = `
        SELECT resident_id, f_name, l_name, house_no, street
        FROM residents
        WHERE LOWER(TRIM(f_name)) = ? AND LOWER(TRIM(l_name)) = ? AND birthdate = ?
          AND is_household_head = 1 AND is_archived = 0
        LIMIT 1
      `;

      db.query(headSql, [hfName, hlName, hBirthdate], (err, results) => {
        if (err || results.length === 0) {
          // Head not found — mark all rows referencing this head as error
          for (const idx of indices) {
            dedupedValidRows[idx] = {
              ...dedupedValidRows[idx],
              status: "error",
              statusReason: `Household Head not found: "${dedupedValidRows[idx].head_f_name} ${dedupedValidRows[idx].head_l_name}" (Birthdate: ${dedupedValidRows[idx].head_birthdate})`,
              enabled: false,
              existing_id: null,
            };
          }
        } else {
          const head = results[0];
          for (const idx of indices) {
            dedupedValidRows[idx].head_resident_id = head.resident_id;
            // Show the head's address in preview for readability
            dedupedValidRows[idx].house_no = head.house_no || null;
            dedupedValidRows[idx].street = head.street || "";
            dedupedValidRows[idx]._head_name = `${head.f_name} ${head.l_name}`;
          }
        }

        headLookupsProcessed++;
        headLookupDone();
      });
    }

    return; // response is sent asynchronously above
  }

  // ── HEAD imports: standard per-row DB check ───────────────────────
  const resultRows = [...inFileDuplicateRows];
  let processed = 0;

  const checkDone = () => {
    if (processed < dedupedValidRows.length) return;

    const allRows = [...resultRows, ...errorRows].sort(
      (a, b) => a._rowNumber - b._rowNumber
    );

    const summary = {
      green:  resultRows.filter((r) => r.status === "green").length,
      yellow: resultRows.filter((r) => r.status === "yellow").length,
      red:    resultRows.filter((r) => r.status === "red").length,
      error:  errorRows.length,
    };

    return res.status(200).json({ rows: allRows, summary, importType });
  };

  for (const row of dedupedValidRows) {
    const checkSql = `
      SELECT * FROM residents
      WHERE l_name = ? AND f_name = ? AND birthdate = ?
      LIMIT 1
    `;

    db.query(checkSql, [row.l_name, row.f_name, row.birthdate], (err, results) => {
      let categorized;

      if (err || results.length === 0) {
        categorized = {
          ...row,
          status: "green",
          statusReason: "New record — will be inserted as Household Head",
          enabled: true,
          existing_id: null,
        };
      } else {
        const existing = results[0];
        const allSame = rowsMatch(row, existing);

        if (allSame) {
          categorized = {
            ...row,
            status: "red",
            statusReason: "Exact duplicate — no changes detected, will be skipped",
            enabled: false,
            existing_id: existing.resident_id,
          };
        } else {
          categorized = {
            ...row,
            status: "yellow",
            statusReason: "Existing record with changes — will be updated",
            enabled: true,
            existing_id: existing.resident_id,
          };
        }
      }

      resultRows.push(categorized);
      processed++;
      checkDone();
    });
  }
};

module.exports = { previewImportResidents };