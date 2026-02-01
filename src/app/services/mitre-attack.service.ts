import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ThreatItem, TacticInterface, TacticThreatsInterface } from 'src/threatmodel/ItemDefinition';
import { ArrOpService } from './arr-op.service';
import { AuthenticationService, UserProfile } from './authentication.service';
import { DesignSettingsService } from './design-settings.service';

@Injectable({
  providedIn: 'root'
})
export class MitreAttackService {
  public tactics: TacticInterface[] = [];
  public techniques: TacticInterface[] = [];
  public atmTactics: TacticInterface[] = [];
  public mitreAttackComponents: string[] = [];
  public removedAfterMerge: string[] = [];
  public tacticsThreats: TacticThreatsInterface[] = [];
  public mitreAttackBottomPanelType: string = "Control";
  public mitreControlBeforeThreat: ThreatItem;
  public mitreControlAfterThreat: ThreatItem;

  currentUserProfile: UserProfile = this.authService.currentUserValue();

  mergeAttackThreatStream: Subject<any> = new Subject<any>();
  mergeControlThreatStream: Subject<any> = new Subject<any>();

  private project: any;

  constructor(
    private arrOpService: ArrOpService,
    private authService: AuthenticationService,
    private editDesignShared: DesignSettingsService
  ) {
    if (localStorage.getItem("newDesign")) {
      this.project = this.editDesignShared.localProjectInfoFromLocalStorage();
    };
  }

  resetControlThreats() {
    this.mitreControlBeforeThreat = undefined;
    this.mitreControlAfterThreat = undefined;
  }

  // Set ATM tactics array from mitreAttckDb records
  public setAtmTactics() {
    if (this.atmTactics.length === 0 && this.tactics.length > 0) {
      this.atmTactics = this.tactics.filter((_: TacticInterface) => _.matrix.includes("atm")).sort((a: any, b: any) => a.vId > b.vId ? 1 : -1);
    }
  }

  // Add new threat to selected tactic column
  public addTacticThreat(tacticVId: number, threat: ThreatItem) {
    const tactic: TacticInterface = this.tactics.find((_: TacticInterface) => _.vId === tacticVId);
    if (tactic) {
      const tacticThreatsIndex: number = this.tacticsThreats.findIndex((__: TacticThreatsInterface) => __.tacticVId === tacticVId);
      if (tacticThreatsIndex > -1) {
        this.tacticsThreats = this.tacticsThreats.map((_: TacticThreatsInterface, index: number) => tacticThreatsIndex === index ? {
          ..._,
          threats: [..._.threats, threat]
        } : _);
      } else {
        this.tacticsThreats.push({
          tacticVId,
          threats: [threat]
        });
      }
    } else {
      this.tacticsThreats.push({
        tacticVId,
        threats: [threat]
      });
    }
  }

  // Add new threat to selected tactic column into a specific index
  public addTacticThreatToIndex(tacticVId: number, threat: ThreatItem, threatIndex: number) {
    const tactic: TacticInterface = this.tactics.find((_: TacticInterface) => _.vId === tacticVId);
    if (tactic) {
      const tacticThreatsIndex: number = this.tacticsThreats.findIndex((__: TacticThreatsInterface) => __.tacticVId === tacticVId);
      if (tacticThreatsIndex > -1) {
        this.tacticsThreats[tacticThreatsIndex].threats.splice(threatIndex, 0, threat);
      } else {
        this.tacticsThreats.push({
          tacticVId,
          threats: [threat]
        })
      }
    }
  }

  // Get tactic threats from tactic vId
  public getTacticThreats(tacticVId: number) {
    const tactic: TacticInterface = this.tactics.find((_: TacticInterface) => _.vId === tacticVId);
    if (tactic) {
      const tacticThreats: TacticThreatsInterface = this.tacticsThreats.find((_: TacticThreatsInterface) => _.tacticVId === tactic.vId);
      if (tacticThreats) {
        return tacticThreats ? tacticThreats.threats : [];
      }
    }

    return [];
  }

