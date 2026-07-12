// controllers/residentImportPreviewController.js
const db = require("../config/db");
const xlsx = require("xlsx");

const COLUMN_MAP = {
  "First Name":                        "f_name",
  "MIddle Name":                       "m_name",
  "Middle Name":                       "m_name",
  "Last Name":                         "l_name",
  "Suffix":                            "suffix",
  "Sex":                               "sex",
  "BIrthdate":                         "birthdate",
  "Birthdate":                         "birthdate",
  "Birthplace":                        "birthplace",
  "House No. / Block /Lot":            "house_no",
  "House No. / Block / Lot":           "house_no",
  "Street":                            "street",
  "Civil Status":                      "civil_status",
  "Occupation":                        "occupation",
  "Citizenship":                       "citizenship",
  "Is Person with Disability (PWD)?":  "is_pwd",
  "Is Senior Citizen?":                "is_senior",
  "Is Solo Parent?":                   "is_solop",
  "Are you the Household Head?":       "is_household_head",
  "Are you the Household Head ":       "is_household_head", // fallback — current form export has a trailing space and no "?"
  "Household Member Count":            "household_member_count",
};

const REQUIRED_FIELDS = ["f_name", "l_name", "sex", "birthdate", "birthplace", "street", "civil_status"];

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

const normalizeStr = (v) => String(v == null ? "" : v).trim().toLowerCase();
const normalizeBool = (v) => (v ? 1 : 0);

const rowsMatch = (incoming, existing) => {
  for (const field of NON_CONSTANT_FIELDS) {
    if (field === "is_pwd" || field === "is_senior" || field === "is_solop" || field === "is_household_head") {
      if (normalizeBool(incoming[field]) !== normalizeBool(existing[field])) return false;
    } else {
      if (normalizeStr(incoming[field]) !== normalizeStr(existing[field])) return false;
    }
  }
  return true;
};

const previewImportResidents = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  let workbook;
  try {
    workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
  } catch (err) {
    return res.status(400).json({ message: "Failed to parse file. Make sure it is a valid .xlsx or .csv file." });
  }

  const sheetName = workbook.SheetNames[0];
  const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  if (rawRows.length === 0) {
    return res.status(400).json({ message: "The file is empty or has no data rows." });
  }

  // Map raw rows to DB fields
  const mapped = rawRows.map((raw, index) => {
    const row = {};
    for (const [header, field] of Object.entries(COLUMN_MAP)) {
      if (raw[header] !== undefined) row[field] = raw[header];
    }

    row.f_name       = String(row.f_name || "").trim();
    row.m_name       = String(row.m_name || "").trim() || null;
    row.l_name       = String(row.l_name || "").trim();
    row.suffix       = String(row.suffix || "").trim() || null;
    row.sex          = String(row.sex || "").trim();
    row.birthdate    = formatDate(row.birthdate);
    row.birthplace   = String(row.birthplace || "").trim();
    row.house_no     = String(row.house_no || "").trim() || null;
    row.street       = String(row.street || "").trim();
    row.civil_status = String(row.civil_status || "").trim();
    row.occupation   = String(row.occupation || "").trim() || null;
    row.citizenship  = String(row.citizenship || "").trim() || "Filipino";
    row.is_pwd       = parseYesNo(row.is_pwd);
    row.is_senior    = parseYesNo(row.is_senior);
    row.is_solop     = parseYesNo(row.is_solop);
    row.is_household_head = parseYesNo(row.is_household_head);
    row.household_member_count = row.is_household_head
      ? (parseInt(row.household_member_count, 10) || 1)
      : null;
    row._id          = `row_${index}`;
    row._rowNumber   = index + 2;

    return row;
  });

  // Separate valid from invalid (missing required fields)
  const validRows = [];
  const errorRows = [];

  for (const row of mapped) {
    const missing = REQUIRED_FIELDS.filter((f) => !row[f]);
    if (missing.length > 0) {
      errorRows.push({
        ...row,
        status: "error",
        statusReason: `Missing required fields: ${missing.join(", ")}`,
        enabled: false,
        existing_id: null,
      });
    } else {
      validRows.push(row);
    }
  }

  if (validRows.length === 0) {
    const summary = { green: 0, yellow: 0, red: 0, error: errorRows.length };
    return res.status(200).json({ rows: errorRows, summary });
  }

  // For each valid row, check against DB
  const resultRows = [];
  let processed = 0;

  const checkDone = () => {
    if (processed < validRows.length) return;

    // Merge and sort by original row number
    const allRows = [...resultRows, ...errorRows].sort(
      (a, b) => a._rowNumber - b._rowNumber
    );

    const summary = {
      green:  resultRows.filter((r) => r.status === "green").length,
      yellow: resultRows.filter((r) => r.status === "yellow").length,
      red:    resultRows.filter((r) => r.status === "red").length,
      error:  errorRows.length,
    };

    return res.status(200).json({ rows: allRows, summary });
  };

  for (const row of validRows) {
    const checkSql = `
      SELECT * FROM residents
      WHERE l_name = ? AND f_name = ? AND birthdate = ?
      LIMIT 1
    `;

    db.query(checkSql, [row.l_name, row.f_name, row.birthdate], (err, results) => {
      let categorized;

      if (err || results.length === 0) {
        // No match found — GREEN (new record)
        categorized = {
          ...row,
          status: "green",
          statusReason: "New record — will be inserted",
          enabled: true,
          existing_id: null,
        };
      } else {
        const existing = results[0];
        const allSame = rowsMatch(row, existing);

        if (allSame) {
          // Exact duplicate — RED
          categorized = {
            ...row,
            status: "red",
            statusReason: "Exact duplicate — no changes detected, will be skipped",
            enabled: false,
            existing_id: existing.resident_id,
          };
        } else {
          // Existing record but has changes — YELLOW
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