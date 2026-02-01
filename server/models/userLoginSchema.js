const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    hash: String,
    salt: String,
    role: String,
    loginAttemptCounter: {
        type: Number,
        default: 0
    },
    projectAccessId: [String],
    lastSuccessfulLogin: {
        type: Date,
        default: new Date()
    },
    userEmail: String,
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
module.exports.UserSchema = UserSchema;
