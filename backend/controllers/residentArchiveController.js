// controllers/residentArchiveController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

/**
 * PUT /api/residents/archive/:id
 * Archives a resident (is_archived = 1). Available to Admin and Staff.
 *
 * Household-aware logic:
 * - If archiving a HEAD with members: auto-promotes the oldest member
 *   (earliest birthdate) to head first, then archives the original head.
 *   The household continues uninterrupted under the new head.
 * - If archiving a HEAD with no members: straightforward archive.
 * - If archiving a MEMBER: just flips is_archived; immediately excluded
 *   from the head's live member list/count.
 */
const archiveResident = (req, res) => {
  const { id } = req.params;
  const performed_by = req.user.id;

  if (!id) return res.status(400).json({ message: "Missing id" });

  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ message: "Database connection error" });

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        return res.status(500).json({ message: "Transaction start failed" });
      }

      // 1. Fetch the target resident
      connection.query(
        "SELECT resident_id, f_name, l_name, is_household_head, is_archived FROM residents WHERE resident_id = ?",
        [id],
        (err, results) => {
          if (err) return rollback(connection, res, "Database error");
          if (results.length === 0) return rollback(connection, res, "Resident not found", 404);
          if (results[0].is_archived) return rollback(connection, res, "This resident is already archived.", 409);

          const resident = results[0];
          const residentName = `${resident.f_name || ""} ${resident.l_name || ""}`.trim();

          // If NOT a head, just archive directly
          if (!resident.is_household_head) {
            return doArchive(connection, res, id, residentName, performed_by);
          }

          // HEAD — check for non-archived members
          connection.query(
            `SELECT resident_id, f_name, l_name, birthdate
             FROM residents
             WHERE head_resident_id = ? AND is_archived = 0
             ORDER BY birthdate ASC
             LIMIT 1`,
            [id],
            (err2, members) => {
              if (err2) return rollback(connection, res, "Database error checking members");

              if (members.length === 0) {
                // Head with no members — archive directly
                return doArchive(connection, res, id, residentName, performed_by);
              }

              // Head WITH members — auto-promote the oldest member
              const promoted = members[0];
              const promotedName = `${promoted.f_name || ""} ${promoted.l_name || ""}`.trim();

              // 2a. Copy head's address onto promoted member + flip to head
              connection.query(
                `UPDATE residents
                 SET house_no = (SELECT house_no FROM (SELECT house_no FROM residents WHERE resident_id = ?) AS tmp),
                     street = (SELECT street FROM (SELECT street FROM residents WHERE resident_id = ?) AS tmp),
                     is_household_head = 1,
                     head_resident_id = NULL
                 WHERE resident_id = ?`,
                [id, id, promoted.resident_id],
                (err3) => {
                  if (err3) return rollback(connection, res, "Failed to promote member");

                  // 2b. Repoint all other members to the new head
                  connection.query(
                    `UPDATE residents
                     SET head_resident_id = ?
                     WHERE head_resident_id = ?
                       AND resident_id != ?
                       AND is_archived = 0`,
                    [promoted.resident_id, id, promoted.resident_id],
                    (err4) => {
                      if (err4) return rollback(connection, res, "Failed to repoint members");

                      // 2c. Now archive the original head
                      doArchive(connection, res, id, residentName, performed_by, {
                        promotedId: promoted.resident_id,
                        promotedName,
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

/** Helper: archives a resident and commits the transaction. */
function doArchive(connection, res, id, residentName, performed_by, promotion = null) {
  connection.query(
    `UPDATE residents
     SET is_archived = 1,
         archived_by = ?,
         archived_at = NOW()
     WHERE resident_id = ?`,
    [performed_by, id],
    (err) => {
      if (err) return rollback(connection, res, "Failed to archive resident");

      connection.commit((commitErr) => {
        connection.release();
        if (commitErr) return res.status(500).json({ message: "Transaction commit failed" });

        const responseData = { message: "Resident archived" };
        if (promotion) {
          responseData.promoted = promotion;
        }
        res.json(responseData);

        logActivity({
          entity_type: "Resident",
          entity_id: id,
          entity_name: residentName,
          action_type: "archived",
          performed_by,
        });

        if (promotion) {
          logActivity({
            entity_type: "Resident",
            entity_id: promotion.promotedId,
            entity_name: promotion.promotedName,
            action_type: "head_transferred",
            performed_by,
            details: `Auto-promoted to household head when ${residentName} was archived`,
          });
        }
      });
    }
  );
}

/** Helper: rolls back and sends error. */
function rollback(connection, res, message, status = 500) {
  connection.rollback(() => {
    connection.release();
    res.status(status).json({ message });
  });
}

/**
 * GET /api/residents/archived
 * Lists archived residents. Viewable by both Admin and Staff (matches who
 * can archive), but only Admin can act on the Restore button the frontend
 * shows here — enforced server-side in restoreResident below regardless of
 * what the UI hides.
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
      r.head_resident_id,
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
 * Admin-only. Reverses an archive.
 *
 * Household-aware: if the resident's original head no longer exists or is
 * itself archived, restore them as an independent head-of-one instead of
 * erroring. Residents that were heads when archived are always restored
 * as heads-of-one (their old household may have a new head now).
 */
const restoreResident = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can restore archived residents." });
  }

  const { id } = req.params;
  const performed_by = req.user.id;

  db.query(
    "SELECT f_name, l_name, is_archived, head_resident_id FROM residents WHERE resident_id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(404).json({ message: "Resident not found" });
      if (!results[0].is_archived) {
        return res.status(409).json({ message: "This resident is not archived." });
      }

      const resident = results[0];
      const residentName = `${resident.f_name || ""} ${resident.l_name || ""}`.trim();
      const headId = resident.head_resident_id;

      // Decide: can the resident return to their old head, or do they
      // become an independent head-of-one?
      const restoreAsHeadOfOne = () => {
        const sql = `
          UPDATE residents
          SET is_archived = 0,
              archived_by = NULL,
              archived_at = NULL,
              is_household_head = 1,
              head_resident_id = NULL
          WHERE resident_id = ?
        `;

        db.query(sql, [id], (err2) => {
          if (err2) {
            console.error("Restore resident error:", err2);
            return res.status(500).json({ message: "Failed to restore resident", error: err2.message });
          }

          // If restored as head-of-one but has no address (was a member),
          // they'll need to set one via edit. That's acceptable — better
          // than blocking the restore entirely.
          res.json({ message: "Resident restored as independent household head" });

          logActivity({
            entity_type: "Resident",
            entity_id: id,
            entity_name: residentName,
            action_type: "restored",
            performed_by,
          });
        });
      };

      const restoreAsMember = () => {
        const sql = `
          UPDATE residents
          SET is_archived = 0,
              archived_by = NULL,
              archived_at = NULL,
              is_household_head = 0,
              head_resident_id = ?
          WHERE resident_id = ?
        `;

        db.query(sql, [headId, id], (err2) => {
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
      };

      // No head reference → restore as head-of-one
      if (!headId) {
        return restoreAsHeadOfOne();
      }

      // Check if the original head still exists and is active
      db.query(
        "SELECT resident_id, is_archived, is_household_head FROM residents WHERE resident_id = ?",
        [headId],
        (err3, headResults) => {
          if (err3) return res.status(500).json({ message: "Database error" });

          if (
            headResults.length === 0 ||
            headResults[0].is_archived ||
            !headResults[0].is_household_head
          ) {
            // Original head gone/archived/demoted → restore as head-of-one
            return restoreAsHeadOfOne();
          }

          // Original head is still active → restore as member
          return restoreAsMember();
        }
      );
    }
  );
};

module.exports = { archiveResident, getArchivedResidents, restoreResident };