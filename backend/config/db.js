// backend/config/db.js
const mysql2 = require("mysql2");

const db = mysql2.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "barangay",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("Database connection failed", err);
  } else {
    console.log("Connected to MySQL Database");
    connection.release();
  }
});

module.exports = db;
