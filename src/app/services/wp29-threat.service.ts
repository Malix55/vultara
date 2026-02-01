import { Injectable } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';
import { ArrOpService } from './arr-op.service';
import sha256 from 'crypto-js/sha256';
import { SystemConfigService } from './system-config.service';

@Injectable({
  providedIn: 'root'
})
export class Wp29ThreatService {
  public mappingStatus: any = {};
  // public isShowMapping: boolean = false;
  public threatGroup: any[] = [];
  public assetLib: any[] = [];

  constructor(
    private arrOpService: ArrOpService,
    private systemConfigService: SystemConfigService
  ) { }

  // Find out table view threats row array values when wp29 threat index matched with a table row wp29AttackIndex
  public getThreatIndex(result: any[], wp29AttackIndex: string, index: number, rowNumbers: number[]): number[] {
    const threat: any = result[index];
    const wp29Attack: any[] = threat.wp29AttackIndex;
    const rowNumber: number = index + 1;
    if (wp29Attack && wp29Attack.length > 0 && wp29Attack.includes(wp29AttackIndex) && !rowNumbers.includes(rowNumber)) {
      rowNumbers.push(rowNumber);
    }
    if (index < (result.length - 1)) {
      return this.getThreatIndex(result, wp29AttackIndex, index + 1, rowNumbers);
    } else {
      return rowNumbers;
    }
  }

  // Calculate wp29Threats rows for rendering to excel file 
  public calculateWP29Threats(threats: any[], result: any[]): any[] {
    const dataArray = [["High Level Threat", "Sub Level Threat ID", "Sub Level Threat", "WP 29 Attack Index", "WP 29 Attack", "Mapping Status", "Threat"]];
    let counter: number = 0;
    threats.forEach((threat: any) => {
      const subLevelThreats = threat.subLevelThreats;
      subLevelThreats.forEach((subThreat: any) => {
        const wp29Attacks = subThreat.wp29Attacks;
        wp29Attacks.forEach((attack: any) => {
          const rowNumbers: number[] = this.getThreatIndex(result, attack.wp29AttackIndex, 0, []);
          const rowNumbersText: string = rowNumbers.length > 0 ? rowNumbers.join(", ") : " ";
          const statusText: string = this.mappingStatus[counter];
          let singleMappingStatus: string = " ";
          switch (statusText) {
            case "green":
              singleMappingStatus = "Checked";
              break;
            case "red":
              singleMappingStatus = "Not Checked";
              break;
            case "orange":
              singleMappingStatus = "Not Applicable";
              break;
          }
          const data: any[] = [
            threat.highLevelThreat,
            subThreat.subLevelThreatId,
            subThreat.subLevelThreat,
            attack.wp29AttackIndex,
            attack.wp29Attack,
            singleMappingStatus,
            rowNumbersText
          ];
          dataArray.push(data);
          counter = counter + 1;
        });
      });
    });

    return dataArray;
  }

  // Calculate wp29Threats rows
  public calculateWP29ThreatRows(threats: any[]): any[] {
    const dataArray = [];
    threats.forEach((threat: any) => {
      const subLevelThreats = threat.subLevelThreats;
      let includeHighLevelThreat: boolean = true;
      subLevelThreats.sort((a: any, b: any) => (Number(a.subLevelThreatId) > Number(b.subLevelThreatId)) ? 1 : ((Number(b.subLevelThreatId) > Number(a.subLevelThreatId)) ? -1 : 0));
      subLevelThreats.forEach((subThreat: any) => {
        const wp29Attacks = subThreat.wp29Attacks;
        let includeSubLevelThreat: boolean = true;
        wp29Attacks.forEach((attack: any) => {
          let dataObject = {};
          if (includeHighLevelThreat) {
            dataObject = {
              ...dataObject,
              highLevelThreat: threat.highLevelThreat,
              highLevelThreatId: threat.highLevelThreatId
            };
            includeHighLevelThreat = false;
          }
          if (includeSubLevelThreat) {
            dataObject = {
              ...dataObject,
              subLevelThreatId: subThreat.subLevelThreatId,
              subLevelThreat: subThreat.subLevelThreat,
              spanLength: wp29Attacks.length
            }
            includeSubLevelThreat = false;
          }
          dataObject = {
            ...dataObject,
            wp29AttackIndex: attack.wp29AttackIndex,
            wp29Attack: attack.wp29Attack
          }
          dataArray.push(dataObject);
        });
      });
    });

    return dataArray;
  }

  // Store additional project information in localStorage
  public setProjectStatus(projectStatus: any[], projectInformation: any) {
    if (projectStatus.length > 0) {
      const existingObjIndex: number = projectStatus.findIndex((obj: any) => obj.id === projectInformation.id);
      if (existingObjIndex > -1) {
        projectStatus[existingObjIndex] = projectInformation;
        localStorage.setItem("projectStatus", JSON.stringify(projectStatus));
      } else {
        projectStatus.push(projectInformation);
        localStorage.setItem("projectStatus", JSON.stringify(projectStatus));
      }
    } else {
      projectStatus.push(projectInformation);
      localStorage.setItem("projectStatus", JSON.stringify(projectStatus));
    }
  }