  // Get threat mitreAttackIndex property from selected tactic threat
  public getTacticThreatMitreAttackIndexProperty(tacticVId: number, threatIndex: number, propertyName: string) {
    const tactic: TacticInterface = this.tactics.find((_: TacticInterface) => _.vId === tacticVId);
    if (tactic) {
      const tacticThreatsIndex: number = this.tacticsThreats.findIndex((__: TacticThreatsInterface) => __.tacticVId === tacticVId);
      if (tacticThreatsIndex > -1) {
        return this.tacticsThreats[tacticThreatsIndex].threats[threatIndex].mitreAttackIndex[propertyName];
      }
    }

    return false;
  }

  // Get tactic threat property value from given property name
  public getTacticThreatProperty(tacticVId: number, threatIndex: number, propertyName: string) {
    const tactic: TacticInterface = this.tactics.find((_: TacticInterface) => _.vId === tacticVId);
    if (tactic) {
      const tacticThreatsIndex: number = this.tacticsThreats.findIndex((__: TacticThreatsInterface) => __.tacticVId === tacticVId);
      if (tacticThreatsIndex > -1) {
        return this.tacticsThreats[tacticThreatsIndex].threats[threatIndex][propertyName];
      }
    }

    return false;
  }

  // Update a tactic threat property
  public updateTacticThreatProperty(tacticVId: number, threatIndex: number, propertyName: string, propertyValue: any) {
    const tactic: TacticInterface = this.tactics.find((_: TacticInterface) => _.vId === tacticVId);
    if (tactic) {
      const tacticThreatsIndex: number = this.tacticsThreats.findIndex((__: TacticThreatsInterface) => __.tacticVId === tacticVId);
      this.tacticsThreats = this.tacticsThreats.map((_: TacticThreatsInterface, index: number) => index === tacticThreatsIndex ?
        {
          ..._,
          threats: _.threats.map((__: ThreatItem, i: number) => threatIndex === i ? { [propertyName]: propertyValue, ...__ } : __)
        }
        : _);
    }
  }

  // Delete selected tactic threat
  public deleteTacticThreat(tacticVId: number, threatIndex: number) {
    const tactic: TacticInterface = this.tactics.find((_: TacticInterface) => _.vId === tacticVId);
    if (tactic) {
      const tacticThreatsIndex: number = this.tacticsThreats.findIndex((__: TacticThreatsInterface) => __.tacticVId === tacticVId);
      if (tacticThreatsIndex > -1) {
        this.tacticsThreats[tacticThreatsIndex].threats.splice(threatIndex, 1);
      }
    }
  }

  // Empty all tactics threats
  public emptyTacticsThreats() {
    this.tacticsThreats = this.tacticsThreats.map((_: TacticThreatsInterface) => {
      _.threats = [];
      return _;
    })
  }

  // Empty control threats
  public emptyControlThreats() {
    this.mitreControlBeforeThreat = undefined;
    this.mitreControlAfterThreat = undefined;
  }

