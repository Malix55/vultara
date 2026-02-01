const mongoose = require("mongoose");

const HelpSchema = new mongoose.Schema({
    helpDocumentId: String,
    position:Number,
    displayType:String,
    text:String
}, { timestamps: true });
module.exports.HelpSchema = HelpSchema