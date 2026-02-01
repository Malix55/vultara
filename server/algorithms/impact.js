const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");

function impactAggregation(S, F, O, P, systemConfigData) { // impact aggregation function. take the most severe impact among the four.
    let impactLevelName = systemConfigData.impactLevelName;
    if (systemConfigData.impactAggMethod == "mostSevere") {
      let aggregatedImpactIndex = Math.min(impactLevelName.indexOf(S), impactLevelName.indexOf(F), impactLevelName.indexOf(O), impactLevelName.indexOf(P));
      let aggregatedImpact = impactLevelName[aggregatedImpactIndex];
      return aggregatedImpact
    }
}
module.exports.impactAggregation = impactAggregation;

function analyzeImpact(featureImpactResponse) {
    impactS = featureImpactResponse.safety;
    impactF = featureImpactResponse.financial;
    impactO = featureImpactResponse.operational;
    impactP = featureImpactResponse.privacy;
    return [impactS, impactF, impactO, impactP];
}
module.exports.analyzeImpact = analyzeImpact;

const impactScale = [8, 5, 3];
// not used
function analyzeImpactLevel(impactScore) {
    let impactLevel = {
        S: "",
        F: "",
        O: "",
        P: ""
    };
    if (impactScore.safety>impactScale[0]) {
        impactLevel.S = "Severe"
    } else if (impactScore.safety>impactScale[1]) {
        impactLevel.S = "Major"
    } else if (impactScore.safety>impactScale[2]) {
        impactLevel.S = "Moderate"
    } else {
        impactLevel.S = "Negligible"
    }

    if (impactScore.financial>impactScale[0]) {
        impactLevel.F = "Severe"
    } else if (impactScore.financial>impactScale[1]) {
        impactLevel.F = "Major"
    } else if (impactScore.financial>impactScale[2]) {
        impactLevel.F = "Moderate"
    } else {
        impactLevel.F = "Negligible"
    }

    if (impactScore.operational>impactScale[0]) {
        impactLevel.O = "Severe"
    } else if (impactScore.operational>impactScale[1]) {
        impactLevel.O = "Major"
    } else if (impactScore.operational>impactScale[2]) {
        impactLevel.O = "Moderate"
    } else {
        impactLevel.O = "Negligible"
    }

    if (impactScore.privacy>impactScale[0]) {
        impactLevel.P = "Severe"
    } else if (impactScore.privacy>impactScale[1]) {
        impactLevel.P = "Major"
    } else if (impactScore.privacy>impactScale[2]) {
        impactLevel.P = "Moderate"
    } else {
        impactLevel.P = "Negligible"
    }

    return impactLevel;
}
module.exports.analyzeImpactLevel = analyzeImpactLevel;

// this function is not used, as impact levels from database are directly used.
function analyzeGroupImpactLevel(impactScore, systemConfigData) {
    let impactLevel = {
        S: "",
        F: "",
        O: "",
        P: ""
    };
    if (impactScore.safety>impactScale[0]) {
        impactLevel.S = systemConfigData.impactLevelName[0]; // Severe
    } else if (impactScore.safety>impactScale[1]) {
        impactLevel.S = systemConfigData.impactLevelName[1]; // Major
    } else if (impactScore.safety>impactScale[2]) {
        impactLevel.S = systemConfigData.impactLevelName[2]; // Moderate
    } else {
        impactLevel.S = systemConfigData.impactLevelName[3]; // Negligible
    }

    if (impactScore.financial>impactScale[0]) {
        impactLevel.F = systemConfigData.impactLevelName[0]; // Severe
    } else if (impactScore.financial>impactScale[1]) {
        impactLevel.F = systemConfigData.impactLevelName[1]; // Major
    } else if (impactScore.financial>impactScale[2]) {
        impactLevel.F = systemConfigData.impactLevelName[2]; // Moderate
    } else {
        impactLevel.F = systemConfigData.impactLevelName[3]; // Negligible
    }

    if (impactScore.operational>impactScale[0]) {
        impactLevel.O = systemConfigData.impactLevelName[0]; // Severe
    } else if (impactScore.operational>impactScale[1]) {
        impactLevel.O = systemConfigData.impactLevelName[1]; // Major
    } else if (impactScore.operational>impactScale[2]) {
        impactLevel.O = systemConfigData.impactLevelName[2]; // Moderate
    } else {
        impactLevel.O = systemConfigData.impactLevelName[3]; // Negligible
    }

    if (impactScore.privacy>impactScale[0]) {
        impactLevel.P = systemConfigData.impactLevelName[0]; // Severe
    } else if (impactScore.privacy>impactScale[1]) {
        impactLevel.P = systemConfigData.impactLevelName[1]; // Major
    } else if (impactScore.privacy>impactScale[2]) {
        impactLevel.P = systemConfigData.impactLevelName[2]; // Moderate
    } else {
        impactLevel.P = systemConfigData.impactLevelName[3]; // Negligible
    }

    return impactLevel;
}
module.exports.analyzeGroupImpactLevel = analyzeGroupImpactLevel;

