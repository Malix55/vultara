const { getRiskChartLevelData, getResidualRiskData, getProjectThreatList, getProjectHtml, getProjectHighRiskThreatList, getProjectVulnerabilityList } = require("./httpService");

// convert stride to cia properties
function convertStrideToCia(strideValue) {
    const secPropertyCia = ["i", "i", "a", "c", "a", "i"];
    const secPropertyStride = ["s", "t", "r", "i", "d", "e"];
    let index = secPropertyStride.indexOf(strideValue);
    if (index >= 0) {
        return [secPropertyCia[index]]
    } else {
        return ["i", "STRIDE value in threat feasibility library is stored incorrectly"]
    }
}
module.exports.convertStrideToCia = convertStrideToCia;

// convert the data structure of project to a list of objects identified by component ids
function sortComponentsById(project) {
    let projectById = {};
    for (let [element] of Object.entries(project)) { // for every type of component
        project[element].forEach((currentItem) => { // for every component within a type
            projectById[currentItem.id] = currentItem;
        });
    };
    // console.log(projectById);
    return projectById;
};
module.exports.sortComponentsById = sortComponentsById;

// get component property from projectById object by the compnent id
function getComponentPropertyById(componentId, projectById, property) {
    let componentList = Object.keys(projectById);
    let componentIndex = componentList.indexOf(componentId);
    let componentProperty = projectById[componentList[componentIndex]][property];
    return componentProperty
}
module.exports.getComponentPropertyById = getComponentPropertyById;

// find object property value from an array of objects
function findObjectByPropertyValue(myArray, myProperty, myValue) {
    let output = null;
    for (let i = 0; i < myArray.length; i++) {
        if (myArray[i][myProperty] == myValue) {
            output = myArray[i];
        }
    }
    return output
}
module.exports.findObjectByPropertyValue = findObjectByPropertyValue;

// find object with two property values from an array of objects
function findObjectByTwoPropertyValues(myArray, firstProperty, firstValue, secondProperty, secondValue) {
    let output = null;
    for (let i = 0; i < myArray.length; i++) {
        if (myArray[i][firstProperty] == firstValue && myArray[i][secondProperty] == secondValue) {
            output = myArray[i];
        }
    }
    return output
}
module.exports.findObjectByTwoPropertyValues = findObjectByTwoPropertyValues;

// find all objects that match a property
function findAllObjectsByProperty(myArray, propertyName, propertyValue) {
    let output = [];
    for (let i = 0; i < myArray.length; i++) {
        if (myArray[i][propertyName] == propertyValue) {
            output.push(myArray[i]);
        }
    }
    return output
}
module.exports.findAllObjectsByProperty = findAllObjectsByProperty;

// find all objects that match two properties together
function findAllObjectsByTwoProperties(myArray, firstPropertyName, firstPropertyValue, secondPropertyName, secondPropertyValue) {
    let output = [];
    for (let i = 0; i < myArray.length; i++) {
        if (myArray[i][firstPropertyName] == firstPropertyValue && myArray[i][secondPropertyName] == secondPropertyValue) {
            output.push(myArray[i]);
        }
    }
    return output
}
module.exports.findAllObjectsByTwoProperties = findAllObjectsByTwoProperties;

// process threatFeasibility array for group operation algorithm
function processThreatFeaForGroupAlgorithm(threatFea, assetTypeValue, subTypeValue) {
    let currentThreatFea = findObjectByPropertyValue(threatFea, "assetType", assetTypeValue);
    // console.log(`processThreatFeaForGroupAlgorithm is executed. currentThreatFea is `)
    // console.dir(currentThreatFea, {depth: null});
    let output = [];
    let resS = findObjectByPropertyValue(currentThreatFea.threatFeaArray, "stride", "s");
    output.push(resS);
    let resT = findObjectByPropertyValue(currentThreatFea.threatFeaArray, "stride", "t");
    output.push(resT);
    let resR = findObjectByPropertyValue(currentThreatFea.threatFeaArray, "stride", "r");
    output.push(resR);
    let resI = findObjectByPropertyValue(currentThreatFea.threatFeaArray, "stride", "i");
    output.push(resI);
    let resD = findObjectByPropertyValue(currentThreatFea.threatFeaArray, "stride", "d");
    output.push(resD);
    let resE = findObjectByPropertyValue(currentThreatFea.threatFeaArray, "stride", "e");
    output.push(resE);
    return output
}
module.exports.processThreatFeaForGroupAlgorithm = processThreatFeaForGroupAlgorithm;

// process threatFeasibilityAdv for group operation algorithm
function processThreatFeaAdvForGroupAlgorithm(threatFeaAdv) {
    // console.log(`processThreatFeaForGroupAlgorithm is executed. currentThreatFea is `)
    // console.dir(currentThreatFea, {depth: null});
    let output = [];
    let resS = findObjectByPropertyValue(threatFeaAdv, "stride", "s");
    output.push(resS);
    let resT = findObjectByPropertyValue(threatFeaAdv, "stride", "t");
    output.push(resT);
    let resR = findObjectByPropertyValue(threatFeaAdv, "stride", "r");
    output.push(resR);
    let resI = findObjectByPropertyValue(threatFeaAdv, "stride", "i");
    output.push(resI);
    let resD = findObjectByPropertyValue(threatFeaAdv, "stride", "d");
    output.push(resD);
    let resE = findObjectByPropertyValue(threatFeaAdv, "stride", "e");
    output.push(resE);
    return output
}
module.exports.processThreatFeaAdvForGroupAlgorithm = processThreatFeaAdvForGroupAlgorithm;

