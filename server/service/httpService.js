// const fetch = require("node-fetch");
// node-fetch from v3 is an ESM-only module - you are not able to import it with require(). 
// Threrefore, we are using a hack to import it asynchronously.
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { ACCESS_TOKEN, APPServerHTTPURL, ReportServerHTTPURL, APPServerRootHTTPURL } = require("../config");
require('dotenv').config({ path: __dirname + '/./../.env' });

// get a group of asset types from assetLib collection
async function getGroupAssetType(groupAsset) {
    const reqBody = {
        id: groupAsset,
    };
    const urlAssetLib = APPServerHTTPURL + "groupAssetById";
    let response = await fetch(urlAssetLib, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        },
        body: JSON.stringify(reqBody),
    })
    let result = await response.json();
    // console.log(`result is `);
    // console.dir(result);
    return result
};
module.exports.getGroupAssetType = getGroupAssetType;

// get a group of threat scenarios from threatLibStride collection
async function getGroupThreatScenario(groupAssetType) {
    const reqBody = {
        assetType: groupAssetType,
    };
    const urlThreatLibStride = APPServerHTTPURL + "groupThreatLibStride";
    let response = await fetch(urlThreatLibStride, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        },
        body: JSON.stringify(reqBody),
    })
    let result = await response.json();
    // console.log(`result is `);
    // console.dir(result);
    return result
};
module.exports.getGroupThreatScenario = getGroupThreatScenario;

// get a group of threat feasibility numbers from threatFeasibilityLib collection
async function getGroupThreatFeasibility(assetTypeArray, assetSubTypeArray) {
    const reqBody = {
        assetType: assetTypeArray,
        subType: assetSubTypeArray,
    };
    const urlThreatFeasibilityLib = APPServerHTTPURL + "groupThreatFeasibilityLib";
    let response = await fetch(urlThreatFeasibilityLib, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        },
        body: JSON.stringify(reqBody),
    })
    let result = await response.json();
    // console.log(`result is `);
    // console.dir(result);
    return result
};
module.exports.getGroupThreatFeasibility = getGroupThreatFeasibility;

// get a group of threat feasibility numbers from threatFeasibilityLibAdv collection
async function getGroupThreatFeasibilityAdv(assetTypeArray, assetSubTypeArray, attackSurfaceBaseProtocol, attackSurfaceAppProtocol,
    attackSurfaceSecurityProtocol, attackSurfaceTransmissionMedia) {
    const reqBody = {
        assetType: assetTypeArray,
        subType: assetSubTypeArray,
        baseProtocol: attackSurfaceBaseProtocol,
        appProtocol: attackSurfaceAppProtocol,
        secureProtocol: attackSurfaceSecurityProtocol,
        transmissionMedia: attackSurfaceTransmissionMedia,
    };
    const urlThreatFeasibilityLib = APPServerHTTPURL + "groupThreatFeasibilityLibAdv";
    let response = await fetch(urlThreatFeasibilityLib, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        },
        body: JSON.stringify(reqBody),
    })
    let result = await response.json();
    // console.log(`result is `);
    // console.dir(result);
    return result
};
module.exports.getGroupThreatFeasibilityAdv = getGroupThreatFeasibilityAdv;

// get a group of impact numbers from featureImpactLib collection
async function getGroupImpact(moduleIdArray, featureIdArray, moduleArray, featureArray) {
    const reqBody = {
        moduleIdArray: moduleIdArray,
        featureIdArray: featureIdArray,
        moduleArray: moduleArray,
        featureArray: featureArray,
    };
    const urlFeatureImpactLib = APPServerHTTPURL + "groupFeatureImpactLib";
    let response = await fetch(urlFeatureImpactLib, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        },
        body: JSON.stringify(reqBody),
    })
    let result = await response.json();
    // console.log(`result is `);
    // console.dir(result);
    return result
};
module.exports.getGroupImpact = getGroupImpact;

// get user added threats
async function getUserAddedThreat(filteredIdArray) {
    const reqBody = {
        fromFeatureId: filteredIdArray,
    };
    const urlUserAddedThreatLib = APPServerHTTPURL + "userAddedThreatLib";
    let response = await fetch(urlUserAddedThreatLib, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        },
        body: JSON.stringify(reqBody),
    })
    let result = await response.json();
    // console.log(`result is `);
    // console.dir(result);
    return result
};
module.exports.getUserAddedThreat = getUserAddedThreat;
// get system configuration data
async function getSystemConfig() {
    const urlSystemConfig = APPServerHTTPURL + "systemconfig";
    let response = await fetch(urlSystemConfig, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        }
    });
    // .then(res => {res.json()})
    // .then(text => console.log(text))
    let result = await response.json();
    // console.log(`result is `);
    // console.dir(result);
    return result
};
module.exports.getSystemConfig = getSystemConfig;

