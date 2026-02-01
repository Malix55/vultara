const WP29ThreatMappingSchema = require("./../models/wp29ThreatSchema").WP29ThreatMappingSchema;
const WP29ThreatMappingKeywordsSchema = require("./../models/wp29ThreatSchema").WP29ThreatKeywordsSchema;
const atlasTrialDbConnection = require("./../database/atlasTrialDatabaseConnect").atlasTrialDbConnection;
const WP29ThreatMappingModel = atlasTrialDbConnection.model("WP29ThreatMappingModel", WP29ThreatMappingSchema, "wp29ThreatMappingLib");
const WP29ThreatMappingKeywordsModel = atlasTrialDbConnection.model("WP29ThreatMappingKeywordsModel", WP29ThreatMappingKeywordsSchema, "wp29ThreatMappingLibKeywords");

// main Algorithm file to update wp29 threat index
async function calculateWP29ThreatIndex(resultData) {
    const mappingData = await getWP29ThreatInformation();
    const initialThreatIndex = 0;
    const newResultData = checkThreatInfoMatched(mappingData, resultData, initialThreatIndex);
    return newResultData;
}
module.exports.calculateWP29ThreatIndex = calculateWP29ThreatIndex;

// Retrive WP29Threat and keywords information from a single query
async function getWP29ThreatInformation() {
    try {
        return await WP29ThreatMappingModel.aggregate([
            {
                $lookup: {
                    from: WP29ThreatMappingKeywordsModel.collection.name,
                    let: { threatId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$threatId", "$$threatId"]
                                }
                            },
                        },
                    ],
                    as: "keywords",
                },
            },
            {
                $addFields: {
                    keywords: { $arrayElemAt: ["$keywords", 0] },
                },
            }
        ]).then(result => {
            return result;
        });
    } catch (err) {
        return "Error: Project wp29 threat database GET request failed!";
    }
}

// recursive function to iterate over result and update WP29ThreatIndex value if conditions matched
function checkThreatInfoMatched(mappingData, resultData, threatIndex) {
    const threat = resultData[threatIndex];
    for (let i = 0; i < mappingData.length; i++) {
        const wp29AttackIndex = resultData[threatIndex].wp29AttackIndex ? resultData[threatIndex].wp29AttackIndex : [];
        const isMatchedIndex = (mappingData[i] && threat) ? checkMappingMatched(mappingData[i], threat) : false;
        if (isMatchedIndex) {
            if (!wp29AttackIndex.includes(isMatchedIndex)) {
                wp29AttackIndex.push(isMatchedIndex);
            }
        }
        resultData[threatIndex].wp29AttackIndex = wp29AttackIndex;
    }

    if (threatIndex < (resultData.length - 1)) {
        return checkThreatInfoMatched(mappingData, resultData, threatIndex + 1);
    } else {
        return resultData;
    }
}

// check whether keywords and mapping threat matched with result threat
function checkMappingMatched(mappingWP29, threat) {
    const isKeywordMatched = mappingWP29.keywords ? checkThreatKeywordsMatched(mappingWP29.keywords, threat) : true;
    if (isKeywordMatched) {
        const mappingCondition = (threat.assetType && mappingWP29.assetType === threat.assetType) && (threat.subType && mappingWP29.subType === threat.subType)
            && (threat.securityPropertyStride && mappingWP29.securityPropertyStride === threat.securityPropertyStride) && (mappingWP29.baseProtocol === "any" || (threat.baseProtocol && mappingWP29.baseProtocol === threat.baseProtocol))
            && (mappingWP29.appProtocol === "any" || (mappingWP29.appProtocol && threat.appProtocol.includes(mappingWP29.appProtocol))) && (mappingWP29.featureType === "any" || (threat.featureType && mappingWP29.featureType === threat.featureType))
            && (mappingWP29.transmissionMedia === "any" || (threat.transmissionMedia && mappingWP29.transmissionMedia === threat.transmissionMedia)) && (threat.MITM !== undefined && mappingWP29.MITM === threat.MITM);
        return mappingCondition ? mappingWP29.wp29AttackIndex : false;
    } else {
        return false;
    }
}

// check keywords value and conditions to perform updating index
function checkThreatPropertyValueExists(propertyName, propertyNameIncludes) {
    let isPropertyNameIncludes = false;
    const propertyNameArray = propertyName ? propertyName.split(" ").filter(name => name !== " ") : [];
    const propertyNameIncludesArray = propertyNameIncludes ? propertyNameIncludes.split(" ").filter(name => name !== " ") : [];
    if (propertyNameIncludesArray && propertyNameIncludesArray.length > 0) {
        if (propertyNameIncludesArray.includes("OR")) {
            const propertyNameIncludesArrayORExcluded = propertyNameIncludesArray.filter(name => name !== "OR");
            isPropertyNameIncludes = isMappingPropertyNameIncluded(propertyNameArray, propertyNameIncludesArrayORExcluded, true);
        } else {
            isPropertyNameIncludes = isMappingPropertyNameIncluded(propertyNameArray, propertyNameIncludesArray, false);
        }
    }

    return isPropertyNameIncludes;
}

// One time condition to fall back if condition matched first time from iteration
function isMappingPropertyNameIncluded(propertyNameArray, propertyNameIncludesArray, condition) {
    for (mappingName of propertyNameIncludesArray) {
        if (propertyNameArray.includes(mappingName) === condition) {
            return condition;
        }
    }
    return !condition;
}

// check whether keywords value and and value conditions matched with threat result
function checkThreatKeywordsMatched(keywords, threat) {
    let isKeyWordExists = false;
    const assetNameIncludes = keywords.assetNameIncludes ? keywords.assetNameIncludes : "";
    const relationship = keywords.relationship ? keywords.relationship : "";
    const fromFeatureIncludes = keywords.fromFeatureIncludes ? keywords.fromFeatureIncludes : "";
    let isAssetNameIncludes = checkThreatPropertyValueExists(threat.asset, assetNameIncludes);
    let isFromFeatureIncludes = checkThreatPropertyValueExists(threat.fromFeature, fromFeatureIncludes);

    switch (relationship) {
        case "OR":
            if (isAssetNameIncludes || isFromFeatureIncludes) {
                isKeyWordExists = true;
            }
            break;

        default:
            isAssetNameIncludes = keywords.assetNameIncludes === undefined ? true : isAssetNameIncludes;
            isFromFeatureIncludes = keywords.fromFeatureIncludes === undefined ? true : isFromFeatureIncludes;
            if (isAssetNameIncludes && isFromFeatureIncludes) {
                isKeyWordExists = true;
            }
            break;
    }

    return isKeyWordExists;
}