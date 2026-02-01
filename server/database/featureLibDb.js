const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const asyncPackage = require('async');
const FeatureAssetSchema = require("../models/featureAssetModelSchema").FeatureAssetSchema;
const FeatureImpactLibSchema = require("../models/threatLibModelSchema").FeatureImpactLibSchema;
const AssetLibSchema = require("../models/threatLibModelSchema").AssetLibSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const controlUnitSchema = require("../models/componentModelSchema").controlUnitSchema;
const { get } = require("http");

const featureAssetModel = atlasTrialDbConnection.model("featureAssetModel", FeatureAssetSchema, "featureAssetLib");
const featureImpactLibModel = atlasTrialDbConnection.model("featureImpactLibModel", FeatureImpactLibSchema, "featureImpactLib");
const controlUnitModel = atlasTrialDbConnection.model("controlUnitModel", controlUnitSchema, "controlUnitLib");
const assetLibModel = atlasTrialDbConnection.model("AssetLibModel", AssetLibSchema, "assetLib");

require('dotenv').config({ path: __dirname+'/./../.env'});

router
    .route("/featureassetlib")
    .get(async (req, res, next) => { // "Settings" uses this GET to retrieve all available assets. Side panel uses this to retrieve particular feature(s)
        try {
            let queryLimit = 0; // by default no limit
            // console.log(req.query.featureList)
            if (req.query.featureList) { // if query is specified
                // queryProperty = {"_id": {$in: req.query.featureList.split(",")}};
                let featureAssetArray = {
                    asset: [],
                    assetId: [],
                    assetType: [],
                    assetSubType: [],
                    index: [],
                    missingFeaturesArray: [],
                    msg: ""
                };
                let featureIdList = req.query.featureList.split(",");
                let featureRoleIndexList = req.query.featureRoleList.split(",");
                // console.log(featureIdList);
                const options = {
                    new: true,
                    upsert: true,
                    useFindAndModify: false
                };
                asyncPackage.forEachOf(featureIdList, (item, index, callback) => {
                        let featureIndex = index; // feature index, used for assetFeatureIndex
                        // console.log(`feature ${update[featureIndex]} is queried.`)
                        // console.log(`_id is ${item}`)
                        featureAssetModel.findById(item, async (err, result) => {
                            if (err) {
                                console.log(`feature-asset library GET error: `);
                                console.dir(err);
                                callback(err)
                            } else {
                                if (result) { // if a match is found
                                    // console.log(`returned assets are ${result.assets}`);
                                    let featureRoleSpecificAssetName = "assets" + featureRoleIndexList[index];
                                    // console.log(featureRoleSpecificAssetName);
                                    // console.log(result[featureRoleSpecificAssetName])
                                    let assetsId = []
                                    for(let i = 0; i < 9; i++){// Adding assetId1,assetId2 ... 
                                        if(assetsId[i]){
                                          assetsId.push(...result[`assetsId${i}`])
                                        }
                                    }
                                    const allAssetIds = [...result.assetsId,...assetsId];
                                    let assetsDestails = [];
                                    try {
                                        assetsDestails = await assetLibModel.find({ _id: { $in: allAssetIds }}, {assetType: 1, subType: 1});
                                    } catch (error) {
                                        return res.status(500).send({msg: "asset library GET error"});
                                    }
                                    if (result[featureRoleSpecificAssetName] && result[featureRoleSpecificAssetName].length>0) { // if the feature role has its specific assets
                                        let featureRoleSpecificAssetIdName = "assetsId" + featureRoleIndexList[index];
                                        for (let ind=0; ind<result[featureRoleSpecificAssetName].length; ind++) {
                                            featureAssetArray.asset.push(result[featureRoleSpecificAssetName][ind]);
                                            featureAssetArray.assetId.push(result[featureRoleSpecificAssetIdName][ind]);
                                            featureAssetArray.index.push(featureIndex); // the index is to create a link between asset and feature
                                            const selectedAsset = assetsDestails.find(asset => asset._id == result[featureRoleSpecificAssetIdName][ind]);
                                            if(selectedAsset){
                                                featureAssetArray.assetType.push(selectedAsset.assetType);
                                                featureAssetArray.assetSubType.push(selectedAsset.subType);
                                            } else {
                                                featureAssetArray.assetType.push("");
                                                featureAssetArray.assetSubType.push("");
                                            }
                                        }
                                    } else { // if the feature role doesn't have its specific assets, use the default assets for all feature roles
                                        for (let ind=0; ind<result.assets.length; ind++) {
                                            featureAssetArray.asset.push(result.assets[ind]);
                                            featureAssetArray.assetId.push(result.assetsId[ind]);
                                            featureAssetArray.index.push(featureIndex); // the index is to create a link between asset and feature
                                            const selectedAsset = assetsDestails.find(asset => asset._id == result.assetsId[ind]);
                                            if(selectedAsset){
                                                featureAssetArray.assetType.push(selectedAsset.assetType);
                                                featureAssetArray.assetSubType.push(selectedAsset.subType);
                                            } else {
                                                featureAssetArray.assetType.push("");
                                                featureAssetArray.assetSubType.push("");
                                            }
                                        }
                                    }
                                    callback(null)
                                } else { // if an match is not found, record the feature and send it back to front end
                                    featureAssetArray.missingFeaturesArray.push(item);
                                    callback(null);
                                }

                            };
                        });
                }, function (err) {
                    if (err) {
                        console.log(`feature-asset library GET error: `);
                        console.dir(err);
                        return res.status(500).send({msg: "feature-asset library GET error"});
                    }
                    // sort featureAssetArray into monotonically increasing 
                    if (featureAssetArray.index.length>1) {
                        let newIndexs = featureAssetArray.index.map((o,index) => { return {index, val: o}}).sort((a,b) => a.val - b.val);
                        const prepareObj = (arr) => {
                            return newIndexs.map(a => { return arr[a.index]})
                        };
                        featureAssetArray.asset = prepareObj(featureAssetArray.asset);
                        featureAssetArray.assetId = prepareObj(featureAssetArray.assetId);
                        featureAssetArray.assetType = prepareObj(featureAssetArray.assetType);
                        featureAssetArray.assetSubType = prepareObj(featureAssetArray.assetSubType);
                        featureAssetArray.index = prepareObj(featureAssetArray.index);
                    }
                    // console.log(`result to send is ${featureAssetArray}`)
                    return res.status(200).send(featureAssetArray);
                });
            } else { // otherwise return the whole database, except features of commLine
                if (req.query.limit) { // if needed to limit how many features to show
                    queryLimit = parseInt(req.query.limit);
                }
                let featureAssetArray;
                if ( req.query.global == '1' ) { // req.query.global 1 means we have to search name and feature type
                    featureAssetArray = await featureAssetModel.find({$and: [
                        {_id: {$ne: "5fcbcc45c4c9a731a8bb0f6d"}}, // "CAN/CAN FD Communication for commLine"
                        {_id: {$ne: "5fcbcc90c4c9a731a8bb0f6e"}}, // Ethernet Communication for commLine
                        {_id: {$ne: "601c1fdb76719d2b8c000eec"}}, // LIN Communication for commLine
                        {_id: {$ne: "601c1fe576719d2b8c000eed"}}, // USB Communication for commLine
                        {_id: {$ne: "606b71b291011b00c868919d"}}, // GNSS Communication for commLine
                        {_id: {$ne: "606b71c791011b00c868919e"}}, // Cellular Communication for commLine
                        {_id: {$ne: "606b73df91011b00c86891a3"}}, // Bluetooth Communication for commLine
                        {_id: {$ne: "606b73e891011b00c86891a4"}}, // Bluetooth LE Communication for commLine
                        {_id: {$ne: "606b73f091011b00c86891a5"}}, // WiFi Communication for commLine
                        {_id: {$ne: "606b76bf91011b00c86891a6"}}, // NFC Communication for commLine
                        {_id: {$ne: "606b76c791011b00c86891a7"}}, // RFID Communication for commLine
                        {_id: {$ne: "61283db389cddb2698ba7105"}}, // DSRC V2X Communication for commLine
                        {$or: [
                            {"name": new RegExp(req.query.searchTerm.toLowerCase(), "ig")},
                            {"featureType": new RegExp(req.query.searchTerm.toLowerCase(), "ig")}]
                    }]}).sort({_id: -1}).limit(queryLimit);
                } else { // req.query.global === 0 means we are searching in name only
                    featureAssetArray = await featureAssetModel.find({$and: [
                        {_id: {$ne: "5fcbcc45c4c9a731a8bb0f6d"}}, // "CAN/CAN FD Communication for commLine"
                        {_id: {$ne: "5fcbcc90c4c9a731a8bb0f6e"}}, // Ethernet Communication for commLine
                        {_id: {$ne: "601c1fdb76719d2b8c000eec"}}, // LIN Communication for commLine
                        {_id: {$ne: "601c1fe576719d2b8c000eed"}}, // USB Communication for commLine
                        {_id: {$ne: "606b71b291011b00c868919d"}}, // GNSS Communication for commLine
                        {_id: {$ne: "606b71c791011b00c868919e"}}, // Cellular Communication for commLine
                        {_id: {$ne: "606b73df91011b00c86891a3"}}, // Bluetooth Communication for commLine
                        {_id: {$ne: "606b73e891011b00c86891a4"}}, // Bluetooth LE Communication for commLine
                        {_id: {$ne: "606b73f091011b00c86891a5"}}, // WiFi Communication for commLine
                        {_id: {$ne: "606b76bf91011b00c86891a6"}}, // NFC Communication for commLine
                        {_id: {$ne: "606b76c791011b00c86891a7"}}, // RFID Communication for commLine
                        {_id: {$ne: "61283db389cddb2698ba7105"}}, // DSRC V2X Communication for commLine
                        {$or: [
                            {"name": new RegExp(req.query.searchTerm.toLowerCase(), "ig")}]
                    }]}).sort({ _id: -1 }).limit(queryLimit);
                }
                res.status(200).send(featureAssetArray);
            }
        } catch (err) {
            res.status(500).send("Error: feature-asset library GET error");
            res.end();
        }
    })
    .post(async (req, res, next) => {
        try {
            // console.log(req.body);
            let filter = {_id: ""}
            const applicationIds = [];
            const updateApplication = [];
            let oldFeatures = null;
            if (req.body._id) {
                filter = {_id: req.body._id};

                // if(req.body.application && req.body.application.length > 0 ){
                //   req.body.application.forEach(e => {
                //     if(e._id) {
                //       applicationIds.push(mongoose.Types.ObjectId(e._id));
                //     }
                //   });

                //   oldFeatures = await featureImpactLibModel.find({_id: {$in: applicationIds}});
                // }
            } else {
                filter = {_id: mongoose.Types.ObjectId()}
            }
            // const modulesToAdd = [...req.body.module];
            // const moduleIdToAdd = [...req.body.moduleId];

            const options = {
              new: true,  // return the updated document
              upsert: true,
              useFindAndModify: false
          };

            const update = {
                name: req.body.name,
                featureType: req.body.featureType,
                assets: req.body.assets,
                assetsId: req.body.assetsId
            };

            let updatedDoc = await featureAssetModel.findOneAndUpdate(filter, update, options)

            // if(oldFeatures && oldFeatures.length > 0) {
            //   const removedModules  = oldFeatures.filter(o=> !req.body.application.some(i=> i.module === o.module));
            //   if(removedModules && removedModules.length > 0) {
            //     const arr = [];
            //     removedModules.forEach(x => {
            //       arr.push(mongoose.Types.ObjectId(x.moduleId));
            //     })
            //       let moduleList = await controlUnitModel.find({_id: {$in : arr}});
            //       if(moduleList && moduleList.length > 0) {
            //         for (const module of moduleList) {
            //           if(module.featureId && module.featureId.length > 0) {
            //             const found = module.featureId.filter(x => x == req.body._id);

            //             if(found && found.length > 0) {
            //               const index = module.featureId.indexOf(found[0]);
            //               if(index != -1) {
            //                 module.featureId.splice(index, 1);
            //                 module.feature.splice(index, 1);
            //                 module.featureType.splice(index, 1);
            //                 module.featureRole.splice(index, 1);

            //                 const _update = {
            //                   featureId: module.featureId,
            //                   feature: module.feature,
            //                   featureType: module.featureType,
            //                   featureRole: module.featureRole
            //                 };

            //                 const result = await controlUnitModel.findOneAndUpdate({_id: mongoose.Types.ObjectId(module._id)}, _update, options);
            //               }
            //             }
            //           }
            //         }
            //       }
            //   }
            // }

            res.status(200).send(updatedDoc);
        } catch (err) {
            res.status(500).send("Error: feature-asset library update error");
            res.end();
        }
    })
    .delete(async (req, res) => {
        try {
            let updatedDoc = await featureAssetModel.findByIdAndDelete(req.query._id)
            let deleteFeatureId = await controlUnitModel.find({ featureId: { "$in" : [req.query._id]} },(err,result)=>{
                if(err){
                    // console.log(err)
                }
                if(result){
                    // console.log(result)
                  result.forEach(item=>{
                   let indices = [];
                   item.featureId.filter(function(yourArray, index) {
                   if(yourArray == req.query._id ){
                     indices.push(index)
                    }
                });
                indices.reverse().map(i=>{
                    item.feature.splice(i,1)
                    item.featureRole.splice(i,1)
                    item.featureType.splice(i,1)
                    item.featureId.splice(i,1)
                })

                   let nonDuplicate = item.featureId.filter(x => item.featureId.filter(y => x === y).length === 1)
                   
                   nonDuplicate.map((id,i2)=>{
                    if(id == req.query._id){
                       item.feature.splice(i2,1)
                       item.featureRole.splice(i2,1)
                       item.featureType.splice(i2,1)
                       item.featureId.splice(i2,1)
                    }
                   })


                  const options = {
                    upsert: true,
                    useFindAndModify: false
                };
                
                  controlUnitModel.updateOne({_id: mongoose.Types.ObjectId(item._id)}, item, options,(err,result)=>{
                    if(err) console.log('save error>>>',err)
                    if(result) console.log('save result COPY>>>>',result)
                  });
                  })
                }
            }).clone();

            res.status(200).send(updatedDoc);
        } catch (err) {
            res.status(500).send("Error: feature-asset library DELETE error");
        }
    })

