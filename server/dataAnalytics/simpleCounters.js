const atlasDataAnalyicsDbConnection = require("../database/atlasTrialDatabaseConnect").atlasDataAnalyicsDbConnection;
const simpleCountersSchema = require("../models/dataAnalyticsModelSchema").simpleCountersSchema;
const simpleCountersModel = atlasDataAnalyicsDbConnection.model("simpleCountersModel", simpleCountersSchema, "simpleCounters");

async function threatCount(threatNumber) {
    // TODO: generatedThreatCount may overflow after it hits 4,294,967,295. generatedThreatCountBillion is prepared to prevent it from overflowing.
    // Need to add a condition to check whether generatedThreatCount >4,000,000,000. If yes, $inc 4 to generatedThreatCountBillion and then decrease generatedThreatCount by 4,000,000,000
    await simpleCountersModel.findOneAndUpdate({counterType: "threatCounter"}, {$inc:{"generatedThreatCount": threatNumber}}, {
        new: false, // no need to return the updated doc
        upsert: true,
        useFindAndModify: false
    })
}
module.exports.threatCount = threatCount;