  // Check previous status property and assign new value
  public processProjectStatusProperty(projectId: any, property: string, value: any) {
    const projectStatus = localStorage.getItem("projectStatus") !== null ? JSON.parse(localStorage.getItem("projectStatus")) : [];
    let existingProjectStatus = projectStatus.find((obj: any) => obj.id === projectId);
    if (existingProjectStatus) {
      existingProjectStatus[property] = value;
      this.setProjectStatus(projectStatus, existingProjectStatus);
    } else {
      const obj = {
        id: projectId
      }
      obj[property] = value;
      this.setProjectStatus(projectStatus, obj);
    }

    // switch (property) {
    //   case "mappedThreatList":
    //     this.isShowMapping = value;
    //     break;
    // }
  }

  // Check whether project information is stored in localstorage
  public checkProjectStaus(projectId: any) {
    const projectStatus = localStorage.getItem("projectStatus") !== null ? JSON.parse(localStorage.getItem("projectStatus")) : [];
    if (projectStatus.length > 0) {
      const existingProjectStatus = projectStatus.find((obj: any) => obj.id === projectId);
      if (existingProjectStatus) {
        // this.isShowMapping = existingProjectStatus.mappedThreatList ? existingProjectStatus.mappedThreatList : false;
      } else {
        // this.isShowMapping = false;
      }
    } else {
      // this.isShowMapping = false;
    }
  }

  // Get text color from mapping status
  public getMappingStatusFromColor(color: string) {
    let status: string = '';
    switch (color) {
      case "green":
        status = "Checked";
        break;
      case "red":
        status = "Not Checked";
        break;
      case "orange":
        status = "Not Applicable";
        break;
    }

    return status;
  }

  // Get text color from mapping status
  public getMappingStatusColor(status: string) {
    let color: string = '';
    switch (status) {
      case "Checked":
        color = "green";
        break;
      case "Not Checked":
        color = "red";
        break;
      case "Not Applicable":
        color = "orange";
        break;
    }

    return color;
  }

  // Filter threats and map to WP29
  public filterWP29Threats(threats: any[] = []) {
    threats.forEach((threat: any) => {
      const highLevelThreat = threat.highLevelThreat;
      let subLevelThreat = threat.subLevelThreat;
      const wp29Attack = threat.wp29Attack;
      const wp29AttackIndex = threat.wp29AttackIndex;

      const highLevelThreatId = highLevelThreat.split(" ")[0];
      const subLevelThreatId = subLevelThreat.split(" ")[0];

      const subLevelThreatArray = subLevelThreat.split(" ");
      subLevelThreatArray.shift();
      subLevelThreat = subLevelThreatArray.join(" ");

      const existingThreatIndex = this.threatGroup.findIndex((obj: any) => obj.highLevelThreatId === highLevelThreatId);
      if (existingThreatIndex > -1) {
        const existingSubLevelThreatIndex = this.threatGroup[existingThreatIndex].subLevelThreats.findIndex((obj: any) => obj.subLevelThreatId === subLevelThreatId);
        if (existingSubLevelThreatIndex > -1) {
          const obj = {
            wp29AttackIndex,
            wp29Attack
          };
          this.threatGroup[existingThreatIndex].subLevelThreats[existingSubLevelThreatIndex].wp29Attacks.push(obj);
        } else {
          const obj = {
            subLevelThreatId,
            subLevelThreat,
            wp29Attacks: [{
              wp29AttackIndex,
              wp29Attack
            }]
          }
          this.threatGroup[existingThreatIndex].subLevelThreats.push(obj);
        }
      } else {
        const obj = {
          highLevelThreatId,
          highLevelThreat,
          subLevelThreats: [{
            subLevelThreatId,
            subLevelThreat,
            wp29Attacks: [{
              wp29AttackIndex,
              wp29Attack
            }]
          }]
        };

        this.threatGroup.push(obj);
      }
    });
  }

  // Calculate the largest row number from goals observable
  private getThreatLargestRowNumber(threats: ThreatItem[] = []) {
    const largestValue: number = threats.length > 0 ? Math.max.apply(Math, threats.map((_: ThreatItem) => _.threatRowNumber)) : 0;
    return largestValue;
  }