router
    .route("/featureimpactlib") // TODO: This route is also used by the main algorithm, under /api/libraries/featureimpactlib. May need to merge.
    .get(async (req, res, next) => {
        try {
            // console.log(req.query)
            let featureImpactDoc = [];
            if (req.query.featureRole != "any" && req.query.featureId) { // used in Feature Settings Feature Role
                featureImpactDoc = await featureImpactLibModel.find({featureId: req.query.featureId, featureRole: req.query.featureRole });
            } else if (req.query) {
                delete req.query.featureRole;
                // console.log(req.query)
                featureImpactDoc = await featureImpactLibModel.find(req.query);
            } else {
                featureImpactDoc = await featureImpactLibModel.find({});
            }
            // console.log(featureImpactDoc)
            res.status(200).send(featureImpactDoc);
        } catch (err) {
            res.status(500).send({msg: "feature impact library retrieval error"});
            res.end();
        }
    })
    .post(async (req, res, next) => {
        try {
            // console.log(req.body);
            const options = {
                new: true,
                upsert: true,
                useFindAndModify: false
            };
            let idArray = []; // collect _id of each entry
            let update = req.body;
            let response = [];
            const featureArray = [];
            // let updatedObj = await featureImpactLibModel.findOneAndUpdate({_id: update[0]._id}, update[0], options);
            // response = await featureImpactLibModel.find({_id: {$in: idArray}}); // check if operation is successful
            // res.status(200).send(response);
            // console.dir(update);
            asyncPackage.eachSeries(update, async function updateFeatureImpactLib(currentObj, callback) {
                if (!currentObj._id) {
                    currentObj._id = mongoose.Types.ObjectId();
                }
                // console.log(`currentObj is `)
                // console.dir(currentObj)
                idArray.push(currentObj._id);
                let updatedObj = await featureImpactLibModel.findOneAndUpdate({_id: currentObj._id}, currentObj, options);

                //adding new features data to controlunits but this is now done in controlunit patch function
                // let controlUnit = await controlUnitModel.findById(currentObj.moduleId);

                // if(controlUnit) {
                //   let toAddFeature = [];
                //   let toAddFeatureId = [];
                //   let toAddFeatureRole = [];
                //   let toAddFeatureType = [];

                //   if(controlUnit.featureId && controlUnit.featureId.length > 0) {
                //     const found = controlUnit.featureId.filter(x => x == currentObj.featureId);
                //     if(found && found.length > 0) {
                //       return;
                //     } else {
                //       toAddFeature = [...controlUnit.feature];
                //       toAddFeatureId = [...controlUnit.featureId];
                //       toAddFeatureRole= [...controlUnit.featureRole];
                //       toAddFeatureType= [...controlUnit.featureType];
                //     }
                //   }

                //   toAddFeature.push(currentObj.feature);
                //   toAddFeatureId.push(currentObj.featureId);
                //   toAddFeatureRole.push(currentObj.featureRole);
                //   toAddFeatureType.push(currentObj.featureType);

                //   const _update = {
                //     feature: toAddFeature,
                //     featureId: toAddFeatureId,
                //     featureRole: toAddFeatureRole,
                //     featureType: toAddFeatureType
                //   }

                // //   let result = await controlUnitModel.findOneAndUpdate({_id: mongoose.Types.ObjectId(currentObj.moduleId)}, _update, options);
            // }

            }, async function(err) {
                callback = async function(returnedData) {
                    // console.log(`callback function executed`);
                    response = await featureImpactLibModel.find({_id: {$in: returnedData}}); // check if operation is successful
                    res.status(200).send(response);
                };
                if (err) {
                    console.log(`feature impact library update error: `);
                    console.dir(err);
                    res.status(500).send("Error: feature impact library update error");
                } else {
                    callback(idArray);
                }
            });
            // console.log(`idArray is ${idArray}`);
            // response = await featureImpactLibModel.find({_id: {$in: idArray}}); // check if operation is successful
            // res.status(200).send(response);
        } catch (err) {
            console.log(`feature impact library update error: `);
            console.dir(err);
            res.status(500).send("Error: feature impact library update error");
        }
    })
    .delete(async (req, res) => {
        try {
            let featureImpactIdArray = req.query._idArray.split(",");
            featureImpactIdArray = featureImpactIdArray.filter(item => item !== "")
            // console.log(`featureImpactIdArray to be deleted is ${featureImpactIdArray}`);
            let updatedDoc = await featureImpactLibModel.deleteMany({_id: {$in: featureImpactIdArray}});
            let moduleIdArray = req.query.moduleId.split(",");
            let featureRole = req.query.featureRole
            moduleIdArray = moduleIdArray.filter(item => item !== "")
            asyncPackage.eachSeries(moduleIdArray, async function updateControlUnitLibFeatureByModuleId(currentModuleId, callback) {
              await controlUnitModel.findById(
                mongoose.Types.ObjectId(currentModuleId),
               async function (err, controlUnitDoc) {
                    let index;
                    controlUnitDoc.featureId.map((item,i)=>{
                      if(item==req.query.featureId && controlUnitDoc.featureRole[i]==featureRole){
                        index = i 
                      }
                    })
                //   const featureIndex = controlUnitDoc.featureId.indexOf(req.query.featureId);
                  if (index >-1) {
                    controlUnitDoc.featureId.splice(index, 1);
                    controlUnitDoc.feature.splice(index, 1);
                    controlUnitDoc.featureType.splice(index, 1);
                    controlUnitDoc.featureRole.splice(index, 1);
                    
                    // controlUnitDoc.save(function (err) {
                    //   if (err) console.error(err)
                    // })
                    const options = {
                        upsert: true,
                        useFindAndModify: false
                      };
                   const ds = await controlUnitModel.updateOne({_id: mongoose.Types.ObjectId(currentModuleId)}, controlUnitDoc, options)
                  }
                }
              ).clone();
              // console.log(`currentObj is `)
              // console.dir(currentObj)
            }, async function(err) {
              callback = async function(returnedData) {
                  // console.log(`callback function executed`);
                  let response = await controlUnitModel.find({moduleId: {$in: returnedData}}); // check if operation is successful
                  res.status(200).send(response);
              };
              if (err) {
                  console.log(`Error when deleting a feature or feature application: `);
                  console.dir(err);
                  res.status(500).send("Error: Error when deleting a feature or feature application");
              } else {
                  callback(moduleIdArray)
              }
            });
            // const updatedObj = await controlUnitModel.findById(
            //   mongoose.Types.ObjectId(req.query.moduleId),
            //   function (err, controlUnitDoc) {
            //     const featureIndex = controlUnitDoc.featureId.indexOf(req.query.featureId);
            //     controlUnitDoc.featureId.splice(featureIndex, 1);
            //     controlUnitDoc.feature.splice(featureIndex, 1);
            //     controlUnitDoc.save(function (err) {
            //       if (err) console.error(err)
            //     })
            //   }
            // );
            // if(req.query.moduleId) {
            //   let controlUnit = await controlUnitModel.findById(req.query.moduleId);

            //     if(controlUnit) {
            //       let toAddFeature = [];
            //       let toAddFeatureId = [];
            //       let toAddFeatureRole = [];
            //       let toAddFeatureType = [];

            //       if(controlUnit.featureId && controlUnit.featureId.length > 0) {
            //         const found = controlUnit.featureId.filter(x => x == req.query.featureId);
            //         if(found && found.length > 0) {
            //           const index = controlUnit.featureId.indexOf(found[0]);
            //           if(index != -1) {
            //             toAddFeature = [...controlUnit.feature];
            //             toAddFeatureId = [...controlUnit.featureId];
            //             toAddFeatureRole= [...controlUnit.featureRole];
            //             toAddFeatureType= [...controlUnit.featureType];

            //             toAddFeature.splice(index, 1);
            //             toAddFeatureId.splice(index, 1);
            //             toAddFeatureRole.splice(index, 1);
            //             toAddFeatureType.splice(index, 1);

            //             const _update = {
            //               feature: toAddFeature,
            //               featureId: toAddFeatureId,
            //               featureRole: toAddFeatureRole,
            //               featureType: toAddFeatureType
            //             };
            //             const options = {
            //               new: true,
            //               upsert: true,
            //               useFindAndModify: false
            //             };
            //             let result = await controlUnitModel.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.query.moduleId)}, _update, options);

            //           }

            //         }
            //       }
            //     }
            // }
            // res.status(200).send(updatedObj);
        } catch (err) {
            res.status(500).send({msg: "featureImpactLib DELETE error"});
        }
    })

