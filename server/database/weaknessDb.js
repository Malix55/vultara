const express = require("express");
const router = express.Router();
const projectWeaknessSchema = require('../models/projectWeaknessSchema').ProjectWeaknessSchema
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const projectWeaknessModel = atlasTrialDbConnection.model("projectWeaknessModel", projectWeaknessSchema, "projectWeakness");
const ObjectID = require('mongodb').ObjectId;

router
    .route("/:projectId")
    //get weaknesses by projectId
    .get(async (req, res) => {
        try {
            if (req.query.activeData == "true") {// Get weaknesses which are in the active tab
                const projectWeakness = await projectWeaknessModel.find({ "analysisReviewed": true, "vulnerabilityAnalysis": "Completed", "exploitable": "Yes", "projectId": req.params.projectId, });
                res.status(200).json(projectWeakness);
            } else {
                const projectWeakness = await projectWeaknessModel.find({ "projectId": req.params.projectId });
                res.status(200).json(projectWeakness);
            }
        } catch (err) {
            res.status(500).send("Error: Weakness database GET request failed!");
        }
    })
    .post(async (req, res) => {
        try {//Add a new weakness
            const count = await projectWeaknessModel.find({ "projectId": req.body.projectId }).sort({ _id: -1 }).limit(1);
            const data = req.body.data;
            if (count.length) {
                data.weaknessNumber = count[0].weaknessNumber + 1;
            } else {
                data.weaknessNumber = 1;
            }
            const weakness = new projectWeaknessModel(data);
            weakness.save((err, weakness) => {
                if (weakness) {
                    res.status(200).send(weakness)
                }
            })
        } catch (err) {
            res.status(500).send("Error: Weakness database Create request failed!");
        }
    })
    // Delete weakness by _id.
    .delete(async (req, res) => {
        try {
            const weakness = await projectWeaknessModel.deleteOne({ _id: new ObjectID(req.query._id) }).then((weakness) => {
                res.status(200).send({ msg: "Weakness has been deleted successfully!" });
            })
        } catch (err) {
            res.status(500).send("Error: Weakness database DELETE request failed!");
        }
    }).patch(async (req, res) => {
        try {
            if (req.body.singleUpdate) { //Patch single weakness
                const update = req.body.res;
                const weakness = await projectWeaknessModel.updateOne({ _id: new ObjectID(update._id) }, update).then(((result) => {
                    if (result) {
                        res.status(200).send(result);
                    }
                }))
            }
            if (req.body.linkWeakness) {//Link vulnerabilities to a weakness
                const weaknesses = [req.body.weaknessData];
                const bulkOps = weaknesses.map(obj => {
                    return {
                        updateOne: {
                            filter: {
                                _id: obj._id
                            },
                            update: {
                                linkedVulnerabilities: obj.linkedVulnerabilities
                            }
                        }
                    }
                })
                projectWeaknessModel.bulkWrite(bulkOps).then((data) => {
                    if(data){
                      res.status(200).send({msg:'Success'});
                    }
                })

            }
            if (req.body.linkedVulnerabilities) {
                const vulnerabilities = req.body.weaknesses;
                const bulkOps = vulnerabilities.map(obj => {
                    return {
                        updateOne: {
                            filter: {
                                _id: obj._id
                            },
                            update: {
                                linkedVulnerabilities: obj.linkedVulnerabilities
                            }
                        }
                    }
                })
                projectWeaknessModel.bulkWrite(bulkOps).then((data => {
                    if(data){
                      res.status(200).send({msg:'Success'});
                    }
                }))
            }
            if (req.body.removeVulnerabilities) {//Remove vulnerabilities by id from all weakness
                const vulnerabilities = req.body.data;
                const bulkOps = vulnerabilities.map(obj => {
                    return {
                        updateOne: {
                            filter: {
                                _id: obj._id
                            },
                            update: {
                                "$pull": { "linkedVulnerabilities": obj.linkedVulnerabilities }
                            }
                        }
                    }
                })
                projectWeaknessModel.bulkWrite(bulkOps).then((data) => {
                    if(data){
                      res.status(200).send({msg:'Success'});
                    }
                })
            }
            // if (req.body.previousId) {// Copy existing vulnerabilities from previous project to new project and update projectId
            //     const projectVulnerbilities = await projectVulnerabilityModel.find({ projectId: req.body.previousId }, '-_id', async (err, result) => {
            //         if (result) {
            //             result.forEach(item => {
            //                 item.projectId = req.params.projectId;
            //             })
            //             const updatedVulnerbilities = await projectVulnerabilityModel.insertMany(result)
            //         }
            //     })
            //     res.status(200).send('');
            // }
        } catch (err) {
            res.status(500).send("Error: Weakness database UPDATE request failed!");
        }
    })

module.exports = router;
