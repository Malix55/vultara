const express = require("express");
const { sendEmail } = require("../service/emailService");
const router = express.Router();
const ProjectOtherNotificationSchema = require("../models/projectOtherNotificationSchema").ProjectOtherNotificationSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const ProjectOtherNotificationModel = atlasTrialDbConnection.model("../models/ProjectOtherNotificationModel", ProjectOtherNotificationSchema, "projectOtherNotification");

// Send email to user if TARA report generation fails.
router
    .route("/failed/TARAReport")
    .post(async (req, res) => {
        try {
            if (req.body && req.body.userEmail) {
                const title = 'Failed to generate the TARA Report';
                const content = `Your requested TARA report generation failed. Please try again later.`;
                await sendEmail(content, title, [req.body.userEmail]);
            }
            return res.status(200).send({ message: "TARA report information is saved succussfully.", success: true });
        } catch (error) {
            return res.status(500).send("Failed to send email when confirming to the user that report generation failed. Error: " + error.message);
        }
    });

// Get TARA report information from request body then save the information as "Other Notification" and send an email to user to confirm that report is created.
router
    .route("/saveTARAReportInformation")
    .post(async (req, res) => {
        try {
            if (req.body.data && req.body.data.Key && req.body.data.Location && req.body.data.Bucket) {
                const otherNotification = new ProjectOtherNotificationModel({
                    projectId: req.body.project.id,
                    userId: req.body.user._id,
                    fileName: req.body.data.Key,
                    fileLocation: req.body.data.Location,
                    reportType: "TARA_Report",
                    title: "A TARA report is ready.",
                    message: "Click to download the file."
                });
                otherNotification.save();

                if (req.body.user.userEmail) {
                    const title = 'TARA Report Generated';
                    const content = `Your requested TARA report has been generated successfully. Please check notifications in the Vultara application to download the report.`;
                    /** email the new threat insertion updates */
                    await sendEmail(content, title, [req.body.user.userEmail]);
                }

                return res.status(200).send({ message: "TARA report information is saved succussfully.", success: true });
            } else {
                return res.status(500).send({ message: "Failed to save the report file. Error: S3 Bucket information is empty", success: false });
            }
        } catch (error) {
            return res.status(500).send("Failed to generate TARA report in excel. Error: " + error.message);
        }
    });

module.exports = router;