router
    .route("/featureimpactlibgroup") // use this route to retrieve a group of module IDs
    .post(async (req, res, next) => { // use POST instead of GET because GET has a length limit
        try {
            const moduleIdList =  req.body.moduleIdList;
            const moduleIdFilter = {moduleId : { $in : moduleIdList }};
            const featureImpactDoc = await featureImpactLibModel.find(moduleIdFilter);
             res.status(200).send(featureImpactDoc);
        } catch (err) {
            res.status(500).send({msg: "feature impact library group retrieval error"});
            res.end();
        }
    })

router
    .route("/featureimpactlibbymodule")
    .get(async (req, res, next) => {
        try {
            const featureIdList =  [];
            if(req.query.featureIds){
              req.query.featureIds.split(",").forEach(x => {
                  featureIdList.push(x);
              });
            }

            const feature = {featureId : { $in : featureIdList }, module: {$eq: req.query.module}};
            const featureAssets = await featureImpactLibModel.find(feature);

            res.status(200).send({data: featureAssets, status: true , msg: "Features for the module are successfully retrieved."});
        } catch (err) {
            res.status(500).send({msg: "featureImpactLibByModule GET route error"});
        }
    })
    .post(async (req, res, next) => { // update featureImpactLib by module id
        try {
            const options = {
                new: true,  // return the updated document
                upsert: true,
                useFindAndModify: false
            };
            let idArray = []; // collect _id of each entry
            let update = req.body;
            // console.dir(update)
            await asyncPackage.eachSeries(update, async function updateFeatureImpactLibByModuleId(currentObj, callback) {
                if (currentObj.delete) { // if delete a module
                    await featureImpactLibModel.deleteMany({moduleId: currentObj._id})
                } else { // if update a module
                    await featureImpactLibModel.updateMany({moduleId: currentObj._id}, {$set: {module:currentObj.module,moduleId:currentObj._id}},{multi:true})
                }
                // console.log(`currentObj is `)
                // console.dir(currentObj)
                idArray.push(currentObj._id);
            }, async function(err) {
                callback = async function(returnedData) {
                    // console.log(`callback function executed`);
                    let response = await featureImpactLibModel.find({moduleId: {$in: returnedData}}); // check if operation is successful
                    res.status(200).send(response);
                };
                if (err) {
                    console.log(`feature impact library by module update error: `);
                    console.dir(err);
                    res.status(500).send("Error: feature impact library by module update error");
                } else {
                    callback(idArray)
                }
            });
            // for (let i=0; i<req.body.length; i++) {
            //     if (req.body[i].delete) { // if delete a module
            //         await featureImpactLibModel.deleteMany({moduleId: update[i].moduleId})
            //     } else { // if update a module
            //         await featureImpactLibModel.updateMany({moduleId: update[i].moduleId}, {$set: update[i]})
            //         // await FeatureImpactLibModel.updateMany({moduleId: update[i].moduleId}, {$set: {module: update[i].module}})
            //     }
            //     idArray.push(update[i].moduleId);
            // }
            // let response = await featureImpactLibModel.find({moduleId: {$in: idArray}}); // check if operation is successful
            // console.log(`idArray is ${idArray}`);
            // console.log(`response is ${response}`)
            // res.status(200).send(response);
        } catch (err) {
            res.status(500).send("Error: feature impact library by module update error");
            res.end();
        }
    })
    .delete(async (req, res, next) => {
        try {
          const featureId = req.query.featureId;
          const moduleId = req.query.moduleId;
          const __Id = req.query._id; // id of feature impact lib
          let module = await controlUnitModel.findById(moduleId);
          if(module) {
            const found = module.featureId.find(x => x == featureId);
            if(found) {
              let index;
              module.featureId.map((item,i)=>{ //Compare both featureId and Role for exact match
                if(item == req.query.featureId && module.featureRole[i] == req.query.featureRole){
                  index = i 
                }
              })
              if(index>-1) {
                module.featureId.splice(index, 1);
                module.feature.splice(index, 1);
                module.featureType.splice(index, 1);
                module.featureRole.splice(index, 1);
    
                const _update = {
                  featureId: module.featureId,
                  feature: module.feature,
                  featureType: module.featureType,
                  featureRole: module.featureRole
                };
    
                const options = {
                  new: true,  // return the updated document
                  upsert: true,
                  useFindAndModify: false
                };
    
                const result = await controlUnitModel.updateOne({_id: mongoose.Types.ObjectId(moduleId)}, _update, options);
                await featureImpactLibModel.deleteOne({_id: mongoose.Types.ObjectId(__Id)});
                return res.status(200).send({status: true, msg: 'Feature deleted from module successfully'});
              }
            } else {
              return res.status(404).send({status: false, msg: 'Feature not found'});
            }
          } else {
            return res.status(404).send({status: false, msg: 'Module not found'});
          }
        } catch (err) {
            res.status(500).send("Error: control-unit library DELETE error");
            res.end();
        }
    })

