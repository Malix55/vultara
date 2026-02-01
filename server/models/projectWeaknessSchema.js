const mongoose = require("mongoose");

const ProjectWeaknessSchema = new mongoose.Schema({
   weaknessNumber: Number,
   dateIdentified: Date,
   identificationMethod: String,
   sourceNotes: String,
   component: String,
   attackSurface: String,
   asset: String,
   weaknessDescription: String,
   cweId: Number,
   cweWeaknessType: String,
   cweWeaknessCategory: String,
   vulnerabilityAnalysis: { type: String, default: "Not started" },
   projectId: String,
   exploitable: String,
   exploitableRationale: String,
   preControlRiskValue: String,
   riskRationale: String,
   analysisReviewed: { type: Boolean, default: false },
   linkedVulnerabilities: [String],
   highlighted: Boolean,
   sourceLink:String
}, { timestamps: true });

module.exports = { ProjectWeaknessSchema };