  // Perform merge operation from "Threat Before Control" threat and "Threat After Control" threat. By default threat properties assigned from "Threat After Control" threat.
  public mergeThreatFromMitreControl(
    LT: ThreatItem,
    RT: ThreatItem,
    userId: string
  ) {
    const id: string = this.arrOpService.genRandomId(20);
    const threat: ThreatItem = {
      ...RT,
      attackSurface: false,
      id,
      treatment: "reduce",
      threatSource: "merged",
      lastModifiedBy: userId,
      reviewed: false,
      reviewedBy: "",
      riskLevelBefore: LT.riskLevelBefore ? LT.riskLevelBefore : LT.riskLevel,
      attackFeasibilityLevelAfter: RT.attackFeasibilityLevelAfter ? RT.attackFeasibilityLevelAfter : RT.attackFeasibilityLevel,
      attackFeasibilityLevel: LT.attackFeasibilityLevel,
      attackFeasibilityAfter: RT.attackFeasibilityAfter ? RT.attackFeasibilityAfter : RT.attackFeasibility,
      attackFeasibility: LT.attackFeasibility,
      impactFAfter: RT.impactFAfter ? RT.impactFAfter : RT.impactF,
      impactFLevelAfter: RT.impactFLevelAfter ? RT.impactFLevelAfter : RT.impactFLevel,
      impactSAfter: RT.impactSAfter ? RT.impactSAfter : RT.impactS,
      impactSLevelAfter: RT.impactSLevelAfter ? RT.impactSLevelAfter : RT.impactSLevel,
      impactOAfter: RT.impactOAfter ? RT.impactOAfter : RT.impactO,
      impactOLevelAfter: RT.impactOLevelAfter ? RT.impactOLevelAfter : RT.impactOLevel,
      impactPAfter: RT.impactPAfter ? RT.impactPAfter : RT.impactP,
      impactPLevelAfter: RT.impactPLevelAfter ? RT.impactPLevelAfter : RT.impactPLevel,
      attackFeasibilityElapsedAfter: RT.attackFeasibilityElapsedAfter ? RT.attackFeasibilityElapsedAfter : RT.attackFeasibilityElapsed,
      attackFeasibilityExpertiseAfter: RT.attackFeasibilityExpertiseAfter ? RT.attackFeasibilityExpertiseAfter : RT.attackFeasibilityExpertise,
      attackFeasibilityKnowledgeAfter: RT.attackFeasibilityKnowledgeAfter ? RT.attackFeasibilityKnowledgeAfter : RT.attackFeasibilityKnowledge,
      attackFeasibilityWindowAfter: RT.attackFeasibilityWindowAfter ? RT.attackFeasibilityWindowAfter : RT.attackFeasibilityWindow,
      attackFeasibilityEquipmentAfter: RT.attackFeasibilityEquipmentAfter ? RT.attackFeasibilityEquipmentAfter : RT.attackFeasibilityEquipment,
      attackFeasibilityElapsedAfterRationale: RT.attackFeasibilityElapsedAfterRationale ? RT.attackFeasibilityElapsedAfterRationale : RT.attackFeasibilityElapsedRationale,
      attackFeasibilityExpertiseAfterRationale: RT.attackFeasibilityExpertiseAfterRationale ? RT.attackFeasibilityExpertiseAfterRationale : RT.attackFeasibilityExpertiseRationale,
      attackFeasibilityKnowledgeAfterRationale: RT.attackFeasibilityKnowledgeAfterRationale ? RT.attackFeasibilityKnowledgeAfterRationale : RT.attackFeasibilityKnowledgeRationale,
      attackFeasibilityWindowAfterRationale: RT.attackFeasibilityWindowAfterRationale ? RT.attackFeasibilityWindowAfterRationale : RT.attackFeasibilityWindowRationale,
      attackFeasibilityEquipmentAfterRationale: RT.attackFeasibilityEquipmentAfterRationale ? RT.attackFeasibilityEquipmentAfterRationale : RT.attackFeasibilityEquipmentRationale,
      attackFeasibilityCVSSVectorAfter: RT.attackFeasibilityCVSSVectorAfter ? RT.attackFeasibilityCVSSVectorAfter : RT.attackFeasibilityCVSSVector,
      attackFeasibilityCVSSComplexityAfter: RT.attackFeasibilityCVSSComplexityAfter ? RT.attackFeasibilityCVSSComplexityAfter : RT.attackFeasibilityCVSSComplexity,
      attackFeasibilityCVSSPrivilegeAfter: RT.attackFeasibilityCVSSPrivilegeAfter ? RT.attackFeasibilityCVSSPrivilegeAfter : RT.attackFeasibilityCVSSPrivilege,
      attackFeasibilityCVSSUserAfter: RT.attackFeasibilityCVSSUserAfter ? RT.attackFeasibilityCVSSUserAfter : RT.attackFeasibilityCVSSUser,
      attackFeasibilityCVSSVectorAfterRationale: RT.attackFeasibilityCVSSVectorAfterRationale ? RT.attackFeasibilityCVSSVectorAfterRationale : RT.attackFeasibilityCVSSVectorRationale,
      attackFeasibilityCVSSComplexityAfterRationale: RT.attackFeasibilityCVSSComplexityAfterRationale ? RT.attackFeasibilityCVSSComplexityAfterRationale : RT.attackFeasibilityCVSSComplexityRationale,
      attackFeasibilityCVSSPrivilegeAfterRationale: RT.attackFeasibilityCVSSPrivilegeAfterRationale ? RT.attackFeasibilityCVSSPrivilegeAfterRationale : RT.attackFeasibilityCVSSPrivilegeRationale,
      attackFeasibilityCVSSUserAfterRationale: RT.attackFeasibilityCVSSUserAfterRationale ? RT.attackFeasibilityCVSSUserAfterRationale : RT.attackFeasibilityCVSSUserRationale,
      attackFeasibilityAttackVectorAfter: RT.attackFeasibilityAttackVectorAfter ? RT.attackFeasibilityAttackVectorAfter : RT.attackFeasibilityAttackVector,
      attackFeasibilityAttackVectorAfterRationale: RT.attackFeasibilityAttackVectorAfterRationale ? RT.attackFeasibilityAttackVectorAfterRationale : RT.attackFeasibilityAttackVectorRationale,
      threatRuleEngineIdBefore: LT.threatRuleEngineId,
      impactF: LT.impactF,
      impactFLevel: LT.impactFLevel,
      impactS: LT.impactS,
      impactSLevel: LT.impactSLevel,
      impactO: LT.impactO,
      impactOLevel: LT.impactOLevel,
      impactP: LT.impactP,
      impactPLevel: LT.impactPLevel,
      attackFeasibilityElapsed: LT.attackFeasibilityElapsed,
      attackFeasibilityExpertise: LT.attackFeasibilityExpertise,
      attackFeasibilityKnowledge: LT.attackFeasibilityKnowledge,
      attackFeasibilityWindow: LT.attackFeasibilityWindow,
      attackFeasibilityEquipment: LT.attackFeasibilityEquipment,
      attackFeasibilityElapsedRationale: LT.attackFeasibilityElapsedRationale,
      attackFeasibilityExpertiseRationale: LT.attackFeasibilityExpertiseRationale,
      attackFeasibilityKnowledgeRationale: LT.attackFeasibilityKnowledgeRationale,
      attackFeasibilityWindowRationale: LT.attackFeasibilityWindowRationale,
      attackFeasibilityEquipmentRationale: LT.attackFeasibilityEquipmentRationale,
      attackFeasibilityCVSSVector: LT.attackFeasibilityCVSSVector,
      attackFeasibilityCVSSComplexity: LT.attackFeasibilityCVSSComplexity,
      attackFeasibilityCVSSPrivilege: LT.attackFeasibilityCVSSPrivilege,
      attackFeasibilityCVSSUser: LT.attackFeasibilityCVSSUser,
      attackFeasibilityCVSSVectorRationale: LT.attackFeasibilityCVSSVectorRationale,
      attackFeasibilityCVSSComplexityRationale: LT.attackFeasibilityCVSSComplexityRationale,
      attackFeasibilityCVSSPrivilegeRationale: LT.attackFeasibilityCVSSPrivilegeRationale,
      attackFeasibilityCVSSUserRationale: LT.attackFeasibilityCVSSUserRationale,
      attackFeasibilityAttackVector: LT.attackFeasibilityAttackVector,
      attackFeasibilityAttackVectorRationale: LT.attackFeasibilityAttackVectorRationale,
      threatBeforeControl: JSON.stringify(LT),
      wp29AttackIndex: []
    }

    return threat;
  }

