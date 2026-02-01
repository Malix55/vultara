const express = require("express");
require('dotenv').config({ path: __dirname + '/./.env' });
const genRandomId = require("../service/objOperation").genRandomId;
const router = express.Router();

const ProjectDesignDataSchema = require("../models/projectModelSchema").ProjectDesignDataSchema;
const ProjectMilestoneSchema = require("../models/projectModelSchema").ProjectMilestoneSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const ProjectDesignDataModel = atlasTrialDbConnection.model("ProjectDesignDataModel", ProjectDesignDataSchema, "projectDesignData");
const ProjectAutoSavedMilestoneModel = atlasTrialDbConnection.model("ProjectAutoSavedMilestoneModel", ProjectMilestoneSchema, "projectAutoSavedMilestone");
const ProjectMilestoneModel = atlasTrialDbConnection.model("ProjectMilestoneModel", ProjectMilestoneSchema, "projectMilestone");

const licenseFile = require("../config").licenseFile;
const projectNumberLimit = licenseFile.numberOfProject;

// Load milestones information by project id, filter threat list by threatRuleEngineId and projection only required data.
router
    .route("/")
    .get(async (req, res) => {
        try {
            const threatRuleEngineId = req.query.threatRuleEngineId;
            const skip = req.query.skip ? Number(req.query.skip) : 0;
            const limit = req.query.limit ? Number(req.query.limit) : 0;
            const filter = { "project.id": req.query.projectId, "threat.threatRuleEngineId": { $in: [threatRuleEngineId] } };
            const projectMilestones = await ProjectMilestoneModel.aggregate([
                {
                    $sort: { "createdAt": -1 }
                },
                {
                    $match: filter,
                },
                {
                    $project: {
                        _id: 0,
                        "project.milestoneName": 1,
                        createdAt: 1,
                        threat: { // Get only the threats those have only the matched threatRuleEngineId
                            $filter: {
                                input: '$threat',
                                as: 'threat',
                                cond: { $eq: ['$$threat.threatRuleEngineId', threatRuleEngineId] }
                            }
                        }
                    }
                },
                {
                    $project: { // Get only the required fields of the milestone record.
                        _id: 0,
                        "project.milestoneName": 1,
                        createdAt: 1,
                        "threat.asset": 1,
                        "threat.securityPropertyCia": 1,
                        "threat.threatScenario": 1,
                        "threat.attackPathName": 1,
                        "threat.damageScenario": 1,
                        "threat.impactS": 1,
                        "threat.impactF": 1,
                        "threat.impactO": 1,
                        "threat.impactP": 1,
                        "threat.impactSLevel": 1,
                        "threat.impactFLevel": 1,
                        "threat.impactOLevel": 1,
                        "threat.impactPLevel": 1,
                        "threat.attackFeasibilityLevelAfter": 1,
                        "threat.attackFeasibilityLevel": 1,
                        "threat.riskLevel": 1
                    }
                },
                {
                    $addFields: {
                        threat: { $first: "$threat" }
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ]);

            res.status(200).send({ success: true, data: projectMilestones });
        } catch (err) {
            console.log(err);
            res.status(500).send("Error: Project milestone database GET request failed!");
        }
    });

router
    .route("/projectMilestoneDb") // use this route to save or load project milestones.
    .get(async (req, res) => {
        try {
            if (req.query.milestoneId) {// If milestone mode only load milestone data specified in filter
                let filter = { "project.milestoneId": req.query.milestoneId };
                let find = req.query.find; // find can be vulnerability,control etc
                let assumptions = await ProjectMilestoneModel.findOne(filter, find);
                res.status(200).send(assumptions);
            }else if (req.query.control){
                let filter = { "project.milestoneId": req.query.milestoneId };
                let assumptions = await ProjectMilestoneModel.findOne(filter, 'control');
                res.status(200).send(assumptions);
            }else {
                let filter = { "project.id": req.query.projectId };
                let milestones = await ProjectMilestoneModel.find(filter);
                if (milestones.length > 0) {
                    res.status(200).send(milestones);
                } else {
                    res.status(200).send({ msg: "This project has no Milestone" });
                }
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Error: Project milestone database GET request failed!");
        }
    })
    .post(async (req, res) => { // saved milestones cannot be modified, but they can be deleted.
        try {
            // first check how many projects are saved
            let projectCount = await ProjectDesignDataModel.countDocuments({});
            if (projectCount <= projectNumberLimit) {
                const newMilestone = new ProjectMilestoneModel({
                    ...req.body
                });
                await newMilestone.save();
                res.status(200).send({ msg: "new milestone saved" });
            } else {
                const errorMsg = `Project is not saved due to project number limit.`;
                throw new Error(errorMsg);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Error: Project milestone database POST request failed!");
        }
    })
    .delete(async (req, res) => {
        try {
            await ProjectMilestoneModel.deleteMany({ "project.id": req.query.id });
            let projectQuery = await ProjectMilestoneModel.findOne({ "project.id": req.query.id });
            res.json(projectQuery);
        } catch (err) {
            console.log(err);
            res.status(500).send("Error: Project milestone database DELETE request failed!");
        }
    })
    .patch(async (req, res) => {// Copy milestones from previous project to new and change projectId,Name and milestoneId
        try {
            let projectQuery = await ProjectMilestoneModel.find({ "project.id": req.body.projectId }, { "_id": 0, "project._id": 0 }, async (err, result) => {
                if (result) {
                    result.forEach(item => {
                        item.project.id = req.body.newProjectId;
                        item.project.name = req.body.newProjectName;
                        item.project.milestoneId = genRandomId(10);
                    })
                    const updatedMilestones = await ProjectMilestoneModel.insertMany(result)
                }
            }).clone()
            res.status(200).send('');
        } catch (err) {
            console.log(err);
            res.status(500).send("Error: Project milestone database UPDATE request failed!");
        }
    })

router
    .route("/projectAutoSavedMilestoneDb") // use this route to save or load auto saved project milestones.
    .delete(async (req, res) => {
        try {
            await ProjectAutoSavedMilestoneModel.deleteMany({ "project.id": req.query.id });
            let projectQuery = await ProjectAutoSavedMilestoneModel.findOne({ "project.id": req.query.id });
            res.json(projectQuery);

        } catch (err) {
            console.log(err);
            res.status(500).send("Error: Project auto saved milestone database DELETE request failed!");
        }
    })

module.exports = router;