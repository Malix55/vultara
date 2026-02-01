const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const WP29ThreatMappingSchema = new mongoose.Schema({
    assetType: String,
    subType: String,
    securityPropertyStride: String,
    baseProtocol: String,
    appProtocol: String,
    featureType: String,
    transmissionMedia: String,
    MITM: Boolean,
    wp29AttackIndex: String
}, { timestamps: true });

module.exports.WP29ThreatMappingSchema = WP29ThreatMappingSchema;

const WP29ThreatKeywordsSchema = new mongoose.Schema({
    threatId: {
        type: Schema.ObjectId,
        refPath: 'onModel'
    },
    assetNameIncludes: String,
    relationship: String,
    fromFeatureIncludes: String
}, { timestamps: true });

module.exports.WP29ThreatKeywordsSchema = WP29ThreatKeywordsSchema;

const WP29ThreatSchema = new mongoose.Schema({
    wp29AttackIndex: String,
    wp29Attack: String,
    subLevelThreat: String,
    highLevelThreat: String
});

module.exports.WP29ThreatSchema = WP29ThreatSchema;