  // Merge tactic column threats and create new threat via mitreAttackMethod
  public mergeThreatsWithMitreAttackMethod(threats: ThreatItem[], mitreAttackMethod: string, lastRowNumber: number,
    impactAggMethod: any, impactLevelName: any, feasibilityLevelName: any, riskMatrix: any): ThreatItem {
    const componentId: string[] = [];
    const asset: string[] = [];
    const assetType: string[] = [];
    const attackFeasibility: number[] = [];
    const attackFeasibilityLevel: string[] = [];
    let attackPath: string[] = [];
    const attackPathName: string[] = [];
    const attackSurface: boolean[] = [];
    const id: string = this.arrOpService.genRandomId(20);
    const fromFeature: string[] = [];
    const impactF: number[] = [];
    const impactS: number[] = [];
    const impactO: number[] = [];
    const impactP: number[] = [];
    const impactFLevel: string[] = [];
    const impactSLevel: string[] = [];
    const impactOLevel: string[] = [];
    const impactPLevel: string[] = [];
    const damageScenario: string[] = [];
    let impactOriginCompAssFea: string[] = [];
    const module: string[] = [];
    const nickName: string[] = [];
    const riskScore: number = 0;
    const riskLevel: string[] = [];
    const securityPropertyCia: string[] = [];
    const securityPropertyStride: string[] = [];
    const threatScenario: string[] = [];
    const treatment: string = "no treatment";
    const treatmentVal: boolean = false;
    const type: string[] = [];
    const reviewed: boolean = false;
    const reviewedBy: string = "";
    const isExpanded: boolean = false;
    const treatmentValidatedBy: string = "";
    const lastModifiedBy: string = this.currentUserProfile._id;
    const cybersecurityClaim: string = "";
    const notes: string = "";
    const assetId: string[] = [];
    const fromFeatureId: string[] = [];
    const fromFeatureIndex: string[] = [];
    const moduleId: string[] = [];
    const subType: string[] = [];
    const reviewStatusRevokedBy: string = "";
    const validateStatusRevokedBy: string = "";
    const treatmentStatusChangedBy: string = "";
    const reviewStatusRevokedDateTime: any = "";
    const reviewedDateTime: any = "";
    const treatmentPickedDateTime: any = "";
    const validatedDateTime: any = "";
    const validationRevokedDateTime: any = "";
    const featureRole: string[] = [];
    const featureType: string[] = [];
    const attackFeasibilityElapsed: number[] = [];
    const attackFeasibilityExpertise: number[] = [];
    const attackFeasibilityKnowledge: number[] = [];
    const attackFeasibilityWindow: number[] = [];
    const attackFeasibilityEquipment: number[] = [];
    const attackFeasibilityElapsedRationale: string = "";
    const attackFeasibilityExpertiseRationale: string = "";
    const attackFeasibilityKnowledgeRationale: string = "";
    const attackFeasibilityWindowRationale: string = "";
    const attackFeasibilityEquipmentRationale: string = "";
    const attackFeasibilityCVSSVector: number[] = [];
    const attackFeasibilityCVSSComplexity: number[] = [];
    const attackFeasibilityCVSSPrivilege: number[] = [];
    const attackFeasibilityCVSSUser: number[] = [];
    const attackFeasibilityAttackVector: string[] = [];
    const riskUpdateNotes: string = "";
    const riskUpdated: boolean = false;
    const threatSource: string = "merged";
    const threatRuleEngineId: string = mitreAttackMethod;
    const createdBy: string = this.currentUserProfile._id;
    const createdInProject: string = this.project.id;
    const reviewStatusForFilter: string = "to-review";
    const validateStatusForFilter: string = "to-validate";
    const moduleIdInDb: string[] = [];
    let threatRowNumber: number = lastRowNumber + 1;
    const baseProtocol: string[] = [];
    let appProtocol: string[] = [];
    let secureProtocol: string[] = [];
    const transmissionMedia: string[] = [];
    const feasibilityDetailsExpanded: boolean = false;
    const attackMethod: string = "";
    let MITM: boolean[] = [];
    let wp29AttackIndex: string[] = [];
    let assetTag: string[] = [];

    threats.forEach((threat: ThreatItem) => {
      componentId.push(threat.componentId);
      asset.push(threat.asset);
      assetType.push(threat.assetType);
      attackFeasibility.push(threat.attackFeasibility);
      attackFeasibilityLevel.push(threat.attackFeasibilityLevel);
      if (threat.attackPath.length > 0) {
        threat.attackPath.unshift("-");
      }
      attackPath = [...attackPath, ...threat.attackPath];
      attackPathName.push(threat.attackPathName);
      attackSurface.push(threat.attackSurface);
      fromFeature.push(threat.fromFeature);
      impactF.push(threat.impactF);
      impactS.push(threat.impactS);
      impactO.push(threat.impactO);
      impactP.push(threat.impactP);
      impactFLevel.push(threat.impactFLevel);
      impactSLevel.push(threat.impactSLevel);
      impactOLevel.push(threat.impactOLevel);
      impactPLevel.push(threat.impactPLevel);
      damageScenario.push(threat.damageScenario);
      impactOriginCompAssFea = [...impactOriginCompAssFea, ...(threat.impactOriginCompAssFea ? threat.impactOriginCompAssFea : [])];
      module.push(threat.module);
      nickName.push(threat.nickName);
      riskLevel.push(threat.riskLevel);
      securityPropertyCia.push(threat.securityPropertyCia);
      securityPropertyStride.push(threat.securityPropertyStride);
      threatScenario.push(threat.threatScenario);
      type.push(threat.type);
      assetId.push(threat.assetId);
      fromFeatureId.push(threat.fromFeatureId);
      fromFeatureIndex.push(threat.fromFeatureIndex);
      moduleId.push(threat.moduleId);
      subType.push(threat.subType);
      featureRole.push(threat.featureRole);
      featureType.push(threat.featureType);
      attackFeasibilityElapsed.push(threat.attackFeasibilityElapsed);
      attackFeasibilityExpertise.push(threat.attackFeasibilityExpertise);
      attackFeasibilityKnowledge.push(threat.attackFeasibilityKnowledge);
      attackFeasibilityWindow.push(threat.attackFeasibilityWindow);
      attackFeasibilityEquipment.push(threat.attackFeasibilityEquipment);
      attackFeasibilityCVSSVector.push(threat.attackFeasibilityCVSSVector);
      attackFeasibilityCVSSComplexity.push(threat.attackFeasibilityCVSSComplexity);
      attackFeasibilityCVSSPrivilege.push(threat.attackFeasibilityCVSSPrivilege);
      attackFeasibilityCVSSUser.push(threat.attackFeasibilityCVSSUser);
      attackFeasibilityAttackVector.push(threat.attackFeasibilityAttackVector);
      moduleIdInDb.push(threat.moduleIdInDb);
      baseProtocol.push(threat.baseProtocol);
      appProtocol = [...appProtocol, ...(threat.appProtocol ? threat.appProtocol : [])];
      secureProtocol = [...secureProtocol, ...(threat.secureProtocol ? threat.secureProtocol : [])];
      transmissionMedia.push(threat.transmissionMedia);
      MITM.push(threat.MITM);
      wp29AttackIndex = [];
      assetTag = [...assetTag, ...(threat.assetTag ? threat.assetTag : [])];
    });

    const threat: ThreatItem = {
      componentId: this.combineWithCommaSeparation(componentId),
      asset: this.combineWithCommaSeparation(asset),
      assetType: this.combineWithCommaSeparation(assetType),
      attackFeasibility: this.getLowerValue(attackFeasibility),
      attackFeasibilityLevel: this.getWorstAttackFeasibilityLevel(attackFeasibilityLevel),
      attackPath,
      attackPathName: this.combineWithBulletPoint(attackPathName),
      attackSurface: this.getPositiveValueIfOneExists(attackSurface),
      id,
      fromFeature: this.combineWithCommaSeparation(fromFeature),
      impactF: this.getLowerValue(impactF),
      impactS: this.getLowerValue(impactS),
      impactO: this.getLowerValue(impactO),
      impactP: this.getLowerValue(impactP),
      impactFLevel: this.getWorstImpactLevel(impactFLevel),
      impactSLevel: this.getWorstImpactLevel(impactSLevel),
      impactOLevel: this.getWorstImpactLevel(impactOLevel),
      impactPLevel: this.getWorstImpactLevel(impactPLevel),
      damageScenario: this.combineWithBulletPoint(damageScenario),
      impactOriginCompAssFea,
      module: this.combineWithCommaSeparation(module),
      nickName: this.combineWithCommaSeparation(nickName),
      riskScore: riskScore,
      riskLevel: this.rateRisk(this.getWorstImpactLevel(impactSLevel), this.getWorstImpactLevel(impactFLevel), this.getWorstImpactLevel(impactOLevel), this.getWorstImpactLevel(impactPLevel),
        this.getWorstAttackFeasibilityLevel(attackFeasibilityLevel), impactAggMethod, impactLevelName, feasibilityLevelName, riskMatrix),
      securityPropertyCia: this.combineWithCommaSeparation(securityPropertyCia),
      securityPropertyStride: this.combineWithCommaSeparation(securityPropertyStride),
      threatScenario: this.combineWithBulletPoint(threatScenario),
      treatment,
      treatmentVal,
      type: this.combineWithCommaSeparation(type),
      reviewed,
      reviewedBy,
      isExpanded,
      treatmentValidatedBy,
      lastModifiedBy,
      cybersecurityClaim,
      notes,
      assetId: this.combineWithCommaSeparation(assetId),
      fromFeatureId: this.combineWithCommaSeparation(fromFeatureId),
      fromFeatureIndex: this.combineWithCommaSeparation(fromFeatureIndex),
      moduleId: this.combineWithCommaSeparation(moduleId),
      subType: this.combineWithCommaSeparation(subType),
      reviewStatusRevokedBy,
      validateStatusRevokedBy,
      treatmentStatusChangedBy,
      reviewStatusRevokedDateTime,
      reviewedDateTime,
      treatmentPickedDateTime,
      validatedDateTime,
      validationRevokedDateTime,
      featureRole: this.combineWithCommaSeparation(featureRole),
      featureType: this.combineWithCommaSeparation(featureType),
      attackFeasibilityElapsed: this.getWorstIfNotSingleMissingProperty(attackFeasibilityElapsed, threats.length),
      attackFeasibilityExpertise: this.getWorstIfNotSingleMissingProperty(attackFeasibilityExpertise, threats.length),
      attackFeasibilityEquipment: this.getWorstIfNotSingleMissingProperty(attackFeasibilityEquipment, threats.length),
      attackFeasibilityKnowledge: this.getWorstIfNotSingleMissingProperty(attackFeasibilityKnowledge, threats.length),
      attackFeasibilityWindow: this.getWorstIfNotSingleMissingProperty(attackFeasibilityWindow, threats.length),
      attackFeasibilityElapsedRationale,
      attackFeasibilityExpertiseRationale,
      attackFeasibilityEquipmentRationale,
      attackFeasibilityKnowledgeRationale,
      attackFeasibilityWindowRationale,
      attackFeasibilityCVSSVector: this.getWorstIfNotSingleMissingProperty(attackFeasibilityCVSSVector, threats.length),
      attackFeasibilityCVSSComplexity: this.getWorstIfNotSingleMissingProperty(attackFeasibilityCVSSComplexity, threats.length),
      attackFeasibilityCVSSPrivilege: this.getWorstIfNotSingleMissingProperty(attackFeasibilityCVSSPrivilege, threats.length),
      attackFeasibilityCVSSUser: this.getWorstIfNotSingleMissingProperty(attackFeasibilityCVSSUser, threats.length),
      attackFeasibilityAttackVector: this.getWorstAttackFeasibilityLevel(attackFeasibilityAttackVector, threats.length),
      riskUpdateNotes,
      riskUpdated,
      threatSource,
      threatRuleEngineId,
      createdBy,
      createdInProject,
      reviewStatusForFilter,
      validateStatusForFilter,
      moduleIdInDb: this.combineWithCommaSeparation(moduleIdInDb),
      threatRowNumber: threatRowNumber,
      baseProtocol: this.combineWithCommaSeparation(baseProtocol),
      appProtocol,
      secureProtocol,
      transmissionMedia: this.combineWithCommaSeparation(transmissionMedia),
      feasibilityDetailsExpanded,
      attackMethod,
      MITM: this.getPositiveValueIfOneExists(MITM),
      wp29AttackIndex,
      assetTag
    }

    return threat;
  }

