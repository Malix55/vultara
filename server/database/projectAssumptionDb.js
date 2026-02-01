const express = require("express");
const router = express.Router();
const ProjectAssumptionSchema = require("../models/projectModelSchema").projectAssumptionSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const ProjectAssumptionModel = atlasTrialDbConnection.model("ProjectAssumptionModel", ProjectAssumptionSchema, "projectAssumption");
const ObjectID = require('mongodb').ObjectId;
router
    .route("/:projectId")
    //get assumption by project ID and other conditions
    .get(async (req, res) => {
        try {
            let projectAssumption = [];
            projectAssumption = await ProjectAssumptionModel.find({ "projectId": req.params.projectId });
            res.status(200).json(projectAssumption);
        } catch (err) {
            console.log(err)
            res.status(500).send("Error: Assumption database GET request failed!");
        }
    })
    // add, update, delete assumption
    .post(async (req, res) => {
        try {
            const updateQuery = req?.body?.updated ? req?.body?.updated?.map(assumptionToUpdate => {
                return {
                    updateOne: {
                        'filter': { _id: new ObjectID(assumptionToUpdate._id) },
                        'update': {
                            ...assumptionToUpdate
                        }
                    }
                }
            }) : []
            const addQuery = req.body?.added ? req.body?.added?.map(assumptionToAdd => ({ insertOne: { document: assumptionToAdd } })) : []
            const deleteQuery = req.body?.deleted ? req.body?.deleted?.map(assumptionToDelete => ({
                deleteMany: {
                    'filter': { _id: new ObjectID(assumptionToDelete._id) },
                }
            })) : [];
            const query = [...updateQuery, ...addQuery, ...deleteQuery]
            const resp = await ProjectAssumptionModel.bulkWrite(query)
            res.status(200).json({ resp: resp, status: true });
        } catch (err) {
            console.log(err)
            res.status(500).send("Error: Assumption database POST request failed!");
        }
    }).patch(async (req, res) => {
        try {
            if (req.body.singleUpdate) { //Patch single assumption
                const update = req.body.assumption;
                const vulnerability = await ProjectAssumptionModel.updateOne({ _id: new ObjectID(update._id) }, update)
                res.status(200).send({ msg: "Assumption have been updated" });
            }
        } catch (err) {
            console.log(err)
            res.status(500).send("Error: Assumption database update request failed!");
        }
    })
module.exports = router;