  // Get threat from wp29AttackIndex value according to specific and general rules
  public getThreatForWP29AttackIndex(wp29AttackIndex: string, threats: ThreatItem[], exHardcodedThreats: ThreatItem[], ...args: any[]): ThreatItem[] {
    const threatLargestRowNumber: number = this.getThreatLargestRowNumber([...threats, ...exHardcodedThreats]);
    let hardcodedThreats: ThreatItem[] = [];
    switch (wp29AttackIndex) {
      case "4.2":
        hardcodedThreats = this.indexFourPointTwo(threatLargestRowNumber, args[0].commLine);
        break;
      case "8.2":
        hardcodedThreats = this.indexEightPointTwo(threatLargestRowNumber, args[0].commLine);
        break;
      case "9.1":
        hardcodedThreats = this.indexNinePointOne(threatLargestRowNumber, args[0]);
        break;
      case "15.1":
        hardcodedThreats = this.indexFifteenPointOne(threatLargestRowNumber);
        break;
      case "15.2":
        hardcodedThreats = this.indexFifteenPointTwo(threatLargestRowNumber);
        break;
      case "17.1":
        hardcodedThreats = this.indexSeventeenPointOne(threatLargestRowNumber);
        break;
      case "18.2":
        hardcodedThreats = this.indexEighteenPointTwo(threatLargestRowNumber, args[0], args[1], args[2]);
        break;
      case "19.2":
        hardcodedThreats = this.indexNineteenPointTwo(threatLargestRowNumber);
        break;
      case "20.1":
        hardcodedThreats = this.indexTwentyPointOne(threatLargestRowNumber);
        break;
      case "20.2":
        hardcodedThreats = this.indexTwentyPointTwo(threatLargestRowNumber);
        break;
      case "20.3":
        hardcodedThreats = this.indexTwentyPointThree(threatLargestRowNumber);
        break;
      case "26.2":
        hardcodedThreats = this.indexTwentySixPointTwo(threatLargestRowNumber, args[0]);
        break;
      case "26.3":
        hardcodedThreats = this.indexTwentySixPointThree(threatLargestRowNumber, args[0]);
        break;
      case "28.2":
        hardcodedThreats = this.indexTwentyEightPointTwo(threatLargestRowNumber);
        break;
      case "29.1":
        hardcodedThreats = this.indexTwentyNinePointOne(threatLargestRowNumber, args[0], args[1]);
        break;
      case "29.2":
        hardcodedThreats = this.indexTwentyNinePointTwo(threatLargestRowNumber);
        break;
      case "31.1":
        hardcodedThreats = this.indexThirtyOnePointOne(threats, args[0]);
        break;
      case "32.1":
        hardcodedThreats = this.indexThirtyTwoPointOne(threatLargestRowNumber);
        break;

      default:
        break;
    }

    return hardcodedThreats;
  }

  // Assign not applicable wp29AttackIndex to project parameter
  public getNotApplicableWP29AttackIndex(newDesign: any, requirementIndex: string) {
    let notApplicableWP29AttackIndex: string;
    switch (requirementIndex) {
      case "4.2":
        notApplicableWP29AttackIndex = this.notApplicableIndexFourPointTwo(newDesign.commLine);
        break;
      case "8.2":
        notApplicableWP29AttackIndex = this.notApplicableIndexEightPointTwo(newDesign.commLine);
        break;
      default:
        break;
    }

    return notApplicableWP29AttackIndex;
  }

  // Assign 4.2 as "Not Applicable" wp29AttackIndex to project property
  private notApplicableIndexFourPointTwo(commLines: any[]) {
    let notApplicableWP29AttackIndex: string;
    const baseProtocolWithAttackSurface: any = commLines.find((_: any) => _.attackSurface && _.baseProtocol === "802.11p");
    if (!baseProtocolWithAttackSurface) {
      const protocolCommLine: any = commLines.find((_: any) => _.baseProtocol !== "802.11p" || (_.baseProtocol === "802.11p" && !_.attackSurface));
      if (protocolCommLine) {
        notApplicableWP29AttackIndex = "4.2";
      }
      return notApplicableWP29AttackIndex;
    } else {
      return null;
    }
  }

  // Assign 8.2 as "Not Applicable" wp29AttackIndex to project property
  private notApplicableIndexEightPointTwo(commLines: any[]) {
    let notApplicableWP29AttackIndex: string;
    const baseProtocolWithAttackSurface: any = commLines.find((_: any) => _.attackSurface && _.baseProtocol === "802.11p");
    if (!baseProtocolWithAttackSurface) {
      const protocolCommLine: any = commLines.find((_: any) => _.baseProtocol !== "802.11p" || (_.baseProtocol === "802.11p" && !_.attackSurface));
      if (protocolCommLine) {
        notApplicableWP29AttackIndex = "8.2";
      }
      return notApplicableWP29AttackIndex;
    } else {
      return null;
    }
  }

