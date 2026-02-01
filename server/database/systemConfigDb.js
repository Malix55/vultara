const express = require("express");
const router = express.Router();
const SystemConfigSchema = require("../models/systemConfigSchema").SystemConfigSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const SystemConfigModel = atlasTrialDbConnection.model("systemConfigModel", SystemConfigSchema, "systemConfig");

router
    .route("/systemconfig")
    .get(async (req, res, next) => {
        try {
            let configParam = await SystemConfigModel.find({id: "systemConfiguration"});
            res.json(configParam[0]);
        } catch (err) {
            console.log(err.stack)
            res.status(500).send("System config file doesn't exist or database is busy.");
        }
    })
    .post(async (req, res, next) => {
        try {
            // console.log(req.body);
            const filter = {id: "systemConfiguration"};
            const update = {
                mitreAttackMethod: req.body.mitreAttackMethod,
                feasibilityMethod: req.body.feasibilityMethod,
                riskMethod: req.body.riskMethod,
                riskMatrix: req.body.riskMatrix,
                feasibilityValue: req.body.feasibilityValue
            };

            let updatedObj = await SystemConfigModel.findOneAndUpdate(filter, { $set: update }, {
                new: true,
                upsert: true,
                useFindAndModify: false
            })
            .select("feasibilityMethod");
            res.status(200).send(updatedObj);
        } catch (err) {
            res.status(500).send("System config update failed. The config file doesn't exist or database is busy.");
        }
    }).patch(async (req, res, next) => {
        try {
            const filter = {id: "systemConfiguration"};
            const update = { allowedDomains: req.body.domains };
            
            let doc = await SystemConfigModel.findOneAndUpdate(filter, update);
            
            res.status(200).send({msg:"Domain names successfully updated"});
        } catch (err) {
            res.status(500).send("System config update failed. The config file doesn't exist or database is busy.");
        }
    })

module.exports = router;
