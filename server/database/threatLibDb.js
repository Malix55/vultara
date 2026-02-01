const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const objOperation = require("../service/objOperation");
const AssetLibSchema = require("../models/threatLibModelSchema").AssetLibSchema;
const ThreatLibSTRIDESchema = require("../models/threatLibModelSchema").ThreatLibSTRIDESchema;
const ThreatFeasibilityLibSchema = require("../models/threatLibModelSchema").ThreatFeasibilityLibSchema;
const ThreatFeasibilityLibAdvSchema = require("../models/threatLibModelSchema").ThreatFeasibilityLibAdvSchema;
const FeatureImpactLibSchema = require("../models/threatLibModelSchema").FeatureImpactLibSchema;
const SystemConfigSchema = require("../models/systemConfigSchema").SystemConfigSchema;
const ThreatListSchema = require("../models/projectModelSchema").ThreatListSchema;
const ThreatListSchemaWithTime = new mongoose.Schema(ThreatListSchema, { timestamps: true })

const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const atlasAlgorithmDbConnection = require("./atlasTrialDatabaseConnect").atlasAlgorithmDbConnection;

const AssetLibModel = atlasTrialDbConnection.model("AssetLibModel", AssetLibSchema, "assetLib");
const ThreatLibSTRIDEModel = atlasAlgorithmDbConnection.model("ThreatLibSTRIDEModel", ThreatLibSTRIDESchema, "threatLibStride");
const ThreatFeasibilityLibModel = atlasAlgorithmDbConnection.model("ThreatFeasibilityLibModel", ThreatFeasibilityLibSchema, "threatFeasibilityLib");
const ThreatFeasibilityLibAdvModel = atlasAlgorithmDbConnection.model("ThreatFeasibilityLibAdvModel", ThreatFeasibilityLibAdvSchema, "threatFeasibilityLibAdv");
const FeatureImpactLibModel = atlasTrialDbConnection.model("FeatureImpactLibModel", FeatureImpactLibSchema, "featureImpactLib");
const systemConfigModel = atlasTrialDbConnection.model("systemConfigModel", SystemConfigSchema, "systemConfig");
const UserAddedThreatLibModel = atlasTrialDbConnection.model("UserAddedThreatLibModel", ThreatListSchemaWithTime, "userAddedThreatLib");
const ACCESS_TOKEN = require("../config").ACCESS_TOKEN;

router
    .route("/groupAssetById") // the optimized algorithm queries all assets together
    .post(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                // console.log(`querying asset id group: `);
                // console.dir(req.body)
                let assetIdList = req.body.id;
                // console.log(`assetIdList: `);
                // console.dir(assetIdList)
                // console.log(`assetIdList: ${assetIdList[0]}, ${assetIdList[1]}`)
                let output = await AssetLibModel.find({ "_id": { $in: assetIdList } });
                // console.log(`query return is`)
                // console.log(output[0])
                res.send(output);
            }
        } catch (err) {
            res.status(500).send({ msg: "POST request for /groupAssetById failed!", error: err });
        }
    })

router
    .route("/threatLibStride")
    .get(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                // console.log(req.query);
                let threatQuery = await ThreatLibSTRIDEModel.find(req.query);
                // let assetTypeQuery = await threatLibModelSchema.AssetLibModel.find(req.body);
                res.json(threatQuery[0]);
                // res.json(assetTypeQuery);
            }
        } catch (err) {
            res.status(500);
            res.end();
        }
    })
router
    .route("/groupthreatLibStride") // the optimized algorithm queries all threat scenarios together
    // .get(async (req, res) => {
    //     try {
    //         // console.log(`querying asset id group: ${req.query.id}`);
    //         let assetTypeList = req.query.assetType.split(",");
    //         // console.log(`assetIdList: ${assetIdList[0]}, ${assetIdList[1]}`)
    //         let output = await ThreatLibSTRIDEModel.find({"assetType": {$in: assetTypeList}});
    //         // console.log(`query return is`)
    //         // console.log(output[0])
    //         res.send(output);
    //     } catch (err) {
    //         res.status(500).send({msg: "GET request for /groupthreatLibStride failed!", error: err});
    //     }
    // })
    .post(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                // console.log(`querying asset id group: `);
                // console.dir(req.body)
                let assetTypeList = req.body.assetType;
                // console.log(`assetIdList: `);
                // console.dir(assetTypeList)
                let output = await ThreatLibSTRIDEModel.find({ "assetType": { $in: assetTypeList } });
                // console.log(`query return is`)
                // console.dir(output)
                res.send(output);
            }
        } catch (err) {
            res.status(500).send({ msg: "POST request for /groupthreatLibStride failed!", error: err });
        }
    })

