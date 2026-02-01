const mongoose = require("mongoose");


const ControlLibSchema = new mongoose.Schema({
    id:String,
    libraryId: String,
    rowNumber: Number,
    name: String,
    description: String,
    createdAtDateTime:Date,
    createdBy: String,
    createdInProjectId: String,
    content: String,
    threatId: [String],
    lastModifiedBy: String,
    lastModifiedAtDateTime: String,
    categoryName: String,
    categoryId: String,
    goalId:[String],
    type: String,
})

module.exports.ControlLibSchema = ControlLibSchema;