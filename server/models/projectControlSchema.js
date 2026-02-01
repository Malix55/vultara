const mongoose = require("mongoose");


const ProjectControlSchema = new mongoose.Schema({
    id:String,
    libraryId: String,
    rowNumber: Number,
    name: String,
    description: String,
    createdAtDateTime:Date,
    createdBy: String,
    projectId: String,
    content: String,
    threatId: [String],
    lastModifiedBy: String,
    lastModifiedAtDateTime: String,
    categoryName: String,
    categoryId: String,
    goalId:[String],
    type:String
});

module.exports.ProjectControlSchema = ProjectControlSchema;