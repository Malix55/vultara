const mongoose = require("mongoose");
const ProjectOtherNotificationSchema = require('../models/projectOtherNotificationSchema').ProjectOtherNotificationSchema
const ProjectVulnerabilitySchema = require('../models/projectVulnerabilitySchema').ProjectVulnerabilitySchema
const ProjectThreatNotificationSchema = require("../models/projectThreatNotificationSchema").ProjectThreatNotificationSchema;

const WP29ThreatSchema = new mongoose.Schema({
    wp29ThreatIndex: String,
    mappingStatus: String
})
module.exports.WP29ThreatSchema = WP29ThreatSchema;

const projectControlSchema = require('../models/projectControlSchema').ProjectControlSchema;
const projectWeaknessSchema = require('../models/projectWeaknessSchema').ProjectWeaknessSchema;

// full schema for project field
const projectSchema = new mongoose.Schema({
    id: {
        type: String,
        index: true
    },
    name: String,
    milestoneName: String,
    milestoneId: String,
    readOnly: Boolean,
    readAccessGroup: [String],
    writeAccessGroup: [String],
    wp29: [WP29ThreatSchema],
    deletedThreatId: [String],
    riskUpdate: {
        type: Boolean,
        default: true
    },
    mappedThreatList: Boolean,
    lastModifiedBy: String,
    notes: String,
    threatListBottomPanel: {
        type: String,
        default: "Control"  // either ATTACK or Control
    },
    notApplicableWP29AttackIndex: [String],
}, { timestampes: true });
module.exports.projectSchema = projectSchema;

// a light version of project schema which only has project ID
const projectLightSchema = new mongoose.Schema({
    id: {
        type: String,
        index: true
    },
}, { timestampes: true });
module.exports.projectLightSchema = projectLightSchema;

const SbomSchema = new mongoose.Schema({
    part: String,
    vendor: String,
    product: String,
    version: String,
    update: String,
    edition: String,
    language: String,
    sw_edition: String,
    target_sw: String,
    target_hw: String,
    other: String,
    cpe23: String,
});
module.exports.SbomSchema = SbomSchema;

const microSchema = new mongoose.Schema({
    model: String,
    type: { type: String },
    manufacturerName: String,
    id: String,
    position: [Number, Number],
    lineId: [String], // stores line id
    lineTerminalId: [String], // stores terminal id
    attackSurface: Boolean,
    nickName: String,
    feature: [String],
    featureId: [String],
    featureType: [String],
    featureRole: [String],
    featureRoleIndex: [Number], // used to compose the property name of assets for a specific feature role
    featureChainId: [String], // stores feature relations, for feature-based threat analysis
    featureChainName: [String], // stores feature relations, for feature-based threat analysis
    module: String,
    modelIdInCompLib: String,
    property: [String],
    asset: [String],
    assetId: [String],
    assetType: [String],
    assetSubType: [String],
    assetFeatureIndex: [Number],
    featureConfirmed: Boolean,
    moduleIdInDb: String,
    transmissionMedia: String,
    sbom: [SbomSchema],
    hbom: [SbomSchema],
    // threat: [],
});
module.exports.microSchema = microSchema;

const controlUnitSchema = new mongoose.Schema({
    model: String,
    type: { type: String },
    id: String,
    position: [Number, Number],
    lineId: [String], // stores line id
    lineTerminalId: [String], // stores terminal id
    attackSurface: Boolean,
    nickName: String,
    feature: [String],
    featureId: [String],
    featureType: [String],
    featureRole: [String],
    featureRoleIndex: [Number], // used to compose the property name of assets for a specific feature role
    featureChainId: [String], // stores feature relations, for feature-based threat analysis
    featureChainName: [String], // stores feature relations, for feature-based threat analysis
    module: String,
    asset: [String],
    assetType: [String],
    assetSubType: [String],
    assetId: [String],
    assetFeatureIndex: [Number],
    featureConfirmed: Boolean,
    moduleIdInDb: String,
    transmissionMedia: String,
    sbom: [SbomSchema],
    hbom: [SbomSchema],
    // threat: [],
});
module.exports.controlUnitSchema = controlUnitSchema;

