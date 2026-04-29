// controllers/householdImportPreviewController.js
const db = require("../config/db");
const xlsx = require("xlsx");

const COLUMN_MAP = {
  "First Name":                                          "f_name",
  "MIddle Name":                                         "m_name",
  "Middle Name":                                         "m_name",
  "Last Name":                                           "l_name",
  "Suffix":                                              "suffix",
  "House No. / Block /Lot":                              "house_no",
  "House No. / Block / Lot":                             "house_no",
  "Street":                                              "street",
  "How many are you in the Household? Number(s) Only":   "head_count",
};

const REQUIRED_FIELDS = ["f_name", "l_name", "house_no", "street", "head_count"];

// Non-constant fields — things that can change about a household
const NON_CONSTANT_FIELDS = ["m_name", "suffix", "house_no", "street", "head_count"];

// house_no comes in as a float (e.g. 17.0) — convert to a clean string
const parseHouseNo = (value) => {
  if (value === "" || value == null) return null;
  const num = parseFloat(value);
  if (!isNaN(num)) return String(Math.round(num));
  return String(value).trim() || null;
};

// head_count comes in as a float (e.g. 25.0) — convert to integer
const parseHeadCount = (value) => {
  if (value === "" || value == null) return null;
  const num = parseFloat(value);
  return !isNaN(num) ? Math.round(num) : null;
};

const normalizeStr = (v) => String(v == null ? "" : v).trim().toLowerCase();

const rowsMatch = (incoming, existing) => {
  for (const field of NON_CONSTANT_FIELDS) {
    if (field === "head_count") {
      if (Number(incoming[field]) !== Number(existing[field])) return false;
    } else {
      if (normalizeStr(incoming[field]) !== normalizeStr(existing[field])) return false;
    }
  }
  return true;
};

const previewImportHouseholds = (req, res) => {
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

    row.f_name     = String(row.f_name || "").trim();
    row.m_name     = String(row.m_name || "").trim() || null;
    row.l_name     = String(row.l_name || "").trim();
    row.suffix     = String(row.suffix || "").trim() || null;
    row.house_no   = parseHouseNo(row.house_no);
    row.street     = String(row.street || "").trim();
    row.head_count = parseHeadCount(row.head_count);
    row._id        = `row_${index}`;
    row._rowNumber = index + 2;

    return row;
  });

  // Separate valid from invalid (missing required fields)
  const validRows = [];
  const errorRows = [];

  for (const row of mapped) {
    const missing = REQUIRED_FIELDS.filter((f) => !row[f] && row[f] !== 0);
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
      SELECT * FROM households
      WHERE l_name = ? AND f_name = ? AND house_no = ? AND street = ?
      LIMIT 1
    `;

    db.query(checkSql, [row.l_name, row.f_name, row.house_no, row.street], (err, results) => {
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
            existing_id: existing.household_id,
          };
        } else {
          // Existing record but has changes — YELLOW
          categorized = {
            ...row,
            status: "yellow",
            statusReason: "Existing record with changes — will be updated",
            enabled: true,
            existing_id: existing.household_id,
          };
        }
      }

      resultRows.push(categorized);
      processed++;
      checkDone();
    });
  }
};

module.exports = { previewImportHouseholds };