  // Get lower value of given array when all threats have property value
  public getWorstIfNotSingleMissingProperty(input: number[], totalRecords: number) {
    if (input.length !== totalRecords)
      return undefined;

    return this.getLowerValue(input);
  }

  // Get worst value from given array when all threats have property value
  public getWorstAttackFeasibilityLevel(input: string[], totalRecords: number = 0) {
    if (totalRecords > 0 && input.length !== totalRecords) {
      return undefined;
    }

    if (input.includes("High")) {
      return "High";
    } else if (input.includes("Medium")) {
      return "Medium";
    } else if (input.includes("Low")) {
      return "Low";
    } else if (input.includes("Very Low")) {
      return "Very Low";
    }
  }

  // Get worst impact level value 
  public getWorstImpactLevel(input: string[]) {
    if (input.includes("Severe")) {
      return "Severe";
    } else if (input.includes("Major")) {
      return "Major";
    } else if (input.includes("Moderate")) {
      return "Moderate";
    } else if (input.includes("Negligible")) {
      return "Negligible";
    }
  }

  // Check empty array value and join to a comma separated string
  public combineWithCommaSeparation(input: any[] = []): string {
    input = input.filter(_ => _);
    let value: string = input.join(",");
    return value;
  }

  // Check empty array value and join to a bullet point separated string
  public combineWithBulletPoint(input: any[] = []): string {
    let stringToReturn = ""
    input.forEach(str => {
      let newStr = str
      if(str[0] !== "-") newStr = "- " + newStr;
      if(str.slice(-1) !== "\n") newStr = newStr + "\n";
      stringToReturn += newStr
    })
    return stringToReturn
  }