  // Get attack feasibility level from threat and system config
  private calculateAttackFeasibilityLevel(threatItem: ThreatItem) {
    let level = "";
    const score = threatItem.attackFeasibilityKnowledge + threatItem.attackFeasibilityExpertise + threatItem.attackFeasibilityEquipment
      + threatItem.attackFeasibilityElapsed + threatItem.attackFeasibilityWindow;

    const feasibilityRating: any[] = this.systemConfigService.getFeasibilityRating();

    if (score <= feasibilityRating[0]) {
      level = this.systemConfigService.systemData.feasibilityLevelName[0]; // High
    } else if (score <= feasibilityRating[1]) {
      level = this.systemConfigService.systemData.feasibilityLevelName[1]; // Medium
    } else if (score <= feasibilityRating[2]) {
      level = this.systemConfigService.systemData.feasibilityLevelName[2]; // Low
    } else {
      level = this.systemConfigService.systemData.feasibilityLevelName[3]; // Very Low
    }

    return level;
  }

  // Aggregate impact value
  impactAggregation(S: string, F: string, O: string, P: string): string { // impact aggregation function. take the most severe impact among the four.
    if (this.systemConfigService.systemData.impactAggMethod == "mostSevere") {
      let aggregatedImpactIndex = Math.min(this.systemConfigService.systemData.impactLevelName.indexOf(S),
        this.systemConfigService.systemData.impactLevelName.indexOf(F),
        this.systemConfigService.systemData.impactLevelName.indexOf(O),
        this.systemConfigService.systemData.impactLevelName.indexOf(P));
      let aggregatedImpact = this.systemConfigService.systemData.impactLevelName[aggregatedImpactIndex];
      return aggregatedImpact
    }
  }

  // Calculate risk from impact and feasibility
  calculateRiskFromMatrix(impact, feasibility): any { // risk determination function
    const impactIndex = this.systemConfigService.systemData.impactLevelName.indexOf(impact);
    const feasibilityIndex = this.systemConfigService.systemData.feasibilityLevelName.indexOf(feasibility);
    const riskMatrix: any = this.systemConfigService.getRiskMatrix();
    return riskMatrix[feasibilityIndex][impactIndex]
  }

  // Calculate risk of a threat from impact and attack feasibility
  private calculateRiskLevel(threat: ThreatItem) {
    const impactLevel = this.impactAggregation(threat.impactSLevel, threat.impactFLevel, threat.impactOLevel, threat.impactPLevel);
    return this.calculateRiskFromMatrix(impactLevel, threat.attackFeasibilityLevel);
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 4.2
  private indexFourPointTwo(threatLargestRowNumber: number, commLines: any[]): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const protocolCommLines: any[] = commLines.filter((_: any) => _.attackSurface && _.baseProtocol === "802.11p");
    protocolCommLines.forEach((_: ThreatItem) => {
      const newId: string = this.arrOpService.genRandomId(20);
      const threat = new ThreatItem(_.id, // Component ID
        "Inter-vehicle communication messages", // Asset
        "", // assetType
        9, // attackFeasibility
        "", // attackFeasibilityLevel
        [_.id], // attackPath
        `starts from ${_.nickName}, and affects the target vehicle.`, // attackPathName
        false, // attackSurface
        newId, // id
        "", // fromFeature
        1, // impactF
        1, // impactS
        1, // impactO
        1, // impactP
        "Negligible", // impactFLevel
        "Moderate", // impactSLevel
        "Severe", // impactOLevel
        "Negligible", // impactPLevel
        "Vehicle's operation is severely affected.", // damageScenario
        [], // impactOriginCompAssFea
        "", // module
        "", // nickName
        5, // riskScore
        "", // riskLevel
        "a", // securityPropertyCia
        "", // securityPropertyStride
        "Sybil attack - spoof the target vehicle as if there are many vehicles on the road", // threatScenario
        "no treatment", // treatment
        false, // treatmentVal
        "userCreated", // type
        false, // reviewed
        "", // reviewedBy
        false // isExpanded
      );

      threat.attackFeasibilityElapsed = 1;
      threat.attackFeasibilityEquipment = 4;
      threat.attackFeasibilityExpertise = 3;
      threat.attackFeasibilityWindow = 1;
      threat.attackFeasibilityKnowledge = 0;
      threat.wp29AttackIndex = ["4.2"];
      threat.threatSource = "wp29RuleEngine";
      threat.threatRowNumber = threatLargestRowNumber + 1;
      threatLargestRowNumber = threatLargestRowNumber + 1;
      threat.attackFeasibilityLevel = this.calculateAttackFeasibilityLevel(threat);
      threat.riskLevel = this.calculateRiskLevel(threat);
      threat.threatRuleEngineId = "4.2_" + _.id;
      hardCodedThreats.push(threat);
    });

    return hardCodedThreats;
  }