// process threatFeasibilityAdv array
function processThreatFeaAdv(threatFeaAdv, secProStride) {
    if (threatFeaAdv && threatFeaAdv.length > 0) {
        // console.log(`secProStride is ${secProStride}`)
        // // console.log(`threatFeaAdv is `)
        // // console.dir(threatFeaAdv)
        let output = threatFeaAdv.filter(obj => obj.stride == secProStride);
        return output
    } else {
        return undefined
    }
}
module.exports.processThreatFeaAdv = processThreatFeaAdv;

async function convertAssetThreatMatrixToTable(assetThreatMatrix) { // convert the object into an array for angular table
    let assetThreatTable = [];
    let index = 0;
    Object.keys(assetThreatMatrix).forEach((componentItem) => {
        Object.keys(assetThreatMatrix[componentItem]).forEach((assetItem) => {
            assetThreatMatrix[componentItem][assetItem].threat.forEach((threatItem, i) => {
                assetThreatTable[index] = {};
                // console.log(assetThreatTable);
                assetThreatTable[index]["componentId"] = componentItem;
                assetThreatTable[index]["assetId"] = assetItem;
                assetThreatTable[index]["id"] = genRandomId();
                for (let key of Object.keys(assetThreatMatrix[componentItem][assetItem])) {
                    if (key !== "threat") {
                        assetThreatTable[index][key] = assetThreatMatrix[componentItem][assetItem][key];
                    }
                }
                for (let key of Object.keys(assetThreatMatrix[componentItem][assetItem].threat[i])) {
                    assetThreatTable[index][key] = assetThreatMatrix[componentItem][assetItem].threat[i][key];
                }
                index = index + 1;
            })
        })
    })
    return assetThreatTable;
};
module.exports.convertAssetThreatMatrixToTable = convertAssetThreatMatrixToTable;

function genRandomId(lengthOfIdInput) {
    let charPool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let lengthOfId = 20;
    if (lengthOfIdInput) lengthOfId = lengthOfIdInput;
    let text = "";
    for (let i = 0; i < lengthOfId; i++) {
        text += charPool.charAt(Math.floor(Math.random() * charPool.length));
    };
    return text;
};
module.exports.genRandomId = genRandomId;

function stringToCamelCase(str) {
    if (!str || str === "") {
        return "";
    }
    var splitted = str.trim().split(/[ ,]+/);
    var convertedStr = splitted[0].toLowerCase();
    for (var i = 1; i < splitted.length; i++) {
        var subStr = splitted[i];
        convertedStr = convertedStr.concat(
            subStr.charAt(0).toUpperCase() + subStr.slice(1).toLowerCase()
        );
    }
    return convertedStr;
}
module.exports.stringToCamelCase = stringToCamelCase;

function arrayToCamelCase(inputArray) {
    if (!inputArray || inputArray === "") {
        return "";
    }
    var convertedArray = [];
    for (var i = 0; i < inputArray.length; i++) {
        var splitted = inputArray[i].trim().split(/[ ,]+/);
        var convertedStr = splitted[0].toLowerCase();
        for (var i = 1; i < splitted.length; i++) {
            var subStr = splitted[i];
            convertedStr = convertedStr.concat(subStr.charAt(0).toUpperCase() + subStr.slice(1).toLowerCase());
            convertedArray.push(convertedStr);
        }
    }
    return convertedArray;
}
module.exports.stringToCamelCase = stringToCamelCase;

function camelCaseToString(str) { // first letter of each word is not capitalized
    if (!str || str === "") {
        return "";
    }
    function isUpperCaseString(str) {
        return /^[A-Z]+/.test(str);
    }
    var newString = "";
    var wordBeginPos = 0;
    for (var i = 0; i < str.length; i++) {
        if (isUpperCaseString(str.substr(i)) == false)
            continue;
        newString = newString.concat(
            str.substr(wordBeginPos, i - wordBeginPos).toLowerCase() + " "
        );
        wordBeginPos = i;
    }
    newString = newString.concat(
        str.substr(wordBeginPos, i - wordBeginPos).toLowerCase()
    );
    return newString;
}
module.exports.camelCaseToString = camelCaseToString;

// Get risk chart, modeling view and threat list information from API. Call API as an independent "Promise" so that every API request send independently.
async function getTARAReportInformation(authorizationHeader, body) {
    return new Promise(async (resolve, reject) => {
        try {
            const dataPromise = [];
            if (body.organization_risk_chart) {
                dataPromise.push(getRiskChartLevelData(authorizationHeader, body));
            }
            if (body.project_risk_chart) {
                dataPromise.push(getResidualRiskData(authorizationHeader, body));
            }
            if (body.all_threat) {
                dataPromise.push(getProjectThreatList(authorizationHeader, body));
            }
            if (body.architecture_diagram) {
                dataPromise.push(getProjectHtml(authorizationHeader, body));
            }
            if (body.high_risk_threat) {
                dataPromise.push(getProjectHighRiskThreatList(authorizationHeader, body));
            }
            if (body.vulnerability_list) {
                dataPromise.push(getProjectVulnerabilityList(authorizationHeader, body));
            }

            // Send data to generate the report when promises completed.
            Promise.all(dataPromise).then((data) => {
                let reportData = new Object();
                if (data) {
                    for (let key in data) {
                        if (data.hasOwnProperty(key)) {
                            reportData = {
                                ...reportData,
                                ...data[key]
                            }
                        }
                    }
                }
                resolve({ success: true, data: reportData });
            })
        } catch (error) {
            reject({ success: false, message: error.message })
        }
    });
}
module.exports.getTARAReportInformation = getTARAReportInformation;
