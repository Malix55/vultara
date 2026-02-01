const express = require("express");
const router = express.Router();
const ProjectThreatNotificationSchema = require("./../models/projectThreatNotificationSchema").ProjectThreatNotificationSchema;
const ProjectThreatListSchema = require("../models/projectModelSchema").ProjectThreatListSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const ProjectThreatNotificationModel = atlasTrialDbConnection.model("ProjectThreatNotificationModel", ProjectThreatNotificationSchema, "projectThreatNotification");
const ProjectThreatListModel = atlasTrialDbConnection.model("ProjectThreatListModel", ProjectThreatListSchema, "projectThreatList");
const emailService = require("../service/emailService");
require('dotenv').config({ path: __dirname + '/./../.env' });

router
    .route("/")
    .get(async (req, res, next) => {
        try {
            const projectId = req.query.projectId;
            if (projectId) {
                if (req.query.mode == "all") {// Get all notifications to store in milestone
                    const notifications = await ProjectThreatNotificationModel.find({ "projectId": projectId, notificationType: "riskUpdate" }).sort({ createdAt: -1 });
                    res.status(200).send(notifications);
                } else {
                    const notifications = await ProjectThreatNotificationModel.find({ "projectId": projectId, readStatus: false, notificationType: "riskUpdate" }).sort({ createdAt: -1 }).limit(20);
                    res.status(200).send(notifications);
                }
            } else {
                res.status(404).send({ message: "Project ID not found" });
            }
        } catch (error) {
            res.status(500);
            res.end();
        }
    }).patch(async (req, res, next) => { // Copy existing riskNotifications from previous project to new project and update projectId and projectName 
        try {
            const projectId = req.body.projectId;
            if (projectId) {
                const notifications = await ProjectThreatNotificationModel.find({ "projectId": req.body.projectId, notificationType: "riskUpdate" }, { "_id": 0}, async (err, result) => {
                    if (result) {
                        result.forEach(item => {
                            item.projectId = req.body.newProjectId;
                        })
                        const updated = await ProjectThreatNotificationModel.insertMany(result)
                    }
                }).clone()
                res.status(200).send('');
            } else {
                res.status(404).send({ message: "Project ID not found" });
            }
        } catch (error) {
            res.status(500);
            res.end();
        }
    });

router
    .route("/all")
    .get(async (req, res, next) => {
        try {
            const projectId = req.query.projectId;
            const skip = Number(req.query.skip);
            if (projectId) {
                const notifications = await ProjectThreatNotificationModel.find({
                    "projectId": projectId, notificationType: "riskUpdate", "createdAt": {
                        $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                    }
                }).sort({ createdAt: -1 }).limit(25).skip(skip);
                res.status(200).send(notifications);
            } else {
                res.status(404).send({ message: "Project ID not found" });
            }
        } catch (error) {
            res.status(500);
            res.end();
        }
    });

router
    .route("/update-read-status")
    .post(async (req, res, next) => {
        try {
            const projectId = req.body.projectId;
            const threatRuleEngineId = req.body.threatRuleEngineId;
            const readStatus = req.body.readStatus;
            if (projectId && threatRuleEngineId) {
                const notification = await ProjectThreatNotificationModel.findOneAndUpdate({ "projectId": projectId, threatRuleEngineId, notificationType: "riskUpdate" }, { readStatus }, {
                    new: true,
                    useFindAndModify: false
                });
                res.status(200).send(notification);
            } else {
                res.status(404).send({ message: "Project ID not found" });
            }
        } catch (error) {
            res.status(500);
            res.end();
        }
    });