  // Create new threatRuleEngineId according to wp29AttackIndex and wp29Attack
  private getThreatRuleEngineId(wp29AttackIndex: string, wp29Attack: string, featureId: string = '', componentId: string = '') {
    const hashedString: string = wp29AttackIndex + wp29Attack + featureId + componentId;
    return sha256(hashedString).toString();
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 8.2
  private indexEightPointTwo(threatLargestRowNumber: number, commLines: any[]): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const protocolCommLines: any[] = commLines.filter((_: any) => _.attackSurface && _.baseProtocol === "802.11p");
    protocolCommLines.forEach((commLine: any) => {
      if (commLine) {
        const newId: string = this.arrOpService.genRandomId(20);
        const threat = new ThreatItem(commLine.id, // Component ID
          "Inter-vehicle communication messages", // Asset
          "", // assetType
          0, // attackFeasibility
          "", // attackFeasibilityLevel
          [commLine.id], // attackPath
          `starts from ${commLine.nickName}, and affects both vehicles.`, // attackPathName
          false, // attackSurface
          newId, // id
          "", // fromFeature
          1, // impactF
          1, // impactS
          1, // impactO
          1, // impactP
          "Negligible", // impactFLevel
          "Moderate", // impactSLevel
          "Severe", // impactOLevel
          "Negligible", // impactPLevel
          "Communications between vehicles are interrupted.", // damageScenario
          [], // impactOriginCompAssFea
          "", // module
          "", // nickName
          5, // riskScore
          "", // riskLevel
          "a", // securityPropertyCia
          "", // securityPropertyStride
          "Black hole attack - attacker is able to block messages between the vehicles.", // threatScenario
          "no treatment", // treatment
          false, // treatmentVal
          "userCreated", // type
          false, // reviewed
          "", // reviewedBy
          false // isExpanded
        );

        threat.threatSource = "wp29RuleEngine";
        threat.wp29AttackIndex = ["8.2"];
        threat.threatRowNumber = threatLargestRowNumber + 1;
        threatLargestRowNumber = threatLargestRowNumber + 1;
        const featureId: string = commLine.featureId.join("");
        threat.threatRuleEngineId = this.getThreatRuleEngineId("8.2", "Black hole attack, in order to disrupt communication between vehicles the attacker is able to block messages between the vehicles", featureId, commLine.id);
        hardCodedThreats.push(threat);
      }
    });

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 9.1
  private indexNinePointOne(threatLargestRowNumber: number, newDesign: any): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const modules: any[] = [...newDesign.micro, ...newDesign.controlUnit].filter((_: any) => _.featureType.includes("accessControl"));
    let modulesConnectedLineId: string[] = [];
    modules.map((_: any) => _.lineId).forEach((_: string[]) => {
      modulesConnectedLineId = [...modulesConnectedLineId, ..._];
    });
    const commLines: any[] = newDesign.commLine.filter((_: any) => _.attackSurface && modulesConnectedLineId.includes(_.id));
    commLines.forEach((_: any, index: number, self: any[]) => {
      const lineConnectedModule: any[] = modules.filter((__: any) => __.lineId.includes(_.id));
      const componentFeatureRoleUser: any = lineConnectedModule.find((__: any) => __.featureRole.includes("user"));
      const componentFeatureRoleSystem: any = lineConnectedModule.find((__: any) => __.featureRole.includes("system"));
      const newId: string = this.arrOpService.genRandomId(20);
      const threat = new ThreatItem(_.id, // Component ID
        "Privileged access", // Asset
        "", // assetType
        0, // attackFeasibility
        "", // attackFeasibilityLevel
        [_.id], // attackPath
        `starts from ${_.nickName}${componentFeatureRoleUser ? ` or ${componentFeatureRoleUser.nickName}` : ''}, and affects ${componentFeatureRoleSystem ? componentFeatureRoleSystem.nickName : ''} `, // attackPathName
        false, // attackSurface
        newId, // id
        "", // fromFeature
        1, // impactF
        1, // impactS
        1, // impactO
        1, // impactP
        "", // impactFLevel
        "", // impactSLevel
        "", // impactOLevel
        "", // impactPLevel
        "Attacker can gain advanced user privilege and thus access secret data or tamper other assets.", // damageScenario
        [], // impactOriginCompAssFea
        "", // module
        "", // nickName
        5, // riskScore
        "", // riskLevel
        "i", // securityPropertyCia
        "", // securityPropertyStride
        "An unprivileged user is able to gain privileged access, for example root access", // threatScenario
        "no treatment", // treatment
        false, // treatmentVal
        "userCreated", // type
        false, // reviewed
        "", // reviewedBy
        false // isExpanded
      );

      threat.threatSource = "wp29RuleEngine";
      threat.wp29AttackIndex = ["9.1"];
      threat.threatRowNumber = threatLargestRowNumber + 1;
      threatLargestRowNumber = threatLargestRowNumber + 1;
      const featureId: string = _.featureId.join("");
      threat.threatRuleEngineId = this.getThreatRuleEngineId("9.1", "An unprivileged user is able to gain privileged access, for example root access", featureId, _.id);
      hardCodedThreats.push(threat);
    });

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 15.1
  private indexFifteenPointOne(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "User interaction", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "", // securityPropertyCia
      "", // securityPropertyStride
      "Innocent victim (e.g. owner, operator or maintenance engineer) being tricked into taking an action to unintentionally load malware or enable an attack", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["15.1"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("15.1", "Innocent victim (e.g. owner, operator or maintenance engineer) being tricked into taking an action to unintentionally load malware or enable an attack");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 15.2
  private indexFifteenPointTwo(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "", // securityPropertyCia
      "", // securityPropertyStride
      "Certain  security controls are not effective because the security procedures are not followed.", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["15.2"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("15.2", "Defined security procedures are not followed");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 17.1
  private indexSeventeenPointOne(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "i", // securityPropertyCia
      "", // securityPropertyStride
      "Corrupted applications, or those with poor software security, used as a method to attack vehicle systems", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["17.1"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("17.1", "Corrupted applications, or those with poor software security, used as a method to attack vehicle systems");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 18.2
  private indexEighteenPointTwo(threatLargestRowNumber: number, newDesign: any, modules: string[], moduleCommLines: any[]) {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    modules.forEach((_: string) => {
      const selectedModule: any = [...newDesign.micro, ...newDesign.controlUnit].find((__: any) => __.id === _);
      if (selectedModule && moduleCommLines[_] && moduleCommLines[_].length > 0) {
        const moduleNickname: string = selectedModule.nickName;
        const selectedModuleLineId: string[] = selectedModule.lineId ? selectedModule.lineId : [];
        const selectedCommLines: any[] = moduleCommLines[_].filter((_: any) => selectedModuleLineId.includes(_.id));
        const commLinesNickname: string[] = [...new Set(selectedCommLines.map((_: ThreatItem) => _.nickName))];
        const commLinesId: string[] = [...new Set(selectedCommLines.map((_: ThreatItem) => _.id))];
        const threat = new ThreatItem("", // Component ID
          `${moduleNickname}`, // Asset
          "", // assetType
          0, // attackFeasibility
          "", // attackFeasibilityLevel
          commLinesId, // attackPath
          `starts from ${commLinesNickname.join(",")} and reaches ${moduleNickname}`, // attackPathName
          false, // attackSurface
          newId, // id
          "", // fromFeature
          1, // impactF
          1, // impactS
          1, // impactO
          1, // impactP
          "", // impactFLevel
          "", // impactSLevel
          "", // impactOLevel
          "", // impactPLevel
          "", // damageScenario
          [], // impactOriginCompAssFea
          "", // module
          "", // nickName
          5, // riskScore
          "", // riskLevel
          "i", // securityPropertyCia
          "", // securityPropertyStride
          "Media infected with a virus connected to a vehicle system", // threatScenario
          "no treatment", // treatment
          false, // treatmentVal
          "userCreated", // type
          false, // reviewed
          "", // reviewedBy
          false // isExpanded
        );

        threat.threatSource = "wp29RuleEngine";
        threat.wp29AttackIndex = ["18.2"];
        threat.threatRowNumber = threatLargestRowNumber + 1;
        threatLargestRowNumber = threatLargestRowNumber + 1;
        const featureId: string = selectedModule.featureId.join("");
        threat.threatRuleEngineId = this.getThreatRuleEngineId("18.2", "Media infected with a virus connected to a vehicle system", featureId, selectedModule.id);
        hardCodedThreats.push(threat);
      }
    });

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 19.2
  private indexNineteenPointTwo(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "c", // securityPropertyCia
      "", // securityPropertyStride
      "Unauthorized access to the owner’s privacy information such as personal identity, payment account information, address book information, location information, vehicle’s electronic ID, etc.", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["19.2"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("19.2", "Unauthorized access to the owner’s privacy information such as personal identity, payment account information, address book information, location information, vehicle’s electronic ID, etc.");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 20.1
  private indexTwentyPointOne(threatLargestRowNumber: number) {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "i", // securityPropertyCia
      "", // securityPropertyStride
      "Illegal/unauthorized changes to vehicle’s electronic ID", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["20.1"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("20.1", "Illegal/unauthorized changes to vehicle’s electronic ID");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 20.2
  private indexTwentyPointTwo(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "i", // securityPropertyCia
      "", // securityPropertyStride
      "Identity fraud. For example, if a user wants to display another identity when communicating with toll systems, manufacturer backend", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["20.2"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("20.2", "Identity fraud. For example, if a user wants to display another identity when communicating with toll systems, manufacturer backend");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 20.3
  private indexTwentyPointThree(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "i", // securityPropertyCia
      "", // securityPropertyStride
      "Action to circumvent monitoring systems (e.g. hacking/ tampering/ blocking of messages such as ODR Tracker data, or number of runs)", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["20.3"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("20.3", "Action to circumvent monitoring systems (e.g. hacking/ tampering/ blocking of messages such as ODR Tracker data, or number of runs)");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Create a static threat before applying condition for wp29AAttackIndex - 26.2
  private individualTwentySixPointTwoThreat(module?: any) {
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem(module ? module.id : '', // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "", // securityPropertyCia
      "", // securityPropertyStride
      "Insufficient use of cryptographic algorithms to protect sensitive systems", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );
    threat.threatSource = "wp29RuleEngine";
    return threat;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 26.2
  private indexTwentySixPointTwo(threatLargestRowNumber: number, newDesign: any): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const modules: any[] = [...newDesign.micro, ...newDesign.controlUnit].filter((_: any) => _.featureType.includes("cryptoAction"));
    if (modules && modules.length > 0) {
      modules.forEach((_: any) => {
        let feature: string = '';
        const featureIndex: number = _.featureType.indexOf("cryptoAction");
        if (featureIndex > -1) {
          feature = _.feature[featureIndex];
        }
        const threat: ThreatItem = this.individualTwentySixPointTwoThreat(_);
        threat.threatRowNumber = threatLargestRowNumber + 1;
        threatLargestRowNumber = threatLargestRowNumber + 1;
        const featureIdText: string = _.featureId.join("");
        threat.threatRuleEngineId = this.getThreatRuleEngineId("26.2", "Insufficient use of cryptographic algorithms to protect sensitive systems", featureIdText, _.id);
        threat.wp29AttackIndex = ["26.2"];
        threat.fromFeature = feature;
        hardCodedThreats.push(threat);
      });
    } else {
      const threat: ThreatItem = this.individualTwentySixPointTwoThreat();
      threat.threatRowNumber = threatLargestRowNumber + 1;
      threat.threatRuleEngineId = this.getThreatRuleEngineId("26.2", "Insufficient use of cryptographic algorithms to protect sensitive systems");
      threat.wp29AttackIndex = ["26.2"];
      threat.highlight = "_highlight";
      threat.notes = "WP29 engine: this threat is automatically generated based on WP29 requirements. Please check carefully whether this threat is relevant, should be a standalone threat, or merged with other threats.";
      hardCodedThreats.push(threat);
    }
    return hardCodedThreats;
  }

  // Create a static threat before applying condition for wp29AAttackIndex - 26.3
  private individualTwentySixPointThreeThreat(module?: any) {
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem(module ? module.id : "", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "", // securityPropertyCia
      "", // securityPropertyStride
      "Using already or soon to be deprecated cryptographic algorithms", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );
    threat.threatSource = "wp29RuleEngine";
    return threat;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 26.3
  private indexTwentySixPointThree(threatLargestRowNumber: number, newDesign: any): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const modules: any[] = [...newDesign.micro, ...newDesign.controlUnit].filter((_: any) => _.featureType.includes("cryptoAction"));
    if (modules && modules.length > 0) {
      modules.forEach((_: any) => {
        let feature: string = '';
        const featureIndex: number = _.featureType.indexOf("cryptoAction");
        if (featureIndex > -1) {
          feature = _.feature[featureIndex];
        }
        const threat: ThreatItem = this.individualTwentySixPointThreeThreat(_);
        threat.threatRowNumber = threatLargestRowNumber + 1;
        threatLargestRowNumber = threatLargestRowNumber + 1;
        const featureIdText: string = _.featureId.join("");
        threat.threatRuleEngineId = this.getThreatRuleEngineId("26.3", "Using already or soon to be deprecated cryptographic algorithms", featureIdText, _.id);
        threat.wp29AttackIndex = ["26.3"];
        threat.fromFeature = feature;
        hardCodedThreats.push(threat);
      });
    } else {
      const threat: ThreatItem = this.individualTwentySixPointThreeThreat();
      threat.threatRowNumber = threatLargestRowNumber + 1;
      threat.threatRuleEngineId = this.getThreatRuleEngineId("26.3", "Using already or soon to be deprecated cryptographic algorithms");
      threat.wp29AttackIndex = ["26.3"];
      threat.highlight = "_highlight";
      threat.notes = "WP29 engine: this threat is automatically generated based on WP29 requirements. Please check carefully whether this threat is relevant, should be a standalone threat, or merged with other threats.";
      hardCodedThreats.push(threat);
    }

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 28.2
  private indexTwentyEightPointTwo(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "", // securityPropertyCia
      "", // securityPropertyStride
      "Using remainders from development (e.g. debug ports, JTAG ports, microprocessors, development certificates, developer passwords, …) can permit access to ECUs or permit attackers to gain higher privileges", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["28.2"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("28.2", "Using remainders from development (e.g. debug ports, JTAG ports, microprocessors, development certificates, developer passwords, …) can permit access to ECUs or permit attackers to gain higher privileges");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 29.1
  private indexTwentyNinePointOne(threatLargestRowNumber: number, commLinesId: string[] = [], commLines: any[] = []): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    commLines = commLines.filter((_: any) => commLinesId.includes(_.id));
    commLines.forEach((_: any) => {
      const newId: string = this.arrOpService.genRandomId(20);
      const threat = new ThreatItem(_.id, // Component ID
        "", // Asset
        "", // assetType
        0, // attackFeasibility
        "", // attackFeasibilityLevel
        [], // attackPath
        "", // attackPathName
        false, // attackSurface
        newId, // id
        "", // fromFeature
        1, // impactF
        1, // impactS
        1, // impactO
        1, // impactP
        "", // impactFLevel
        "", // impactSLevel
        "", // impactOLevel
        "", // impactPLevel
        "", // damageScenario
        [], // impactOriginCompAssFea
        "", // module
        "", // nickName
        5, // riskScore
        "", // riskLevel
        "", // securityPropertyCia
        "", // securityPropertyStride
        `Superfluous internet ports left open, providing access to network systems`, // threatScenario
        "no treatment", // treatment
        false, // treatmentVal
        "commLine", // type
        false, // reviewed
        "", // reviewedBy
        false // isExpanded
      );

      threat.threatSource = "wp29RuleEngine";
      threat.wp29AttackIndex = ["29.1"];
      threat.threatRowNumber = threatLargestRowNumber + 1;
      const featureId: string = _.featureId.join("");
      threat.threatRuleEngineId = this.getThreatRuleEngineId("29.1", "Superfluous internet ports left open, providing access to network systems", featureId, _.id);
      hardCodedThreats.push(threat);
    });

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 29.2
  private indexTwentyNinePointTwo(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "", // securityPropertyCia
      "", // securityPropertyStride
      "Circumvent network separation to gain control. Specific example is the use of unprotected gateways, or access points (such as truck-trailer gateways), to circumvent protections and gain access to other network segments to perform malicious acts, such as sending arbitrary CAN bus messages", // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["29.2"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    threat.threatRuleEngineId = this.getThreatRuleEngineId("29.2", "Circumvent network separation to gain control. Specific example is the use of unprotected gateways, or access points (such as truck-trailer gateways), to circumvent protections and gain access to other network segments to perform malicious acts, such as sending arbitrary CAN bus messages");
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 31.1
  private indexThirtyOnePointOne(threats: ThreatItem[], assets: string[]): ThreatItem[] {
    const newThreats = threats.filter((__: ThreatItem) => assets.includes(__.assetId)).map((__: ThreatItem) => {
      const wp29AttackIndex: string[] = __.wp29AttackIndex && !__.wp29AttackIndex.includes(`31.1`) ? [...__.wp29AttackIndex, '31.1'] : ['31.1'];
      return {
        ...__,
        wp29AttackIndex
      }
    })
    return newThreats;
  }

  // Apply specific and general rule for creating hard-coded threats for wp29AAttackIndex - 32.1
  private indexThirtyTwoPointOne(threatLargestRowNumber: number): ThreatItem[] {
    const hardCodedThreats: ThreatItem[] = [];
    const newId: string = this.arrOpService.genRandomId(20);
    const threat = new ThreatItem("", // Component ID
      "", // Asset
      "", // assetType
      0, // attackFeasibility
      "", // attackFeasibilityLevel
      [], // attackPath
      "", // attackPathName
      false, // attackSurface
      newId, // id
      "", // fromFeature
      1, // impactF
      1, // impactS
      1, // impactO
      1, // impactP
      "", // impactFLevel
      "", // impactSLevel
      "", // impactOLevel
      "", // impactPLevel
      "", // damageScenario
      [], // impactOriginCompAssFea
      "", // module
      "", // nickName
      5, // riskScore
      "", // riskLevel
      "", // securityPropertyCia
      "", // securityPropertyStride
      `Physical manipulation of systems can enable an attack. Manipulation of electronic hardware, e.g. unauthorized electronic hardware added to a vehicle to enable "man-in-the-middle" attack. Replacement of authorized electronic hardware
      (e.g., sensors) with unauthorized electronic hardware. Manipulation of the information collected by a sensor (for example, using a magnet to tamper with the Hall effect sensor connected to the gearbox).`, // threatScenario
      "no treatment", // treatment
      false, // treatmentVal
      "userCreated", // type
      false, // reviewed
      "", // reviewedBy
      false // isExpanded
    );

    threat.threatSource = "wp29RuleEngine";
    threat.wp29AttackIndex = ["32.1"];
    threat.threatRowNumber = threatLargestRowNumber + 1;
    const threatRuleEngineId = this.getThreatRuleEngineId("32.1", `Manipulation of electronic hardware, e.g. unauthorized electronic hardware added to a vehicle to enable "man-in-the-middle" attack
    Replacement of authorized electronic hardware
    (e.g., sensors) with unauthorized electronic hardware
    Manipulation of the information collected by a sensor (for example, using a magnet to tamper with the Hall effect sensor connected to the gearbox)`);
    threat.threatRuleEngineId = threatRuleEngineId;
    hardCodedThreats.push(threat);

    return hardCodedThreats;
  }
}