router
    .route("/threatFeasibilityLib")
    .get(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                // console.log(req.query);
                let feasibility = await ThreatFeasibilityLibModel.find(req.query);
                res.json(feasibility[0]);
                // res.json(assetTypeQuery);
            }
        } catch (err) {
            res.status(500).send({ error: "GET request for threatFeasibilityLib failed!" });
        }
    })
router
    .route("/groupThreatFeasibilityLib") // the optimized algorithm queries all threat feasibilities together. Using POST because GET has length limit
    .post(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                let assetTypeArray = req.body.assetType;
                let subTypeArray = req.body.subType;
                // console.log(`assetTypeArray is ${assetTypeArray[0]}, subTypeArray is ${subTypeArray[0]}`)
                let returnArray = [];
                let threatQuery = await ThreatFeasibilityLibModel.find({ "assetType": { $in: assetTypeArray } })
                    .then(resp => {
                        // console.log(`query by assetType returns: ${resp[0]}`)
                        for (let [index, type] of assetTypeArray.entries()) {
                            let returnObj = {
                                assetType: "",
                                subType: "",
                                threatFeaArray: [],
                            };
                            // console.log(`when assetType is ${type}, subType is ${subTypeArray[index]}`)
                            returnObj.assetType = assetTypeArray[index];
                            if (subTypeArray[index]) { // if subType is defined, check both properties
                                returnObj.subType = subTypeArray[index];
                                let matchedObj = objOperation.findAllObjectsByTwoProperties(resp, "assetType", assetTypeArray[index], "subType", subTypeArray[index]);
                                if (matchedObj[0]) { // if a match if found, use it
                                    matchedObj.forEach(obj => returnObj.threatFeaArray.push(obj))
                                } else { // if no match, match it with only assetType and ignore subType
                                    matchedObj = objOperation.findAllObjectsByTwoProperties(resp, "assetType", assetTypeArray[index], "subType", "");
                                    if (matchedObj[0]) { // if a match if found, use it
                                        matchedObj.forEach(obj => returnObj.threatFeaArray.push(obj))
                                    }
                                    // console.log(`assetType is ${assetTypeArray[index]}, subType is ${subTypeArray[index]}, return from threatFeaLib is ${matchedObj}`)
                                }
                                returnArray.push(returnObj);
                                // console.log(`ThreatFeasibilityLib query completed. assetType ${returnObj.assetType} and subType ${returnObj.subType} has threatFeaArray property `);
                                // console.log(`${returnObj.threatFeaArray}`);
                            } else { // if subType is not defined, only use assetType
                                returnObj.assetType = assetTypeArray[index];
                                matchedObj = objOperation.findAllObjectsByTwoProperties(resp, "assetType", assetTypeArray[index], "subType", "");
                                matchedObj.forEach(obj => returnObj.threatFeaArray.push(obj))
                                // console.log(`match is ${matchedObj}`)
                                returnArray.push(returnObj);
                            }
                        }
                    })
                    .then(resp => {
                        res.json(returnArray);
                    })
            }
        } catch (err) {
            res.status(500).send({ msg: "POST request for /groupThreatFeasibilityLib failed!", error: err });
        }
    })