router
    .route("/accept")
    .post(async (req, res, next) => {
        try {
            const notification = req.body.notification;
            const attackFeasibilityLevel = req.body.attackFeasibilityLevel;
            if (notification._id) {
                let priorResult = await ProjectThreatListModel.findOne({ "projectId": notification.projectId }, { threat: 1, _id: 0 });
                const result = priorResult.toObject().threat;
                const resultIndex = result.findIndex(obj => obj.threatRuleEngineId == notification.threatRuleEngineId);
                if (resultIndex > -1) {
                    result[resultIndex].riskLevel = notification.riskLevel;
                    result[resultIndex].attackFeasibilityLevel = attackFeasibilityLevel;
                    result[resultIndex].attackFeasibilityElapsed = Number(notification.attackFeasibilityElapsed);
                    result[resultIndex].attackFeasibilityElapsedRationale = notification.attackFeasibilityElapsedRationale ? notification.attackFeasibilityElapsedRationale : '';
                    result[resultIndex].attackFeasibilityEquipment = Number(notification.attackFeasibilityEquipment);
                    result[resultIndex].attackFeasibilityEquipmentRationale = notification.attackFeasibilityEquipmentRationale ? notification.attackFeasibilityEquipmentRationale : '';
                    result[resultIndex].attackFeasibilityExpertise = Number(notification.attackFeasibilityExpertise);
                    result[resultIndex].attackFeasibilityExpertiseRationale = notification.attackFeasibilityExpertiseRationale ? notification.attackFeasibilityExpertiseRationale : '';
                    result[resultIndex].attackFeasibilityKnowledge = Number(notification.attackFeasibilityKnowledge);
                    result[resultIndex].attackFeasibilityKnowledgeRationale = notification.attackFeasibilityKnowledgeRationale ? notification.attackFeasibilityKnowledgeRationale : '';
                    result[resultIndex].attackFeasibilityWindow = Number(notification.attackFeasibilityWindow);
                    result[resultIndex].attackFeasibilityWindowRationale = notification.attackFeasibilityWindowRationale ? notification.attackFeasibilityWindowRationale : '';
                    if (result[resultIndex].treatment != 'no treatment') {
                        result[resultIndex].riskLevelBefore = notification.riskLevel;
                    }
                    priorResult.threat = result;
                    let updatedThreat = await ProjectThreatListModel.findOneAndUpdate({ "projectId": notification.projectId }, priorResult, {
                        new: true,
                        useFindAndModify: false
                    });
                    const updatedNotification = await ProjectThreatNotificationModel.findOneAndUpdate({ _id: notification._id, notificationType: "riskUpdate" }, { acceptStatus: true, rejectStatus: false }, {
                        new: true,
                        useFindAndModify: false
                    });
                    res.status(200).send(updatedThreat);
                } else {
                    res.status(404).send({ message: "Threat was not found" });
                }
            } else {
                res.status(404).send({ message: "Notification not found" });
            }
        } catch (error) {
            console.log("🚀 ~ file: riskUpdateNotificationDb.js ~ line 135 ~ .post ~ error", error)
            res.status(500).send(error);
            res.end();
        }
    });

router
    .route("/reject")
    .post(async (req, res, next) => {
        try {
            const _id = req.body._id;
            if (_id) {
                const notification = await ProjectThreatNotificationModel.findOneAndUpdate({ _id: _id, notificationType: "riskUpdate" }, { rejectStatus: true, acceptStatus: false }, {
                    new: true,
                    useFindAndModify: false
                });
                res.status(200).send(notification);
            } else {
                res.status(404).send({ message: "Notification not found" });
            }
        } catch (error) {
            res.status(500);
            res.end();
        }
    });

router
    .route("/notification")
    .get(async (req, res, next) => {
        try {
            const projectId = req.query.projectId;
            const threatRuleEngineId = req.query.threatRuleEngineId;
            const notificationType = req.query.notificationType;
            if (projectId && threatRuleEngineId && notificationType === "riskUpdate") {
                const notification = await ProjectThreatNotificationModel.findOne({ "projectId": projectId, threatRuleEngineId, notificationType });
                res.status(200).send(notification);
            } else {
                res.status(404).send({ message: "Project ID not found" });
            }
        } catch (error) {
            res.status(500);
            res.end();
        }
    });
router
    .route("/email")
    .post(async (req, res, next) => {
        try {
            const { recipients, content, title, originatingEmail } = req.body;
            const result = await emailService.sendEmail(recipients, content, title, originatingEmail)
            if (!result) {
                res.status(400).send({ message: "unable to send the email, please try againg" });
            }
            res.status(200).send({ message: "Email has been sended successfully" });
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    });

module.exports = router;