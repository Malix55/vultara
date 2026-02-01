const mongoose = require("mongoose");

const MitreAttackSchema = new mongoose.Schema({
    matrix: [String],
    type: String,
    name: String,
    vId: Number,
    tactic: [Number],
    technique: Array,
    description: String,
    mitreId: String,
    threatFeaLibAdvId: Array
}, { timestamps: true });
module.exports.MitreAttackSchema = MitreAttackSchema;