  // Get lower number from given array of numbers
  public getLowerValue(input: number[] = []): number {
    input = input.filter(_ => _ === 0 || _);
    return Math.min(...input);
  }

  // Get true value from given array when at least one true value
  public getPositiveValueIfOneExists(input: boolean[]): boolean {
    input = input.filter(_ => _);
    if (input.includes(true)) {
      return true;
    } else {
      return false;
    }
  }

  // Calculate risk level
  public rateRisk(S: string, F: string, O: string, P: string,
    feasibilityLevel: string, impactAggMethod: string, impactLevelName: string[],
    feasibilityLevelName: string[], riskMatrix: any[]) {
    let impactLevel = this.impactAggregation(S, F, O, P, impactAggMethod, impactLevelName);
    let riskLevel = this.calculateRiskFromMatrix(impactLevel, feasibilityLevel, impactLevelName, feasibilityLevelName, riskMatrix);
    return riskLevel
  }

  // Aggregate impact
  public impactAggregation(S: string, F: string, O: string, P: string, impactAggMethod: string, impactLevelName: string[]): string { // impact aggregation function. take the most severe impact among the four.
    if (impactAggMethod == "mostSevere") {
      let aggregatedImpactIndex = Math.min(impactLevelName.indexOf(S), impactLevelName.indexOf(F), impactLevelName.indexOf(O), impactLevelName.indexOf(P));
      let aggregatedImpact = impactLevelName[aggregatedImpactIndex];
      return aggregatedImpact
    }
  }

  // Risk determination
  public calculateRiskFromMatrix(impact: string, feasibility: string, impactLevelName: string[],
    feasibilityLevelName: string[], riskMatrix: any[]): any {
    const impactIndex = impactLevelName.indexOf(impact);
    const feasibilityIndex = feasibilityLevelName.indexOf(feasibility);
    return riskMatrix[impactIndex][feasibilityIndex]
  }

  // Create default mitreAttackIndex property for threat
  public getDefaultMitreAttackIndex(mitreAttackMethod: string, init: boolean = true) {
    return {
      matrix: mitreAttackMethod,
      tacticVId: [],
      techniqueVId: init ? [-1] : [],
      subTechniqueVId: init ? [-1] : [],
      mergedThreatId: [],
      removedAfterMerge: [],
      atomicThreatId: [],
    }
  }
}
