const mongoose = require("mongoose");
const express = require("express");

require('dotenv').config({ path: __dirname+'/./../.env'});


// // establish connection to testDB
// function dbConnectTestDb() { mongoose.connect(
//     "mongodb://localhost:27017/testdb", 
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     });
//     let db = mongoose.connection;
//     db.on("error", console.error.bind(console, "connection error:")); // test if connection to database is successful
//     db.once("open", function() { // if successfully connected
//         console.log("Connection to MongoDB testdb established!");
//     db.on("SIGINT", function() {
//         mongoose.connection.close(function() {
//             console.log("Connection to MongoDB testdb is terminated!");
//             db.exit(0);
//         });
//     });
// })}
// module.exports.dbConnectTestDb = dbConnectTestDb;
// // dbConnection.dbConnectTestDb(); // connect to test database

// // establish connection to local database for libraries
// function localDbConnectAssetThreatLib() {
//     mongoose.connect(
//     // "mongodb://localhost:27017/asset-threat-lib", // TODO: change database name
//     process.env.LOCALDB_STRING,
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     });
//     // console.log(mongoose.connections.length);
//     let localDb = mongoose.connections[0];
//     localDb.on("error", console.error.bind(console, "local connection error:")); // test if connection to database is successful
//     localDb.once("open", function() { // if successfully connected
//         console.log("Connection to local MongoDB asset-threat-lib established!");
//         localDb.on("SIGINT", function() {
//             mongoose.connections[0].close(function() {
//                 console.log("Connection to MongoDB asset-threat-lib is terminated!");
//                 localDb.exit(0);
//             });
//         });
//     });
//     return localDb
// }
// // module.exports.localDbConnectAssetThreatLib = localDbConnectAssetThreatLib;
// const localDbConnection = localDbConnectAssetThreatLib(); // connect to database


const localDbConnection = mongoose.connect(
    // "mongodb://localhost:27017/asset-threat-lib", // TODO: change database name
    process.env.LOCALDB_STRING);
// console.log(mongoose.connections.length);
let localDb = mongoose.connections[0];
localDb.on("error", console.error.bind(console, "local connection error:")); // test if connection to database is successful
localDb.once("open", function() { // if successfully connected
    console.log("Connection to local MongoDB asset-threat-lib established!");
    localDb.on("SIGINT", function() {
        mongoose.connections[0].close(function() {
            console.log("Connection to MongoDB asset-threat-lib is terminated!");
            localDb.exit(0);
        });
    });
});
module.exports.localDbConnection = localDbConnection;
