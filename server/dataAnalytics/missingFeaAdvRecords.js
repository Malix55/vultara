const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");
const asyncPackage = require("async");
const missingFeaAdvSchema = require("../models/dataAnalyticsModelSchema").missingFeaAdvSchema;
const atlasDataAnalyicsDbConnection = require("./../database/atlasTrialDatabaseConnect").atlasDataAnalyicsDbConnection;
const dataAnalyticsMissingFeaAdvRecordsModel = atlasDataAnalyicsDbConnection.model("dataAnalyticsMissingFeaAdvRecordsModel", missingFeaAdvSchema, "missingFeaAdvRecords");

async function recordAndCalculate(combinedAssetThreatTable) {
    const recordAndCalculate = async function(item, callback) {
        if (item.attackFeasibilityElapsedRationale) {

        } else { // records only if the rationale property doesn't exist
            const filter = {
                assetType: item.assetType,
                subType: item.subType,
                transmissionMedia: item.transmissionMedia,
                baseProtocol: item.baseProtocol,
                appProtocol: item.appProtocol,
                secureProtocol: item.secureProtocol,
                stride: item.securityPropertyStride,
            };
            const update = {
                assetType: item.assetType,
                subType: item.subType,
                transmissionMedia: item.transmissionMedia,
                baseProtocol: item.baseProtocol,
                appProtocol: item.appProtocol,
                secureProtocol: item.secureProtocol,
                stride: item.securityPropertyStride,
            };
            await dataAnalyticsMissingFeaAdvRecordsModel.findOneAndUpdate(filter,{$set: update, $inc: {count: 1}}, {
                new: true,
                upsert: true,
                useFindAndModify: false
            })
        }
    }
    asyncPackage.each(combinedAssetThreatTable, recordAndCalculate, async function (err) {
        if (err) {
            console.log(`data analytics module, missing feasibility library recordAndCalculate method has an err: ${err.stack}`);
            throw Error(err);
        } else {

        }
    });
}
module.exports.recordAndCalculate = recordAndCalculate;
