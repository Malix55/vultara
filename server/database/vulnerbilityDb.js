const express = require("express");
const router = express.Router();
const cryptoService = require("../service/cryptoService");
const projectVulnerabilitySchema = require('../models/projectVulnerabilitySchema').ProjectVulnerabilitySchema
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const projectVulnerabilityModel = atlasTrialDbConnection.model("projectVulnerabilityModel", projectVulnerabilitySchema, "projectVulnerability");
const ObjectID = require('mongodb').ObjectId;

// get all vulnerabilities where isNotified is false
router
    .route("/:projectId/notifications")
    .get(async (req, res) => {
        try {
            if (req.query.type == "all") {// Get all cuurent notifications to store in milestone
                const projectVulnerbilities = await projectVulnerabilityModel.find({
                    projectId: req.params.projectId, $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }],
                    $or: [{ "raisedBy": "schedulerServer" }, { "raisedBy": { $exists: false } }],
                    "updatedAt": {
                        $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                    }
                }).sort({ _id: -1 });
                res.status(200).json(projectVulnerbilities);
            } else {
                const projectVulnerbilities = await projectVulnerabilityModel.find({
                    projectId: req.params.projectId, isNotified: false, $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }],
                    $or: [{ "raisedBy": "schedulerServer" }, { "raisedBy": { $exists: false } }],
                    "updatedAt": {
                        $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                    }
                }).sort({ _id: -1 }).limit();
                res.status(200).json(projectVulnerbilities);
            }
        } catch (err) {
            res.status(500).send("Error: Failed to get Vulnerabilities Notifications");
        }
    })
    // to update vulnerability isNotified status when user have seen the notification
    .post(async (req, res) => {
        try {
            const projectVulnerbilities = await projectVulnerabilityModel.updateOne({ projectId: req.params.projectId, _id: new ObjectID(req.body.notificationId) }, { isNotified: true })
            res.status(200).json(projectVulnerbilities);
        } catch (err) {
            console.log(err)
            res.status(500).send("Error: Failed to update vulnerability notification");
        }
    })

router
    .route("/:projectId")
    //get vulnerabilities by project ID and other conditions
    .get(async (req, res) => {
        try {
            let projectVulnerbilities = [];
            if (req.query && req.query.type && req.query.type == "all") {
                projectVulnerbilities = await projectVulnerabilityModel.find({
                    "projectId": req.params.projectId, $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }]
                }).sort({ _id: -1 });
            } else {
                projectVulnerbilities = await projectVulnerabilityModel.find({
                    "projectId": req.params.projectId,
                    "updatedAt": {
                        $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                    },
                    $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }],
                }).sort({ _id: -1 });
            }
            res.status(200).json(projectVulnerbilities);
        } catch (err) {
            res.status(500).send("Error: Vulnerability database GET request failed!");
        }
    })
    // add, update, delete vulnerabilities
    .post(async (req, res) => {
        try {
            if(req.body.added){
                const vulnerability = new projectVulnerabilityModel(req.body.data);
                vulnerability.save((err, data) => {
                if (data) {
                    res.status(200).send(data);
                }
            })
            }

            if(req.body.deleted){
                const vulnerability = await projectVulnerabilityModel.updateOne({ _id: new ObjectID(req.body._id) },
                    {
                        '$set': {
                            'isDeleted': true,
                            'isNotified': true,
                        }
                    }).then(((data) => {
                    if (data) {
                        res.status(200).send(data);
                    }
                }))
            }

            if(req.body.updated){
                const vulnerability = await projectVulnerabilityModel.updateOne({ _id: new ObjectID(req.body.data._id) }, req.body.data).then(((data) => {
                    if (data) {
                        res.status(200).send(data);
                    }
                }))
            }

        } catch (err) {
            res.status(500).send("Error: Vulnerability database POST request failed!");
        }
    })
    // Delete vulnerabilities by project id.
    .delete(async (req, res) => {
        try {
            const projectVulnerbilities = await projectVulnerabilityModel.deleteMany({ projectId: req.params.projectId });
            res.status(200).send({ msg: "Vulnerabilities have been deleted" });
        } catch (err) {
            res.status(500).send("Error: Vulnerability database GET request failed!");
        }
    }).patch(async (req, res) => {
        try {
            if (req.body.singleUpdate) { //Patch single vulnerability
                const update = req.body.vulnerability;
                const vulnerability = await projectVulnerabilityModel.updateOne({ _id: new ObjectID(update._id) }, update)
                res.status(200).send('');
            }
            if(req.body.linkWeakness){//add weaknesses to a vulnerability
                const vulnerabilities = req.body.vulnerabilities;
                const bulkOps = vulnerabilities.map(obj => {
                    return {
                      updateOne: {
                        filter: {
                          _id: obj._id
                        },
                        update: {
                          linkedWeaknesses: obj.linkedWeaknesses
                        }
                      }
                    }
                  })
                  projectVulnerabilityModel.bulkWrite(bulkOps).then((data) => {
                    if(data){
                        res.status(200).send({msg:'Success'});
                    }
                  })
            }
            if (req.body.linkedVulnerabilities) {// Add vulnerabilities Id to weakness
                const weaknesses = [req.body.vulnerabilityData];
                const bulkOps = weaknesses.map(obj => {
                    return {
                        updateOne: {
                            filter: {
                                _id: obj._id
                            },
                            update: {
                                linkedWeaknesses: obj.linkedWeaknesses
                            }
                        }
                    }
                })
                projectVulnerabilityModel.bulkWrite(bulkOps).then((data) => {
                    if(data){
                      res.status(200).send({msg:'Success'});
                    }
                })
            }
            if(req.body.removeWeakness){//Remove a specific weakness Id from all vulnerabilities
                const vulnerabilities = req.body.data;
                const bulkOps = vulnerabilities.map(obj => {
                    return {
                      updateOne: {
                        filter: {
                          _id: obj._id
                        },
                        update: {
                         "$pull": { "linkedWeaknesses": obj.linkedWeakness } 
                        }
                      }
                    }
                  })
                  projectVulnerabilityModel.bulkWrite(bulkOps).then((data) => {
                    if(data){
                     res.status(200).send({msg:'Success'});
                    }
                  })
            }
            if (req.body.previousId) {// Copy existing vulnerabilities from previous project to new project and update projectId
                const projectVulnerbilities = await projectVulnerabilityModel.find({ projectId: req.body.previousId }, '-_id', async (err, result) => {
                    if (result) {
                        result.forEach(item => {
                            item.projectId = req.params.projectId;
                        })
                        const updatedVulnerbilities = await projectVulnerabilityModel.insertMany(result)
                    }
                }).clone();
                res.status(200).send('');
            }
        } catch (err) {
            res.status(500).send("Error: Vulnerability database UPDATE request failed!");
        }
    })

router
    .route("/notifications/:projectId/:skipItems")
    // Get vulnerability notifications for 3 months historical data with conditions and pagination.
    .get(async (req, res) => {
        try {
            const skip = Number(req.params.skipItems);
            const projectVulnerbilities = await projectVulnerabilityModel.find({
                "projectId": req.params.projectId,
                $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }],
                $or: [{ "raisedBy": "schedulerServer" }, { "raisedBy": { $exists: false } }],
                "updatedAt": {
                    $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                }
            }).sort({ _id: -1 }).limit(25).skip(skip);
            res.status(200).json(projectVulnerbilities);
        } catch (err) {
            res.status(500).send("Error: Vulnerability database GET request failed!");
        }
    })


module.exports = router;