const commLineSchema = new mongoose.Schema({
    model: String,
    type: { type: String },
    id: String,
    position: [],
    terminalId: [String],
    terminalComponentId: [String],
    terminalComponentFeature: [[String]],
    terminalComponentFeatureId: [[String]],
    terminalComponentFeatureIndex: [[Number]], // stores feature index in terminal component. used in attackPath.assetCheck()
    terminalComponentFeatureChainId: [[String]], // stores feature relations, for feature-based threat analysis
    terminalComponentAssetAccessBoolean: [[Boolean]], // indicates whether an asset is carried. sequence of asset follows micro.asset
    terminalComponentAssetAccessType: [[String]], // Store access type of the relevant assets for a commLine. 
    attackSurface: Boolean,
    sensorInput: Boolean,
    transmissionMedia: String,
    nickName: String,
    feature: [String],
    featureId: [String],
    featureType: [String],
    featureRole: [String],
    module: String,
    baseProtocol: String,
    secureProtocol: [String],
    secureProtocolFeatureIndex: [Number],
    appProtocol: [String],
    appProtocolFeatureIndex: [Number],
    asset: [String],
    assetId: [String],
    assetType: [String],
    assetSubType: [String],
    assetFeatureIndex: [Number],
    moduleIdInDb: String,
    textProtocolDisplay: Boolean,
    // threat: ThreatType[]
});
module.exports.commLineSchema = commLineSchema;

const boundarySchema = new mongoose.Schema({
    model: String,
    type: { type: String },
    id: String,
    position: [Number, Number],
    size: [Number, Number],
    enable: Boolean,
    attackSurface: Boolean,
    nickName: String,
    module: String,
    property: [String], // not used
    asset: [String],
    // threat: ThreatType[]
});
module.exports.boundarySchema = boundarySchema;

const goalSchema = new mongoose.Schema({
    id: String,
    rowNumber: Number,
    createdBy: String,
    createdAtDateTime: Date, // 
    content: String, // description of the goal
    threatId: [String], // stores the "id" property of each mapped threat
    lastModifiedBy: String,
    lastModifiedAtDateTime: Date, // 
    controlName: [String], // store tags of control names
    controlText: String, // store description of the controls
    createdInProjectId: String, // store the project id where this goal was originally created
    libraryId: String, // unique id for a goal added to goal library
    type: String // to identify whether the goal's type is claim or goal
});
module.exports.goalSchema = goalSchema;

const projectAssumptionSchema = new mongoose.Schema({
    id: String,
    rowNumber: Number,
    createdBy: String,
    content: String,
    lastModifiedBy: String,
    highlighted: Boolean,
    projectId: String // store the project id where this assumption was originally created
});
module.exports.projectAssumptionSchema = projectAssumptionSchema;