router
    .route("/featureassetlibByAsset") // this API name is wrong. the content is not about featureAssetLib
    .post(async (req, res, next) => {
      try {

        const feature = req.body.feature;
        const originalFeatureId = req.body.originalFeatureId;
        const hasChange = req.body.hasChange;

        if(feature) {

          const filter = {featureId: originalFeatureId, moduleId: feature.moduleId};
          const update = {
            featureId: feature.featureId,
            feature: feature.feature,
            SLevel: feature.SLevel,
            FLevel: feature.FLevel,
            OLevel: feature.OLevel,
            PLevel: feature.PLevel,
            damageScenario: feature.damageScenario,
            featureRole: feature.featureRole,
            featureType: feature.featureType
          };
          const options = {
              new: true,  // return the updated document
              upsert: true,
              useFindAndModify: false
          };
          const test = await featureImpactLibModel.findOneAndUpdate({_id: feature._id}, update, options);

          if(hasChange) {
            let module = await controlUnitModel.findById(feature.moduleId);

            if(module) {
              const found = module.featureId.find(x => x == originalFeatureId);
              if(found) {
                const index = module.featureId.indexOf(found);
                if(index !== -1) {
                  // removing the original value
                  module.featureId.splice(index, 1);
                  module.feature.splice(index, 1);
                  module.featureType.splice(index, 1);
                  module.featureRole.splice(index, 1);

                  // adding new value
                  module.featureId.push(feature.featureId);
                  module.feature.push(feature.feature);
                  module.featureType.push(feature.featureType);
                  module.featureRole.push(feature.featureRole);

                  const _update = {
                    featureId: module.featureId,
                    feature: module.feature,
                    featureType: module.featureType,
                    featureRole: module.featureRole
                  };

                  const result = await controlUnitModel.updateOne({_id: feature.moduleId}, _update, options);
                }
              }
            }
          }

          return res.status(200).send({status: true, msg: 'Feature updated successfully'});

        } else {
          return res.status(404).send({status: false, msg: 'No data posted'});
        }
      } catch (err) {
        res.status(500).send("Error: control-unit library POST error");
          res.end();
      }
  })


