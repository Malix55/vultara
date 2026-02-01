import { MomentInput } from "moment";

// attributes associated with a microcontroller
export interface MicroProperty {
  hsm?: string[];
  hsmId?: string[];
  cpe23?: string;
  manufacturer?: string;
  manufacturerId?: string;
  model?: string;
  busCanNumber?: number;
  busCanType?: string;
  busEthNumber?: number;
  busEthType?: string;
}
// export interface HsmType {
//   none?: boolean;
//   she?: boolean;
//   cse?: boolean;
//   cse2?: boolean;
//   cse3?: boolean;
//   aurixHsm?: boolean;
//   evitaL?: boolean;
//   evitaM?: boolean;
//   evitaH?: boolean;
// }
// export interface CanType {
//   speedH?: boolean;
//   speedM?: boolean;
//   speedL?: boolean;
//   fd?: boolean;
// }
// export interface EthType {
//   broadRReach?: boolean;
//   base100Tx?: boolean;
// }
// attributes associated with a controlUnit
export interface ControlUnitProperty {
  category?: string;
  model?: string;
  feature?: string[];
}
// attributes associated with a boundary
export interface BoundaryProperty {
  secureEnvironment: boolean;
}
// for flexible displaying names and fixed storage names
export interface ValueAndViewValue {
  value: string,
  viewValue: string,
  index?: number
}
// attributes associated with a communication line
export interface CommLineProperty {
  moduleIdInDb?: string;
  model?: string;
  module?: string;
  baseProtocol?: string; // CAN, CAN FD, Ethernet
  transmissionMedia?: string[];
  secureProtocol?: string[]; // TLS, IPsec, SecOC
  appProtocol?: string[]; // http
  feature?: string[];
  featureId?: string[];
  asset?: string[];
  assetId?: string[];
  assetType?: string[];
  assetSubType?: string[];
}

// attributes associated with an attacker
// export interface AttackerProperty {
//   level: string;

// }

// export interface AssetList {

// }

export interface ImpactType {
  f: boolean;
  fScore: number;
  s: boolean;
  sScore: number;
  o: boolean;
  oScore: number;
  p: boolean;
  pScore: number;
}

export interface ThreatType {
  name: string;
  type: string;
  attackPath: string[];
}

// use this interface to assemble controlUnitDatabase in property panel and database settings
export interface ControlUnitLib {
  _id?: string,
  model?: string,
  category?: string,
  feature?: string[],
  featureId?: string[],
  featureType?: string[],
  featureRole?: string[],
  featureRoleIndex?: number[], // used to compose the property name of assets for a specific feature role
}

// this format follows standard: https://csrc.nist.gov/CSRC/media/Publications/nistir/8085/draft/documents/nistir_8085_draft.pdf
export interface SbomInterface {
  part: string,
  vendor: string,
  product: string,
  version?: string,
  update?: string,
  edition?: string,
  language?: string,
  sw_edition?: string,
  target_sw?: string,
  target_hw?: string,
  other?: string,
  cpe23?: string, // this stores the cpe 2.3 format
}
// export interface terminalComponentFeatureType {
//   componentId: string;
//   feature: string[];
// }
// use this class to record the micros in a model
export class ComponentMicro {
  constructor(
    public model: string,
    public type: string,
    public id: string,
    public position: [number, number],
    public modelIdInCompLib?: string,
    public lineId?: string[], // stores line id
    public lineTerminalId?: string[], // stores terminal id
    public attackSurface?: boolean,
    public nickName?: string,
    public feature?: string[],
    public featureId?: string[],
    public featureType?: string[],
    public featureRole?: string[],
    public featureRoleIndex?: number[], // used to compose the property name of assets for a specific feature role
    public featureChainId?: string[], // stores feature relations, for feature-based threat analysis
    public featureChainName?: string[], // stores feature relations, for feature-based threat analysis
    public module?: string,
    public moduleId?: string,
    public moduleIdInDb?: string,
    public property?: string[],
    public transmissionMedia?: string,
    public asset?: string[],
    public assetId?: string[],
    public assetType?: string[],
    public assetSubType?: string[],
    public assetFeatureIndex?: number[],
    public featureConfirmed?: boolean,
    public hbom?: SbomInterface[], 
    public sbom?: SbomInterface[],     

    // public threat?: ThreatType[],
    ) {}
}
// use this class to record the controllers in a model
export class ComponentControlUnit {
  constructor(
    public model: string,
    public type: string,
    public id: string,
    public position: [number, number],
    public lineId?: string[], // stores line id
    public lineTerminalId?: string[], // stores terminal id
    public attackSurface?: boolean,
    public nickName?: string,
    public feature?: string[],
    public featureId?: string[],
    public featureType?: string[],
    public featureRole?: string[],
    public featureRoleIndex?: number[], // used to compose the property name of assets for a specific feature role
    public featureChainId?: string[], // stores feature relations, for feature-based threat analysis
    public featureChainName?: string[], // stores feature relations, for feature-based threat analysis
    public module?: string,
    public moduleId?: string,
    public moduleIdInDb?: string,
    public transmissionMedia?: string,
    public asset?: string[],
    public assetId?: string[],
    public assetType?: string[],
    public assetSubType?: string[],
    public assetFeatureIndex?: number[],
    public featureConfirmed?: boolean,
    public hbom?: SbomInterface[], 
    public sbom?: SbomInterface[], 
    // public threat?: ThreatType[],
    ) {}
}

