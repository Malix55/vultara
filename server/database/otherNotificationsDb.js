const express = require("express");
const router = express.Router();
const AWS = require('aws-sdk');
const projectOtherNotificationSchema = require('../models/projectOtherNotificationSchema').ProjectOtherNotificationSchema
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const projectOtherNotificationModel = atlasTrialDbConnection.model("projectOtherNotificationModel", projectOtherNotificationSchema, "projectOtherNotification");
const ObjectID = require('mongodb').ObjectId;
const { s3ReportsBucketName, accessKeyId, secretAccessKey } = require("../config");

// Route to delete other notifications
router
    .route("/projectOtherNotification")
    .delete(async (req, res, next) => {
        try {
            await projectOtherNotificationModel.deleteMany({ "projectId": req.query.id });
            res.status(200).send({ msg: "Other Notifications have been deleted for given project id" });
        } catch (error) {
            res.status(500).send("Project other notifications delete request is failed. Error: " + error.message);
            res.end();
        }
    });

// get all "other notifications" where readStatus is false.
router
    .route("/:projectId/notifications")
    .get(async (req, res) => {
        try {
            if (req.query.milestone) {//Get both read and unread to save in milestone
                const projectOtherNotification = await projectOtherNotificationModel.find({
                    projectId: req.params.projectId,
                    "updatedAt": {
                        $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                    }
                }).sort({ updatedAt: -1 });
                res.status(200).json(projectOtherNotification);
            } else {
                const projectOtherNotification = await projectOtherNotificationModel.find({
                    projectId: req.params.projectId, readStatus: false,
                    "updatedAt": {
                        $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                    }
                }).sort({ updatedAt: -1 }).limit(20);
                res.status(200).json(projectOtherNotification);
            }
        } catch (err) {
            res.status(500).send("Failed to get Vulnerabilities Notifications. Error: " + err.message);
        }
    })
    // Upon clicking on a TARA report notification, download the file from S3 bucket and make the readStatus property true.
    .post(async (req, res) => {
        try {
            const s3 = new AWS.S3({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey
            });
            const otherNotification = await projectOtherNotificationModel.findOne({ projectId: req.params.projectId, _id: new ObjectID(req.body.notificationId) });
            const projectOtherNotifications = await projectOtherNotificationModel.updateOne({ projectId: req.params.projectId, _id: new ObjectID(req.body.notificationId) }, { readStatus: true })
            var options = {
                Bucket: s3ReportsBucketName,
                Key: otherNotification.fileName,
            };
            await s3.headObject(options).promise();
            const downloadUrl = await s3.getSignedUrlPromise('getObject', { ...options, Expires: 1800 });
            res.status(200).send({ "message": "Temporary file link is created", success: true, data: { url: downloadUrl } });
        } catch (err) {
            if (err.statusCode && err.statusCode === 404) {
                res.status(404).send("Error: The file does not exists.")
            } else {
                res.status(500).send("Failed to update the database record or download the file. Error: " + err.message);
            }
        }
    })

// Get other notifications with pagination.
router
    .route("/all")
    .get(async (req, res, next) => {
        try {
            const projectId = req.query.projectId;
            const skip = Number(req.query.skip);
            if (projectId) {
                const notifications = await projectOtherNotificationModel.find({
                    "projectId": projectId, reportType: "TARA_Report", "createdAt": {
                        $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                    }
                }).sort({ createdAt: -1 }).limit(25).skip(skip);
                res.status(200).send(notifications);
            } else {
                res.status(404).send({ message: "Project ID not found" });
            }
        } catch (error) {
            res.status(500).send("Failed to retrieve other notifications. Error: " + error.message);
            res.end();
        }
    });

// Get other notifications with sorting, query and pagination.
router
    .route("/notifications/:projectId/:skipItems")
    .get(async (req, res) => {
        try {
            const skip = Number(req.params.skipItems);
            const projectOtherNotifications = await projectOtherNotificationModel.find({
                "projectId": req.params.projectId,
                "updatedAt": {
                    $gte: new Date((new Date().getTime() - (90 * 24 * 60 * 60 * 1000)))
                }
            }).sort({ updatedAt: -1 }).limit(25).skip(skip);
            res.status(200).json(projectOtherNotifications);
        } catch (err) {
            res.status(500).send("Failed to retrieve other notifications for paginations. Error: " + err.message);
        }
    })

module.exports = router;