const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");

    // schema { comp_1:
    //              { asset_1: ,
    //                  assetType: ,
    //                  fromFeature: ,
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
    //              },
    //          }

function analyzeFeasibility(threatFeaItem, strideIndex, systemConfigData, OpEnvVar) {
    let score = 0;
    let level = systemConfigData.feasibilityLevelName[0]; // High
    // use environment variable to replace CVSSVector and attackVector from database
    let CVSSVector = 0;
    let trueAV = "";
    // console.log(`OpEnvVar.attackVector is ${OpEnvVar.attackVector}`)
    switch (OpEnvVar.attackVector) {
        case systemConfigData.feasibilityRatingAV[0][0]: // Network
            CVSSVector = 0.85;
            trueAV = systemConfigData.feasibilityRatingAV[1][0];
            break;
        case systemConfigData.feasibilityRatingAV[0][1]: // Adjacent
            CVSSVector = 0.6;
            trueAV = systemConfigData.feasibilityRatingAV[1][1];
            break;
        case systemConfigData.feasibilityRatingAV[0][2]: // Local
            CVSSVector = 0.4;
            trueAV = systemConfigData.feasibilityRatingAV[1][2];
            break;
        case systemConfigData.feasibilityRatingAV[0][3]: // Physical
            CVSSVector = 0.2;
            trueAV = systemConfigData.feasibilityRatingAV[1][3];
            break;
        default:
            if (threatFeaItem[strideIndex].CVSSVector) {
                CVSSVector = threatFeaItem[strideIndex].CVSSVector;
            } else {

            }
            trueAV = "";
    };
    switch (systemConfigData.feasibilityMethod) {
        case "Attack Potential":
            score = threatFeaItem[strideIndex].knowledge + threatFeaItem[strideIndex].expertise + threatFeaItem[strideIndex].equipment
                + threatFeaItem[strideIndex].elapsed + threatFeaItem[strideIndex].window;
            if (score<=systemConfigData.feasibilityRatingAP[0]) {
                level = systemConfigData.feasibilityLevelName[0]; // High
            } else if (score<=systemConfigData.feasibilityRatingAP[1]) {
                level = systemConfigData.feasibilityLevelName[1]; // Medium
            } else if (score<=systemConfigData.feasibilityRatingAP[2]) {
                level = systemConfigData.feasibilityLevelName[2]; // Low
            } else {
                level = systemConfigData.feasibilityLevelName[3]; // Very Low
            }
            break;
        case "Attack Vector":
            score = threatFeaItem[strideIndex].CVSSVector;
            switch (OpEnvVar.attackVector) {
                case systemConfigData.feasibilityRatingAV[0][0]: // Network
                    level = systemConfigData.feasibilityRatingAV[1][0];
                    break;
                case systemConfigData.feasibilityRatingAV[0][1]: // Adjacent
                    level = systemConfigData.feasibilityRatingAV[1][1];
                    break;
                case systemConfigData.feasibilityRatingAV[0][2]: // Local
                    level = systemConfigData.feasibilityRatingAV[1][2];
                    break;
                case systemConfigData.feasibilityRatingAV[0][3]: // Physical
                    level = systemConfigData.feasibilityRatingAV[1][3];
                    break;
            };
            break;
        case "CVSS":
            score = 8.22 * CVSSVector * threatFeaItem[strideIndex].CVSSPrivilege * threatFeaItem[strideIndex].CVSSComplexity
                * threatFeaItem[strideIndex].CVSSUser;
            if (score>=systemConfigData.feasibilityRatingCVSS[0]) {
                level = systemConfigData.feasibilityLevelName[0]; // High
            } else if (score>=systemConfigData.feasibilityRatingCVSS[1]) {
                level = systemConfigData.feasibilityLevelName[1]; // Medium
            } else if (score>=systemConfigData.feasibilityRatingCVSS[2]) {
                level = systemConfigData.feasibilityLevelName[2]; // Low
            } else {
                level = systemConfigData.feasibilityLevelName[3]; // Very Low
            }
            break;
        case "custom": // not configurable in front end
            score = threatFeaItem[strideIndex].knowledge + threatFeaItem[strideIndex].expertise + threatFeaItem[strideIndex].equipment
                + threatFeaItem[strideIndex].elapsed + threatFeaItem[strideIndex].window;
            break;
        default: // default is attack potential method as defined in ISO 21434
            score = threatFeaItem[strideIndex].knowledge + threatFeaItem[strideIndex].expertise + threatFeaItem[strideIndex].equipment
                + threatFeaItem[strideIndex].elapsed + threatFeaItem[strideIndex].window;
    }
    return [score, level, CVSSVector, trueAV];
}
module.exports.analyzeFeasibility = analyzeFeasibility;


