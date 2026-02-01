// this file defines schemas for component libraries, not components in newDesign object (those are defined in projectModelSchema.js)
const mongoose = require("mongoose");

const microSchema = new mongoose.Schema({
    manufacturer: String,
    model: String,
    hsm: [String]
}, {timestamps: true});
// microModel = mongoose.model('microLib', microSchema, 'microLib');
// module.exports.microModel = microModel;
module.exports.microSchema = microSchema;

const controlUnitSchema = new mongoose.Schema({
    // manufacturer: String,
    // version: String,
    category: String,
    subCategory: String,
    model: String,
    feature: [String],
    featureId: [String],
    featureType: [String],
    featureRole: [String],
}, {timestamps: true});
// controlUnitModel = mongoose.model('controlUnitLib', controlUnitSchema, 'controlUnitLib');
// module.exports.controlUnitModel = controlUnitModel;
module.exports.controlUnitSchema = controlUnitSchema;

const commLineSchema = new mongoose.Schema({
    model: String,
    module: String,
    baseProtocol: String,
    baseProtocolId: String,
    secureProtocol: [String],
    secureProtocolId: [String],
    appProtocol: [String],
    appProtocolId: [String],
    feature: [String],
    featureId: [String],
    asset: [String],
    assetId: [String],
    sensorInput: Boolean,
    // featureType: [String],
    // featureRole: [String],
}, {timestamps: true});
// commLineModel = mongoose.model('commLineLib', commLineSchema, 'commLineLib');
// module.exports.commLineModel = commLineModel;
module.exports.commLineSchema = commLineSchema;

const ProtocolSchema = new mongoose.Schema({
    category: String,
    name: String
}, { timestamps: true });

module.exports.ProtocolSchema = ProtocolSchema;