// use this class to record the communication buses in a model
export class ComponentCommLine {
  constructor(
    public model: string, // baseProtocol: CAN, CAN FD, Ethernet
    public type: string,
    public id: string,
    public position: number[],
    public terminalId: string[], // store terminal id
    public terminalComponentId: string[], // store the ids of attached components
    public terminalComponentFeature?: any, // store the features that using this commLine
    public terminalComponentFeatureId?: any, // store the features Id
    public terminalComponentFeatureIndex?: any, // store feature index in the terminal component. used in atackPath.assetCheck()
    public terminalComponentFeatureChainId?: string[], // stores featureChain id, for feature-based threat analysis
    public terminalComponentAssetAccessBoolean?: Array<Array<boolean>>, // indicates whether an asset is carried. sequence follows micro.asset
    public terminalComponentAssetAccessType?: Array<Array<string>>, // Store access type of the relevant assets for a commLine. 
    public attackSurface?: boolean,
    public sensorInput?: boolean,
    public transmissionMedia?: string,
    public nickName?: string,
    public feature?: string[],
    public featureId?: string[],
    public featureType?: string[],
    public featureRole?: string[],
    public module?: string,
    public moduleId?: string,
    public moduleIdInDb?: string,
    public baseProtocol?: string,
    public secureProtocol?: string[], // TLS, IPsec, SecOC
    public appProtocol?: string[], // http
    public appProtocolFeatureIndex?: number[], // link appProtocol to features
    public secureProtocolFeatureIndex?: number[], // link secureProtocol to features
    public asset?: string[],
    public assetId?: string[],
    public assetType?: string[],
    public assetSubType?: string[],
    public assetFeatureIndex?: number[],
    public textProtocolDisplay?: boolean,
    // public threat?: ThreatType[],
    ) {}
}
// use this class to record the boundaries in a model
export class ComponentBoundary {
  constructor(
    public model: string,
    public type: string,
    public id: string,
    public position: [number, number],
    public size: [number, number],  // [width, height]
    public enable: boolean,
    public attackSurface?: boolean,
    public nickName?: string,
    public module?: string,
    public moduleId?: string,
    public property?: BoundaryProperty, // not used
    public asset?: string[],
    public assetId?: string[],
    // public threat?: ThreatType[],
    ) {}
}
export class WP29Model {
  constructor(
    public wp29ThreatIndex: string,
    public mappingStatus: string
  ) { }
}
// use this class to record the project information in a model
export class ProjectType {
  constructor(
    public id: string,
    public name?: string,
    public milestoneName?: string,
    public milestoneId?: string,
    public readOnly?: boolean,
    public readAccessGroup?: string[],
    public writeAccessGroup?: string[],
    public wp29?: WP29Model[],
    public lastModifiedBy?: string,
    public notes?: string,
    public deletedThreatId?: string[],
    public riskUpdate?: boolean,
    public userLabel?: string[], // for searching purpose
    public threatListBottomPanel?: string, // either ATTACK or Control,
    public notApplicableWP29AttackIndex?: string[], // "Not Applicable" index
    public mappedThreatList?: boolean,
  ) { }
}
export class MatrixType {
  constructor(
    public id?: Array<string>,
    public matrix?: Array<Array<number>>,
  ) { }
}
export class ComponentList {
  constructor(
    public project: ProjectType,
    public micro: Array<ComponentMicro>,
    public controlUnit: Array<ComponentControlUnit>,
    public commLine: Array<ComponentCommLine>,
    public boundary: Array<ComponentBoundary>,
    // public connectivity?: MatrixType,
  ) { }
}
export class ProjectHtml {
  constructor(
    public projectId: string,
    public html: string,
  ) { }
}

