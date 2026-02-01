const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");
const asyncPackage = require("async");
const atlasDataAnalyicsDbConnection = require("../database/atlasTrialDatabaseConnect").atlasDataAnalyicsDbConnection;
const threatRiskAllSchema = require("../models/dataAnalyticsModelSchema").threatRiskAllSchema;
const threatRiskAllModel = atlasDataAnalyicsDbConnection.model("threatRiskAllModel", threatRiskAllSchema, "threatRiskAll");
const threatFeaAllSchema = require("../models/dataAnalyticsModelSchema").threatFeaAllSchema;
const threatFeaAllModel = atlasDataAnalyicsDbConnection.model("threatFeaAllModel", threatFeaAllSchema, "threatFeaAll");

const licenseFile = require(`../config`).licenseFile;
const crypto = require('crypto');


async function collectReviewedThreat(allThreats, projectId) {
    if (licenseFile.collectThreatRisk) { // only collect if the configuration is set so
        let threatsToSave = allThreats.filter(threat => threat.reviewed); // only keep the reviewed threats
        threatsToSave = generateNewFieldsValue(threatsToSave, projectId);
        const updateThreat = async function(item, callback) {
            const filter = {id: item.id};
            const update = item;
            // save to threatRiskAll for all possible analysis
            if(update._id){
                delete update._id;
            }
            await threatRiskAllModel.findOneAndUpdate(filter, update, {
                new: false, // no need to return the updated doc
                upsert: true,
                useFindAndModify: false
            })
        }
        asyncPackage.each(threatsToSave, updateThreat, async function (err) {
            if (err) {
                console.log(`data analytics module, threatRiskAll library collectReviewedThreat method has an err: ${err.stack}`);
                throw Error(err.stack);
            }
        });
    }
}
module.exports.collectReviewedThreat = collectReviewedThreat;

// prepare new fields in new obj
function generateNewFieldsValue(allThreats, projectId) {
    allThreats.forEach(currentThreat => {
        currentThreat.orgHash = crypto.createHash('sha256').update(licenseFile.customerName).digest('hex');
        const userID = licenseFile.customerName + currentThreat.reviewedBy; // use the reviewer's hash to identify the user
        currentThreat.userHash = crypto.createHash('sha256').update(userID).digest('hex');
        currentThreat.industry = licenseFile.industry;
        currentThreat.supplyChain = currentThreat.supplyChain;
        currentThreat.attackPathLength = currentThreat.attackPath.length;
        let threatIdInput = "";
        if (currentThreat.threatSource == "ruleEngine") { // threatRuleEngineId is static
            threatIdInput = licenseFile.customerName + projectId + currentThreat.threatRuleEngineId;
        } else { // if not, id field is static, either generated in front end when row added (manual) or generated from last project (re-use)
            threatIdInput = licenseFile.customerName + projectId + currentThreat.id
        }
        currentThreat.id = crypto.createHash('sha512').update(threatIdInput).digest('hex'); // need a consistent id to avoid repeated storage of the same threat
        currentThreat.newToThreatFeaAll = true;
    })
    return allThreats
}

// delete relevant fields and modify relevant key words to anonymize recorded threats
// currently addressed by schema - may needf to add dictionary to filter out key words later
function anonymizeThreat(allThreats) {
    allThreats.forEach(currentThreat => {
    })
    return allThreats
}