const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");
const attackFeasibilityFunc = require("./attackFeasibility");
const threatScenarioFunc = require("./threatScenario");
const opEnv = require("./operationalEnvironment");
const attackPathFunc = require("./attackPath");
const dataDrivenFeasibility = require("./dataDrivenFeasibility");
const impactFunc = require("./impact");
const riskFunc = require("./riskDetermination");
const crypto = require('crypto');
const sageMakerStatus = require('../config').licenseFile.sageMakerStatus;


// function to further populate assetThreatMatrix, including threat scenario, feasibility, risk score, etc.
async function groupThreatScenario(assetThreatMatrix, connectedComponentIdArray, assetArray, projectById, featureIndexArray, attackPathVarArray,
    attackSurfaceBaseProtocol, attackSurfaceAppProtocol, attackSurfaceSecurityProtocol, attackSurfaceTransmissionMedia, assetTypeArray, 
    assetSubTypeArray, assetAccessTypeArray, systemConfigData, userCallFlag) {
    const threatObj = await httpService.getGroupThreatScenario(assetTypeArray); // return relevant object from threatLib
    // console.log(`assetTypeArray is ${assetTypeArray}`)
    // console.log(`assetTypeArray[0] is ${assetTypeArray[0]}`)
    const threatFea = await httpService.getGroupThreatFeasibility(assetTypeArray, assetSubTypeArray); // return relevant object from threatFeasibilityLib
    // threatFeaAdv is an array of arrays. Each innner array is a group of adv feasibility documents of the same assetType.
    const threatFeaAdv = await httpService.getGroupThreatFeasibilityAdv(assetTypeArray, assetSubTypeArray, attackSurfaceBaseProtocol, attackSurfaceAppProtocol,
        attackSurfaceSecurityProtocol, attackSurfaceTransmissionMedia); // return relevant object from threatFeasibilityLibAdv
    // console.log(`threatFea[0].assetType is ${threatFea[0].assetType}`)
    // console.log(`threatFea[0].threatFeaArray is ${threatFea[0].threatFeaArray}`)
    // console.log(`threatFea[0] is ${threatFea[0]}`)
    // console.dir(threatFeaAdv);
    const secPropertyCia = ["i", "i", "a", "c", "a", "i"];
    const secPropertyStride = ["s", "t", "r", "i", "d", "e"];
    for (let [index, currentComponent] of connectedComponentIdArray.entries()) { // this array, together with assetArray, featureIndexArray, and attackPathVarArray, represents all assets in assetThreatMatrix
        let threatScenarioItem = threatScenarioFunc.generateThreatScenarioStrideForGroup(threatObj, assetThreatMatrix[currentComponent][assetArray[index]].asset,
            assetThreatMatrix[currentComponent][assetArray[index]].assetType, assetThreatMatrix[currentComponent][assetArray[index]].assetSubType, 
            assetThreatMatrix[currentComponent][assetArray[index]].nickName, assetThreatMatrix[currentComponent][assetArray[index]].fromFeature, 
            projectById[attackPathVarArray[index][0]].sensorInput, assetAccessTypeArray[index]); // this array always has 6 elements, STRIDE
        // console.log(`component ${currentComponent} asset ${assetArray[index]} has ${threatScenarioItem.length} threat scenarios. They are `)
        // console.dir(threatScenarioItem);

        // assetLibGroupRes doesn't follow the same sequence as other arrays, so this is needed to get the correct assetLib document
        // let assetLibRes = objOperation.findObjectByPropertyValue(assetLibGroupRes, "_id", assetArray[index]);
        // threatFea doesn't follow the same sequence, so this is needed to get the correct threatFeasibilityLib document
        let currentThreatFeaStrideArray = objOperation.processThreatFeaForGroupAlgorithm(threatFea, assetTypeArray[index], assetSubTypeArray[index]);
        // console.log(`assetType is ${assetTypeArray[index]}, subType is ${assetSubTypeArray[index]}, currentThreatFea is ${currentThreatFea}`)
        for (i = 0; i < threatScenarioItem.length; i++) {
            let secProCia = secPropertyCia[i];
            let secProStride = secPropertyStride[i];
            for (const threat of threatScenarioItem[i]) {
                let OpEnvVar = opEnv.analyzeOpEnv(threat, attackPathVarArray[index], projectById); // consider operational environment parameters. OpEnvVar = {attackVector, window}
                // console.log(`CVSSVector is ${CVSSVector}, and trueAV is ${trueAV}`)
                // const feasibilityLevel = attackFeasibilityFunc.analyzeFeasibilityLevel(feasibilityScore); // calculate feasibility score
                // console.log(`feasibilityLevel is ${feasibilityLevel}`);
                // console.log(`assetType is ${assetTypeArray[index]}, subType is ${assetSubTypeArray[index]}, i is ${i}, currentThreatFea[i] is ${currentThreatFea[i]}`);
                let attackMethodId = "tbd"; // reserved for a new library
                // threatFeaAdv array follows the same sequence as other arrays. each element may have more than one objects because threat type (STRIDE) was not used in DB query
                let currentThreatFeaAdv = objOperation.processThreatFeaAdv(threatFeaAdv[index], secProStride);
                // console.log(currentThreatFeaAdv)
                if (currentThreatFeaAdv != undefined && currentThreatFeaAdv.length > 0) { // if advanced feasibility library has record for a threat
                    currentThreatFeaAdv.forEach((attackMethod, attackMethodIndex) => {
                        // this following array is to match the format of currentThreatFeaStrideArray, so that they can use the same analyzeFeasibility method
                        // this must be changed to support CVSS and attack vector methods (those values need to be added to records in adv feasibility library)
                        const [feasibilityScore, feasibilityLevel, CVSSVector, trueAV] = attackFeasibilityFunc.analyzeFeasibility(currentThreatFeaAdv, attackMethodIndex, systemConfigData,
                            OpEnvVar); // calculate feasibility score and level
                        attackMethodId = attackMethod._id;
                        let attackPathNameVar = attackPathFunc.assembleAttackPathDescription(assetThreatMatrix, currentComponent, assetArray, index,
                            attackPathVarArray, projectById, attackSurfaceTransmissionMedia[index], attackMethod.stride, assetSubTypeArray[index],
                            projectById[attackPathVarArray[index][0]].sensorInput);
                        let ruleDigest = assetThreatMatrix[currentComponent][assetArray[index]].fromFeatureId + assetArray[index] + attackPathVarArray[index] + secProStride
                            + attackMethodId;
                        if (objOperation.convertStrideToCia(attackMethod.stride)[1]) {
                            const errorMsg = `Please report to your administrator: the item _id ${attackMethod._id} of advanced feasibility library has an invalid stride entry`;
                            throw new Error(errorMsg); // TODO: generate an error log and store in txt file
                        }
                        assetThreatMatrix[currentComponent][assetArray[index]].threat.push({
                            "securityPropertyCia": objOperation.convertStrideToCia(attackMethod.stride)[0],
                            "securityPropertyStride": attackMethod.stride,
                            "assetType": assetTypeArray[index],
                            "subType": assetSubTypeArray[index],
                            "threatScenario": threat,
                            "attackFeasibility": feasibilityScore,
                            "attackFeasibilityLevel": feasibilityLevel,
                            "attackFeasibilityElapsed": attackMethod.elapsed,
                            "attackFeasibilityExpertise": attackMethod.expertise,
                            "attackFeasibilityKnowledge": attackMethod.knowledge,
                            "attackFeasibilityWindow": attackMethod.window,
                            "attackFeasibilityEquipment": attackMethod.equipment,
                            "attackFeasibilityCVSSVector": CVSSVector,
                            "attackFeasibilityCVSSComplexity": currentThreatFeaStrideArray[i].CVSSComplexity, // these are CVSS scores do not exist in the advanced fea lib yet
                            "attackFeasibilityCVSSPrivilege": currentThreatFeaStrideArray[i].CVSSPrivilege,
                            "attackFeasibilityCVSSUser": currentThreatFeaStrideArray[i].CVSSUser,
                            "attackFeasibilityAttackVector": trueAV,
                            "riskScore": 0,
                            "riskLevel": "tbd",
                            "treatment": "no treatment",
                            "treatmentVal": false,
                            "validateStatusForFilter": "to-validate",
                            "attackPath": attackPathVarArray[index], // connectivityListZero only records 1-step attack path: line, or the component directly connected to the line
                            "attackPathName": attackPathNameVar, // for table view display
                            // impactOriginCompAssFea records the impact origin, mainly for conveyor assets
                            "impactOriginCompAssFea": [currentComponent, assetArray[index], projectById[currentComponent].feature[featureIndexArray[index]]],
                            "threatSource": "ruleEngine",
                            "threatRuleEngineId": crypto.createHash('sha256').update(ruleDigest).digest('hex'), // used to identify threats generated from the same rule
                            "highlight": "", // for uncertain threat item
                            "baseProtocol": attackSurfaceBaseProtocol[index],
                            "appProtocol": attackSurfaceAppProtocol[index],
                            "secureProtocol": attackSurfaceSecurityProtocol[index],
                            "transmissionMedia": attackSurfaceTransmissionMedia[index],
                            "attackFeasibilityElapsedRationale": attackMethod.elapsedRat,
                            "attackFeasibilityExpertiseRationale": attackMethod.expertiseRat,
                            "attackFeasibilityKnowledgeRationale": attackMethod.knowledgeRat,
                            "attackFeasibilityWindowRationale": attackMethod.windowRat,
                            "attackFeasibilityEquipmentRationale": attackMethod.equipmentRat,
                            "attackMethod": attackMethod.attackMethod,
                            "MITM": attackMethod.MITM,
                            "notes": "Threat Engine Note: This attack is also called " + attackMethod.attackMethod,
                            "threatFeaLibAdvId": attackMethod._id,
                            "attackSurfaceSensorInput": projectById[attackPathVarArray[index][0]].sensorInput,
                            "endOfChainModuleIdInDb": projectById[attackPathVarArray[index][attackPathVarArray[index].length - 1]].moduleIdInDb,
                        });
                    })
                } else { // if no record in advanced feasibility library
                    const [feasibilityScore, feasibilityLevel, CVSSVector, trueAV] = attackFeasibilityFunc.analyzeFeasibility(currentThreatFeaStrideArray, i,
                        systemConfigData, OpEnvVar); // calculate feasibility score and level
                    let attackPathNameVar = attackPathFunc.assembleAttackPathDescription(assetThreatMatrix, currentComponent, assetArray, index,
                        attackPathVarArray, projectById, attackSurfaceTransmissionMedia[index], secProStride, assetSubTypeArray[index], projectById[attackPathVarArray[index][0]].sensorInput);
                    // each rule consists of feature id, asset id (including asset type and subType), attack path (including attack surface and attacked component),
                    // threat type, attack surface base protocol (if through a commLine), attack surface app protocols (if through a commLine),
                    // attack surface security protocols (if through a commLine), transmission media (if through a commLine), and in the future, specific attack method
                    let machineLearningModel = null;
                    let attackFeasibilityElapsed = null;
                    let attackFeasibilityExpertise = null;
                    let attackFeasibilityKnowledge = null;
                    let attackFeasibilityWindow = null;
                    let attackFeasibilityEquipment = null;
                    // defining assetLibRes object here is for historical reasons
                    // historically, we didn't have assetTypeArray or assetSubTypeArray, so we used assetLibRes to represent both. now we could directly use those two arrays
                    // but haven't got time to update the code
                    let assetLibRes = {
                        "assetType": assetTypeArray[index],
                        "subType": assetSubTypeArray[index]
                    };
                    if (sageMakerStatus && userCallFlag) { // sagemaker will only trigger if it's called by a user
                        machineLearningModel = await dataDrivenFeasibility.getMachineLearningModel(assetLibRes, attackPathVarArray[index],
                            projectById[attackPathVarArray[index][0]].sensorInput, secProCia, secProStride, attackSurfaceTransmissionMedia[index],
                            attackSurfaceBaseProtocol[index], attackSurfaceAppProtocol[index], attackSurfaceSecurityProtocol[index]);
                        attackFeasibilityElapsed = machineLearningModel && machineLearningModel.length > 0 ? machineLearningModel[0][0] : currentThreatFeaStrideArray[i].elapsed;
                        attackFeasibilityExpertise = machineLearningModel && machineLearningModel.length > 0 ? machineLearningModel[0][2] : currentThreatFeaStrideArray[i].expertise;
                        attackFeasibilityKnowledge = machineLearningModel && machineLearningModel.length > 0 ? machineLearningModel[0][3] : currentThreatFeaStrideArray[i].knowledge;
                        attackFeasibilityWindow = machineLearningModel && machineLearningModel.length > 0 ? machineLearningModel[0][4] : currentThreatFeaStrideArray[i].window;
                        attackFeasibilityEquipment = machineLearningModel && machineLearningModel.length > 0 ? machineLearningModel[0][1] : currentThreatFeaStrideArray[i].equipment;
                    } else {
                        attackFeasibilityElapsed = currentThreatFeaStrideArray[i].elapsed;
                        attackFeasibilityExpertise = currentThreatFeaStrideArray[i].expertise;
                        attackFeasibilityKnowledge = currentThreatFeaStrideArray[i].knowledge;
                        attackFeasibilityWindow = OpEnvVar.window;
                        attackFeasibilityEquipment = currentThreatFeaStrideArray[i].equipment;
                    }
                    let ruleDigest = assetThreatMatrix[currentComponent][assetArray[index]].fromFeatureId + assetArray[index] + attackPathVarArray[index] + secProStride
                        + attackMethodId;
                    // console.log(`assetThreatMatrix[currentComponent][assetArray[index]].asset is `)
                    // console.dir(assetThreatMatrix[currentComponent][assetArray[index]])
                    assetThreatMatrix[currentComponent][assetArray[index]].threat.push({
                        "securityPropertyCia": secProCia,
                        "securityPropertyStride": secProStride,
                        "assetType": assetTypeArray[index],
                        "subType": assetSubTypeArray[index],
                        "threatScenario": threat,
                        "attackFeasibility": feasibilityScore,
                        "attackFeasibilityLevel": feasibilityLevel,
                        "attackFeasibilityElapsed": attackFeasibilityElapsed,
                        "attackFeasibilityExpertise": attackFeasibilityExpertise,
                        "attackFeasibilityKnowledge": attackFeasibilityKnowledge,
                        "attackFeasibilityWindow": attackFeasibilityWindow,
                        "attackFeasibilityEquipment": attackFeasibilityEquipment,
                        "attackFeasibilityCVSSVector": CVSSVector,
                        "attackFeasibilityCVSSComplexity": currentThreatFeaStrideArray[i].CVSSComplexity,
                        "attackFeasibilityCVSSPrivilege": currentThreatFeaStrideArray[i].CVSSPrivilege,
                        "attackFeasibilityCVSSUser": currentThreatFeaStrideArray[i].CVSSUser,
                        "attackFeasibilityAttackVector": trueAV,
                        "riskScore": 0,
                        "riskLevel": "tbd",
                        "treatment": "no treatment",
                        "treatmentVal": false,
                        "validateStatusForFilter": "to-validate",
                        "attackPath": attackPathVarArray[index], // connectivityListZero only records 1-step attack path: line, or the component directly connected to the line
                        "attackPathName": attackPathNameVar, // for table view display
                        // impactOriginCompAssFea records the impact origin, mainly for conveyor assets
                        "impactOriginCompAssFea": [currentComponent, assetArray[index], projectById[currentComponent].feature[featureIndexArray[index]]],
                        "threatSource": "ruleEngine",
                        "threatRuleEngineId": crypto.createHash('sha256').update(ruleDigest).digest('hex'), // used to identify threats generated from the same rule
                        "highlight": "", // for uncertain threat item
                        "baseProtocol": attackSurfaceBaseProtocol[index],
                        "appProtocol": attackSurfaceAppProtocol[index],
                        "secureProtocol": attackSurfaceSecurityProtocol[index],
                        "transmissionMedia": attackSurfaceTransmissionMedia[index],
                        "MITM": false,
                        "threatFeaLibAdvId": "",
                        "attackSurfaceSensorInput": projectById[attackPathVarArray[index][0]].sensorInput,
                        "endOfChainModuleIdInDb": projectById[attackPathVarArray[index][attackPathVarArray[index].length - 1]].moduleIdInDb,
                    });
                }
            }
        }
    }
    return assetThreatMatrix
}