export class CybersecurityGoal {
  constructor(
    public id: string,
    public rowNumber: number,
    public createdBy: string, // stores the user name who created this goal
    public createdAtDateTime: any, // use moment()
    public content: string, // description of the goal
    public libraryId: string, // unique id for a goal added to goal library
    public type: string, // to identify whether the goal's type is claim or goal
    public threatId?: string[], // stores the "id" property of each mapped threat
    public lastModifiedBy?: string, // stores the user id who last modified this goal
    public lastModifiedAtDateTime?: any, // use moment()
    public controlName?: string[], // store tags of control names
    public controlText?: string, // store description of the controls
    public createdInProjectId?: string, // store the project id where this goal was originally created
    public _id?: string,
  ) {}
}
export interface Assumption {
     id: string,
     createdBy: string, // stores the user Id of the user who created this assumption
     createdAtDateTime: any,
     content: string, // content of the Assumption
     rowNumber: Number,
     lastModifiedBy?: string, // stores the user id of the user who last modified this assumption
     lastModifiedAtDateTime?: any,
     projectId: string, // stores the project id where this assumption was originally created
}

export class ThreatItem {
  constructor(
    public componentId: string,
    public asset: string, // asset name
    public assetType: string,
    public attackFeasibility: number,
    public attackFeasibilityLevel: string,
    public attackPath: string[],
    public attackPathName: string,
    public attackSurface: boolean,
    public id: string,
    public fromFeature: string,
    public impactF: number,
    public impactS: number,
    public impactO: number,
    public impactP: number,
    public impactFLevel: string,
    public impactSLevel: string,
    public impactOLevel: string,
    public impactPLevel: string,
    public damageScenario: string,
    public impactOriginCompAssFea: string[],
    public module: string,
    public nickName: string,
    public riskScore: number,
    public riskLevel: string,
    public securityPropertyCia: string,
    public securityPropertyStride: string,
    public threatScenario: string,
    public treatment: string,
    public treatmentVal: boolean,
    public type: string,
    public reviewed: boolean,
    public reviewedBy: string,
    public isExpanded: boolean,
    public treatmentValidatedBy?: string,
    public lastModifiedBy?: string,
    public cybersecurityClaim?: string,
    public notes?: string,
    public assetId?: string,
    public fromFeatureId?: string,
    public fromFeatureIndex?: string,
    public moduleId?: string,
    public subType?: string, // asset subType
    public reviewStatusRevokedBy?: string,
    public validateStatusRevokedBy?: string,
    public treatmentStatusChangedBy?: string,
    public reviewStatusRevokedDateTime?: any,
    public reviewedDateTime?: any,
    public treatmentPickedDateTime?: any,
    public validatedDateTime?: any,
    public validationRevokedDateTime?: any,
    public featureRole?: string,
    public featureType?: string,
    public riskScoreAfter?: number,
    public riskLevelAfter?: string,
    public riskLevelBefore?: string,
    public riskLevelUpdated?: string,
    public riskLevelAfterUpdated?: string,
    public attackPathNameDes?: string,
    public attackFeasibilityAfter?: number,
    public attackFeasibilityLevelAfter?: string,
    public attackFeasibilityLevelUpdated?: string,
    public attackFeasibilityLevelAfterUpdated?: string,
    public impactFAfter?: number,
    public impactSAfter?: number,
    public impactOAfter?: number,
    public impactPAfter?: number,
    public impactFLevelAfter?: string,
    public impactSLevelAfter?: string,
    public impactOLevelAfter?: string,
    public impactPLevelAfter?: string,
    public impactFLevelUpdated?: string,
    public impactSLevelUpdated?: string,
    public impactOLevelUpdated?: string,
    public impactPLevelUpdated?: string,
    public impactFLevelAfterUpdated?: string,
    public impactSLevelAfterUpdated?: string,
    public impactOLevelAfterUpdated?: string,
    public impactPLevelAfterUpdated?: string,
    public attackFeasibilityElapsed?: number,
    public attackFeasibilityExpertise?: number,
    public attackFeasibilityKnowledge?: number,
    public attackFeasibilityWindow?: number,
    public attackFeasibilityEquipment?: number,
    public attackFeasibilityElapsedAiUser?: number,
    public attackFeasibilityExpertiseAiUser?: number,
    public attackFeasibilityKnowledgeAiUser?: number,
    public attackFeasibilityWindowAiUser?: number,
    public attackFeasibilityEquipmentAiUser?: number,
    public attackFeasibilityElapsedAiOrg?: number,
    public attackFeasibilityExpertiseAiOrg?: number,
    public attackFeasibilityKnowledgeAiOrg?: number,
    public attackFeasibilityWindowAiOrg?: number,
    public attackFeasibilityEquipmentAiOrg?: number,
    public attackFeasibilityElapsedRationale?: string,
    public attackFeasibilityExpertiseRationale?: string,
    public attackFeasibilityKnowledgeRationale?: string,
    public attackFeasibilityWindowRationale?: string,
    public attackFeasibilityEquipmentRationale?: string,
    public attackFeasibilityElapsedRationaleAiUser?: string,
    public attackFeasibilityExpertiseRationaleAiUser?: string,
    public attackFeasibilityKnowledgeRationaleAiUser?: string,
    public attackFeasibilityWindowRationaleAiUser?: string,
    public attackFeasibilityEquipmentRationaleAiUser?: string,
    public attackFeasibilityElapsedRationaleAiOrg?: string,
    public attackFeasibilityExpertiseRationaleAiOrg?: string,
    public attackFeasibilityKnowledgeRationaleAiOrg?: string,
    public attackFeasibilityWindowRationaleAiOrg?: string,
    public attackFeasibilityEquipmentRationaleAiOrg?: string,
    public attackFeasibilityCVSSVector?: number,
    public attackFeasibilityCVSSComplexity?: number,
    public attackFeasibilityCVSSPrivilege?: number,
    public attackFeasibilityCVSSUser?: number,
    public attackFeasibilityCVSSVectorRationale?: string,
    public attackFeasibilityCVSSComplexityRationale?: string,
    public attackFeasibilityCVSSPrivilegeRationale?: string,
    public attackFeasibilityCVSSUserRationale?: string,
    public attackFeasibilityAttackVector?: string,
    public attackFeasibilityAttackVectorRationale?: string,
    public attackFeasibilityElapsedAfter?: number,
    public attackFeasibilityExpertiseAfter?: number,
    public attackFeasibilityKnowledgeAfter?: number,
    public attackFeasibilityWindowAfter?: number,
    public attackFeasibilityEquipmentAfter?: number,
    public attackFeasibilityElapsedAfterRationale?: string,
    public attackFeasibilityExpertiseAfterRationale?: string,
    public attackFeasibilityKnowledgeAfterRationale?: string,
    public attackFeasibilityWindowAfterRationale?: string,
    public attackFeasibilityEquipmentAfterRationale?: string,
    public attackFeasibilityCVSSVectorAfter?: number,
    public attackFeasibilityCVSSComplexityAfter?: number,
    public attackFeasibilityCVSSPrivilegeAfter?: number,
    public attackFeasibilityCVSSUserAfter?: number,
    public attackFeasibilityCVSSVectorAfterRationale?: string,
    public attackFeasibilityCVSSComplexityAfterRationale?: string,
    public attackFeasibilityCVSSPrivilegeAfterRationale?: string,
    public attackFeasibilityCVSSUserAfterRationale?: string,
    public attackFeasibilityAttackVectorAfter?: string,
    public attackFeasibilityAttackVectorAfterRationale?: string,
    public attackFeasibilityElapsedUpdated?: number,
    public attackFeasibilityExpertiseUpdated?: number,
    public attackFeasibilityKnowledgeUpdated?: number,
    public attackFeasibilityWindowUpdated?: number,
    public attackFeasibilityEquipmentUpdated?: number,
    public attackFeasibilityElapsedUpdatedRationale?: string,
    public attackFeasibilityExpertiseUpdatedRationale?: string,
    public attackFeasibilityKnowledgeUpdatedRationale?: string,
    public attackFeasibilityWindowUpdatedRationale?: string,
    public attackFeasibilityEquipmentUpdatedRationale?: string,
    public attackFeasibilityCVSSVectorUpdated?: number,
    public attackFeasibilityCVSSComplexityUpdated?: number,
    public attackFeasibilityCVSSPrivilegeUpdated?: number,
    public attackFeasibilityCVSSUserUpdated?: number,
    public attackFeasibilityCVSSVectorUpdatedRationale?: string,
    public attackFeasibilityCVSSComplexityUpdatedRationale?: string,
    public attackFeasibilityCVSSPrivilegeUpdatedRationale?: string,
    public attackFeasibilityCVSSUserUpdatedRationale?: string,
    public attackFeasibilityAttackVectorUpdated?: string,
    public attackFeasibilityAttackVectorUpdatedRationale?: string,
    public attackFeasibilityElapsedAfterUpdated?: number,
    public attackFeasibilityExpertiseAfterUpdated?: number,
    public attackFeasibilityKnowledgeAfterUpdated?: number,
    public attackFeasibilityWindowAfterUpdated?: number,
    public attackFeasibilityEquipmentAfterUpdated?: number,
    public attackFeasibilityElapsedAfterUpdatedRationale?: string,
    public attackFeasibilityExpertiseAfterUpdatedRationale?: string,
    public attackFeasibilityKnowledgeAfterUpdatedRationale?: string,
    public attackFeasibilityWindowAfterUpdatedRationale?: string,
    public attackFeasibilityEquipmentAfterUpdatedRationale?: string,
    public attackFeasibilityCVSSVectorAfterUpdated?: number,
    public attackFeasibilityCVSSComplexityAfterUpdated?: number,
    public attackFeasibilityCVSSPrivilegeAfterUpdated?: number,
    public attackFeasibilityCVSSUserAfterUpdated?: number,
    public attackFeasibilityCVSSVectorAfterUpdatedRationale?: string,
    public attackFeasibilityCVSSComplexityAfterUpdatedRationale?: string,
    public attackFeasibilityCVSSPrivilegeAfterUpdatedRationale?: string,
    public attackFeasibilityCVSSUserAfterUpdatedRationale?: string,
    public attackFeasibilityAttackVectorAfterUpdated?: string,
    public attackFeasibilityAttackVectorAfterUpdatedRationale?: string,
    public riskUpdateNotes?: string,
    public riskUpdated?: boolean,
    public threatSource?: string, // ruleEngine, userManual, userAddedThreatLib, dataEngine, merged, wp29RuleEngine
    public threatRuleEngineId?: string, // designator for ruleEngine generated threat (machine use)
    public threatRuleEngineIdBefore?: string, // for threats merged from Control bottom panel
    public createdBy?: string, // used for userManual type of threat
    public createdInProject?: string, // used for userManual type and userAddedThreatLib type of threat
    public highlight?: string, // uncertain item
    public threatRankingLabel?: string, // designator for human use
    public reviewStatusForFilter?: string, // so that Angular table can search reviewed results
    public validateStatusForFilter?: string, // so that Angular table can search validated results
    public moduleIdInDb?: string,
    public newRiskRatingAvailable?: boolean,
    public reasonForNewRiskRating?: string,
    public threatRowNumber?: number, // dynamic number to display the row number of a threat
    public baseProtocol?: string,
    public appProtocol?: string[],
    public secureProtocol?: string[],
    public transmissionMedia?: string,
    public feasibilityDetailsExpanded?: boolean,
    public attackMethod?: string,
    public MITM?: boolean,
    public wp29AttackIndex?: string[],
    public assetTag?: string[],
    public attackSurfaceSensorInput?: boolean,
    public hidden?: boolean,
    public threatFeaLibAdvId?: string,
    public endOfChainModuleIdInDb?: string,
    public threatStore?:any, //stores all of the merged threats so that they can be retrieved and shown when the show merged threat is clicked on a merged threat
    public mitreAttackIndex?: mitreAttackIndexInterface, // array index in each field shall match one merge
    public threatBeforeControl?: string, // stores the threat dropped in the left column in the Control bottom panel
  ) { }
}

