const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
const { atlasDbConnection, dbName, algoDbConnection, dbNameAlgo, userAccessDbConnection, dataAnalyticsDbConnection, dbNameDataAnalytics, componentDbConnection, dbNameComponent } = require("../config");

// this is the main project database, storing all project-specific data. Each server, when hosted in different places, uses a different DB.
const atlasTrialDbConnection = mongoose.createConnection(atlasDbConnection);
atlasTrialDbConnection.on("error", console.error.bind(console, dbName + " connection error:")); // test if connection to database is successful
atlasTrialDbConnection.once("open", function() { // if successfully connected
    console.log("Connection to " + dbName + " established!");
    atlasTrialDbConnection.on("SIGINT", function() {
      atlasTrialDbConnection.close(function() {
            console.log("Connection to " + dbName + " terminated!");
            atlasTrialDbConnection.exit(0);
        });
    });
});
module.exports.atlasTrialDbConnection = atlasTrialDbConnection;

// this is a shared database, storing algorithm related data. local server uses one DB. AWS-hosted servers use another DB
const atlasAlgorithmDbConnection = mongoose.createConnection(algoDbConnection);
atlasAlgorithmDbConnection.on("error", console.error.bind(console, dbNameAlgo + " connection error:")); // test if connection to database is successful
atlasAlgorithmDbConnection.once("open", function() { // if successfully connected
    console.log("Connection to " + dbNameAlgo + " established!");
    atlasAlgorithmDbConnection.on("SIGINT", function() {
      atlasAlgorithmDbConnection.close(function() {
            console.log("Connection to " + dbNameAlgo + " terminated!");
            atlasAlgorithmDbConnection.exit(0);
        });
    });
});
module.exports.atlasAlgorithmDbConnection = atlasAlgorithmDbConnection;

// this is a shared database, storing user authentication data. local and trial use one DB. production uses another DB.
const atlasUserAccessConnection = mongoose.createConnection(userAccessDbConnection);
atlasUserAccessConnection.on("error", console.error.bind(console, "userAccessDbConnection" + " connection error:")); // test if connection to database is successful
atlasUserAccessConnection.once("open", function() { // if successfully connected
    console.log("Connection to " + "userAccessDbConnection" + " established!");
    atlasUserAccessConnection.on("SIGINT", function() {
      atlasUserAccessConnection.close(function() {
            console.log("Connection to " + "userAccessDbConnection" + " terminated!");
            atlasUserAccessConnection.exit(0);
        });
    });
});
module.exports.atlasTrialLocalUserConnection = atlasUserAccessConnection;

// this is a shared DB, storing data analytics data. local server uses one DB. AWS-hosted servers use another DB.
const atlasDataAnalyicsDbConnection = mongoose.createConnection(dataAnalyticsDbConnection);
atlasDataAnalyicsDbConnection.on("error", console.error.bind(console, dbNameDataAnalytics + " connection error:")); // test if connection to database is successful
atlasDataAnalyicsDbConnection.once("open", function() { // if successfully connected
    console.log("Connection to " + dbNameDataAnalytics + " established!");
    atlasDataAnalyicsDbConnection.on("SIGINT", function() {
      atlasDataAnalyicsDbConnection.close(function() {
            console.log("Connection to " + dbNameDataAnalytics + " terminated!");
            atlasDataAnalyicsDbConnection.exit(0);
        });
    });
});
module.exports.atlasDataAnalyicsDbConnection = atlasDataAnalyicsDbConnection;

// this is a shared DB, storing component data. local server uses one DB. AWS-hosted servers use another DB.
const atlasComponentDbConnection = mongoose.createConnection(componentDbConnection);
atlasComponentDbConnection.on("error", console.error.bind(console, dbNameComponent + " connection error:")); // test if connection to database is successful
atlasComponentDbConnection.once("open", function() { // if successfully connected
    console.log("Connection to " + dbNameComponent + " established!");
    atlasComponentDbConnection.on("SIGINT", function() {
      atlasComponentDbConnection.close(function() {
            console.log("Connection to " + dbNameComponent + " terminated!");
            atlasComponentDbConnection.exit(0);
        });
    });
});
module.exports.atlasComponentDbConnection = atlasComponentDbConnection;