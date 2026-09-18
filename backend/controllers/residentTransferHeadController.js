// controllers/residentTransferHeadController.js
const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

/**
 * POST /api/residents/household/:headId/transfer/:memberId
 *
 * Transfers household headship from one resident to another within the
 * same household. One DB transaction:
 *
 * 1. Copy the household's address onto the promoted member.
 * 2. Flip head flags:
 *    - promoted member → head (is_household_head = 1, head_resident_id = NULL)
 *    - old head → member (is_household_head = 0, head_resident_id = promoted)
 * 3. Repoint every other existing member's head_resident_id from old → new.
 * 4. logActivity entry (action_type = "head_transferred").
 *
 * Only offerable for residents already in the same household — the frontend
 * restricts the selection accordingly.
 */
const transferHeadship = (req, res) => {
  const { headId, memberId } = req.params;
  const performed_by = req.user.id;

  if (!headId || !memberId) {
    return res.status(400).json({ message: "Both headId and memberId are required" });
  }

  if (headId === memberId) {
    return res.status(400).json({ message: "Cannot transfer headship to the same person" });
  }

  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ message: "Database connection error" });

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        return res.status(500).json({ message: "Transaction start failed" });
      }

      // 1. Verify both residents exist and are in the same household
      connection.query(
        `SELECT resident_id, f_name, l_name, is_household_head, head_resident_id,
                house_no, street, is_archived
         FROM residents
         WHERE resident_id IN (?, ?)`,
        [headId, memberId],
        (err, rows) => {
          if (err) return rollback(connection, res, "Database error");

          const headRow = rows.find(r => r.resident_id === parseInt(headId));
          const memberRow = rows.find(r => r.resident_id === parseInt(memberId));

          if (!headRow || !memberRow) {
            return rollback(connection, res, "One or both residents not found", 404);
          }
          if (headRow.is_archived || memberRow.is_archived) {
            return rollback(connection, res, "Cannot transfer headship involving archived residents", 400);
          }
          if (!headRow.is_household_head) {
            return rollback(connection, res, "The specified head is not a household head", 400);
          }
          if (memberRow.head_resident_id !== parseInt(headId)) {
            return rollback(connection, res, "The specified member does not belong to this household", 400);
          }

          const headName = `${headRow.f_name || ""} ${headRow.l_name || ""}`.trim();
          const memberName = `${memberRow.f_name || ""} ${memberRow.l_name || ""}`.trim();

          // 2a. Copy head's address onto promoted member + flip to head
          connection.query(
            `UPDATE residents
             SET house_no = ?,
                 street = ?,
                 is_household_head = 1,
                 head_resident_id = NULL
             WHERE resident_id = ?`,
            [headRow.house_no, headRow.street, memberId],
            (err2) => {
              if (err2) return rollback(connection, res, "Failed to promote member");

              // 2b. Demote old head → member under new head
              connection.query(
                `UPDATE residents
                 SET is_household_head = 0,
                     head_resident_id = ?
                 WHERE resident_id = ?`,
                [memberId, headId],
                (err3) => {
                  if (err3) return rollback(connection, res, "Failed to demote old head");

                  // 2c. Repoint all other members to new head
                  connection.query(
                    `UPDATE residents
                     SET head_resident_id = ?
                     WHERE head_resident_id = ?
                       AND resident_id != ?`,
                    [memberId, headId, memberId],
                    (err4) => {
                      if (err4) return rollback(connection, res, "Failed to repoint members");

                      // Commit
                      connection.commit((commitErr) => {
                        connection.release();
                        if (commitErr) {
                          return res.status(500).json({ message: "Transaction commit failed" });
                        }

                        res.json({
                          message: `Headship transferred from ${headName} to ${memberName}`,
                        });

                        logActivity({
                          entity_type: "Resident",
                          entity_id: parseInt(memberId),
                          entity_name: memberName,
                          action_type: "head_transferred",
                          performed_by,
                          details: `Headship transferred from ${headName} (ID ${headId}) to ${memberName} (ID ${memberId})`,
                        });
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

/** Helper: rolls back and sends error. */
function rollback(connection, res, message, status = 500) {
  connection.rollback(() => {
    connection.release();
    res.status(status).json({ message });
  });
}

module.exports = { transferHeadship };