export interface mitreAttackIndexInterface {
  // these following four properties are used by both individual threats and merged threats
  matrix: string, // matrix name - mitreAttackMethod property value from systemConfig
  tacticVId: number[],
  techniqueVId: number[], // push -1 if no technique is selected
  subTechniqueVId: number[], // push -1 if no technique is selected
  // these following two properties are used only by individual threats that are merged
  mergedThreatId?: string[], // store the merged threat id. each element in this array shall match each element in other arrays (tacticVId, techniqueVId, subTechniqueVId, removedAfterMerge)
  removedAfterMerge?: boolean[], // if user chooses to remove the original threat after merge, add true; otherwise false
  // this following property is used only by a merged threat
  atomicThreatId?: string[], // store individual threats that are merged. each element in this array shall match each element in other arrays (tacticVId, techniqueVId, subTechniqueVId)
}

export interface VulnerabilityInterface {
  cveDataMetaIds: String,
  projectId: String,
  size?:any,
  isNotified?: Boolean,
  component: String,
  sbom?:{product: String},
  hbom?:{product: String},
  description: String,
  publishedDate: MomentInput,
  reviewed: Boolean,
  treatment: String,
  highlighted: Boolean,
  validated: Boolean,
  baseScore: any,
  no: Number,
  formattedPublishedDate?: String,
  swhw: String,
  _id: String,
  updated?: Boolean,
  isNew: Boolean
}

