const mongoose = require("mongoose");

const SystemConfigSchema = new mongoose.Schema({
    id: String,
    mitreAttackMethod: String,
    feasibilityMethod: String,
    feasibilityRatingAP: [Number],
    feasibilityRatingCVSS: [Number],
    feasibilityRatingAV: [[String]],
    feasibilityValue: String,
    riskMethod: String,
    impactAggMethod: String,
    impactLevelName: [String],
    feasibilityLevelName: [String],
    riskMatrix: [[[Number]]],
    allowedDomains:[String]
}, {timestamps: true});
module.exports.SystemConfigSchema = SystemConfigSchema;
