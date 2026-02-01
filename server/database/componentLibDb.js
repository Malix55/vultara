const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const asyncPackage = require("async");
const controlUnitSchema = require("../models/componentModelSchema").controlUnitSchema;
const FeatureImpactLibSchema = require("../models/threatLibModelSchema").FeatureImpactLibSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const controlUnitModel = atlasTrialDbConnection.model("controlUnitModel", controlUnitSchema, "controlUnitLib");
const featureImpactLibModel = atlasTrialDbConnection.model("featureImpactLibModel", FeatureImpactLibSchema, "featureImpactLib");

router
  .route("/controlunitlib")
  .get(async (req, res, next) => {
    try {
      // let controlUnit = await controlUnitModel.find({});
      // controlUnit.forEach((element, index, myArray) => { // remove entries whose category is Actor
      //     if (element.category == "Actor") {
      //         myArray.splice(index, 1)
      //     }
      // })
      let controlUnit;
      let numberOfModuleToDisplay = 0;
      if (req.query.limit) {
        numberOfModuleToDisplay = parseInt(req.query.limit);
      }
      if (req.query.global == "1") {
        // req.query.global 1 means we have to search for all two
        controlUnit = await controlUnitModel
          .find({
            $or: [
              {
                category: new RegExp(req.query.searchTerm.toLowerCase(), "ig"),
              },
              {
                model: new RegExp(req.query.searchTerm.toLowerCase(), "ig"),
              },
            ],
          }).sort({ _id: -1})
          .limit(numberOfModuleToDisplay);
      } else {
        // req.query.global === 0 means we are searching in name only
        if (req.query.searchTerm) {
          controlUnit = await controlUnitModel
            .find({
              model: {
                $regex: new RegExp(req.query.searchTerm.toLowerCase(), "ig"),
              },
            })
            .limit(numberOfModuleToDisplay);
        } else {
          controlUnit = await controlUnitModel
            .find({}).sort({ _id: -1 })   //{_id:-1} == get latest record  {_id:1} == get oldest records
            .limit(numberOfModuleToDisplay);
        }
      }
      controlUnit.forEach((element, index, myArray) => {
        // remove entries whose category is Actor
        if (element.category == "Actor") {
          myArray.splice(index, 1);
        }
      });
      res.status(200).send(controlUnit);
    } catch (err) {
      res.status(500).send("Error: module library retrieval error");
      res.end();
    }
  })
  .post(async (req, res, next) => {
    try {
      // console.log(req.body);
      if (req.body.delete) {
        // delete a document
        let updatedDoc = await controlUnitModel.findByIdAndDelete(req.body.data[0]._id);
        let featureWithModules = await featureImpactLibModel.find({moduleId: { $eq: req.body.data[0]._id },});
        if (featureWithModules && featureWithModules.length > 0) {
          const array = [];
          featureWithModules.forEach((x) => array.push(mongoose.Types.ObjectId(x._id)));
          await featureImpactLibModel.remove({ _id: { $in: array } });
        }
        res.status(200).send(updatedDoc);
      } else {
        // modify or add a document
        let idArray = []; // collect _id of each entry
        const options = {
          new: true, // return the updated document
          upsert: true,
          useFindAndModify: false,
        };
        let update = req.body.data;
        asyncPackage.eachSeries(update, async function updateControlUnitLib(currentObj, done) {
            if (!currentObj._id) {
              currentObj._id = mongoose.Types.ObjectId();
            }
            idArray.push(currentObj._id);
            let updatedObj = await controlUnitModel.findOneAndUpdate({ _id: currentObj._id }, currentObj, options);
        },
        async function (err) {
          callback = async function (returnedData) {
            // console.log(`callback function executed`);
            let response = await controlUnitModel.find({_id: { $in: returnedData },}); // check if operation is successful
            res.status(200).send(response);
          };
          if (err) {
            console.log(`module library update error: `);
            console.dir(err);
            res.status(500).send("Error: module library update error");
          } else {
            callback(idArray);
          }
        }
        );
        // let response = await controlUnitModel.find({_id: {$in: idArray}}); // check if operation is successful
        // res.status(200).send(response);
      }
    } catch (err) {
      res.status(500).send("Error: module library update error");
    }
  })
  .delete(async (req, res) => {
    // currently not used
    try {
      let updatedDoc = await controlUnitModel.findByIdAndDelete(
        req.body.data[0]._id
      );
      res.status(200).send(updatedDoc);
    } catch (err) {
      res.status(500).send("Error: module library delete error");
    }
  })
  /**
   * This feature is to
   *  Sync Between Feature Impact Lib and Control UNit lib, remove extra values from Control Unit lib
   *  Method is updated for detect the changes after feature and featureId changed or deleted.
   */
  .patch(async (req, res) => {
    try {
      if (req.body.action == "featureConfirm") { // this call comes from confirming feature settings dialog in Feature Library
        let featureName = await req.body.feature
        let roles = await req.body.featureRole
        let types = await req.body.featureType
        let moduleIdArray = await req.body.moduleIdArray
        let newlyAdded = await req.body.newAdded
        const changedModules = await req.body.changedModules
        const changedModulesIndex = await req.body.changedModulesIndex
        let i=0;
        newlyAdded = newlyAdded.map(x => x !== undefined ? x : "");

        //Find duplicate moduleIds and add them to the duplicate array
        let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
        let duplicate = [...new Set(findDuplicates(moduleIdArray))]
        
        let indices = [];
        let copyRole =[]

        //Get the duplicate moduleIds, roles and indices
        if(duplicate.length){
        duplicate.map(item=>{
          moduleIdArray.filter(function(yourArray, index) {
                  if(yourArray == item ){
                    indices.push(index)
                  }
          });
        })

        indices.map(item=>{
          copyRole.push(req.body.featureRole[item])
        })
        copyRole = copyRole.filter(item=>item) //Remove undefined values
        moduleIdArray = moduleIdArray.filter(function(value, index) {
            return indices.indexOf(index) == -1;
        })

        roles = roles.filter(function(value, index) {
            return indices.indexOf(index) == -1;
        })
        }

        // remove all duplicate Ids from orignal moduleIds
        moduleIdArray = moduleIdArray.filter( ( el ) => !duplicate.includes( el ) );
        
        // update the features of non-duplicate moduleIds
        if(moduleIdArray.length){
        //This loop is for the non duplicate module Ids patching
        asyncPackage.eachSeries(moduleIdArray, async function updateControlUnitLibFeatureByModuleId(currentModuleId, callback) {
          await controlUnitModel.findById(
            mongoose.Types.ObjectId(currentModuleId),
           async function (err, controlUnitDoc) {
              const featureIndex = controlUnitDoc.featureId.findIndex(item=>item==req.body.featureId)
              if (featureIndex >-1 && !changedModules.some( item => item.moduleId == currentModuleId )) {
                controlUnitDoc.feature[featureIndex] = featureName
                controlUnitDoc.featureRole[featureIndex] = roles[i]
                controlUnitDoc.featureType[featureIndex] = types
                i++;
              }
                  // This condition will trigger when features are added to a ControlUnit
                  if(newlyAdded.length){
                    let matched = newlyAdded.filter(item=>item.moduleId==currentModuleId)
                    let duplicates = []
                    let role = matched.map(item=>item.featureRole)
                    let fIds = matched.map(item=>item.featureId)
                      role.map((r,index)=>{
                      if(controlUnitDoc.featureRole[featureIndex]==r && controlUnitDoc.featureId[featureIndex]==fIds[index]){
                        duplicates.push({featureRole:r,FeatureId:fIds[index]})
                      }
                  })
                  if(duplicates.length){
                    matched = matched.filter(ar => !duplicates.find(rm => (rm.featureRole === ar.featureRole) ))
                  }   
                    matched.map(item=>{
                      controlUnitDoc.feature.push(item.feature)
                      controlUnitDoc.featureRole.push(item.featureRole)
                      controlUnitDoc.featureType.push(item.featureType)
                      controlUnitDoc.featureId.push(item.featureId)
                    })
                  
                  }

                  const options = {
                    upsert: true,
                    useFindAndModify: false
                  };
      
                 const update = await controlUnitModel.updateOne({_id: mongoose.Types.ObjectId(currentModuleId)}, controlUnitDoc, options)
            }
          ).clone();
        },  function(err) {
          if (err) {
              console.log(`Error when deleting a feature or feature application: `);
              console.dir(err);
              res.status(500).send("Error: Error when deleting a feature or feature application");
          }else {
            updateDuplicateModuleFeatures()
          }
        });
      }else{
        updateDuplicateModuleFeatures()
      }

      // update the features of duplicate moduleIds
         function updateDuplicateModuleFeatures (){
        let di=0 //Index for duplicate Ids
        //This loop is for the duplicateIds
        if(duplicate.length){
         asyncPackage.eachSeries(duplicate, async function updateControlUnitLibFeatureByModuleIdCopy(currentModuleId, callback) {
          await controlUnitModel.findById(
            mongoose.Types.ObjectId(currentModuleId),
           async function (err, controlUnitDoc) {
              let indices2 = []
              controlUnitDoc.featureId.filter(function(yourArray, index) {
                if(yourArray == req.body.featureId ){
                  indices2.push(index)
                }
              });
              let commonIndex =[]
              let commonFeatures = []
              if(changedModules.length){
                commonIndex = indices2.filter(value => changedModulesIndex.includes(value));
              }
              commonIndex.map(cItem=>{
                commonFeatures.push({
                  featureRole:controlUnitDoc.featureRole[cItem],
                  featureId:controlUnitDoc.featureId[cItem],
                  feature:controlUnitDoc.feature[cItem],
                  featureType:controlUnitDoc.featureType[cItem],
                  moduleId:controlUnitDoc._id,
                })
              })
              if(commonIndex.length){
                newlyAdded = [...newlyAdded,...commonFeatures]
              }
              indices2.map(item=>{
                controlUnitDoc.feature[item] = featureName
                controlUnitDoc.featureRole[item] = copyRole[di]
                controlUnitDoc.featureType[item] = types
                di++;
              })
                

                if(newlyAdded.length){
                  let matched = newlyAdded.filter(item=>item.moduleId==currentModuleId)
                  let duplicates = []
                  let role = matched.map(item=>item.featureRole)
                  let fIds = matched.map(item=>item.featureId)
                  indices2.map(item=>{
                    role.map((r,index)=>{
                      if(controlUnitDoc.featureRole[item]==r && controlUnitDoc.featureId[item]==fIds[index]){
                        duplicates.push({featureRole:r,FeatureId:fIds[index]})
                      }
                    })
                  })
                  if(duplicates.length){
                    matched = matched.filter(ar => !duplicates.find(rm => (rm.featureRole === ar.featureRole) ))
                  } 

                  matched.map(item=>{
                    controlUnitDoc.feature.push(item.feature)
                    controlUnitDoc.featureRole.push(item.featureRole)
                    controlUnitDoc.featureType.push(item.featureType)
                    controlUnitDoc.featureId.push(item.featureId)   
                  })
                    
                }
                const options = {
                  upsert: true,
                  useFindAndModify: false
                };
    
                const update = await controlUnitModel.updateOne({_id: mongoose.Types.ObjectId(currentModuleId)}, controlUnitDoc, options)
            }
          ).clone();
        }, function(err) {
            if (err) {
              console.log(`Error when deleting a feature or feature application: `);
              console.dir(err);
              res.status(500).send("Error: Error when deleting a feature or feature application");
            }else {
              removeFeaturesFromChangedModules()
          }
        })
      }else if(changedModules.length){
          removeFeaturesFromChangedModules()
        }else{
              res.status(200).send('');
        }

      }



      function removeFeaturesFromChangedModules (){
      // Removing features from existing modules which have been changed to another module
      if(changedModules.length){
        asyncPackage.eachSeries(changedModules, async function updateControlUnitLibFeatureByModuleIdChange(currentModuleId, callback) {
          await controlUnitModel.findById(
            mongoose.Types.ObjectId(currentModuleId.moduleId),
            async function (err, controlUnitDoc) {

            const options = {
              upsert: true,
              useFindAndModify: false,
            };
              
            let indices = []
            let changes = currentModuleId.changes
            changes.map(item =>{
              let ds = controlUnitDoc.featureId.findIndex((id,i)=>id==item.featureId && item.featureRole== controlUnitDoc.featureRole[i])
              if (ds>-1){
                 indices.push(ds)
              }
            })
              
                
            indices.reverse().map(item=>{
              controlUnitDoc.feature.splice(item,1)
              controlUnitDoc.featureRole.splice(item,1)
              controlUnitDoc.featureType.splice(item,1)
              controlUnitDoc.featureId.splice(item,1)
            })

            const update = await controlUnitModel.updateOne({_id: mongoose.Types.ObjectId(currentModuleId.moduleId)}, controlUnitDoc,options)
            }
          ).clone();
          // console.log(`currentObj is `)
          // console.dir(currentObj)
        }, function(err) {
          if (err) {
              console.log(`Error when deleting a feature or feature application: `);
              console.dir(err);
              res.status(500).send("Error: Error when deleting a feature or feature application");
          }else {
            res.status(200).send('');

          }
        }
        )
      }else{
        res.status(200).send('');
      }
    }
    }

    //Update categories name in controlUnitModel
    if(req.body.action == "updateCateogries"){
    const categories = await req.body.categories
    asyncPackage.eachSeries(categories, async function updateControlUnitLibFeatureByModuleIdChange(item, callback) {
      if(item.initialCategory){
        await controlUnitModel.updateMany({"category":item.initialCategory}, {"$set":{"category": item.category}})
      }
    }, function(err) {
      if (err) {
          console.log(`Error when updating categories: `);
          console.dir(err);
          res.status(500).send("Error: Error when updating categories");
      }else {
        res.status(200).send({Msg:'success'});
      }
    })
    }

    if(req.body.action == "updateSingleModule"){ //If a single module featureRole is updated using edit/delete module dialog
      const filter = `featureRole.${req.body.featureIndex}`;
      const update = await controlUnitModel.updateOne({"_id":req.body.moduleId},{"$set":{[filter]:req.body.featureRole}},((err, result)=>{
        if(result){
          res.status(200).send("")
        }
      })).clone();
    }

    } catch (err) {
      res.status(500).send("Error: Syncing Modules and Features");
    }
  });


  //Check if the category is being used in any controlunit before deleteing
  router
  .route("/controlunitlibCategory")
  .get(async (req, res) => {
    try {
      const find = await controlUnitModel.findOne({"category":req.query.category})
      res.status(200).send(find);
    } catch (err) {
      res.status(500).send("Error: category delete error");
      res.end();
    }
  })

module.exports = router;