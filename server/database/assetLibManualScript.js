const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const asyncPackage = require("async");
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const ProjectDesignDataSchema = require("../models/projectModelSchema").ProjectDesignDataSchema;
const assetLibSchema = require("../models/threatLibModelSchema").AssetLibSchema;
const ProjectThreatListSchema = require("../models/projectModelSchema").ProjectThreatListSchema;
const ThreatListSchema = require("../models/projectModelSchema").ThreatListSchema;

const ProjectDeletedThreatsSchema = require("../models/projectModelSchema").projectDeletedThreats;
const ProjectAssumptionSchema = require("../models/projectModelSchema").projectAssumptionSchema;
const ProjectCybersecurityGoalSchema = require("../models/projectModelSchema").ProjectCybersecurityGoalSchema;
const ProjectMilestoneSchema = require("../models/projectModelSchema").ProjectMilestoneSchema;
const projectVulnerabilitySchema = require('../models/projectVulnerabilitySchema').ProjectVulnerabilitySchema

const ThreatListSchemaWithTime = new mongoose.Schema(ThreatListSchema, { timestamps: true })

const UserAddedThreatLibModel = atlasTrialDbConnection.model("UserAddedThreatLibModel", ThreatListSchemaWithTime, "userAddedThreatLib");
const ProjectCybersecurityGoalModel = atlasTrialDbConnection.model("ProjectCybersecurityGoalModel", ProjectCybersecurityGoalSchema, "projectCybersecurityGoal");
const projectVulnerabilityModel = atlasTrialDbConnection.model("projectVulnerabilityModel", projectVulnerabilitySchema, "projectVulnerability");
const ProjectDesignDataModel = atlasTrialDbConnection.model("ProjectDesignDataModel", ProjectDesignDataSchema, "projectDesignData");
const ProjectAutoSavedThreatListModel = atlasTrialDbConnection.model("ProjectAutoSavedThreatListModel", ProjectThreatListSchema, "projectAutoSavedThreatList");
const assetLibModel = atlasTrialDbConnection.model("assetLibModel", assetLibSchema, "assetLib");
const ProjectThreatListModel = atlasTrialDbConnection.model("ProjectThreatListModel", ProjectThreatListSchema, "projectThreatList");
const ProjectDeletedThreatsModel = atlasTrialDbConnection.model("ProjectDeletedThreatsModel", ProjectDeletedThreatsSchema, "projectDeletedThreats");
const UserModel = require("./projectDatabase").UserModel;
const ProjectAssumptionModel = atlasTrialDbConnection.model("ProjectAssumptionModel", ProjectAssumptionSchema, "projectAssumption");
const ProjectAutoSavedMilestoneModel = atlasTrialDbConnection.model("ProjectAutoSavedMilestoneModel", ProjectMilestoneSchema, "projectAutoSavedMilestone");
const ProjectMilestoneModel = atlasTrialDbConnection.model("ProjectMilestoneModel", ProjectMilestoneSchema, "projectMilestone");
const ProjectAutoSavedDesignDataModel = atlasTrialDbConnection.model("ProjectAutoSavedDesignDataModel", ProjectDesignDataSchema, "projectAutoSavedDesignData");


const ACCESS_TOKEN = require("../config").ACCESS_TOKEN;

// Method to update usedInProjectId property via a bulkWrite execution
const updateAssetUsedInProjectIdProperty = async (assetsToUpdate) => {
    const queries = [];
    assetsToUpdate.forEach(_ => {
        const query = {
            updateOne:
            {
                "filter": { "_id": _._id },
                "update": { "usedInProjectId": _.usedInProjectId },
            }
        }
        queries.push(query);
    });
    await assetLibModel.bulkWrite(queries);
}

