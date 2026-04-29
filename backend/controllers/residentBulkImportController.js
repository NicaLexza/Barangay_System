// controllers/residentBulkImportController.js
const db = require("../config/db");
const xlsx = require("xlsx");

// Column mapping from Google Form export headers to DB fields
const COLUMN_MAP = {
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
  "Is Senior Citizen?":                "is_senior",
  "Is Solo Parent?":                   "is_solop",
};

const REQUIRED_FIELDS = ["f_name", "l_name", "sex", "birthdate", "birthplace", "street", "civil_status"];

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
    row.is_senior   = parseYesNo(row.is_senior);
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
        reason: `Missing required fields: ${missing.join(", ")}`,
      });
    } else {
      validRows.push(row);
    }
  }

  if (validRows.length === 0) {
    return res.status(400).json({
      message: "No valid rows found to import.",
      imported: 0,
      skipped: 0,
      errors: errorRows,
    });
  }

  // Process each valid row: check duplicate then insert
  let imported = 0;
  let skipped = 0;
  const skippedRows = [];
  let processed = 0;

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

      const insertSql = `
        INSERT INTO residents (
          f_name, m_name, l_name, suffix, sex, birthdate, birthplace,
          house_no, street, civil_status, occupation, citizenship,
          is_pwd, is_senior, is_solop, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        ],
        (err2) => {
          if (err2) {
            errorRows.push({
              row: row._rowNumber,
              name: `${row.f_name} ${row.l_name}`,
              reason: "Insert failed: " + err2.message,
            });
          } else {
            imported++;
          }
          processed++;
          checkDone();
        }
      );
    });
  };

  const checkDone = () => {
    if (processed === validRows.length) {
      return res.status(200).json({
        message: `Import complete.`,
        imported,
        skipped,
        errors: errorRows,
        skippedDetails: skippedRows,
      });
    }
  };

  // Kick off all rows
  for (const row of validRows) {
    checkAndInsert(row);
  }
};

module.exports = { bulkImportResidents };