const ThreatListSchema = new mongoose.Schema({
    asset: String, // asset name
    assetType: String,
    assetId: String,
    attackFeasibility: Number,
    attackFeasibilityLevel: String,
    attackPath: [String],
    attackPathName: String,
    attackSurface: Boolean,
    componentId: String,
    featureRole: String,
    featureType: String,
    fromFeature: String,
    fromFeatureId: String,
    fromFeatureIndex: String,
    id: String,
    impactS: Number,
    impactSLevel: String,
    impactF: Number,
    impactFLevel: String,
    impactO: Number,
    impactOLevel: String,
    impactP: Number,
    impactPLevel: String,
    impactOriginCompAssFea: [String], // [componentId, asset name, feature name]
    module: String,
    moduleId: String,
    nickName: String,
    riskLevel: {
        type: String,
        index: true
    },
    riskScore: Number,
    securityPropertyCia: String,
    securityPropertyStride: String,
    subType: String, // asset subType
    threatScenario: String,
    treatment: {
        type: String,
        index: true
    },
    treatmentVal: {
        type: Boolean,
        index: true
    },
    treatmentValidatedBy: String,
    type: { type: String },
    damageScenario: String,
    reviewed: {
        type: Boolean,
        index: true
    },
    reviewedBy: String,
    reviewStatusRevokedBy: String,
    validateStatusRevokedBy: String,
    treatmentStatusChangedBy: String,
    reviewStatusRevokedDateTime: Date,
    reviewedDateTime: Date,
    treatmentPickedDateTime: Date,
    validatedDateTime: Date,
    validationRevokedDateTime: Date,
    lastModifiedBy: String,
    cybersecurityClaim: String,
    notes: String,
    isExpanded: Boolean,
    attackFeasibilityAfter: Number,
    attackFeasibilityLevelAfter: String,
    attackFeasibilityLevelUpdated: String,
    attackFeasibilityLevelAfterUpdated: String,
    riskScoreAfter: Number,
    riskLevelAfter: String,
    riskLevelBefore: String,
    riskLevelUpdated: String,
    riskLevelAfterUpdated: String,
    attackPathNameDes: String,
    impactFAfter: Number,
    impactSAfter: Number,
    impactOAfter: Number,
    impactPAfter: Number,
    impactFLevelAfter: String,
    impactSLevelAfter: String,
    impactOLevelAfter: String,
    impactPLevelAfter: String,
    impactFLevelAfterUpdated: String,
    impactSLevelAfterUpdated: String,
    impactOLevelAfterUpdated: String,
    impactPLevelAfterUpdated: String,
    impactFLevelUpdated: String,
    impactSLevelUpdated: String,
    impactOLevelUpdated: String,
    impactPLevelUpdated: String,
    attackFeasibilityElapsed: Number,
    attackFeasibilityExpertise: Number,
    attackFeasibilityKnowledge: Number,
    attackFeasibilityWindow: Number,
    attackFeasibilityEquipment: Number,
    attackFeasibilityElapsedAiUser: Number,
    attackFeasibilityExpertiseAiUser: Number,
    attackFeasibilityKnowledgeAiUser: Number,
    attackFeasibilityWindowAiUser: Number,
    attackFeasibilityEquipmentAiUser: Number,
    attackFeasibilityElapsedAiOrg: Number,
    attackFeasibilityExpertiseAiOrg: Number,
    attackFeasibilityKnowledgeAiOrg: Number,
    attackFeasibilityWindowAiOrg: Number,
    attackFeasibilityEquipmentAiOrg: Number,
    attackFeasibilityElapsedRationale: String,
    attackFeasibilityExpertiseRationale: String,
    attackFeasibilityKnowledgeRationale: String,
    attackFeasibilityWindowRationale: String,
    attackFeasibilityEquipmentRationale: String,
    attackFeasibilityElapsedRationaleAiUser: String,
    attackFeasibilityExpertiseRationaleAiUser: String,
    attackFeasibilityKnowledgeRationaleAiUser: String,
    attackFeasibilityWindowRationaleAiUser: String,
    attackFeasibilityEquipmentRationaleAiUser: String,
    attackFeasibilityElapsedRationaleAiOrg: String,
    attackFeasibilityExpertiseRationaleAiOrg: String,
    attackFeasibilityKnowledgeRationaleAiOrg: String,
    attackFeasibilityWindowRationaleAiOrg: String,
    attackFeasibilityEquipmentRationaleAiOrg: String,
    attackFeasibilityCVSSVector: Number,
    attackFeasibilityCVSSComplexity: Number,
    attackFeasibilityCVSSPrivilege: Number,
    attackFeasibilityCVSSUser: Number,
    attackFeasibilityCVSSVectorRationale: String,
    attackFeasibilityCVSSComplexityRationale: String,
    attackFeasibilityCVSSPrivilegeRationale: String,
    attackFeasibilityCVSSUserRationale: String,
    attackFeasibilityAttackVector: String,
    attackFeasibilityAttackVectorRationale: String,
    attackFeasibilityElapsedAfter: Number,
    attackFeasibilityExpertiseAfter: Number,
    attackFeasibilityKnowledgeAfter: Number,
    attackFeasibilityWindowAfter: Number,
    attackFeasibilityEquipmentAfter: Number,
    attackFeasibilityElapsedAfterRationale: String,
    attackFeasibilityExpertiseAfterRationale: String,
    attackFeasibilityKnowledgeAfterRationale: String,
    attackFeasibilityWindowAfterRationale: String,
    attackFeasibilityEquipmentAfterRationale: String,
    attackFeasibilityCVSSVectorAfter: Number,
    attackFeasibilityCVSSComplexityAfter: Number,
    attackFeasibilityCVSSPrivilegeAfter: Number,
    attackFeasibilityCVSSUserAfter: Number,
    attackFeasibilityCVSSVectorAfterRationale: String,
    attackFeasibilityCVSSComplexityAfterRationale: String,
    attackFeasibilityCVSSPrivilegeAfterRationale: String,
    attackFeasibilityCVSSUserAfterRationale: String,
    attackFeasibilityAttackVectorAfter: String,
    attackFeasibilityAttackVectorAfterRationale: String,
    attackFeasibilityElapsedUpdated: Number,
    attackFeasibilityExpertiseUpdated: Number,
    attackFeasibilityKnowledgeUpdated: Number,
    attackFeasibilityWindowUpdated: Number,
    attackFeasibilityEquipmentUpdated: Number,
    attackFeasibilityElapsedUpdatedRationale: String,
    attackFeasibilityExpertiseUpdatedRationale: String,
    attackFeasibilityKnowledgeUpdatedRationale: String,
    attackFeasibilityWindowUpdatedRationale: String,
    attackFeasibilityEquipmentUpdatedRationale: String,
    attackFeasibilityCVSSVectorUpdated: Number,
    attackFeasibilityCVSSComplexityUpdated: Number,
    attackFeasibilityCVSSPrivilegeUpdated: Number,
    attackFeasibilityCVSSUserUpdated: Number,
    attackFeasibilityCVSSVectorUpdatedRationale: String,
    attackFeasibilityCVSSComplexityUpdatedRationale: String,
    attackFeasibilityCVSSPrivilegeUpdatedRationale: String,
    attackFeasibilityCVSSUserUpdatedRationale: String,
    attackFeasibilityAttackVectorUpdated: String,
    attackFeasibilityAttackVectorUpdatedRationale: String,
    attackFeasibilityElapsedAfterUpdated: Number,
    attackFeasibilityExpertiseAfterUpdated: Number,
    attackFeasibilityKnowledgeAfterUpdated: Number,
    attackFeasibilityWindowAfterUpdated: Number,
    attackFeasibilityEquipmentAfterUpdated: Number,
    attackFeasibilityElapsedAfterUpdatedRationale: String,
    attackFeasibilityExpertiseAfterUpdatedRationale: String,
    attackFeasibilityKnowledgeAfterUpdatedRationale: String,
    attackFeasibilityWindowAfterUpdatedRationale: String,
    attackFeasibilityEquipmentAfterUpdatedRationale: String,
    attackFeasibilityCVSSVectorAfterUpdated: Number,
    attackFeasibilityCVSSComplexityAfterUpdated: Number,
    attackFeasibilityCVSSPrivilegeAfterUpdated: Number,
    attackFeasibilityCVSSUserAfterUpdated: Number,
    attackFeasibilityCVSSVectorAfterUpdatedRationale: String,
    attackFeasibilityCVSSComplexityAfterUpdatedRationale: String,
    attackFeasibilityCVSSPrivilegeAfterUpdatedRationale: String,
    attackFeasibilityCVSSUserAfterUpdatedRationale: String,
    attackFeasibilityAttackVectorAfterUpdated: String,
    attackFeasibilityAttackVectorAfterUpdatedRationale: String,
    riskUpdateNotes: String,
    riskUpdated: Boolean,
    threatSource: String, // ruleEngine, userManual, userAddedThreatLib, dataEngine
    threatRuleEngineId: String, // designator for ruleEngine generated threat
    threatRuleEngineIdBefore: String, // for threats merged from Control bottom panel
    createdBy: String, // used for userManual type of threat
    createdInProject: String, // use for userManual type and userAddedThreatLib type of threat
    highlight: String, // for uncertain item
    threatRankingLabel: String, // designator for human use
    reviewStatusForFilter: String, // so that Angular table can search reviewed results
    validateStatusForFilter: String, // so that Angular table can search validated results
    moduleIdInDb: String,
    newRiskRatingAvailable: Boolean,
    reasonForNewRiskRating: String,
    threatRowNumber: Number, // dynamic number to display the row number of a threat
    baseProtocol: String,
    appProtocol: [String],
    secureProtocol: [String],
    transmissionMedia: String,
    attackMethod: String,
    MITM: Boolean,
    wp29AttackIndex: [String],
    assetTag: [String],
    attackSurfaceSensorInput: Boolean,
    hidden: Boolean,
    threatFeaLibAdvId: String,
    endOfChainModuleIdInDb: String,
    mitreAttackIndex: { // array index in each field shall match one merge
        matrix: String, // matrix name - mitreAttackMethod property value from systemConfig
        tacticVId: [Number],
        mergedThreatId: [String], // store the merged threat id. each element in this array shall match each element in other arrays (tacticVId, techniqueVId, subTechniqueVId, removedAfterMerge)
        techniqueVId: [Number], // push -1 if no technique is selected
        subTechniqueVId: [Number], // push -1 if no technique is selected
        removedAfterMerge: [Boolean], // if user chooses to remove the original threat after merge, add true; otherwise false
        atomicThreatId: [String], // store individual threats that are merged. each element in this array shall match each element in other arrays (tacticVId, techniqueVId, subTechniqueVId)
    },
    threatBeforeControl: String, // stores the threat dropped in the left column in the Control bottom panel
    threatStore: [Object],// stores all of the merged threats so that they can be retrieved and shown when the show merged threat is clicked on a merged threat
}, { timestamps: true })
module.exports.ThreatListSchema = ThreatListSchema;