// One time route to update asset information for usedInProjectId property
router
    .route("/usedInProjectId")
    .post(async (req, res, next) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                return res.status(401).send({ message: "Error occurred during the authentication process. Access denied." });
            }

            const projects = await ProjectDesignDataModel.find({});
            const usedInProjectIdInformation = [];

            for (let _ of projects) {
                let assetId = [];
                [..._.commLine, ..._.micro, ..._.controlUnit].map(__ => __.assetId).forEach(___ => {
                    assetId = [...assetId, ...(___ ? ___ : [])];
                });
                assetId = [...new Set(assetId)];

                const projectId = _.project.id;

                if (projectId && assetId.length > 0) {
                    const existingAssetsUsedInProject = await assetLibModel.find({
                        usedInProjectId: {
                            $in: [projectId]
                        }
                    });
                    let existingAssetsNotUsedInProject = existingAssetsUsedInProject.filter(_ => !assetId.includes(_._id.toString()));
                    if (existingAssetsNotUsedInProject.length > 0) {
                        existingAssetsNotUsedInProject = existingAssetsNotUsedInProject.map(_ => {
                            const usedInProjectId = _.usedInProjectId;
                            const indexOfProjectId = usedInProjectId.indexOf(projectId);
                            if (indexOfProjectId > -1) {
                                usedInProjectId.splice(indexOfProjectId, 1);
                                _.usedInProjectId = usedInProjectId;
                            }
                            return _;
                        });
                        await updateAssetUsedInProjectIdProperty(existingAssetsNotUsedInProject);
                    }

                    const existingAssetsAlreadyUsedInProjectId = existingAssetsUsedInProject.filter(_ => assetId.includes(_._id.toString())).map(_ => _._id.toString());
                    const remainingUnusedAssetsProjectId = assetId.filter(_ => !existingAssetsAlreadyUsedInProjectId.includes(_));
                    if (remainingUnusedAssetsProjectId.length > 0) {
                        const existingAssetsUsedInProject = await assetLibModel.find({
                            _id: {
                                $in: remainingUnusedAssetsProjectId
                            }
                        });
                        const assetsToUpdate = existingAssetsUsedInProject
                            .map(_ => {
                                _.usedInProjectId = [...new Set([...(_.usedInProjectId ? _.usedInProjectId : []), projectId])];
                                return _;
                            });

                        await updateAssetUsedInProjectIdProperty(assetsToUpdate);
                    }
                }
            }
            res.status(200).send({ msg: "Asset's usedInProjectId upgradation process is successfully done" });
        } catch (error) {
            console.log({ error });
            res.status(500).send("Error: Asset's usedInProjectId upgradation request is failed");
            res.end();
        }
    }).patch(async (req, res) => {
        if (req.headers.authorization !== ACCESS_TOKEN) {
            return res.status(401).send({ message: "Error occurred during the authentication process. Access denied." });
        }
        const users = await UserModel.find({}, "username");
        // console.log("🚀 ~ file: assetLibManualScript.js ~ line 122 ~ .post ~ users", users)
        // update(
        //     { _id: 1, "items.id": "2" },
        //     {
        //         $set: {
        //             "items.$.name": "yourValue",
        //             "items.$.value": "yourvalue",
        //          }
        //     }
        //deleted threat, threat list,design data project,project mielstone threat,vulnera
        // )
        // let f = await [ds[10]]
        // console.log("🚀 ~ file: riskUpdateNotificationDb.js ~ line 31 ~ .get ~ f", f)
        // const dl = await projectVulnerabilityModel.aggregate([
        //     {
        //         "$lookup": {
        //             "from": UserModel.collection.name,
        //             "localField": "lastModifiedBy",
        //             "foreignField": "username",
        //             "as": "inventory_docs"
        //           }
        //     },
        //     {"$project":{
        //         inventory_docs:1,
        //         lastModifiedBy:1
        //     }},{
        //         $set: {
        //             "lastModifiedBy": {$toString:{
        //               $arrayElemAt: [
        //               "$inventory_docs._id",
        //               0
        //             ]
        //           }
        //         }}
        //       }
        // ])
        // console.log("🚀 ~ file: assetLibManualScript.js ~ line 138 ~ .post ~ dl", dl)
        // {
        //     $set: {
        //       "lastModifiedBy": {
        //         $arrayElemAt: [
        //           "$inventory_docs._id",
        //           0
        //         ]
        //       }
        //     }
        //   }
        asyncPackage.eachSeries(users, async function updateControlUnitLibFeatureByModuleIdChange(item, callback) {
            console.log("🚀 ~ file: assetLibManualScript.js ~ line 169 ~ updateControlUnitLibFeatureByModuleIdChange ~ item", item.username)
            const updateThreat = await ProjectThreatListModel.updateMany(
                { "threat.lastModifiedBy": item.username },
                { "$set": { "threat.$[elem].lastModifiedBy": item._id } },
                { "arrayFilters": [{ "elem.lastModifiedBy": item.username }], "multi": true }
            )
            const update2Threat = await ProjectThreatListModel.updateMany(
                { "threat.treatmentValidatedBy": item.username },
                { "$set": { "threat.$[elem].treatmentValidatedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentValidatedBy": item.username }], "multi": true }
            )
            const update3Threat = await ProjectThreatListModel.updateMany(
                { "threat.reviewedBy": item.username },
                { "$set": { "threat.$[elem].reviewedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewedBy": item.username }], "multi": true }
            )
            const update4Threat = await ProjectThreatListModel.updateMany(
                { "threat.reviewStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].reviewStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewStatusRevokedBy": item.username }], "multi": true }
            )
            const update5Threat = await ProjectThreatListModel.updateMany(
                { "threat.validateStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].validateStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.validateStatusRevokedBy": item.username }], "multi": true }
            )
            const update6Threat = await ProjectThreatListModel.updateMany(
                { "threat.treatmentStatusChangedBy": item.username },
                { "$set": { "threat.$[elem].treatmentStatusChangedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentStatusChangedBy": item.username }], "multi": true }
            )

            const updateDeletedThreat = await ProjectDeletedThreatsModel.updateMany(
                { "threat.lastModifiedBy": item.username },
                { "$set": { "threat.$[elem].lastModifiedBy": item._id } },
                { "arrayFilters": [{ "elem.lastModifiedBy": item.username }], "multi": true }
            )
            const updateDeletedThreat3 = await ProjectDeletedThreatsModel.updateMany(
                { "threat.treatmentValidatedBy": item.username },
                { "$set": { "threat.$[elem].treatmentValidatedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentValidatedBy": item.username }], "multi": true }
            )
            const updateDeletedThreat4 = await ProjectDeletedThreatsModel.updateMany(
                { "threat.reviewedBy": item.username },
                { "$set": { "threat.$[elem].reviewedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewedBy": item.username }], "multi": true }
            )
            const updateDeletedThreat5 = await ProjectDeletedThreatsModel.updateMany(
                { "threat.reviewStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].reviewStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewStatusRevokedBy": item.username }], "multi": true }
            )
            const updateDeletedThreat6 = await ProjectDeletedThreatsModel.updateMany(
                { "threat.validateStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].validateStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.validateStatusRevokedBy": item.username }], "multi": true }
            )
            const updateDeletedThreat7 = await ProjectDeletedThreatsModel.updateMany(
                { "threat.treatmentStatusChangedBy": item.username },
                { "$set": { "threat.$[elem].treatmentStatusChangedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentStatusChangedBy": item.username }], "multi": true }
            )
            
            const updateDeletedThreatAuto2 = await ProjectAutoSavedThreatListModel.updateMany(
                { "threat.lastModifiedBy": item.username },
                { "$set": { "threat.$[elem].lastModifiedBy": item._id } },
                { "arrayFilters": [{ "elem.lastModifiedBy": item.username }], "multi": true }
            )
            const updateDeletedThreatAuto3 = await ProjectAutoSavedThreatListModel.updateMany(
                { "threat.treatmentValidatedBy": item.username },
                { "$set": { "threat.$[elem].treatmentValidatedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentValidatedBy": item.username }], "multi": true }
            )
            const updateDeletedThreatAuto4 = await ProjectAutoSavedThreatListModel.updateMany(
                { "threat.reviewedBy": item.username },
                { "$set": { "threat.$[elem].reviewedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewedBy": item.username }], "multi": true }
            )
            const updateDeletedThreatAuto5 = await ProjectAutoSavedThreatListModel.updateMany(
                { "threat.reviewStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].reviewStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewStatusRevokedBy": item.username }], "multi": true }
            )
            const updateDeletedThreatAuto6 = await ProjectAutoSavedThreatListModel.updateMany(
                { "threat.validateStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].validateStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.validateStatusRevokedBy": item.username }], "multi": true }
            )
            const updateDeletedThreatAuto7 = await ProjectAutoSavedThreatListModel.updateMany(
                { "threat.treatmentStatusChangedBy": item.username },
                { "$set": { "threat.$[elem].treatmentStatusChangedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentStatusChangedBy": item.username }], "multi": true }
            )


            const updatevulnerability = await projectVulnerabilityModel.updateMany(
                { "lastModifiedBy": item.username },
                {
                    $set: {
                        "lastModifiedBy": item._id,
                    }
                }
            )
            const update2vulnerability = await projectVulnerabilityModel.updateMany(
                { "validatedBy": item.username },
                {
                    $set: {
                        "validatedBy": item._id,
                    }
                }
            )
            const update3vulnerability = await projectVulnerabilityModel.updateMany(
                { "reviewedBy": item.username },
                {
                    $set: {
                        "reviewedBy": item._id,
                    }
                }
            )
            const update4vulnerability = await projectVulnerabilityModel.updateMany(
                { "reviewStatusRevokedBy": item.username },
                {
                    $set: {
                        "reviewStatusRevokedBy": item._id,
                    }
                }
            )
            const update5vulnerability = await projectVulnerabilityModel.updateMany(
                { "validateStatusRevokedBy": item.username },
                {
                    $set: {
                        "validateStatusRevokedBy": item._id,
                    }
                }
            )
            const update6vulnerability = await projectVulnerabilityModel.updateMany(
                { "treatmentStatusChangedBy": item.username },
                {
                    $set: {
                        "treatmentStatusChangedBy": item._id,
                    }
                }
            )

            const updateAssumption1 = await ProjectAssumptionModel.updateMany(
                { "createdBy": item.username },
                {
                    $set: {
                        "createdBy": item._id,
                    }
                }
            )
            const updateAssumption2 = await ProjectAssumptionModel.updateMany(
                { "lastModifiedBy": item.username },
                {
                    $set: {
                        "lastModifiedBy": item._id,
                    }
                }
            )

            const updateGoals1 = await ProjectCybersecurityGoalModel.updateMany(
                { "goal.createdBy": item.username },
                { "$set": { "goal.$[elem].createdBy": item._id } },
                { "arrayFilters": [{ "elem.createdBy": item.username }], "multi": true }
            )
            
            const updateGoals2 = await ProjectCybersecurityGoalModel.updateMany(
                { "goal.lastModifiedBy": item.username },
                { "$set": { "goal.$[elem].lastModifiedBy": item._id } },
                { "arrayFilters": [{ "elem.lastModifiedBy": item.username }], "multi": true }
            )
            const updateDesignData = await ProjectDesignDataModel.updateMany(
                { "project.lastModifiedBy": item.username },
                {
                    $set: {
                        "project.lastModifiedBy": item._id,
                    }
                }
            )
            const updateAutoDesignData = await ProjectAutoSavedDesignDataModel.updateMany(
                { "project.lastModifiedBy": item.username },
                {
                    $set: {
                        "project.lastModifiedBy": item._id,
                    }
                }
            )
            
            const updateAutoSavedMilestone1 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "project.lastModifiedBy": item.username },
                {
                    $set: {
                        "project.lastModifiedBy": item._id,
                    }
                }
            )
            const updateAutoSavedMilestone2 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "goal.createdBy": item.username },
                { "$set": { "goal.$[elem].createdBy": item._id } },
                { "arrayFilters": [{ "elem.createdBy": item.username }], "multi": true }
            )
            const updateAutoSavedMilestone3 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "threat.lastModifiedBy": item.username },
                { "$set": { "threat.$[elem].lastModifiedBy": item._id } },
                { "arrayFilters": [{ "elem.lastModifiedBy": item.username }], "multi": true }
            )
            const updateAutoSavedMilestone4 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "threat.treatmentValidatedBy": item.username },
                { "$set": { "threat.$[elem].treatmentValidatedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentValidatedBy": item.username }], "multi": true }
            )
            const updateAutoSavedMilestone5 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "threat.reviewedBy": item.username },
                { "$set": { "threat.$[elem].reviewedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewedBy": item.username }], "multi": true }
            )
            const updateAutoSavedMilestone6 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "threat.reviewStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].reviewStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewStatusRevokedBy": item.username }], "multi": true }
            )
            const updateAutoSavedMilestone7 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "threat.validateStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].validateStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.validateStatusRevokedBy": item.username }], "multi": true }
            )
            const updateAutoSavedMilestone8 = await ProjectAutoSavedMilestoneModel.updateMany(
                { "threat.treatmentStatusChangedBy": item.username },
                { "$set": { "threat.$[elem].treatmentStatusChangedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentStatusChangedBy": item.username }], "multi": true }
            )

            const updateMilestone1 = await ProjectMilestoneModel.updateMany(
                { "project.lastModifiedBy": item.username },
                {
                    $set: {
                        "project.lastModifiedBy": item._id,
                    }
                }
            )
            const updateMilestone2 = await ProjectMilestoneModel.updateMany(
                { "goal.$.createdBy": item.username },
                { "$set": { "goal.$[elem].createdBy": item._id } },
                { "arrayFilters": [{ "elem.createdBy": item.username }], "multi": true }
            )

            const updateMilestone3 = await ProjectMilestoneModel.updateMany(
                { "threat.lastModifiedBy": item.username },
                { "$set": { "threat.$[elem].lastModifiedBy": item._id } },
                { "arrayFilters": [{ "elem.lastModifiedBy": item.username }], "multi": true }
            )
            const updateMilestone4 = await ProjectMilestoneModel.updateMany(
                { "threat.treatmentValidatedBy": item.username },
                { "$set": { "threat.$[elem].treatmentValidatedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentValidatedBy": item.username }], "multi": true }
            )
           const updateMilestone5 = await ProjectMilestoneModel.updateMany(
                { "threat.reviewedBy": item.username },
                { "$set": { "threat.$[elem].reviewedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewedBy": item.username }], "multi": true }
            )
            const updateMilestone6 = await ProjectMilestoneModel.updateMany(
                { "threat.reviewStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].reviewStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.reviewStatusRevokedBy": item.username }], "multi": true }
            )
            const updateMilestone7 = await ProjectMilestoneModel.updateMany(
                { "threat.validateStatusRevokedBy": item.username },
                { "$set": { "threat.$[elem].validateStatusRevokedBy": item._id } },
                { "arrayFilters": [{ "elem.validateStatusRevokedBy": item.username }], "multi": true }
            )
            const updateMilestone8 = await ProjectMilestoneModel.updateMany(
                { "threat.treatmentStatusChangedBy": item.username },
                { "$set": { "threat.$[elem].treatmentStatusChangedBy": item._id } },
                { "arrayFilters": [{ "elem.treatmentStatusChangedBy": item.username }], "multi": true }
            )
            
            const userAddedThreat1 = await UserAddedThreatLibModel.updateMany(
                { "lastModifiedBy": item.username },
                {
                    $set: {
                        "lastModifiedBy": item._id,
                    }
                }
            )
            const userAddedThreat2 = await UserAddedThreatLibModel.updateMany(
                { "treatmentValidatedBy": item.username },
                {
                    $set: {
                        "treatmentValidatedBy": item._id,
                    }
                }
            )
           const userAddedThreat3 = await UserAddedThreatLibModel.updateMany(
                { "reviewedBy": item.username },
                {
                    $set: {
                        "reviewedBy": item._id,
                    }
                }
            )
            const userAddedThreat4 = await UserAddedThreatLibModel.updateMany(
                { "reviewStatusRevokedBy": item.username },
                {
                    $set: {
                        "reviewStatusRevokedBy": item._id,
                    }
                }
            )
            const userAddedThreat5 = await UserAddedThreatLibModel.updateMany(
                { "validateStatusRevokedBy": item.username },
                {
                    $set: {
                        "validateStatusRevokedBy": item._id,
                    }
                }
            )
            const userAddedThreat6 = await UserAddedThreatLibModel.updateMany(
                { "treatmentStatusChangedBy": item.username },
                {
                    $set: {
                        "treatmentStatusChangedBy": item._id,
                    }
                }
            )

            const userAddedThreat7 = await UserAddedThreatLibModel.updateMany(
                { "createdBy": item.username },
                {
                    $set: {
                        "createdBy": item._id,
                    }
                }
            )

        }, function (err) {
            if (err) {
                console.log(`Error when updating categories: `);
                console.dir(err);
                res.status(500).send("Error: Error when updating categories");
            } else {
                res.status(200).send({ msg: 'success' });
            }
        })
    })

module.exports = router;