router
    .route("/featureassetlibSingleFeature") // this is used by Feature Settings under Settings to retrieve and update feature-role specific assets
    .get(async (req, res, next) => {
        try {
            let returnedFeature = await featureAssetModel.findById(req.query._id)
            res.status(200).send(returnedFeature);
        } catch (err) {
            res.status(500).send("Error: feature-asset library GET error for featureassetlibSingleFeature route");
        }
    })
    .post(async (req, res, next) => {
        try {
            let filter = {_id: req.body._id}
            // if (req.body._id) {
            //     filter = {_id: req.body._id};
            // } else {
            //     filter = {_id: mongoose.Types.ObjectId()}
            // }
            const options = {
              new: true,  // return the updated document
              upsert: false,
              useFindAndModify: false
            };
            const assetPropertyName = "assets" + req.body.featureRoleIndex;
            const assetIdPropertyName = "assetsId" + req.body.featureRoleIndex;
            var update = {};
            update[assetPropertyName] = req.body[assetPropertyName];
            update[assetIdPropertyName] = req.body[assetIdPropertyName];
            update.featureType = req.body.featureType
            let updatedDoc = await featureAssetModel.findOneAndUpdate(filter, update, options)
            res.status(200).send(updatedDoc);
        } catch (err) {
            res.status(500).send("Error: feature-asset library POST error for featureassetlibSingleFeature route");
        }
    })
module.exports = router;