// generate tara report from reportsGenerator microservice
async function generateTaraReportInWord(reportPayload) {
    const generateTaraReport = ReportServerHTTPURL + "generateTaraReportInWord";
    const response = await fetch(generateTaraReport, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': ACCESS_TOKEN
        },
        body: JSON.stringify(reportPayload),
    });
    let result = await response.json();
    return result
};
module.exports.generateTaraReportInWord = generateTaraReportInWord;

// Call API request to get risk chart level data. Format the data according to chart requirement.
function getRiskChartLevelData(authorizationHeader,body) {
    return new Promise(async (resolve, reject) => {
        try {
            const dashboardAPIURL = APPServerRootHTTPURL + "dashboard/getRiskLevelChart?id=" + body.project.id;
            let response = await fetch(dashboardAPIURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': authorizationHeader
                }
            });
            let result = await response.json();
            const organizationalRiskChartLabel = [];
            const organizationalRiskChartData = [];
            for (let i = 0; i < result?.series.length; i++) {
                organizationalRiskChartLabel.push(result?.series[i]?.name)
                organizationalRiskChartData.push(result?.series[i]?.value)
            }
            resolve({
                organizationalRiskChartLabel,
                organizationalRiskChartData
            });
        } catch (error) {
            reject(error);
        }
    })
}
module.exports.getRiskChartLevelData = getRiskChartLevelData;

// Call API request to get residual risk data. Format the data according to chart requirement.
function getResidualRiskData(authorizationHeader, body) {
    return new Promise(async (resolve, reject) => {
        try {
            const dashboardAPIURL = APPServerRootHTTPURL + "dashboard/getProjectResidualRiskData?id=" + body.project.id;
            let response = await fetch(dashboardAPIURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': authorizationHeader
                }
            });
            let result = await response.json();
            const residualRiskChartLabel = [];
            const residualRiskChartData = [];
            for (let i = 0; i < result.length; i++) {
                residualRiskChartLabel.push(result[i]?.name)
                residualRiskChartData.push(result[i]?.value)
            }
            resolve({
                residualRiskChartLabel,
                residualRiskChartData
            })
        } catch (error) {
            reject(error);
        }
    });
}
module.exports.getResidualRiskData = getResidualRiskData;

// Call API request to get project threat list.
function getProjectThreatList(authorizationHeader, body) {
    return new Promise(async (resolve, reject) => {
        try {
            const dashboardAPIURL = APPServerRootHTTPURL + "projects/projectRiskThreatsByRiskLevel?id=" + body.project.id;
            let response = await fetch(dashboardAPIURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': authorizationHeader
                }
            });
            let result = await response.json();
            if (result) {
                resolve({ allThreats: result.threat ? result.threat : [] })
            } else {
                resolve({ allThreats: [] });
            }
        } catch (error) {
            reject(error);
        }
    });
}
module.exports.getProjectThreatList = getProjectThreatList;

// Call API request to get project html.
function getProjectHtml(authorizationHeader, body) {
    return new Promise(async (resolve, reject) => {
        try {
            const dashboardAPIURL = APPServerRootHTTPURL + "projects/projectHtmlDb?id=" + body.project.id;
            let response = await fetch(dashboardAPIURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': authorizationHeader
                }
            });
            let result = await response.json();
            resolve({ projectHtml: result });
        } catch (error) {
            reject(error);
        }
    });
}
module.exports.getProjectHtml = getProjectHtml;

// Call API request to get project high "riskLevel" threat list.
function getProjectHighRiskThreatList(authorizationHeader, body) {
    return new Promise(async (resolve, reject) => {
        try {
            const riskLevel = ["5"];
            const dashboardAPIURL = APPServerRootHTTPURL + "projects/projectHighRiskThreats?id=" + body.project.id + "&riskLevel=" + JSON.stringify(riskLevel);
            let response = await fetch(dashboardAPIURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': authorizationHeader
                }
            });
            let result = await response.json();
            if (result) {
                resolve({ projectHighRiskThreatList: result.threat ? result.threat : [] });
            } else {
                resolve({ projectHighRiskThreatList: [] });
            }
        } catch (error) {
            reject(error);
        }
    })
}
module.exports.getProjectHighRiskThreatList = getProjectHighRiskThreatList;

// Call API request to get project vulnerability list.
function getProjectVulnerabilityList(authorizationHeader, body) {
    return new Promise(async (resolve, reject) => {
        try {
            const dashboardAPIURL = APPServerRootHTTPURL + "vulnerability/" + body.project.id + "?type=all&id="+body.project.id;
            let response = await fetch(dashboardAPIURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': authorizationHeader
                }
            });
            let result = await response.json();
            resolve({ vulnerabilityList: result });
        } catch (error) {
            reject(error);
        }
    })
}
module.exports.getProjectVulnerabilityList = getProjectVulnerabilityList;