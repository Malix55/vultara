const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");

// call risk level by symmetricRiskMatrix[ind_1][ind_2]. ind_1 impact, ind_2 feasibility. [high to low] is [0 to 3]
// symmetricRiskMatrix = [[5, 4, 3, 1], [4, 3, 2, 1], [3, 2, 2, 1], [1, 1, 1, 1]];
// asymmetricRiskMatrix = [[5, 4, 3, 2], [4, 3, 3, 2], [3, 2, 2, 2], [2, 1, 1, 1]];
// lowRiskProfileRiskMatrix = [[3, 3, 2, 1], [3, 2, 2, 1], [2, 2, 1, 1], [1, 1, 1, 1]];
function calculateRiskFromMatrix(impact, feasibility, systemConfigData) { // risk determination function
    const impactLevelName = systemConfigData.impactLevelName;
    const feasibilityLevelName = systemConfigData.feasibilityLevelName;
    const impactIndex = impactLevelName.indexOf(impact);
    const feasibilityIndex = feasibilityLevelName.indexOf(feasibility);
    let riskMatrixName = systemConfigData.riskMethod;
    let riskMatrixNameIndex = systemConfigData.riskMethodMapping.indexOf(riskMatrixName);
    let riskMatrix = systemConfigData.riskMatrix[riskMatrixNameIndex];
    // console.log(riskMatrix)
    // console.log(impactIndex)
    // console.log(feasibilityIndex)
    return riskMatrix[impactIndex][feasibilityIndex]
}
module.exports.calculateRiskFromMatrix = calculateRiskFromMatrix;