const ProjectDesignDataSchema = new mongoose.Schema({
    project: projectSchema,
    micro: [microSchema],
    controlUnit: [controlUnitSchema],
    commLine: [commLineSchema],
    boundary: [boundarySchema],
}, { timestamps: true });
module.exports.ProjectDesignDataSchema = ProjectDesignDataSchema;

const ProjectHtmlSchema = new mongoose.Schema({
    projectId: String,
    html: String,
}, { timestamps: true });
module.exports.ProjectHtmlSchema = ProjectHtmlSchema;

const ProjectThreatListSchema = new mongoose.Schema({
    projectId:String,
    threat: [ThreatListSchema],
}, { timestamps: true });
module.exports.ProjectThreatListSchema = ProjectThreatListSchema;

const projectDeletedThreats = new mongoose.Schema({
    projectId: String,
    threat: [ThreatListSchema],
}, { timestamps: true });
module.exports.projectDeletedThreats = projectDeletedThreats;

const ProjectMilestoneSchema = new mongoose.Schema({
    project: projectSchema,
    micro: [microSchema],
    controlUnit: [controlUnitSchema],
    commLine: [commLineSchema],
    boundary: [boundarySchema],
    html: String,
    threat: [ThreatListSchema],
    goal: [goalSchema],
    assumptions:[projectAssumptionSchema],
    vulnerability : [ProjectVulnerabilitySchema],
    otherNotifications: [ProjectOtherNotificationSchema],
    riskNotifications: [ProjectThreatNotificationSchema],
    control:[projectControlSchema],
    weakness:[projectWeaknessSchema]
}, { timestamps: true });
module.exports.ProjectMilestoneSchema = ProjectMilestoneSchema;

const ProjectCybersecurityGoalSchema = new mongoose.Schema({
    projectId: String,
    goal: [goalSchema],
}, { timestamps: true });
module.exports.ProjectCybersecurityGoalSchema = ProjectCybersecurityGoalSchema;