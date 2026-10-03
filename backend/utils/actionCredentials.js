// utils/actionCredentials.js
//
// Credential gate for sensitive eligibility-form actions (Enable, Disable,
// Archive, Edit details).
//
// Unlike the backup/restore/ranked-create re-auth (which only accepts the
// logged-in user's OWN credentials), this gate has two modes:
//
//  - Logged-in Admin: must submit their OWN username + password.
//  - Logged-in Staff: must submit ANY active Admin's username + password.
//
// Every credential failure returns the same generic 401 so a Staff user
// can't use this to probe which usernames are admins or which are inactive.
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const INVALID = { status: 401, message: "Invalid credentials." };

// Compared against when the username doesn't exist, so a wrong username and
// a wrong password take about the same time to reject.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const queryAsync = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

/**
 * Resolves with:
 *   { actingAdmin: <users row — use its user_id as performed_by>,
 *     requestedBy: <staff username, or null when the actor is an Admin> }
 * Rejects with { status, message }.
 */
const verifyActionCredentials = async (req) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    throw { status: 400, message: "Username and password are required." };
  }

  const actorRole = req.user.role;
  const submittedUsername = username.trim();
  let rows;

  try {
    if (actorRole === "Admin") {
      rows = await queryAsync("SELECT * FROM users WHERE username = ? AND user_id = ?", [
        submittedUsername,
        req.user.id,
      ]);
    } else if (actorRole === "Staff") {
      rows = await queryAsync("SELECT * FROM users WHERE username = ? AND role = 'Admin'", [
        submittedUsername,
      ]);
    } else {
      throw { status: 403, message: "Your role cannot perform this action." };
    }
  } catch (e) {
    if (e && e.status) throw e;
    console.error("[verifyActionCredentials] DB error:", e && e.message);
    throw { status: 500, message: "Database error" };
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  if (!user || !isMatch || user.status !== "Active") throw INVALID;

  return {
    actingAdmin: user,
    requestedBy: actorRole === "Staff" ? req.user.username : null,
  };
};

/**
 * Builds the `details` object for logActivity. Only includes requested_by
 * when Staff initiated the action (an Admin acting for themselves is already
 * identified by performed_by).
 */
const requestDetails = (requestedBy, extra = {}) => {
  const details = { ...extra };
  if (requestedBy) details.requested_by = requestedBy;
  return Object.keys(details).length > 0 ? details : null;
};

module.exports = { verifyActionCredentials, requestDetails };