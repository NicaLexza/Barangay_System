// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const residentRoutes = require("./routes/residentRoutes");
const residentAddRoutes = require("./routes/residentAddRoutes");

// use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/residents", residentAddRoutes);

// start server

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
