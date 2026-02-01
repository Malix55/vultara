const mongoose = require("mongoose");

const ProjectOtherNotificationSchema = new mongoose.Schema({
    projectId: String,
    userId: mongoose.Schema.ObjectId,
    fileName: String,
    fileLocation: String,
    secretKey: String,
    reportType: String,
    title: String,
    message: String,
    readStatus: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports.ProjectOtherNotificationSchema = ProjectOtherNotificationSchema;