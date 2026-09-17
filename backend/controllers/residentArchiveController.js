// controllers/residentArchiveController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

/**
 * PUT /api/residents/archive/:id
 * Archives a resident (is_archived = 1). Available to Admin and Staff.
 * This REPLACES the old hard DELETE — residents are never permanently
 * removed anymore, only hidden from the active list and from eligibility
 * qualification. Restoring (Admin-only) simply reverses this.
 */
const archiveResident = (req, res) => {
  const { id } = req.params;
  const performed_by = req.user.id;

  if (!id) return res.status(400).json({ message: "Missing id" });

  db.query(
    "SELECT f_name, l_name, is_archived FROM residents WHERE resident_id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(404).json({ message: "Resident not found" });
      if (results[0].is_archived) {
        return res.status(409).json({ message: "This resident is already archived." });
      }

      const residentName = `${results[0].f_name || ""} ${results[0].l_name || ""}`.trim();

      const sql = `
        UPDATE residents
        SET is_archived = 1, archived_by = ?, archived_at = NOW()
        WHERE resident_id = ?
      `;

      db.query(sql, [performed_by, id], (err2) => {
        if (err2) {
          console.error("Archive resident error:", err2);
          return res.status(500).json({ message: "Failed to archive resident", error: err2.message });
        }

        res.json({ message: "Resident archived" });

        logActivity({
          entity_type: "Resident",
          entity_id: id,
          entity_name: residentName,
          action_type: "archived",
          performed_by,
        });
      });
    }
  );
};

/**
 * GET /api/residents/archived
 * Lists archived residents. Viewable by both Admin and Staff (matches who
 * can archive), but only Admin can act on the Restore button the frontend
 * shows here — enforced server-side in restoreResident below regardless of
 * what the UI hides.
 *
 * Returns the SAME field shape as residentController.js's getAllResidents
 * (specialSector, address, occupation, citizenship, household fields,
 * created_at) rather than just the columns the Archived Residents table
 * displays — this lets ResidentStatsModal.jsx merge this data directly
 * into its active-residents dataset when its "include archived" checkbox
 * is used, without needing a second, differently-shaped fetch path.
 */
const getArchivedResidents = (req, res) => {
  const sql = `
    SELECT
      r.resident_id,
      CONCAT_WS(' ', r.f_name, r.m_name, r.l_name, r.suffix) AS fullName,
      DATE_FORMAT(r.birthdate, '%Y-%m-%d') AS birthdate,
      r.sex,
      r.civil_status AS civilStatus,
      CONCAT_WS(' ', r.house_no, r.street) AS address,
      r.occupation,
      r.citizenship,
      CONCAT(
        IF(r.is_pwd = 1, 'PD, ', ''),
        IF(r.is_senior = 1, 'S, ', ''),
        IF(r.is_solop = 1, 'SP', '')
      ) AS specialSector,
      r.is_household_head,
      r.household_member_count,
      DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      DATE_FORMAT(r.archived_at, '%Y-%m-%d %H:%i:%s') AS archived_at,
      ab.fullname AS archived_by_name
    FROM residents r
    LEFT JOIN users ab ON ab.user_id = r.archived_by
    WHERE r.is_archived = 1
    ORDER BY r.archived_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", err });

    // Same specialSector trailing-comma cleanup as getAllResidents, so
    // downstream consumers (this page's table, and the merged Stats
    // modal dataset) never have to special-case archived rows' formatting.
    const formatted = results.map((row) => {
      let sector = (row.specialSector || "").trim();
      if (sector.endsWith(",")) sector = sector.slice(0, -1).trim();
      return { ...row, specialSector: sector || "None" };
    });

    res.status(200).json(formatted);
  });
};

/**
 * PUT /api/residents/archived/:id/restore
 * Admin-only. Reverses an archive — no permanent-delete path exists for
 * residents at all, so this is the only way an archived record changes
 * state again besides staying archived.
 */
const restoreResident = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can restore archived residents." });
  }

  const { id } = req.params;
  const performed_by = req.user.id;

  db.query(
    "SELECT f_name, l_name, is_archived FROM residents WHERE resident_id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(404).json({ message: "Resident not found" });
      if (!results[0].is_archived) {
        return res.status(409).json({ message: "This resident is not archived." });
      }

      const residentName = `${results[0].f_name || ""} ${results[0].l_name || ""}`.trim();

      const sql = `
        UPDATE residents
        SET is_archived = 0, archived_by = NULL, archived_at = NULL
        WHERE resident_id = ?
      `;

      db.query(sql, [id], (err2) => {
        if (err2) {
          console.error("Restore resident error:", err2);
          return res.status(500).json({ message: "Failed to restore resident", error: err2.message });
        }

        res.json({ message: "Resident restored" });

        logActivity({
          entity_type: "Resident",
          entity_id: id,
          entity_name: residentName,
          action_type: "restored",
          performed_by,
        });
      });
    }
  );
};

module.exports = { archiveResident, getArchivedResidents, restoreResident };