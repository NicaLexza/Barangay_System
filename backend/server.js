// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const userAddRoutes = require("./routes/userAddRoutes");
const userEditRoutes = require("./routes/userEditRoutes");
const userDeleteRoutes = require("./routes/userDeleteRoutes");
const userChangePassRoutes = require("./routes/userChangePassRoutes");

const residentRoutes = require("./routes/residentRoutes");
const residentAddRoutes = require("./routes/residentAddRoutes");
const residentEditRoutes = require("./routes/residentEditRoutes");
const residentDeleteRoutes = require("./routes/residentDeleteRoutes");
const residentBulkImportRoutes = require("./routes/residentBulkImportRoutes");

const householdRoutes = require("./routes/householdRoutes");
const householdAddRoutes = require("./routes/householdAddRoutes");
const householdEditRoutes = require("./routes/householdEditRoutes");
const householdDeleteRoutes = require("./routes/householdDeleteRoutes");
const householdBulkImportRoutes = require("./routes/householdBulkImportRoutes");

const eligibilityFormAddRoutes = require("./routes/EligibilityFormAddRoutes");
const eligibilityFormRoutes = require("./routes/eligibilityFormRoutes");
const eligibilityFormDeleteRoutes = require("./routes/eligibilityFormDeleteRoutes");

const eligibilityFormEntriesRoutes = require("./routes/eligibilityFormEntriesRoutes");
const eligibilityFormEntriesUpdateRoutes = require("./routes/eligibilityFormEntriesUpdateRoutes");
const eligibilityFormEntriesDeleteRoutes = require("./routes/eligibilityFormEntriesDeleteRoutes");


// use routes

app.use("/api/auth", authRoutes);
app.use("/api/users", userEditRoutes);
app.use("/api/users", userDeleteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", userAddRoutes);
app.use("/api/users", userChangePassRoutes);

app.use("/api/residents", residentRoutes);
app.use("/api/residents", residentAddRoutes);
app.use("/api/residents", residentEditRoutes);
app.use("/api/residents", residentDeleteRoutes);
app.use("/api/residents", residentBulkImportRoutes);

app.use("/api/households", householdRoutes);
app.use("/api/households", householdAddRoutes);
app.use("/api/households", householdEditRoutes);
app.use("/api/households", householdDeleteRoutes);
app.use("/api/households", householdBulkImportRoutes);

app.use("/api/eligibility-forms", eligibilityFormAddRoutes);
app.use("/api/eligibility-forms", eligibilityFormRoutes);
app.use("/api/eligibility-forms", eligibilityFormDeleteRoutes);

app.use("/api/eligibility-forms", eligibilityFormEntriesRoutes);
app.use("/api/eligibility-forms", eligibilityFormEntriesUpdateRoutes);
app.use("/api/eligibility-forms", eligibilityFormEntriesDeleteRoutes);

// start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});