export class  Vulnerability implements VulnerabilityInterface {
  constructor(
    public no: number,
    public _id: string,
    public component: string,
    public swhw: string,
    public highlighted: Boolean,
    public isNew: Boolean,
    public cveDataMetaIds: string,
    public publishedDate: string,
    public description: string,
    public baseScore: any,
    public treatment: string,
    public validated: Boolean,
    public reviewed: boolean,
    public projectId: String,
    public isSbom: Boolean,
    public baseSeverity: string,
    public sbom:{product: String},
    public hbom:{product: String},
    public vulnerabilitySource: String
  ){}
}

   // these classes are not used
   // use this class to record the attackers in a model
// export class ComponentAttacker {

//   constructor(
//       public name: string,
//       public type: string,
//       public id: string,
//       public targetId: string,
//       public position: [number, number],
//       public property?: AttackerProperty,
//       public threat?: ThreatType) {
//       }
// }

// export class ItemComponentList {
//   public itemComponent: ComponentMicro;
//   public static itemComponents: Array<ComponentMicro>;

//     createItemComponent(name: string, type: string, id: string, position: [number, number]) {
//         // let newItemComponent = new ItemComponent(name, type, id, position);
//         ItemComponentList.itemComponents.push(new ComponentMicro(name, type, id, position))
//     }

//     showAllItemComponents(): ComponentMicro [] {
//         return ItemComponentList.itemComponents
//     }
// }


// use this class to record the communication ports in a model


export interface TacticThreatsInterface {
  tacticVId: number,
  threats: ThreatItem[]
}

export interface TacticInterface {
  matrix: string[],
  type: string,
  name: string,
  vId: number,
  tactic: number[],
  technique: any[],
  description: string,
  mitreId: string,
  threatFeaLibAdvId: any[]
}
