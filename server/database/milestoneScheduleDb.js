const express = require("express");
const router = express.Router();

const ProjectDesignDataSchema = require("../models/projectModelSchema").ProjectDesignDataSchema;
const ProjectMilestoneSchema = require("../models/projectModelSchema").ProjectMilestoneSchema;
const ProjectHtmlSchema = require("../models/projectModelSchema").ProjectHtmlSchema;
const ProjectThreatListSchema = require("../models/projectModelSchema").ProjectThreatListSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const ProjectDesignDataModel = atlasTrialDbConnection.model("ProjectDesignDataModel", ProjectDesignDataSchema, "projectDesignData");
const ProjectAutoSavedMilestoneModel = atlasTrialDbConnection.model("ProjectAutoSavedMilestoneModel", ProjectMilestoneSchema, "projectAutoSavedMilestone");
const ProjectHtmlModel = atlasTrialDbConnection.model("ProjectHtmlModel", ProjectHtmlSchema, "projectHtml");
const ProjectThreatListModel = atlasTrialDbConnection.model("ProjectThreatListModel", ProjectThreatListSchema, "projectThreatList");
const ACCESS_TOKEN = require("../config").ACCESS_TOKEN;

router
    .route("/getAllProjectsInformation") // get all projects information
    .get(async (req, res) => {
        if (req.headers.authorization !== ACCESS_TOKEN) {
            res.status(401).send({ msg: "You are not allowed to access the route" });
        } else {
            try {
                await ProjectDesignDataModel
                    .aggregate([
                        {
                            $lookup: {
                                from: ProjectHtmlModel.collection.name,
                                let: { project: "$project" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$projectId", "$$projectId"]
                                            }
                                        },
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            html: 1
                                        }
                                    }
                                ],
                                as: "html",
                            }
                        },
                        {
                            $addFields: {
                                html: { $arrayElemAt: ["$html", 0] },
                            },
                        },
                        {
                            $lookup: {
                                from: ProjectThreatListModel.collection.name,
                                let: { project: "$project" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$projectId", "$$projectId"]
                                            }
                                        },
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            threat: 1
                                        }
                                    }
                                ],
                                as: "threat",
                            }
                        },
                        {
                            $addFields: {
                                threat: { $arrayElemAt: ["$threat", 0] },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                project: 1,
                                micro: 1,
                                controlUnit: 1,
                                commLine: 1,
                                boundary: 1,
                                html: "$html.html",
                                threat: "$threat.threat"
                            }
                        }
                    ])
                    .then(milestones => {
                        res.status(200).send(milestones);
                    })

            } catch (err) {
                res.status(500).send({ error: "GET request to display projects milestones failed!" });
            }
        }
    })

router
    .route("/autoSaveProjectsMilestonesDb") // use this route to auto save/delete projects milestones.
    .post(async (req, res) => {
        if (req.headers.authorization !== ACCESS_TOKEN) {
            res.status(401).send({ msg: "You are not allowed to access the route" });
        } else {
            try {
                const milestones = req.body.milestones;
                const insertedMilestones = await ProjectAutoSavedMilestoneModel.insertMany(milestones);
                const currentdate = new Date();
                console.log(`Total ${insertedMilestones.length} milestones inserted on - ${currentdate.getDate()}/${(currentdate.getMonth() + 1)}/${currentdate.getFullYear()} @ ${currentdate.getHours()}:${currentdate.getMinutes()}:${currentdate.getSeconds()}`);
                res.status(200).send({ msg: "Projects milestones saved" });
            } catch (err) {
                res.status(500).send("Error: Projects milestones database POST request failed!");
            }
        }
    })
    .delete(async (req, res) => {
        if (req.headers.authorization !== ACCESS_TOKEN) {
            res.status(401).send({ msg: "You are not allowed to access the route" });
        } else {
            try {
                const deletedDocuments = await ProjectAutoSavedMilestoneModel.deleteMany({ createdAt: { "$lt": new Date(Date.now() - 730 * 24 * 60 * 60 * 1000) } }); // The query will delete all records before last 2 years.
                // const deletedDocuments = await ProjectAutoSavedMilestoneModel.deleteMany({ createdAt: { "$lt": new Date(Date.now() - 15 * 60 * 1000) } }) // The query is for testing purpose, it'll delete records before last 6 minutes.
                const currentdate = new Date();
                console.log(`Total ${deletedDocuments.deletedCount} milestones deleted on - ${currentdate.getDate()}/${(currentdate.getMonth() + 1)}/${currentdate.getFullYear()} @ ${currentdate.getHours()}:${currentdate.getMinutes()}:${currentdate.getSeconds()}`);
                res.status(200).send({ msg: "Projects milestones deleted" });
            } catch (err) {
                res.status(500).send("Error: Project milestones database DELETE request failed!");
            }
        }
    })

module.exports = router;