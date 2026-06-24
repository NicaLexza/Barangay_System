// utils/passwordGenerator.js
const crypto = require("crypto");

// Excludes visually ambiguous characters (0/O, 1/l/I, lowercase o)
// so the password is easy to read and relay to a new user.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/**
 * Generates a cryptographically secure random password.
 * Intended for one-time temporary passwords (must_change_password = 1).
 * Never persisted in plaintext — caller must hash before storing
 * and should not log it anywhere persistent.
 *
 * @param {number} length — number of characters to generate (default 6)
 * @returns {string}
 */
const generateRandomPassword = (length = 6) => {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += CHARSET[crypto.randomInt(0, CHARSET.length)];
  }
  return password;
};

module.exports = { generateRandomPassword };