// this function prepares data needed for analyzeAsset function
async function mainAlgoMainProcess(projectById, connectivityListZero, connectivityListZeroPath, connectivityListZeroBaseProt, connectivityListZeroAppProt, connectivityListZeroSecProt,
    connectivityListZeroTransmissionMedia, featureChainInvolvedComponent, featureChainInvolvedComponentFromCommLine, userCallFlag) {
    try {
        let assetThreatMatrix = {};
        let analyzeAssetMetaData = { // to improve algorithm performance, these arrays are collected so they can be queries together, rather than one at a time
            connectedComponentIdArray: [], // these are the components under attack
            assetIdArray: [],
            assetTypeArray: [],
            assetSubTypeArray: [],
            featureIndexArray: [],
            attackPathVarArray: [], // stores the id of each components along the way. array of arrays
            attackSurfaceBaseProtocol: [], // stores base protocol if attack surface is commLine, stores component id if attack surface is not commLine
            attackSurfaceAppProtocol: [], // stores application protocol (this is an array for each attack surface) if attack surface is commLine, stores component id if attack surface is not commLine
            attackSurfaceSecurityProtocol: [], // stores security protocol (this is an array for each attack surface) if attack surface is commLine, stores component id if attack surface is not commLine
            transmissionMedia: [],
            assetAccessTypeArray: [], // stores access type for each asset
        }
        const systemConfigData = await httpService.getSystemConfig(); // system configuration data shows which feasibility method to use
        // console.log(`systemConfigData is `);
        // console.dir(systemConfigData);
        // first loop, no asset has been analyzed before. So assetThreatMatrix doesn't have component or asset
        for (let currentComponentInProjectById of Object.keys(projectById)) { // for every component
            // console.log(`current component is ${projectById[currentComponentInProjectById].nickName}; its asset includes: ${projectById[currentComponentInProjectById].asset}; assetIdArray is ${analyzeAssetMetaData.assetIdArray}`)
            // this following if statement and for loop are to deal with each component connected to the attacking component
            if (projectById[currentComponentInProjectById].attackSurface == true) { // if it is an attacking component, analyze. if not, ignore.
                for (let [connectedComponentIdIndex, connectedComponentId] of connectivityListZero[currentComponentInProjectById].entries()) {
                    let attackPathVar = []; // initialize attack path variable
                    // if (component A reaches component B via component A || component A reaches component B via component B), only two components are involved in the path
                    if (currentComponentInProjectById == connectivityListZeroPath[currentComponentInProjectById][connectedComponentIdIndex] ||
                        connectedComponentId == connectivityListZeroPath[currentComponentInProjectById][connectedComponentIdIndex]) {
                        attackPathVar.push(currentComponentInProjectById, connectedComponentId);
                    } else { // otherwise, there must be three components involved in the path
                        attackPathVar.push(currentComponentInProjectById, connectivityListZeroPath[currentComponentInProjectById][connectedComponentIdIndex], connectedComponentId);
                    }
                    // the following is to analyze threats according to the connectivity list
                    if (assetThreatMatrix[connectedComponentId]) { // if the component under attack was already analyzed before, add to it
                        for (let index = 0; index < projectById[connectedComponentId].asset.length; index++) { // for each asset
                            let featureIndex = projectById[connectedComponentId].assetFeatureIndex[index];
                            let assetItem = projectById[connectedComponentId].assetId[index];
                            let assetType = projectById[connectedComponentId].assetType[index];
                            let assetCheck = attackPathFunc.assetCheck(projectById, attackPathVar, connectedComponentId, assetItem, index, assetType);
                            // console.log(`component added before. asset check for ${projectById[connectedComponentId].asset[index]} is ${assetCheck}`);
                            if (assetCheck[0]) { // analyze the asset if the associated feature is carried on the attack path
                                // error handling for users
                                checkMissingRequiredSetting(connectivityListZeroTransmissionMedia[currentComponentInProjectById][connectedComponentIdIndex],
                                    projectById[connectedComponentId].nickName, "Transmission Media");
                                checkMissingRequiredSetting(connectivityListZeroBaseProt[currentComponentInProjectById][connectedComponentIdIndex],
                                    projectById[connectedComponentId].nickName, "Base Protocol");
                                if (assetThreatMatrix[connectedComponentId][assetItem]) { // if the asset already exist, only add to the threat array
                                    // analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                    // analyzeAssetMetaData.assetIdArray.push(assetItem);
                                    // analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                    // analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                } else { // if the asset doesn't exist, create the new asset property with all contents
                                    assetThreatMatrix[connectedComponentId][assetItem] = {}; // initialize asset under component in assetThreatMatrix
                                    // assetThreatMatrix is structured: {componentId: {assetId: {property1: xxx, property2: xxx}}}
                                    Object.assign(assetThreatMatrix[connectedComponentId][assetItem], { // values don't need async functions
                                        "asset": projectById[connectedComponentId].asset[index],
                                        "assetType": projectById[connectedComponentId].assetType[index],
                                        "assetSubType": projectById[connectedComponentId].assetSubType[index],
                                        "fromFeatureIndex": projectById[connectedComponentId].assetFeatureIndex[index],
                                        "fromFeature": projectById[connectedComponentId].feature[featureIndex],
                                        "fromFeatureId": projectById[connectedComponentId].featureId[featureIndex],
                                        "featureType": projectById[connectedComponentId].featureType[featureIndex],
                                        "featureRole": projectById[connectedComponentId].featureRole[featureIndex],
                                        "module": projectById[connectedComponentId].module,
                                        "moduleId": projectById[connectedComponentId].id,
                                        "moduleIdInDb": projectById[connectedComponentId].moduleIdInDb,
                                        "nickName": projectById[connectedComponentId].nickName,
                                        "type": projectById[connectedComponentId].type,
                                        "attackSurface": projectById[connectedComponentId].attackSurface,
                                        "isExpanded": false,
                                        "notes": "",
                                        "cybersecurityClaim": "",
                                        "reviewed": false,
                                        "reviewStatusForFilter": "to-review",
                                        "threat": []
                                    });
                                }
                                analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                analyzeAssetMetaData.assetIdArray.push(assetItem);
                                analyzeAssetMetaData.assetTypeArray.push(assetType);
                                analyzeAssetMetaData.assetSubTypeArray.push(projectById[connectedComponentId].assetSubType[index]);
                                analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                analyzeAssetMetaData.attackSurfaceBaseProtocol.push(connectivityListZeroBaseProt[currentComponentInProjectById][connectedComponentIdIndex]);
                                analyzeAssetMetaData.attackSurfaceAppProtocol.push(connectivityListZeroAppProt[currentComponentInProjectById][connectedComponentIdIndex]);
                                analyzeAssetMetaData.attackSurfaceSecurityProtocol.push(connectivityListZeroSecProt[currentComponentInProjectById][connectedComponentIdIndex]);
                                analyzeAssetMetaData.transmissionMedia.push(connectivityListZeroTransmissionMedia[currentComponentInProjectById][connectedComponentIdIndex]);
                                analyzeAssetMetaData.assetAccessTypeArray.push(assetCheck[1]);
                            }
                        }
                    } else { // if the component under attack was never analyzed, create a new property
                        assetThreatMatrix[connectedComponentId] = {}; // initialize component in assetThreatMatrix
                        if (projectById[connectedComponentId].asset) { // if the component has assets defined
                            for (let index = 0; index < projectById[connectedComponentId].asset.length; index++) { // for each asset
                                let featureIndex = projectById[connectedComponentId].assetFeatureIndex[index];
                                let assetItem = projectById[connectedComponentId].assetId[index];
                                // console.log(`asset being processed is ${projectById[connectedComponentId].asset[index]}`);
                                let assetType = projectById[connectedComponentId].assetType[index];
                                let assetCheck = attackPathFunc.assetCheck(projectById, attackPathVar, connectedComponentId, assetItem, index, assetType);
                                // console.log(`asset check for ${projectById[connectedComponentId].asset[index]} is ${assetCheck}`);
                                if (assetCheck[0]) { // analyze the asset if the associated feature is carried on the attack path
                                    // error handling for users
                                    checkMissingRequiredSetting(connectivityListZeroBaseProt[currentComponentInProjectById][connectedComponentIdIndex],
                                        projectById[connectedComponentId].nickName, "Base Protocol");
                                    checkMissingRequiredSetting(connectivityListZeroTransmissionMedia[currentComponentInProjectById][connectedComponentIdIndex],
                                        projectById[connectedComponentId].nickName, "Transmission Media");
                                    assetThreatMatrix[connectedComponentId][assetItem] = {}; // initialize asset under component in assetThreatMatrix
                                    // assetThreatMatrix is structured: {componentId: {assetId: {property1: xxx, property2: xxx}}}
                                    Object.assign(assetThreatMatrix[connectedComponentId][assetItem], { // values don't need async functions
                                        "asset": projectById[connectedComponentId].asset[index],
                                        "assetType": projectById[connectedComponentId].assetType[index],
                                        "assetSubType": projectById[connectedComponentId].assetSubType[index],
                                        "fromFeatureIndex": projectById[connectedComponentId].assetFeatureIndex[index],
                                        "fromFeature": projectById[connectedComponentId].feature[featureIndex],
                                        "fromFeatureId": projectById[connectedComponentId].featureId[featureIndex],
                                        "featureType": projectById[connectedComponentId].featureType[featureIndex],
                                        "featureRole": projectById[connectedComponentId].featureRole[featureIndex],
                                        "module": projectById[connectedComponentId].module,
                                        "moduleId": projectById[connectedComponentId].id,
                                        "moduleIdInDb": projectById[connectedComponentId].moduleIdInDb,
                                        "nickName": projectById[connectedComponentId].nickName,
                                        "type": projectById[connectedComponentId].type,
                                        "attackSurface": projectById[connectedComponentId].attackSurface,
                                        "isExpanded": false,
                                        "notes": "",
                                        "cybersecurityClaim": "",
                                        "reviewed": false,
                                        "reviewStatusForFilter": "to-review",
                                        "threat": []
                                    });
                                    analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                    analyzeAssetMetaData.assetIdArray.push(assetItem);
                                    analyzeAssetMetaData.assetTypeArray.push(projectById[connectedComponentId].assetType[index]);
                                    analyzeAssetMetaData.assetSubTypeArray.push(projectById[connectedComponentId].assetSubType[index]);
                                    analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                    analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                    analyzeAssetMetaData.attackSurfaceBaseProtocol.push(connectivityListZeroBaseProt[currentComponentInProjectById][connectedComponentIdIndex]);
                                    analyzeAssetMetaData.attackSurfaceAppProtocol.push(connectivityListZeroAppProt[currentComponentInProjectById][connectedComponentIdIndex]);
                                    analyzeAssetMetaData.attackSurfaceSecurityProtocol.push(connectivityListZeroSecProt[currentComponentInProjectById][connectedComponentIdIndex]);
                                    analyzeAssetMetaData.transmissionMedia.push(connectivityListZeroTransmissionMedia[currentComponentInProjectById][connectedComponentIdIndex]);
                                    analyzeAssetMetaData.assetAccessTypeArray.push(assetCheck[1]);
                                }
                            }
                        }
                    }
                    // console.log(`this round is for currentComponentInProjectById ${currentComponentInProjectById}, connectedComponentId is ${connectedComponentId}`);
                    // console.log(`after this round, analyzeAssetMetaData.assetIdArray.length is ${analyzeAssetMetaData.assetIdArray.length}`);
                    // console.log(`analyzeAssetMetaData.connectedComponentIdArray is now ${analyzeAssetMetaData.connectedComponentIdArray}`);
                    // console.log(`analyzeAssetMetaData.assetIdArray is now ${analyzeAssetMetaData.assetIdArray}`);
                    // console.log(`analyzeAssetMetaData.featureIndexArray is now ${analyzeAssetMetaData.featureIndexArray}`);
                    // console.log(`analyzeAssetMetaData.attackPathVarArray is now ${analyzeAssetMetaData.attackPathVarArray}`);
                }
                // the following if statement and for loop deal with feature chain started from a micro or controlUnit
                if (featureChainInvolvedComponent.originating.includes(currentComponentInProjectById)) { // if current component is an originating component in feature chain
                    for (let [currentOriginatingCompIndex, currentOriginatingComp] of featureChainInvolvedComponent.originating.entries()) {
                        if (currentOriginatingComp == currentComponentInProjectById) {
                            let attackPathVar = featureChainInvolvedComponent.attackPath[currentOriginatingCompIndex];
                            let connectedComponentId = featureChainInvolvedComponent.attacked[currentOriginatingCompIndex];
                            // the following is to analyze threats according to the feature chain involved component
                            if (assetThreatMatrix[connectedComponentId]) { // if the component under attack was already analyzed before, add to it
                                for (let index = 0; index < projectById[connectedComponentId].asset.length; index++) { // for each asset
                                    let featureIndex = projectById[connectedComponentId].assetFeatureIndex[index];
                                    let assetItem = projectById[connectedComponentId].assetId[index];
                                    let assetCheck = [false, null];
                                    // if the feature is carried, all assets are relevant
                                    if (featureChainInvolvedComponent.featureIndexInAttacked[currentOriginatingCompIndex] == featureIndex) {
                                        let assetType = projectById[connectedComponentId].assetType[index];
                                        assetCheck = attackPathFunc.returnTrueAndAccessTypeByAssetType(assetType)
                                    }
                                    if (assetCheck[0]) { // analyze the asset if the associated feature is carried on the attack path
                                        if (assetThreatMatrix[connectedComponentId][assetItem]) { // if the asset already exist, only add to the threat array
                                            // analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                            // analyzeAssetMetaData.assetIdArray.push(assetItem);
                                            // analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                            // analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                        } else { // if the asset doesn't exist, create the new asset property with all contents
                                            assetThreatMatrix[connectedComponentId][assetItem] = {}; // initialize asset under component in assetThreatMatrix
                                            // assetThreatMatrix is structured: {componentId: {assetId: {property1: xxx, property2: xxx}}}
                                            Object.assign(assetThreatMatrix[connectedComponentId][assetItem], { // values don't need async functions
                                                "asset": projectById[connectedComponentId].asset[index],
                                                "assetType": projectById[connectedComponentId].assetType[index],
                                                "assetSubType": projectById[connectedComponentId].assetSubType[index],
                                                "fromFeatureIndex": projectById[connectedComponentId].assetFeatureIndex[index],
                                                "fromFeature": projectById[connectedComponentId].feature[featureIndex],
                                                "fromFeatureId": projectById[connectedComponentId].featureId[featureIndex],
                                                "featureType": projectById[connectedComponentId].featureType[featureIndex],
                                                "featureRole": projectById[connectedComponentId].featureRole[featureIndex],
                                                "module": projectById[connectedComponentId].module,
                                                "moduleId": projectById[connectedComponentId].id,
                                                "moduleIdInDb": projectById[connectedComponentId].moduleIdInDb,
                                                "nickName": projectById[connectedComponentId].nickName,
                                                "type": projectById[connectedComponentId].type,
                                                "attackSurface": projectById[connectedComponentId].attackSurface,
                                                "isExpanded": false,
                                                "notes": "",
                                                "cybersecurityClaim": "",
                                                "reviewed": false,
                                                "reviewStatusForFilter": "to-review",
                                                "threat": []
                                            });
                                        }
                                        analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                        analyzeAssetMetaData.assetIdArray.push(assetItem);
                                        analyzeAssetMetaData.assetTypeArray.push(projectById[connectedComponentId].assetType[index]);
                                        analyzeAssetMetaData.assetSubTypeArray.push(projectById[connectedComponentId].assetSubType[index]);
                                        analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                        analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                        analyzeAssetMetaData.transmissionMedia.push(projectById[currentOriginatingComp].transmissionMedia);
                                        // micro or controlUnit doesn't have these following
                                        analyzeAssetMetaData.attackSurfaceBaseProtocol.push("");
                                        analyzeAssetMetaData.attackSurfaceAppProtocol.push([]);
                                        analyzeAssetMetaData.attackSurfaceSecurityProtocol.push([]);
                                        analyzeAssetMetaData.assetAccessTypeArray.push(assetCheck[1]);
                                    }
                                }
                            } else { // if the component under attack was never analyzed, create a new property
                                assetThreatMatrix[connectedComponentId] = {}; // initialize component in assetThreatMatrix
                                if (projectById[connectedComponentId].asset) { // if assets are defined in this component
                                    for (let index = 0; index < projectById[connectedComponentId].asset.length; index++) { // for each asset
                                        let featureIndex = projectById[connectedComponentId].assetFeatureIndex[index];
                                        let assetItem = projectById[connectedComponentId].assetId[index];
                                        let assetCheck = [false, null];
                                        // if the feature is carried, all assets are relevant
                                        if (featureChainInvolvedComponent.featureIndexInAttacked[currentOriginatingCompIndex] == featureIndex) { 
                                            let assetType = projectById[connectedComponentId].assetType[index];
                                            assetCheck = attackPathFunc.returnTrueAndAccessTypeByAssetType(assetType)
                                        }
                                        if (assetCheck[0]) { // analyze the asset if the associated feature is carried on the attack path
                                            assetThreatMatrix[connectedComponentId][assetItem] = {}; // initialize asset under component in assetThreatMatrix
                                            // assetThreatMatrix is structured: {componentId: {assetId: {property1: xxx, property2: xxx}}}
                                            Object.assign(assetThreatMatrix[connectedComponentId][assetItem], { // values don't need async functions
                                                "asset": projectById[connectedComponentId].asset[index],
                                                "assetType": projectById[connectedComponentId].assetType[index],
                                                "assetSubType": projectById[connectedComponentId].assetSubType[index],
                                                "fromFeatureIndex": projectById[connectedComponentId].assetFeatureIndex[index],
                                                "fromFeature": projectById[connectedComponentId].feature[featureIndex],
                                                "fromFeatureId": projectById[connectedComponentId].featureId[featureIndex],
                                                "featureType": projectById[connectedComponentId].featureType[featureIndex],
                                                "featureRole": projectById[connectedComponentId].featureRole[featureIndex],
                                                "module": projectById[connectedComponentId].module,
                                                "moduleId": projectById[connectedComponentId].id,
                                                "moduleIdInDb": projectById[connectedComponentId].moduleIdInDb,
                                                "nickName": projectById[connectedComponentId].nickName,
                                                "type": projectById[connectedComponentId].type,
                                                "attackSurface": projectById[connectedComponentId].attackSurface,
                                                "isExpanded": false,
                                                "notes": "",
                                                "cybersecurityClaim": "",
                                                "reviewed": false,
                                                "reviewStatusForFilter": "to-review",
                                                "threat": []
                                            });
                                            analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                            analyzeAssetMetaData.assetIdArray.push(assetItem);
                                            analyzeAssetMetaData.assetTypeArray.push(projectById[connectedComponentId].assetType[index]);
                                            analyzeAssetMetaData.assetSubTypeArray.push(projectById[connectedComponentId].assetSubType[index]);
                                            analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                            analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                            analyzeAssetMetaData.transmissionMedia.push(projectById[currentOriginatingComp].transmissionMedia);
                                            // micro or controlUnit doesn't have these following
                                            analyzeAssetMetaData.attackSurfaceBaseProtocol.push("");
                                            analyzeAssetMetaData.attackSurfaceAppProtocol.push([]);
                                            analyzeAssetMetaData.attackSurfaceSecurityProtocol.push([]);
                                            analyzeAssetMetaData.assetAccessTypeArray.push(assetCheck[1]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // the following if statement and for loop deal with feature chain started from a commLine and sensor input line
                if (featureChainInvolvedComponentFromCommLine.originating.includes(currentComponentInProjectById)) { // if current component is an originating component in feature chain
                    for (let [currentOriginatingCompIndex, currentOriginatingComp] of featureChainInvolvedComponentFromCommLine.originating.entries()) {
                        if (currentOriginatingComp == currentComponentInProjectById) {
                            let attackPathVar = featureChainInvolvedComponentFromCommLine.attackPath[currentOriginatingCompIndex];
                            let connectedComponentId = featureChainInvolvedComponentFromCommLine.attacked[currentOriginatingCompIndex];
                            let relevantAssetFeatureIndex = featureChainInvolvedComponentFromCommLine.featureIndexInAttacked[currentOriginatingCompIndex];
                            let affectedComponentId = featureChainInvolvedComponentFromCommLine.affected[currentOriginatingCompIndex];
                            // the following is to analyze threats according to the feature chain involved component
                            if (assetThreatMatrix[connectedComponentId]) { // if the component under attack was already analyzed before, add to it
                                for (let index = 0; index < projectById[connectedComponentId].asset.length; index++) { // for each asset
                                    let featureIndex = projectById[connectedComponentId].assetFeatureIndex[index];
                                    if (featureIndex == relevantAssetFeatureIndex) { // only check assets belong to the feature chain feature
                                        let assetItem = projectById[connectedComponentId].assetId[index];
                                        let assetType = projectById[connectedComponentId].assetType[index];
                                        let assetCheck = attackPathFunc.assetCheck(projectById, attackPathVar, connectedComponentId, assetItem, index, assetType);
                                        if (assetCheck[0]) { // analyze the asset if the associated feature is carried on the attack path
                                            if (assetThreatMatrix[connectedComponentId][assetItem]) { // if the asset already exist, only add to the threat array
                                                // analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                                // analyzeAssetMetaData.assetIdArray.push(assetItem);
                                                // analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                                // analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                            } else { // if the asset doesn't exist, create the new asset property with all contents
                                                assetThreatMatrix[connectedComponentId][assetItem] = {}; // initialize asset under component in assetThreatMatrix
                                                // assetThreatMatrix is structured: {componentId: {assetId: {property1: xxx, property2: xxx}}}
                                                Object.assign(assetThreatMatrix[connectedComponentId][assetItem], { // values don't need async functions
                                                    "asset": projectById[connectedComponentId].asset[index],
                                                    "assetType": projectById[connectedComponentId].assetType[index],
                                                    "assetSubType": projectById[connectedComponentId].assetSubType[index],
                                                    "fromFeatureIndex": projectById[connectedComponentId].assetFeatureIndex[index],
                                                    "fromFeature": projectById[connectedComponentId].feature[featureIndex],
                                                    "fromFeatureId": projectById[connectedComponentId].featureId[featureIndex],
                                                    "featureType": projectById[connectedComponentId].featureType[featureIndex],
                                                    "featureRole": projectById[connectedComponentId].featureRole[featureIndex],
                                                    "module": projectById[connectedComponentId].module,
                                                    "moduleId": projectById[connectedComponentId].id,
                                                    "moduleIdInDb": projectById[connectedComponentId].moduleIdInDb,
                                                    "nickName": projectById[connectedComponentId].nickName,
                                                    "type": projectById[connectedComponentId].type,
                                                    "attackSurface": projectById[connectedComponentId].attackSurface,
                                                    "isExpanded": false,
                                                    "notes": "",
                                                    "cybersecurityClaim": "",
                                                    "reviewed": false,
                                                    "reviewStatusForFilter": "to-review",
                                                    "threat": []
                                                });
                                            }
                                            analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                            analyzeAssetMetaData.assetIdArray.push(assetItem);
                                            analyzeAssetMetaData.assetTypeArray.push(projectById[connectedComponentId].assetType[index]);
                                            analyzeAssetMetaData.assetSubTypeArray.push(projectById[connectedComponentId].assetSubType[index]);
                                            analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                            analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                            analyzeAssetMetaData.attackSurfaceBaseProtocol.push(projectById[currentOriginatingComp].baseProtocol);
                                            analyzeAssetMetaData.attackSurfaceAppProtocol.push(projectById[currentOriginatingComp].appProtocol);
                                            analyzeAssetMetaData.attackSurfaceSecurityProtocol.push(projectById[currentOriginatingComp].secureProtocol);
                                            analyzeAssetMetaData.transmissionMedia.push(projectById[currentOriginatingComp].transmissionMedia);
                                            analyzeAssetMetaData.assetAccessTypeArray.push(assetCheck[1]);
                                        }
                                    }
                                }
                            } else { // if the component under attack was never analyzed, create a new property
                                assetThreatMatrix[connectedComponentId] = {}; // initialize component in assetThreatMatrix
                                if (projectById[connectedComponentId].asset) { // if assets are defined in this component
                                    for (let index = 0; index < projectById[connectedComponentId].asset.length; index++) { // for each asset
                                        let featureIndex = projectById[connectedComponentId].assetFeatureIndex[index];
                                        if (featureIndex == relevantAssetFeatureIndex) { // only check assets belong to the feature chain feature
                                            let assetItem = projectById[connectedComponentId].assetId[index];
                                            let assetType = projectById[connectedComponentId].assetType[index];
                                            let assetCheck = attackPathFunc.assetCheck(projectById, attackPathVar, connectedComponentId, assetItem, index, assetType);
                                            if (assetCheck[0]) { // analyze the asset if the associated feature is carried on the attack path
                                                assetThreatMatrix[connectedComponentId][assetItem] = {}; // initialize asset under component in assetThreatMatrix
                                                // assetThreatMatrix is structured: {componentId: {assetId: {property1: xxx, property2: xxx}}}
                                                Object.assign(assetThreatMatrix[connectedComponentId][assetItem], { // values don't need async functions
                                                    "asset": projectById[connectedComponentId].asset[index],
                                                    "assetType": projectById[connectedComponentId].assetType[index],
                                                    "assetSubType": projectById[connectedComponentId].assetSubType[index],
                                                    "fromFeatureIndex": projectById[connectedComponentId].assetFeatureIndex[index],
                                                    "fromFeature": projectById[connectedComponentId].feature[featureIndex],
                                                    "fromFeatureId": projectById[connectedComponentId].featureId[featureIndex],
                                                    "featureType": projectById[connectedComponentId].featureType[featureIndex],
                                                    "featureRole": projectById[connectedComponentId].featureRole[featureIndex],
                                                    "module": projectById[connectedComponentId].module,
                                                    "moduleId": projectById[connectedComponentId].id,
                                                    "moduleIdInDb": projectById[connectedComponentId].moduleIdInDb,
                                                    "nickName": projectById[connectedComponentId].nickName,
                                                    "type": projectById[connectedComponentId].type,
                                                    "attackSurface": projectById[connectedComponentId].attackSurface,
                                                    "isExpanded": false,
                                                    "notes": "",
                                                    "cybersecurityClaim": "",
                                                    "reviewed": false,
                                                    "reviewStatusForFilter": "to-review",
                                                    "threat": []
                                                });
                                                analyzeAssetMetaData.connectedComponentIdArray.push(connectedComponentId);
                                                analyzeAssetMetaData.assetIdArray.push(assetItem);
                                                analyzeAssetMetaData.assetTypeArray.push(projectById[connectedComponentId].assetType[index]);
                                                analyzeAssetMetaData.assetSubTypeArray.push(projectById[connectedComponentId].assetSubType[index]);
                                                analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                                                analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                                                analyzeAssetMetaData.attackSurfaceBaseProtocol.push(projectById[currentOriginatingComp].baseProtocol);
                                                analyzeAssetMetaData.attackSurfaceAppProtocol.push(projectById[currentOriginatingComp].appProtocol);
                                                analyzeAssetMetaData.attackSurfaceSecurityProtocol.push(projectById[currentOriginatingComp].secureProtocol);
                                                analyzeAssetMetaData.transmissionMedia.push(projectById[currentOriginatingComp].transmissionMedia);
                                                analyzeAssetMetaData.assetAccessTypeArray.push(assetCheck[1]);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // this following if statement and for loop are to deal with the attacking component itself, as itself is not included in the connectivity matrix
                let attackPathVar = [currentComponentInProjectById]; // initialize attack path variable for threats from the attacking component to itself
                if (assetThreatMatrix[currentComponentInProjectById]) { // if the component already exists in the assetThreatMatrix
                    // error handling for users
                    if (projectById[currentComponentInProjectById].type == "commLine") {
                        checkMissingRequiredSetting(projectById[currentComponentInProjectById].transmissionMedia,
                            projectById[currentComponentInProjectById].nickName, "Transmission Media");
                        checkMissingRequiredSetting(projectById[currentComponentInProjectById].baseProtocol,
                            projectById[currentComponentInProjectById].nickName, "Base Protocol");
                    }
                    if (projectById[currentComponentInProjectById].asset) { // if the asset exists
                        for (let index = 0; index < projectById[currentComponentInProjectById].asset.length; index++) { // for each asset
                            let featureIndex = projectById[currentComponentInProjectById].assetFeatureIndex[index];
                            let assetItem = projectById[currentComponentInProjectById].assetId[index];
                            let assetType = projectById[currentComponentInProjectById].assetType[index];
                            // below is just to get the assetAccessType
                            let assetAccessType = attackPathFunc.returnTrueAndAccessTypeByAssetType(assetType);
                            if (assetThreatMatrix[currentComponentInProjectById][assetItem]) { // if the asset already exist, only add to the threat array

                            } else { // if the asset doesn't exist, create the new asset property with all contents
                                assetThreatMatrix[currentComponentInProjectById][assetItem] = {};
                                Object.assign(assetThreatMatrix[currentComponentInProjectById][assetItem], { // values don't need async functions
                                    "asset": projectById[currentComponentInProjectById].asset[index],
                                    "assetType": projectById[currentComponentInProjectById].assetType[index],
                                    "assetSubType": projectById[currentComponentInProjectById].assetSubType[index],
                                    "fromFeatureIndex": projectById[currentComponentInProjectById].assetFeatureIndex[index],
                                    "fromFeature": projectById[currentComponentInProjectById].feature[featureIndex],
                                    "fromFeatureId": projectById[currentComponentInProjectById].featureId[featureIndex],
                                    "featureType": projectById[currentComponentInProjectById].featureType[featureIndex],
                                    "featureRole": projectById[currentComponentInProjectById].featureRole[featureIndex],
                                    "module": projectById[currentComponentInProjectById].module,
                                    "moduleId": projectById[currentComponentInProjectById].id,
                                    "moduleIdInDb": projectById[currentComponentInProjectById].moduleId,
                                    "moduleIdInDb": projectById[currentComponentInProjectById].moduleIdInDb,
                                    "nickName": projectById[currentComponentInProjectById].nickName,
                                    "type": projectById[currentComponentInProjectById].type,
                                    "attackSurface": projectById[currentComponentInProjectById].attackSurface,
                                    "isExpanded": false,
                                    "notes": "",
                                    "cybersecurityClaim": "",
                                    "reviewed": false,
                                    "reviewStatusForFilter": "to-review",
                                    "threat": []
                                });
                            }
                            analyzeAssetMetaData.connectedComponentIdArray.push(currentComponentInProjectById);
                            analyzeAssetMetaData.assetIdArray.push(assetItem);
                            analyzeAssetMetaData.assetTypeArray.push(projectById[currentComponentInProjectById].assetType[index]);
                            analyzeAssetMetaData.assetSubTypeArray.push(projectById[currentComponentInProjectById].assetSubType[index]);
                            analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                            analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                            if (projectById[currentComponentInProjectById].type == "commLine") { // if a commLine is the attack surface of itself
                                analyzeAssetMetaData.attackSurfaceBaseProtocol.push(projectById[currentComponentInProjectById].baseProtocol);
                                analyzeAssetMetaData.attackSurfaceAppProtocol.push(projectById[currentComponentInProjectById].appProtocol);
                                analyzeAssetMetaData.attackSurfaceSecurityProtocol.push(projectById[currentComponentInProjectById].secureProtocol);
                                analyzeAssetMetaData.transmissionMedia.push(projectById[currentComponentInProjectById].transmissionMedia);
                            } else { // if a non-commLine component is the attack surface of itself, record empty string and empty array
                                analyzeAssetMetaData.attackSurfaceBaseProtocol.push("");
                                analyzeAssetMetaData.attackSurfaceAppProtocol.push([]);
                                analyzeAssetMetaData.attackSurfaceSecurityProtocol.push([]);
                                analyzeAssetMetaData.transmissionMedia.push(projectById[currentComponentInProjectById].transmissionMedia);
                            }
                            analyzeAssetMetaData.assetAccessTypeArray.push(assetAccessType[1]);
                        };
                    } else { // if the attack surface component doesn't have asset, do nothing

                    }
                } else { // initialize the property if the component was not created
                    // console.log(`projectById[currentComponentInProjectById].asset is ${projectById[currentComponentInProjectById].asset}`)
                    assetThreatMatrix[currentComponentInProjectById] = {};
                    // error handling for users
                    if (projectById[currentComponentInProjectById].type == "commLine") {
                        checkMissingRequiredSetting(projectById[currentComponentInProjectById].transmissionMedia,
                            projectById[currentComponentInProjectById].nickName, "Transmission Media");
                        checkMissingRequiredSetting(projectById[currentComponentInProjectById].baseProtocol,
                            projectById[currentComponentInProjectById].nickName, "Base Protocol");
                    }
                    if (projectById[currentComponentInProjectById].asset) { // if assets are defined in this component
                        for (let index = 0; index < projectById[currentComponentInProjectById].asset.length; index++) { // for each asset
                            // console.log(`asset being processed is ${projectById[currentComponentInProjectById].asset[index]}`);
                            // console.dir(projectById[currentComponentInProjectById])
                            let assetItem = projectById[currentComponentInProjectById].assetId[index];
                            let assetType = projectById[currentComponentInProjectById].assetType[index];
                            // below is just to get the assetAccessType
                            let assetAccessType = attackPathFunc.returnTrueAndAccessTypeByAssetType(assetType);
                            assetThreatMatrix[currentComponentInProjectById][assetItem] = {};
                            featureIndex = projectById[currentComponentInProjectById].assetFeatureIndex[index];
                            Object.assign(assetThreatMatrix[currentComponentInProjectById][assetItem], { // values don't need async functions
                                "asset": projectById[currentComponentInProjectById].asset[index],
                                "assetType": projectById[currentComponentInProjectById].assetType[index],
                                "assetSubType": projectById[currentComponentInProjectById].assetSubType[index],
                                "fromFeatureIndex": projectById[currentComponentInProjectById].assetFeatureIndex[index],
                                "fromFeature": projectById[currentComponentInProjectById].feature[featureIndex],
                                "fromFeatureId": projectById[currentComponentInProjectById].featureId[featureIndex],
                                "featureType": projectById[currentComponentInProjectById].featureType[featureIndex],
                                "featureRole": projectById[currentComponentInProjectById].featureRole[featureIndex],
                                "module": projectById[currentComponentInProjectById].module,
                                "moduleId": projectById[currentComponentInProjectById].id,
                                "moduleIdInDb": projectById[currentComponentInProjectById].moduleIdInDb,
                                "nickName": projectById[currentComponentInProjectById].nickName,
                                "type": projectById[currentComponentInProjectById].type,
                                "attackSurface": projectById[currentComponentInProjectById].attackSurface,
                                "isExpanded": false,
                                "notes": "",
                                "cybersecurityClaim": "",
                                "reviewed": false,
                                "reviewStatusForFilter": "to-review",
                                "threat": []
                            });
                            analyzeAssetMetaData.connectedComponentIdArray.push(currentComponentInProjectById);
                            analyzeAssetMetaData.assetIdArray.push(assetItem);
                            analyzeAssetMetaData.assetTypeArray.push(projectById[currentComponentInProjectById].assetType[index]);
                            analyzeAssetMetaData.assetSubTypeArray.push(projectById[currentComponentInProjectById].assetSubType[index]);
                            analyzeAssetMetaData.featureIndexArray.push(featureIndex);
                            analyzeAssetMetaData.attackPathVarArray.push(attackPathVar);
                            if (projectById[currentComponentInProjectById].type == "commLine") { // if a commLine is the attack surface of itself
                                analyzeAssetMetaData.attackSurfaceBaseProtocol.push(projectById[currentComponentInProjectById].baseProtocol);
                                analyzeAssetMetaData.attackSurfaceAppProtocol.push(projectById[currentComponentInProjectById].appProtocol);
                                analyzeAssetMetaData.attackSurfaceSecurityProtocol.push(projectById[currentComponentInProjectById].secureProtocol);
                                analyzeAssetMetaData.transmissionMedia.push(projectById[currentComponentInProjectById].transmissionMedia);
                            } else { // if a non-commLine component is the attack surface of itself, record empty string and empty array
                                analyzeAssetMetaData.attackSurfaceBaseProtocol.push("");
                                analyzeAssetMetaData.attackSurfaceAppProtocol.push([]);
                                analyzeAssetMetaData.attackSurfaceSecurityProtocol.push([]);
                                analyzeAssetMetaData.transmissionMedia.push(projectById[currentComponentInProjectById].transmissionMedia);
                            }
                            analyzeAssetMetaData.assetAccessTypeArray.push(assetAccessType[1]);
                        };
                    }
                }
            }
        }
        // console.log(analyzeAssetMetaData.assetAccessTypeArray)
        // console.dir(assetThreatMatrix);
        // console.log(`analyzeAssetMetaData.assetIdArray.length is ${analyzeAssetMetaData.assetIdArray.length}`)
        // console.dir(analyzeAssetMetaData)
        // assetThreatMatrix won't have any key if no attack surface is defined
        if (Object.keys(assetThreatMatrix).length == 0) {
            const errorMsg = `No threat is found. Maybe you forgot to define any attack surface.`;
            throw new Error(errorMsg);
        }
        // analyzeAssetMetaData won't have any data if attack surface is defined, but no asset is accessible from the attack surface
        if (analyzeAssetMetaData.assetIdArray.length == 0) {
            const errorMsg = `No threat is found. Maybe you forgot the required settings for communication lines or sensor input lines, or maybe the attack surface micro or 
                module doesn't have an asset assigned.`;
            throw new Error(errorMsg);
        }
        assetThreatMatrix = await groupThreatScenario(assetThreatMatrix, analyzeAssetMetaData.connectedComponentIdArray, analyzeAssetMetaData.assetIdArray,
            projectById, analyzeAssetMetaData.featureIndexArray, analyzeAssetMetaData.attackPathVarArray, analyzeAssetMetaData.attackSurfaceBaseProtocol,
            analyzeAssetMetaData.attackSurfaceAppProtocol, analyzeAssetMetaData.attackSurfaceSecurityProtocol, analyzeAssetMetaData.transmissionMedia,
            analyzeAssetMetaData.assetTypeArray, analyzeAssetMetaData.assetSubTypeArray, analyzeAssetMetaData.assetAccessTypeArray, systemConfigData, userCallFlag);
        assetThreatMatrix = await impactFunc.analyzeGroupImpact(assetThreatMatrix, analyzeAssetMetaData.connectedComponentIdArray, analyzeAssetMetaData.assetIdArray,
            projectById, systemConfigData); // analyze impact
        assetThreatTable = await objOperation.convertAssetThreatMatrixToTable(assetThreatMatrix); // convert each threat to a row for better table display
        // console.dir(assetThreatTable);
        // assetThreatTable.forEach((row, index) => { // calculate risk level
        //     let impact = impactFunc.impactAggregation(row.impactSLevel, row.impactFLevel, row.impactOLevel, row.impactPLevel, systemConfigData);
        //     row.riskLevel = riskFunc.calculateRiskFromMatrix(impact, row.attackFeasibilityLevel, systemConfigData);
        //     // if (Math.max(row.impactF, row.impactO, row.impactP, row.impactS) && row.attackFeasibility) {
        //     //     // row.riskScore = Math.round(100*Math.max(row.impactF, row.impactO, row.impactP, row.impactS)/row.attackFeasibility);
        //     //     row.riskScore = Math.max(row.impactF, row.impactO, row.impactP, row.impactS)*((43-row.attackFeasibility)/43)
        //     // }
        // });
        // assetThreatTable.sort((a, b) => (a.riskLevel < b.riskLevel) ? 1 : -1); // sort the threats by riskLevel, descending
        return [assetThreatMatrix, assetThreatTable, systemConfigData];
    } catch (err) {
        console.log(`analyzeAssetPreProcess err: ${err.stack}`);
        throw Error(err);
    }
}
module.exports.mainAlgoMainProcess = mainAlgoMainProcess;

function orderThreatSequence(assetThreatTable, systemConfigData) {
    assetThreatTable.forEach((row, index) => { // calculate risk level
        if (row.treatment == "no treatment") {
            if (row.impactSLevel && row.impactFLevel && row.impactOLevel && row.impactPLevel && row.attackFeasibilityLevel) {
                let impact = impactFunc.impactAggregation(row.impactSLevel, row.impactFLevel, row.impactOLevel, row.impactPLevel, systemConfigData);
                row.riskLevel = riskFunc.calculateRiskFromMatrix(impact, row.attackFeasibilityLevel, systemConfigData);
            } else {
                row.riskLevel = systemConfigData.riskMatrix[0][0][0]; // max risk level in default risk determination method (symmetric), which should be 5
                row.notes = "Alert from threat engine: Please evaluate the risk rating of this threat carefully." + new Date().toISOString();

            }
        } else {
            if (row.impactSLevelAfter && row.impactFLevelAfter && row.impactOLevelAfter && row.impactPLevelAfter && row.attackFeasibilityLevelAfter) {
                let impact = impactFunc.impactAggregation(row.impactSLevelAfter, row.impactFLevelAfter, row.impactOLevelAfter, row.impactPLevelAfter, systemConfigData);
                row.riskLevel = riskFunc.calculateRiskFromMatrix(impact, row.attackFeasibilityLevelAfter, systemConfigData);
            } else {
                if (row.riskLevel) {

                } else {
                    row.riskLevel = systemConfigData.riskMatrix[0][0][0]; // max risk level in default risk determination method (symmetric), which should be 5
                    row.notes = "Alert from threat engine: Please evaluate the risk rating of this threat carefully." + new Date().toISOString();
                }
            }
        }

    });
    assetThreatTable.sort((a, b) => (a.riskLevel < b.riskLevel) ? 1 : -1); // sort the threats by riskLevel, descending
    for (let i = 1; i <= assetThreatTable.length; i++) {
        assetThreatTable[i - 1].threatRowNumber = i;
    }
    return assetThreatTable;
}
module.exports.orderThreatSequence = orderThreatSequence;

// schema { comp_1:
//              { asset_1: ,
//                  assetType: ,
//                  fromFeature: ,
//                  featureType: ,
//                  featureRole: ,
//                  module: ,
//                  message?: ,
//                  threat: [{
//                              threatId: ,
//                              securityPropertyCia: ,
//                              securityPropertyStride: ,
//                              subType: ,
//                              threatScenario: ,
//                              strideType: ,
//                              CWE: ,
//                              CVE: ,
//                              attackPath: {componentId: protocol, },
//                              attackFeasibility: ,
//                          }, ],
//                   impactS: ,
//                   impactF: ,
//                   impactO: ,
//                   impactP: ,
//              },
//          }



async function checkUserAddedThreat(project) {
    let idArray = [];
    // collect all features
    if (project.micro.length > 0) {
        project.micro.forEach(element => {
            Array.prototype.push.apply(idArray, element.featureId);
        });
    }
    if (project.controlUnit.length > 0) {
        project.controlUnit.forEach(element => {
            Array.prototype.push.apply(idArray, element.featureId);
        });
    }
    if (project.commLine.length > 0) {
        project.commLine.forEach(element => {
            Array.prototype.push.apply(idArray, element.featureId);
        });
    }
    // remove duplicated features
    let filteredIdArray = [...new Set(idArray)];
    // console.log(`filteredIdArray is ${filteredIdArray}`)
    const userAddedThreatArray = await httpService.getUserAddedThreat(filteredIdArray); // return user added threats
    return userAddedThreatArray
}
module.exports.checkUserAddedThreat = checkUserAddedThreat;

function checkMissingRequiredSetting(inputData, componentName, settingName) {
    // console.log(`inputData is ${inputData} when componentName is ${componentName} and settingName is ${settingName}`);
    if (!inputData) {
        errorHandlerMissingSetting(componentName, settingName)
    }
}

function errorHandlerMissingSetting(componentName, settingName) {
    const errorMsg = `Setting ` + settingName + ` in ` + componentName + ` is missing. Please complete all required settings.`;
    throw new Error(errorMsg);
}