router
    .route("/groupThreatFeasibilityLibAdv") // query advanced feasibility library
    .post(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                const assetTypeArray = req.body.assetType;
                const subTypeArray = req.body.subType;
                const baseProtocolArray = req.body.baseProtocol;
                // console.log(`baseProtocolArray is ${baseProtocolArray}  length is ${baseProtocolArray.length}  first.length is ${baseProtocolArray[0].length}`)
                const appProtocolArray = req.body.appProtocol;
                // console.log(`appProtocolArray is ${appProtocolArray}  length is ${appProtocolArray.length}  first.length is ${appProtocolArray[0].length}`)
                const securityProtocolArray = req.body.secureProtocol;
                // console.log(`securityProtocolArray is ${securityProtocolArray}  length is ${securityProtocolArray.length}  first.length is ${securityProtocolArray[0].length}`)
                const transmissionMediaArray = req.body.transmissionMedia;
                // console.log(`assetTypeArray is ${assetTypeArray[0]}, subTypeArray is ${subTypeArray[0]}`)
                let returnArray = [];
                let threatQuery = await ThreatFeasibilityLibAdvModel.find({ "transmissionMedia": { $in: transmissionMediaArray } }).lean()
                    .then(resp => {
                        // console.log(`query by transmissionMedia returns: `);
                        // console.dir(resp);
                        // console.log(`query by transmissionMedia return length is: ${resp.length}`);

                        for (let [index, type] of assetTypeArray.entries()) {
                            // let returnObj = {
                            //     attackMethod: "",
                            //     assetType: assetTypeArray[index],
                            //     assetSubType: subTypeArray[index],
                            //     transmissionMedia: transmissionMediaArray[index],
                            //     baseProtocol: baseProtocolArray[index],
                            //     componentID: "",
                            //     appProtocol: appProtocolArray[index],
                            //     secureProtocol: securityProtocolArray[index],
                            //     threatType: "",
                            //     APEquipmentRat: "",
                            //     APEquipmentScore: 0,
                            //     APKnowledgeRat: "",
                            //     APKnowledgeScore: 0,
                            //     APExpertiseRat: "",
                            //     APExpertiseScore: 0,
                            //     APElapsedTimeRat: "",
                            //     APElapsedTimeScore: 0,
                            //     APWindowRat: "",
                            //     APWindowScore: 0,
                            //     mitigations: "",
                            // };
                            if (appProtocolArray[index].length == 0) appProtocolArray[index] = [""];
                            if (securityProtocolArray[index].length == 0) securityProtocolArray[index] = [""];
                            // console.log(`assetType is ${assetTypeArray[index]}, subType is ${subTypeArray[index]}, transmissionMedia is ${transmissionMediaArray[index]},
                            //     baseProtocol is ${baseProtocolArray[index]}, appProtocol is ${appProtocolArray[index]}, securityProtocol is ${securityProtocolArray[index]}`)
                            let matchingObj = resp.filter(document => {
                                if (document.subType == "" || !document.subType) { // if subType is "any" or it doesn't exist (maybe bug in research portal) ignore subType
                                    // console.log(`document.assetType is ${document.assetType}, and assetTypeArray[index] is ${assetTypeArray[index]}, so ${document.assetType == assetTypeArray[index]}... ${document.transmissionMedia == transmissionMediaArray[index]},
                                    //     ${document.baseProtocol == baseProtocolArray[index]}, ${appProtocolArray[index].includes(document.appProtocol)}, 
                                    //     ${securityProtocolArray[index].includes(document.secureProtocol)}`)
                                    if (document.assetType == assetTypeArray[index] && document.transmissionMedia == transmissionMediaArray[index]
                                        && document.baseProtocol == baseProtocolArray[index] && appProtocolArray[index].includes(document.appProtocol) &&
                                        securityProtocolArray[index].includes(document.secureProtocol)) {
                                        return true
                                    } else {
                                        return false
                                    }
                                } else { // if subType has something, subType has to match
                                    if (document.assetType == assetTypeArray[index] && document.transmissionMedia == transmissionMediaArray[index] &&
                                        document.subType == subTypeArray[index] && document.baseProtocol == baseProtocolArray[index] &&
                                        appProtocolArray[index].includes(document.appProtocol) && securityProtocolArray[index].includes(document.secureProtocol)) {
                                        return true
                                    } else {
                                        return false
                                    }
                                }

                            });
                            // console.log(`matchingObj is `)
                            // console.log(matchingObj);
                            returnArray.push(matchingObj);
                        }
                    })
                    .then(resp => {
                        // console.log(`returnArray is `)
                        // console.dir(returnArray)
                        // console.log(returnArray[0][0]._id)
                        res.json(returnArray);
                    })
            }
        } catch (err) {
            res.status(500).send({ msg: "POST request for /groupThreatFeasibilityLibAdv failed!", error: err });
        }
    })

