const express = require("express");
const authRoutes = require("./routes/authRoutes");
const timeOffRoutes = require("./routes/timeOffRoutes");
const leavePolicyRoutes = require("./routes/leavePolicyRoutes");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());


app.use("/auth", authRoutes);
app.use("/requests", timeOffRoutes);
app.use("/policies", leavePolicyRoutes);

module.exports = app;