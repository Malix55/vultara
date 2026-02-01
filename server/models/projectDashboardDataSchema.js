const mongoose = require("mongoose");

const DataSeries = new mongoose.Schema({
    name: String,
    value: Number
});

const ProjectDashboardDataSchema = new mongoose.Schema({
    id: { type: String, index: true },
    dashboardDataType: String, // detects the dashboard data type
    name: String, // chart X axis name that defines the time slot for showing data.
    series: [DataSeries] // axis value to show in the chart
}, { timestamps: true });

module.exports = { ProjectDashboardDataSchema };