router
    .route("/groupFeatureImpactLib")
    .post(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                // console.log(`req.body is `);
                // console.dir(req.body);
                // console.log(typeof req.body);
                // console.log(req.body.moduleArray)
                // let moduleArray = req.body.module.split(",");
                // let featureArray = req.body.feature.split(",");
                // let moduleIdArray = req.body.moduleId.split(",");
                // let featureIdArray = req.body.featureId.split(",");
                // console.log(`assetTypeArray is ${assetTypeArray[0]}, subTypeArray is ${subTypeArray[0]}`)
                // console.log(`req.body is `);
                // console.dir(req.body);
                // let bodyJSON = JSON.parse(req.body);
                // console.log(bodyJSON);
                // console.log(typeof bodyJSON);
                let moduleArray = req.body.moduleArray;
                let featureArray = req.body.featureArray;
                let moduleIdArray = req.body.moduleIdArray;
                let featureIdArray = req.body.featureIdArray;
                // console.log(`moduleIdArray is ${moduleIdArray}`);

                let returnArray = [];
                let threatQuery = await FeatureImpactLibModel.find({ "moduleId": { $in: moduleIdArray } })
                    .then(resp => {
                        // console.log(`query by assetType returns: ${resp[0]}`)
                        for (let [index, type] of moduleIdArray.entries()) {
                            let returnObj = {
                                module: "",
                                feature: "",
                                moduleId: "",
                                featureId: "",
                                featureImpactObj: {},
                            };
                            returnObj.module = moduleArray[index];
                            returnObj.feature = featureArray[index];
                            returnObj.moduleId = moduleIdArray[index];
                            returnObj.featureId = featureIdArray[index];
                            returnObj.featureImpactObj = objOperation.findObjectByTwoPropertyValues(resp, "moduleId", moduleIdArray[index], "featureId", featureIdArray[index]);
                            returnArray.push(returnObj);
                            // console.log(`module is ${returnObj.module}, feature is ${returnObj.feature}, returnObj.featureImpactObj is ${returnObj.featureImpactObj}`)
                        }
                    })
                    .then(resp => {
                        res.json(returnArray);
                    })
            }
        } catch (err) {
            res.status(500).send({ msg: "POST request for /groupFeatureImpactLib failed!", error: err });
        }
    })

router
    .route("/userAddedThreatLib") // retrieve user added threats
    // .get(async (req, res) => {
    //     try {
    //         // console.log("libraries/userAddedThreatLib GET");
    //         // console.log(req.query);
    //         let featureIdList = req.query.fromFeatureId.split(",");
    //         // console.log(featureIdList)
    //         let userAddedThreatArray = await UserAddedThreatLibModel.find({fromFeatureId: {$in: featureIdList}});
    //         res.json(userAddedThreatArray);
    //     } catch (err) {
    //         res.status(500).send({ error: "GET request for libraries/userAddedThreatLib failed!"});
    //     }
    // })
    .post(async (req, res) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                // console.log(`querying asset id group: `);
                // console.dir(req.body)
                let featureIdList = req.body.fromFeatureId;
                // console.log(`assetIdList: `);
                // console.dir(assetIdList)
                // console.log(`assetIdList: ${assetIdList[0]}, ${assetIdList[1]}`)
                let userAddedThreatArray = await UserAddedThreatLibModel.find({ fromFeatureId: { $in: featureIdList } });
                // console.log(`query return is`)
                // console.log(output[0])
                res.json(userAddedThreatArray);
            }
        } catch (err) {
            res.status(500).send({ msg: "POST request for libraries/userAddedThreatLib failed!", error: err });
        }
    })
router
    .route("/systemconfig")
    .get(async (req, res, next) => {
        try {
            if (req.headers.authorization !== ACCESS_TOKEN) {
                res.status(401).send({ msg: "You are not allowed to access the route" });
            } else {
                let configParam = await systemConfigModel.find({});
                res.json(configParam[0]);
            }
        } catch (err) {
            res.status(500).send({ error: "GET request for systemconfig failed!", err: err });
        }
    })
module.exports = router;