// impact analysis for group operation
async function analyzeGroupImpact(assetThreatMatrix, connectedComponentIdArray, assetIdArray, projectById, systemConfigData) {
    try {
        let moduleArray = [];
        let fromFeatureArray = [];
        let moduleIdArray = [];
        let featureIdArray = [];
        // console.log(`connectedComponentIdArray is ${connectedComponentIdArray}`);
        // console.log(`assetThreatMatrix is `);
        // console.dir(assetThreatMatrix);

        for (let [index, currentComponent] of connectedComponentIdArray.entries()) {
            moduleArray.push(assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].module);
            fromFeatureArray.push(assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].fromFeature);
            moduleIdArray.push(assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].moduleIdInDb);
            featureIdArray.push(assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].fromFeatureId);
        }
        // console.log(`analyzeGroupImpact() started`)
        // console.log(`moduleIdArray is ${moduleIdArray}`);
        // console.log(`featureIdArray is ${featureIdArray}`);
        const impactScore = await httpService.getGroupImpact(moduleIdArray, featureIdArray, moduleArray, fromFeatureArray);
        // console.log(`impactScore is `);
        // console.dir(impactScore);
        for (let [index, currentComponent] of connectedComponentIdArray.entries()) {
            // console.log(`module is ${moduleArray[index]}, feature is ${fromFeatureArray[index]}`)
            // console.log(`moduleId is ${moduleIdArray[index]}, featureId is ${featureIdArray[index]}`)
            let currentImpactScoreObj = objOperation.findObjectByTwoPropertyValues(impactScore, "moduleId", moduleIdArray[index], "featureId", featureIdArray[index]);
            // console.log(`currentImpactScoreObj is `);
            // console.dir(currentImpactScoreObj, {depth: null});
            if (currentImpactScoreObj.featureImpactObj) { // if a match is found
                // console.log(`currentImpactScoreObj.featureImpactObj is `);
                // console.dir(currentImpactScoreObj.featureImpactObj, {depth: null});
                Object.assign(assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]], {
                    "impactS": currentImpactScoreObj.featureImpactObj.safety,
                    "impactF": currentImpactScoreObj.featureImpactObj.financial,
                    "impactO": currentImpactScoreObj.featureImpactObj.operational,
                    "impactP": currentImpactScoreObj.featureImpactObj.privacy,
                    "impactSLevel": currentImpactScoreObj.featureImpactObj.SLevel,
                    "impactFLevel": currentImpactScoreObj.featureImpactObj.FLevel,
                    "impactOLevel": currentImpactScoreObj.featureImpactObj.OLevel,
                    "impactPLevel": currentImpactScoreObj.featureImpactObj.PLevel,
                    "damageScenario": currentImpactScoreObj.featureImpactObj.damageScenario,
                    });
                // console.dir(assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]], {depth: null});
            } else { // if no match is found
                Object.assign(assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]], {
                    "impactS": 10,
                    "impactF": 10,
                    "impactO": 10,
                    "impactP": 10,
                    "impactSLevel": systemConfigData.impactLevelName[0], // default to "Severe"
                    "impactFLevel": systemConfigData.impactLevelName[0], // default to "Severe"
                    "impactOLevel": systemConfigData.impactLevelName[0], // default to "Severe"
                    "impactPLevel": systemConfigData.impactLevelName[0], // default to "Severe"
                    "damageScenario": "Impact of this feature in this module is not defined in the database! All impact levels are defaulted to Severe.",
                    });
            }
        }
        for (let [index, currentComponent] of connectedComponentIdArray.entries()) { // re-run the loop to find commLine component. use the max impact of the connect components as the impact for the commLine
            if (assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].featureRole == "conveyor") { // if no match is found, and it is a commLine component, use the highest impact of its connected components
                // console.log(`module ${moduleArray[index]} has the feature ${fromFeatureArray[index]} in conveyor feature role`)
                let impactContainer = [0, 0, 0, 0]; // array of four numbers. scores for S, F, O, P
                let impactLevelContainerNum = [0, 0, 0, 0]; // array of four numbers. scores for SLevel, FLevel, OLevel, PLevel
                let impactLevelContainer = ["", "", "", ""]; // array of four strings. levels for S, F, O, P
                let impactLevelEnum = {
                    Severe: 3,
                    Major: 2,
                    Moderate: 1,
                    Negligible: 0,
                };
                let damageScenarioContainer = "damage scenario is not available in the database";
                let impactOriginCompAssFea = [connectedComponentIdArray[index], assetIdArray[index], assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].fromFeature];
                projectById[connectedComponentIdArray[index]].terminalComponentId.forEach((connectedComponentId, conCompIndex) => { // loop through each connected component
                    let connectedComponentFeature = projectById[connectedComponentIdArray[index]].terminalComponentFeature;
                    let connectedComponentFeatureIndex = projectById[connectedComponentIdArray[index]].terminalComponentFeatureIndex;
                    if (connectedComponentFeature[conCompIndex]) { // if the feature sub-array is not an empty array
                        // this and the next loop are to find the SFOP impacts of the feature on this connected component
                        for (let [connectedFeatureIndex, connectedFeature] of connectedComponentFeature[conCompIndex].entries()) {
                            for (let currentAsset of Object.keys(assetThreatMatrix[connectedComponentId])) {
                                // only need to find one match, because the impacts of any asset in that feature are the same
                                if (assetThreatMatrix[connectedComponentId][currentAsset].fromFeatureIndex == connectedComponentFeatureIndex[conCompIndex][connectedFeatureIndex]) {
                                    let tempImpactContainer = [assetThreatMatrix[connectedComponentId][currentAsset].impactS,
                                    assetThreatMatrix[connectedComponentId][currentAsset].impactF, assetThreatMatrix[connectedComponentId][currentAsset].impactO,
                                    assetThreatMatrix[connectedComponentId][currentAsset].impactP]; // temporary container for comparison
                                    if (Math.max(...tempImpactContainer)>Math.max(...impactContainer)) { // pick the feature with higher max impact
                                        impactContainer = tempImpactContainer.slice(0);
                                        impactOriginCompAssFea = [connectedComponentId, currentAsset, connectedFeature];
                                        damageScenarioContainer = assetThreatMatrix[connectedComponentId][currentAsset].damageScenario;
                                    }
                                    let tempImpactLevelContainer = [impactLevelEnum[assetThreatMatrix[connectedComponentId][currentAsset].impactSLevel],
                                        impactLevelEnum[assetThreatMatrix[connectedComponentId][currentAsset].impactFLevel],
                                        impactLevelEnum[assetThreatMatrix[connectedComponentId][currentAsset].impactOLevel],
                                        impactLevelEnum[assetThreatMatrix[connectedComponentId][currentAsset].impactPLevel]]; // temporary container for comparison
                                    if (Math.max(...tempImpactLevelContainer)>Math.max(...impactLevelContainerNum)) { // pick the feature with higher max impact
                                        impactLevelContainer = [assetThreatMatrix[connectedComponentId][currentAsset].impactSLevel,
                                            assetThreatMatrix[connectedComponentId][currentAsset].impactFLevel,
                                            assetThreatMatrix[connectedComponentId][currentAsset].impactOLevel,
                                            assetThreatMatrix[connectedComponentId][currentAsset].impactPLevel];
                                        impactLevelContainerNum = tempImpactLevelContainer.slice(0);
                                        impactOriginCompAssFea = [connectedComponentId, currentAsset, connectedFeature];
                                        damageScenarioContainer = assetThreatMatrix[connectedComponentId][currentAsset].damageScenario;
                                    }
                                    break
                                }
                            }
                        }
                    }
                })
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactS = impactContainer[0];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactF = impactContainer[1];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactO = impactContainer[2];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactP = impactContainer[3];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactSLevel = impactLevelContainer[0];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactFLevel = impactLevelContainer[1];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactOLevel = impactLevelContainer[2];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactPLevel = impactLevelContainer[3];
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].damageScenario = "Worst case damage scenario is from adjacent component " +
                    assetThreatMatrix[impactOriginCompAssFea[0]][impactOriginCompAssFea[1]].nickName + ", and its asset " + assetThreatMatrix[impactOriginCompAssFea[0]][impactOriginCompAssFea[1]].asset
                    + ": " + damageScenarioContainer;
                assetThreatMatrix[connectedComponentIdArray[index]][assetIdArray[index]].impactOriginCompAssFea = impactOriginCompAssFea;
            }
        }
        return assetThreatMatrix;
    } catch (err) {
        console.log(err);
    }
};
module.exports.analyzeGroupImpact = analyzeGroupImpact;