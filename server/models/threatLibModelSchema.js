const mongoose = require("mongoose");
const { stringify } = require("querystring");

// for asset library
const AssetLibSchema = new mongoose.Schema({
    name: {type: String, trim: true},
    assetType: {type: String, trim: true},
    subType: {type: String, trim: true},
    tag: {type: [String], trim: true},
    usedInProjectId: {type: [String], trim: true}
}, {timestamps: true});
// const AssetLibModel = mongoose.model("assetLib", AssetLibSchema, "assetLib");
function mapAssetLibSchema(srcObj, desObj) {
    desObj.name = srcObj.name;
    desObj.assetType = srcObj.assetType;
    return desObj;
};
// module.exports.mapAssetLibSchema = mapAssetLibSchema;
// module.exports.assetLibModel = AssetLibModel;
module.exports.AssetLibSchema = AssetLibSchema;


// for threat-STRIDE library
const ThreatLibSTRIDESchema = new mongoose.Schema({
    assetType: {type: String, trim: true},
    s: {type: Boolean, trim: true},
    t: {type: Boolean, trim: true},
    r: {type: Boolean, trim: true},
    i: {type: Boolean, trim: true},
    d: {type: Boolean, trim: true},
    e: {type: Boolean, trim: true},
    sConPre: {type: String, trim: true},
    sConPost: {type: String, trim: true},
    tConPre: {type: String, trim: true},
    tConPost: {type: String, trim: true},
    rConPre: {type: String, trim: true},
    rConPost: {type: String, trim: true},
    iConPre: {type: String, trim: true},
    iConPost: {type: String, trim: true},
    dConPre: {type: String, trim: true},
    dConPost: {type: String, trim: true},
    eConPre: {type: String, trim: true},
    eConPost: {type: String, trim: true},
});
// const ThreatLibSTRIDEModel = mongoose.model("threatLibStride", ThreatLibSTRIDESchema, "threatLibStride");
// module.exports.threatLibSTRIDEModel = ThreatLibSTRIDEModel;
module.exports.ThreatLibSTRIDESchema = ThreatLibSTRIDESchema;

// function mapAssetLibSchema(srcObj, desObj) {
//     desObj.name = srcObj.name;
//     desObj.assetType = srcObj.assetType;
//     return desObj;
// };

const ThreatFeasibilityLibSchema = new mongoose.Schema({
    assetType: {type: String, trim: true},
    subType: {type: String, trim: true},
    stride: {type: String, trim: true},
    knowledge: {type: Number, trim: true},
    expertise: {type: Number, trim: true},
    equipment: {type: Number, trim: true},
    attackVector: {type: Number, trim: true},
    elapsed: {type: Number, trim: true},
    window: {type: Number, trim: true},
    CVSSPrivilege: {type: Number, trim: true},
    CVSSComplexity: {type: Number, trim: true},
    CVSSUser: {type: Number, trim: true},
    CVSSVector: {type: Number, trim: true},
    type: {type: String, trim: true},
    cia: {type: String, trim: true},
    attackMethod: {type: String, trim: true},
});
// const ThreatFeasibilityLibModel = mongoose.model("threatFeasibilityLib", ThreatFeasibilityLibSchema, "threatFeasibilityLib");
// module.exports.threatFeasibilityLibModel = ThreatFeasibilityLibModel;
module.exports.ThreatFeasibilityLibSchema = ThreatFeasibilityLibSchema;

const ThreatFeasibilityLibAdvSchema = new mongoose.Schema({
    attackMethod: {type: String, trim: true},
    precondition: {type: String, trim: true},
    assetType: {type: String, trim: true},
    assetSubType: {type: String, trim: true},
    transmissionMedia: {type: String, trim: true},
    baseProtocol: {type: String, trim: true},
    componentID: {type: String, trim: true},
    appProtocol: {type: String, trim: true},
    secureProtocol: {type: String, trim: true},
    threatType: {type: String, trim: true},
    APEquipmentRat: {type: String, trim: true},
    APEquipmentScore: {type: Number, trim: true},
    APKnowledgeRat: {type: String, trim: true},
    APKnowledgeScore: {type: Number, trim: true},
    APExpertiseRat: {type: String, trim: true},
    APExpertiseScore: {type: Number, trim: true},
    APElapsedTimeRat: {type: String, trim: true},
    APElapsedTimeScore: {type: Number, trim: true},
    APWindowTimeRat: {type: String, trim: true},
    APWindowScore: {type: Number, trim: true},
    mitigations: {type: String, trim: true},
    _id: String,
});
module.exports.ThreatFeasibilityLibAdvSchema = ThreatFeasibilityLibAdvSchema;

const FeatureImpactLibSchema = new mongoose.Schema({
    module: {type: String, trim: true},
    feature: {type: String, trim: true},
    featureType: {type: String, trim: true},
    featureRole: {type: String, trim: true},
    safety: {type: Number, trim: true},
    financial: {type: Number, trim: true},
    operational: {type: Number, trim: true},
    privacy: {type: Number, trim: true},
    SLevel: {type: String, trim: true},
    FLevel: {type: String, trim: true},
    OLevel: {type: String, trim: true},
    PLevel: {type: String, trim: true},
    damageScenarioS: {type: String, trim: true},
    damageScenarioF: {type: String, trim: true},
    damageScenarioO: {type: String, trim: true},
    damageScenarioP: {type: String, trim: true},
    damageScenario: {type: String, trim: true},
    featureId: {type: String, trim: true},
    moduleId: {type: String, trim: true},
}, {timestamps: true});
// const FeatureImpactLibModel = mongoose.model("featureImpactLib", FeatureImpactLibSchema, "featureImpactLib");
// module.exports.featureImpactLibModel = FeatureImpactLibModel;
module.exports.FeatureImpactLibSchema = FeatureImpactLibSchema;

