const express = require("express");
const router = express.Router();
const MitreAttackSchema = require("../models/mitreAttackSchema").MitreAttackSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const algoDbConnection = require("./atlasTrialDatabaseConnect").atlasAlgorithmDbConnection;
const MitreAttackModel = algoDbConnection.model("mitreAttackModel", MitreAttackSchema, "mitreAttackDb");
const SystemConfigSchema = require("../models/systemConfigSchema").SystemConfigSchema;
const SystemConfigModel = atlasTrialDbConnection.model("systemConfigModel", SystemConfigSchema, "systemConfig");

router
    .route("/")
    .get(async (req, res, next) => {
        try {
            let configParam = await SystemConfigModel.findOne({ id: "systemConfiguration" }, { _id: 0, mitreAttackMethod: 1 });
            let mitreAttackTactics = await MitreAttackModel.find({ matrix: [configParam.mitreAttackMethod.toLowerCase()] });
            res.status(200).send(mitreAttackTactics);
        } catch (err) {
            res.status(500).send("System config file doesn't exist or database is busy.");
        }
    });

module.exports = router;
