const objOperation = require("../service/objOperation");

// compose threat scenario sentence for batch operation
function generateThreatScenarioStrideForGroup(threatScenarioObj, assetName, assetType, assetSubType, componentName, featureName, attackSurfaceSensorInput, assetAccessType) {
    let currentThreatScenarioObj = objOperation.findObjectByPropertyValue(threatScenarioObj, "assetType", assetType); // find the threat scenario by assetType
    if (currentThreatScenarioObj) {
        let resS = [];
        let resT = [];
        let resR = [];
        let resI = [];
        let resD = [];
        let resE = [];
        // if feature chain is used, an * is appended to the feature name. that's why this following line is used, to remove that *
        if (featureName[featureName.length - 1] === "*") featureName = featureName.slice(0, -1);
        if (attackSurfaceSensorInput) {
            // process relevant STRIDE threat types again by whether the attack surface is an sensor input
            currentThreatScenarioObj = considerSensorInput(assetType, assetSubType, currentThreatScenarioObj);
        }
        if (currentThreatScenarioObj.s == true) {
            // dataAtRest type of asset's asset access type affects its threat type
            if (assetType == "dataAtRest" && !(assetAccessType.includes("U")||assetAccessType.includes("C"))) {
                // if access type doesn't include C and doesn't include U, don't add this threat
            } else {
                let scenario = "Spoofing of the " + assetName + generateAssetOrigin(assetType, componentName, assetAccessType) + " leads to " + generateLoss(assetType, "integrity of") +
                    " used in the " + featureName + " feature, causing the function to behave in an unintended way.";
                resS.push(scenario);
            }
        };
        if (currentThreatScenarioObj.t == true) {
            // dataAtRest type of asset's asset access type affects its threat type
            if (assetType == "dataAtRest" && !assetAccessType.includes("U")) {
                // if access type doesn't include U, don't add this threat
            } else {
                let scenario = "Tampering of the " + assetName + generateAssetOrigin(assetType, componentName, assetAccessType) + " leads to " + generateLoss(assetType, "integrity of") +
                    " used in the " + featureName + " feature, " + tamperConsequence(assetSubType);
                resT.push(scenario);
            }
        };
        if (currentThreatScenarioObj.r == true) {
            let scenario = "Repudiation of the " + assetName + generateAssetOrigin(assetType, componentName, assetAccessType) + " leads to " +
                generateLoss(assetType, "availability of traceability to any actions against") + " used in the " + featureName + " feature." +
                " Malicious activities such as process execution or termination will occur without any user claiming responsibility.";
            resR.push(scenario); // repudiation will be grouped to A
        };
        if (currentThreatScenarioObj.i == true) {
            // dataAtRest type of asset's asset access type affects its information disclosure threat
            if (assetType == "dataAtRest" && !assetAccessType.includes("R")) {
                // for dataAtRest type of assets, if not including Read type of access, do not add this threat
            } else {
                let scenario = "Disclosing the content of the " + assetName + generateAssetOrigin(assetType, componentName, assetAccessType) + " leads to " + generateLoss(assetType, "confidentiality of") +
                " used in the " + featureName + " feature.";
                resI.push(scenario);
            }
        };
        if (currentThreatScenarioObj.d == true) {
            // dataAtRest type of asset's asset access type affects its threat type
            if (assetType == "dataAtRest" && !(assetAccessType.includes("U")||assetAccessType.includes("D"))) {
                // if access type doesn't include U and doesn't include D, don't add this threat
            } else {
                let scenario = "Denial of service of the " + assetName + generateAssetOrigin(assetType, componentName, assetAccessType) + " leads to " + generateLoss(assetType, "availability of") +
                " needed by the " + featureName + " feature." + DenialPost(assetType, featureName);
                resD.push(scenario);
            }
        };
        if (currentThreatScenarioObj.e == true) {
            let scenario = "The " + assetName + generateAssetOrigin(assetType, componentName, assetAccessType) + " can be used to access privileged data or other privileged process, which leads to "
                + generateLoss(assetType, "integrity of") + " used in the " + featureName + " feature.";
            resE.push(scenario); // elevation of privilege will be grouped to I
        };
        return [resS, resT, resR, resI, resD, resE];
    } else {
        return [];
    }
};
module.exports.generateThreatScenarioStrideForGroup = generateThreatScenarioStrideForGroup;

function considerSensorInput(assetType, assetSubType, threatScenarioObj) {
    switch (assetType) {
        case "dataInTransit":
            // s, t, i are true by default
            threatScenarioObj.i = false;
            // s and t are only possible for general data
            if (assetSubType != "generalData") {
                threatScenarioObj.s = false;
                threatScenarioObj.t = false;
            }
            return threatScenarioObj;
        case "dataAtRest":
            // t, i are true by default
            threatScenarioObj.i = false;
            // t is only possible for general data
            if (assetSubType != "generalData") {
                threatScenarioObj.t = false;
            }
            return threatScenarioObj;
        case "bandwidth":
            // d is true by default
            threatScenarioObj.d = false;
            return threatScenarioObj;
        case "process":
            // s, t, r, d are true by default
            threatScenarioObj.t = false;
            threatScenarioObj.r = false;
            threatScenarioObj.d = false;
            return threatScenarioObj;
        case "memoryResource":
            // d is true by default
            threatScenarioObj.d = false;
            return threatScenarioObj;
        case "computingResource":
            // d is true by default
            threatScenarioObj.d = false;
            return threatScenarioObj;
    }
}

function generateAssetOrigin(assetType, componentName, assetAccessType) {
    switch (assetType) {
        case "dataInTransit":
            return generateScenarioForDataInTransit(assetAccessType) + componentName;
        case "dataAtRest":
            return " stored in the " + componentName;
        case "bandwidth":
            return " of the " + componentName;
        case "process":
            return " running in the " + componentName;
        case "memoryResource":
            return " of the " + componentName;
        case "computingResource":
            return " of the " + componentName;
    }
}

function generateScenarioForDataInTransit(assetAccessType) {
    switch (assetAccessType) {
        case "S":
            return " sent out by the ";
        case "Rec":
            return " received by the ";
        default:
            return " sent out or received by the "
    }
}

function generateLoss(assetType, cia) {
    switch (assetType) {
        case "dataInTransit":
            return "loss of " + cia + " the data";
        case "dataAtRest":
            return "loss of " + cia + " the data";
        case "bandwidth":
            return "loss of " + cia + " the communication channel"
        case "process":
            return "loss of " + cia + " the process";
        case "memoryResource":
            return "loss of " + cia + " the memory resource";
        case "computingResource":
            return "loss of " + cia + " the computational resource";
    }
}

function DenialPost(assetType) {
    switch (assetType) {
        case "dataInTransit":
            return "";
        case "dataAtRest":
            return "";
        case "bandwidth":
            return " Necessary messages or data will not be passed to the receiver in time."
        case "process":
            return " The function will either cease to function or refuse to respond to valid requests.";
        case "memoryResource":
            return " The function will either cease to function or refuse to respond to valid requests.";
        case "computingResource":
            return " The function will either cease to function or refuse to respond to valid requests.";
    }
}

function tamperConsequence(assetSubType) {
    switch (assetSubType) {
        case "log":
            return "causing repudiation.";
        default:
            return "causing the function to behave in an unintended way."
    }
}