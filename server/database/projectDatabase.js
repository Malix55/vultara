const express = require("express");
const router = express.Router();
const ProjectThreatNotificationSchema = require("../models/projectThreatNotificationSchema").ProjectThreatNotificationSchema;
const ProjectDesignDataSchema = require("../models/projectModelSchema").ProjectDesignDataSchema;
const ProjectThreatListSchema = require("../models/projectModelSchema").ProjectThreatListSchema;
const ProjectDeletedThreatsSchema = require("../models/projectModelSchema").projectDeletedThreats;
const ProjectHtmlSchema = require("../models/projectModelSchema").ProjectHtmlSchema;
const GoalSchema = require("../models/projectModelSchema").goalSchema;
const ProjectCybersecurityGoalSchema = require("../models/projectModelSchema").ProjectCybersecurityGoalSchema;
const UserSchema = require("../models/userLoginSchema").UserSchema;
const WP29ThreatSchema = require("./../models/wp29ThreatSchema").WP29ThreatSchema;
const WP29ThreatMappingSchema = require("./../models/wp29ThreatSchema").WP29ThreatMappingSchema;
const ControlLibSchema = require("../models/controlLibSchema").ControlLibSchema;
const ProjectControlSchema = require("../models/projectControlSchema").ProjectControlSchema;
const ProjectAssumptionSchema = require("../models/projectModelSchema").projectAssumptionSchema;
const ProjectWeaknessSchema = require('../models/projectWeaknessSchema').ProjectWeaknessSchema;
const objOperation = require("../service/objOperation");
const licenseService = require("../service/licenseService");
const mainAlgo = require("../algorithms/main");
const dataAnalyticsMissingFeaAdv = require("../dataAnalytics/missingFeaAdvRecords");
const dataAnalyticsSimpleCounters = require("../dataAnalytics/simpleCounters");
const processPriorResult = require("../algorithms/processPriorResult");
const wp29Algo = require("./../algorithms/wp29Algo");
const connectivityMatrix = require("../algorithms/connectivity");
const atlasAlgorithmDbConnection = require("./atlasTrialDatabaseConnect").atlasAlgorithmDbConnection;
const threatRiskCollectAll = require("../dataAnalytics/threatRiskCollectAll");
require('dotenv').config({ path: __dirname + '/./.env' });
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const atlasTrialLocalUserConnection = require("./atlasTrialDatabaseConnect").atlasTrialLocalUserConnection;
let UserModel = atlasTrialLocalUserConnection.model("UserModel", UserSchema, "localUser");
switch (process.env.AWS_DEPLOY) {
  case "prod":
    UserModel = atlasTrialDbConnection.model("UserModel", UserSchema, "localUser");
    break;
}
module.exports.UserModel = UserModel;

const ProjectDesignDataModel = atlasTrialDbConnection.model("ProjectDesignDataModel", ProjectDesignDataSchema, "projectDesignData");
const ProjectAutoSavedDesignDataModel = atlasTrialDbConnection.model("ProjectAutoSavedDesignDataModel", ProjectDesignDataSchema, "projectAutoSavedDesignData");
const ProjectThreatListModel = atlasTrialDbConnection.model("ProjectThreatListModel", ProjectThreatListSchema, "projectThreatList");
const ProjectDeletedThreatsModel = atlasTrialDbConnection.model("ProjectDeletedThreatsModel", ProjectDeletedThreatsSchema, "projectDeletedThreats");
const ProjectAutoSavedThreatListModel = atlasTrialDbConnection.model("ProjectAutoSavedThreatListModel", ProjectThreatListSchema, "projectAutoSavedThreatList");
const ProjectHtmlModel = atlasTrialDbConnection.model("ProjectHtmlModel", ProjectHtmlSchema, "projectHtml");
const WP29ThreatModel = atlasAlgorithmDbConnection.model("WP29ThreatModel", WP29ThreatSchema, "wp29ThreatLib");
const WP29ThreatMappingModel = atlasAlgorithmDbConnection.model("WP29ThreatMappingModel", WP29ThreatMappingSchema, "wp29ThreatMappingLib");
const CybersecurityGoalModel = atlasTrialDbConnection.model("CybersecurityGoalModel", GoalSchema, "cybersecurityGoalLib");
const ProjectCybersecurityGoalModel = atlasTrialDbConnection.model("ProjectCybersecurityGoalModel", ProjectCybersecurityGoalSchema, "projectCybersecurityGoal");
const ProjectThreatNotificationModel = atlasTrialDbConnection.model("../models/ProjectThreatNotificationModel", ProjectThreatNotificationSchema, "projectThreatNotification");
const ControlLibModel = atlasTrialDbConnection.model("../models/controlLibSchema", ControlLibSchema, "controlLib");
const ProjectControlModel = atlasTrialDbConnection.model("../models/projectControlSchema", ProjectControlSchema, "projectControl");
const ProjectAssumptionModel = atlasTrialDbConnection.model("ProjectAssumptionModel", ProjectAssumptionSchema, "projectAssumption");
const ProjectWeaknessModel = atlasTrialDbConnection.model("projectWeaknessModel", ProjectWeaknessSchema, "projectWeakness");
const cryptoService = require("../service/cryptoService");
const allFrontEndUrls = require("../config").allFrontEndUrls;

////////////////////////////
///// License Config ///////
////////////////////////////
const licenseFile = require("../config").licenseFile;
const projectNumberLimit = licenseFile.numberOfProject;  // limits how many projects can be saved to database
const licenseConfig = require("../license/licenseConfig")
// Execute algorithm for scheduler API /run
const executeAlgorithm = async (project, priorResult, userCallFlag) => {
  let projectObj = JSON.parse(JSON.stringify(project.project)); // clone a copy of project information for later use
  delete project.project;
  projectById = objOperation.sortComponentsById(project);
  [connectivityListZero, connectivityListZeroPath, connectivityListZeroBaseProt, connectivityListZeroAppProt, connectivityListZeroSecProt,
    connectivityListZeroTransmissionMedia] = connectivityMatrix.createConnMatrixByAdjacency(project, projectById); // construct connectivity matrix using adjacency
  let connectivityFeatureChain = connectivityMatrix.createConnMatrixByFeatureChain(project); // construct connectivity object (meta data) using featureChain
  let [attackPathListFeatureChain, featureChainInvolvedComponent, featureChainInvolvedComponentFromCommLine] =
    connectivityMatrix.createAttackPathForFeatureChain(connectivityFeatureChain, projectById); // construct connectivity matrix using featureChain

  [assetThreatMatrix, assetThreatTable, systemConfigData] = await mainAlgo.mainAlgoMainProcess(projectById, connectivityListZero,
    connectivityListZeroPath, connectivityListZeroBaseProt, connectivityListZeroAppProt, connectivityListZeroSecProt, connectivityListZeroTransmissionMedia,
    featureChainInvolvedComponent, featureChainInvolvedComponentFromCommLine, userCallFlag);
  let userAddedThreatTable = [];
  if (priorResult && priorResult.length) { // if the model was ran before and results were already generated
    combinedAssetThreatTable = await processPriorResult.mainProcess(priorResult, assetThreatTable, { ...project, project: projectObj }); // to avoid conflicts and duplicates between two runs of the same model
  } else { // if it's the first time this model is ran
    userAddedThreatTable = await mainAlgo.checkUserAddedThreat(project);
    combinedAssetThreatTable = assetThreatTable.concat(userAddedThreatTable);
  }
  combinedAssetThreatTable = mainAlgo.orderThreatSequence(combinedAssetThreatTable, systemConfigData); // rank threats in descending order
  await dataAnalyticsMissingFeaAdv.recordAndCalculate(combinedAssetThreatTable); // record gap of threatFeasibilityLibAdv, and calculate which record should we work on next
  await dataAnalyticsSimpleCounters.threatCount(combinedAssetThreatTable.length); // send the number of threats
  console.log("TARA completed!");
  return combinedAssetThreatTable;
}

module.exports.executeAlgorithm = executeAlgorithm;

////////////////////////////
////////// Routes //////////
////////////////////////////

// Route to manage threat notifications
router
  .route("/projectThreatNotification")
  .delete(async (req, res, next) => {
    try {
      await ProjectThreatNotificationModel.deleteMany({ "projectId": req.query.id });
      res.status(200).send({ msg: "Notifications have been deleted for given project id" });
    } catch (error) {
      const errMsg = error.message ? error.message : "Error: Project notifications delete request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  });

// save project data to database
router
  .route("/projectDb") // use this route to load, save, and delete project design data
  .get(async (req, res) => {
    try {
      let projectQuery = await ProjectDesignDataModel.findOne({ "project.id": req.query.id });
      if (projectQuery) {
        let projectDeletedThreats = await ProjectDeletedThreatsModel.findOne({ "projectId": req.query.id });
        if (projectDeletedThreats) {
          const projectDeletedThreatsId = projectDeletedThreats && projectDeletedThreats.threat ? projectDeletedThreats.threat.map(_ => _.id) : [];
          projectQuery.project.deletedThreatId = projectDeletedThreatsId;
        }
        res.status(200).json(projectQuery);
      } else {
        const errorMsg = `This project is not found in the database. Please try loading the project again.`;
        throw new Error(errorMsg);
        res.json({ msg: "no project found" })
      }

    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Project database GET request failed!");
    }
  })
  .post(async (req, res) => {
    try {
      // first check how many projects are saved
      let projectCount = await ProjectDesignDataModel.countDocuments({});
      // console.log(`the project count is ${projectCount}`);
      if (projectCount <= projectNumberLimit) {
        const filter = { "project.id": req.body.projectId };
        const update = {
          project: req.body.project.project,
          micro: req.body.project.micro,
          controlUnit: req.body.project.controlUnit,
          commLine: req.body.project.commLine,
          boundary: req.body.project.boundary
        };
        let updatedObj = await ProjectDesignDataModel.findOneAndUpdate(filter, update, {
          new: true,
          upsert: true,
          useFindAndModify: false
        });
        res.status(200).send(updatedObj);
      } else {
        res.status(200).send({ msg: "Project is not saved due to project number limit." });
      }
    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Project database POST request failed!");
    }
  })
  .delete(async (req, res) => {
    try {
      if (req.query.newDesign) {
        const projectId = req.query.id;
        const filter = { "project.id": projectId };
        const update = {
          "boundary": [],
          "commLine": [],
          "controlUnit": [],
          "micro": []
        };
        await ProjectDesignDataModel.findOneAndUpdate(filter, update, {
          new: true,
          useFindAndModify: false
        }).then(result => {
          res.status(200).json([]);
        });
      }
      else {
        await ProjectDesignDataModel.deleteOne({ "project.id": req.query.id });
        let projectQuery = await ProjectDesignDataModel.findOne({ "project.id": req.query.id });
        res.json(projectQuery);
      }

    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Failed to delete project!");
      res.end();
    }
  })

// Save permanently deleted threats id to project deletedThreatId property
router
  .route("/projectDb/saveDeletedThreatId")
  .post(async (req, res) => {
    try {
      const deletedThreatsIds = req.body.threatIds ? req.body.threatIds : [];
      const projectId = req.body.projectId;
      if (projectId && deletedThreatsIds && deletedThreatsIds.length) {
        await Promise.all(deletedThreatsIds.map(async item => {
          const filter = {
            "project.id": projectId,
            "project.deletedThreatId": { "$nin": [item] }
          };
          const update = {
            $push: {
              "project.deletedThreatId": item
            },
            updatedAt: new Date()
          }
          const id = await ProjectDesignDataModel.findOneAndUpdate(filter, update, {
            new: true,
            upsert: false,
            useFindAndModify: false
          });
        }))
      }
      res.status(200).send({ msg: "Permanently deleted threats have been saved." });
    } catch (err) {
      console.log({ err });
      res.status(500).send("Error: Permanently deleted threats saving POST request failed!");
    }
  })

// Get high risk threats by "riskLevel" field (descending order).
router
  .route("/projectRiskThreatsByRiskLevel")
  .get(async (req, res) => {
    try {
      const allThreats = await ProjectThreatListModel.aggregate([
        { $match: { "projectId": req.query.id } },
        { $sort: { "threat.riskLevel": -1 } },
        { $project: { threat: 1 } }
      ]);
      return res.status(200).send(allThreats[0]);
    } catch (error) {
      return res.status(500).send("Error: Project threat list sort by 'riskLevel' GET request failed!");
    }
  });

// Get high risk threats if threat's "riskLevel" value is matched with input "riskLevel" array value.
router
  .route("/projectHighRiskThreats")
  .get(async (req, res) => {
    try {
      let highRiskThreats = [];
      const riskLevel = req.query.riskLevel ? JSON.parse(req.query.riskLevel) : [];
      highRiskThreats = await ProjectThreatListModel.aggregate([
        { $match: { "projectId": req.query.id } },
        {
          $project: {
            threat: {
              $filter: {
                input: "$threat",
                as: "threat",
                cond: { $in: ["$$threat.riskLevel", riskLevel] },
              },
            },
          },
        },
      ]);
      if (highRiskThreats?.length && !highRiskThreats[0].threat.length) {
        highRiskThreats = await ProjectThreatListModel.aggregate([
          { $match: { "projectId": req.query.id } },
          { $sort: { "threat.riskLevel": -1 }, },
          {
            $project: {
              threat: {
                $slice: ["$threat", 0, 10]
              }
            }
          }
        ]);
      }
      return res.status(200).send(highRiskThreats[0]);
    } catch (error) {
      res.status(500).send("Error: Project high risk threat list database GET request failed!");
    }
  });

// save or load threat list
router
  .route("/projectThreatListDb") // use this route to load, save, and delete threat list
  .get(async (req, res) => {
    try {
      let projectQuery = await ProjectThreatListModel.findOne({ "projectId": req.query.id });
      if (projectQuery) {
        res.json(projectQuery.threat);
      } else {
        const errorMsg = `no project threat list found`;
        throw new Error(errorMsg);
        res.json({ msg: "no project threat list found" });
      }

    } catch (err) {
      res.status(500).send("Error: Project threat list database GET request failed!");
    }
  })
  .post(async (req, res) => {
    try {

      // first check how many projects are saved
      let projectCount = await ProjectDesignDataModel.countDocuments({});
      // console.log(`the project count is ${projectCount}`);
      if (projectCount <= projectNumberLimit) {
        if (licenseFile.collectThreatRisk && req.body.threat.length > 0) {
          await threatRiskCollectAll.collectReviewedThreat(req.body.threat, req.body.projectId);
        }
        // const filter = { "project.id": req.body.project.id };
        const update = {
          projectId: req.body.projectId,
          threat: req.body.threat
        };
        // console.log(update.threat[0]);
        const tempFil = { "projectId":req.body.projectId};
        let updatedObj = await ProjectThreatListModel.findOneAndUpdate(tempFil, update, {
          new: true,
          upsert: true,
          useFindAndModify: false
        });
        // console.log(updatedObj.threat.length);
        res.status(200).send(updatedObj);
      } else {
        const errorMsg = `Project is not saved due to project number limit.`;
        throw new Error(errorMsg);
        res.status(200).send({ msg: "Project is not saved due to project number limit." });
      }
    } catch (err) {
      console.log(err.stack);
      res.status(500).send("Error: Project threat list database POST request failed!");
    }
  })
  .delete(async (req, res) => {
    try {
      if (req.query.newDesign) {
        const projectId = req.query.id;
        const filter = { "projectId": projectId };
        const update = {
          "threat": [],
        };
        await ProjectThreatListModel.findOneAndUpdate(filter, update, {
          new: true,
          useFindAndModify: false
        }).then(result => {
          res.status(200).json([]);
        });
      }
      else {
        await ProjectThreatListModel.deleteOne({ "projectId": req.query.id });
        let projectQuery = await ProjectThreatListModel.findOne({ "projectId": req.query.id });
        res.json(projectQuery);
      }
    } catch (err) {
      res.status(500).send("Error: Failed to delete project Threat List!");
      res.end();
    }
  })

// save/load/delete auto saved threat list
router
  .route("/projectAutoSavedThreatListDb") // use this route to load, save, and delete auto saved threat list
  .delete(async (req, res) => {
    try {
      await ProjectAutoSavedThreatListModel.deleteOne({ "projectId": req.query.id });
      let projectQuery = await ProjectAutoSavedThreatListModel.findOne({ "projectId": req.query.id });
      res.json(projectQuery);
    } catch (err) {
      res.status(500).send("Error: Failed to delete project auto saved Threat List!");
      res.end();
    }
  })

router
  .route("/getAllProjectIdsOfUser") // display the project ID of all accessible projects to the user
  .get(async (req, res) => {
    try {
      // console.log(`userId is ${req.query._id}`);
      let allProjectIds = {
        name: [],
        id: []
      };
      let userInfo = await UserModel.findById(req.query._id).select("projectAccessId role");
      //console.log(`This user is executing GET /getAllProjectIdsOfUser - ${userInfo}`);
      if (userInfo.role == "Admin" || userInfo.role == "Super Admin" || userInfo.role == "Security Manager") { // for Admin, Super Admin or Security Manager, return all projects
        await ProjectDesignDataModel
          .find({}).select("project")
          .then(projects => {
            for (let i = 0; i < projects.length; i++) {
              allProjectIds.id.push(projects[i].project.id);
              allProjectIds.name.push(projects[i].project.name);
            }
            // console.log(projects);
          })
          .then(projects => {
            //console.log(`/getAllProjectIdsOfUser route executed. Returned object:`);
            //console.log(allProjectIds);
            res.status(200).send(allProjectIds);
          })
      } else { // if not Admin or Super Admin, only return accessible projects
        await ProjectDesignDataModel
          .find({ "project.id": { $in: userInfo.projectAccessId } }).select("project")
          .then(projects => {
            for (let i = 0; i < projects.length; i++) {
              allProjectIds.id.push(projects[i].project.id);
              allProjectIds.name.push(projects[i].project.name);
            };
          })
          .then(projects => {
            //console.log(`/getAllProjectIdsOfUser route executed. Returned object:`);
            //console.log(allProjectIds);
            res.status(200).send(allProjectIds);
          });
      }
    } catch (err) {
      console.log(err)
      res.status(500).send("Error: GET request to display project IDs failed!");
    }
  })

router
  .route("/projectHtmlDb") // use this route to save or load project front end HTML
  .get(async (req, res) => {
    try {
      let projectQuery = await ProjectHtmlModel.findOne({ "projectId": req.query.id });
      if (projectQuery) {
        res.json(projectQuery.html);
      } else {
        const errorMsg = `This project is not found in your database. Please try re-loading this project.`;
        throw new Error(errorMsg);
        res.json({ msg: "no project html found" });
      }
    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Project HTML database GET request failed!");
    }
  })
  .post(async (req, res) => {
    try {
      // first check how many projects are saved
      let projectCount = await ProjectHtmlModel.countDocuments({});
      // console.log(`the project count is ${projectCount}`);
      if (projectCount <= projectNumberLimit) {
        const filter = { "projectId": req.body.projectId };
        const update = {
          projectId: req.body.projectId,
          html: req.body.html
        };
        let updatedObj = await ProjectHtmlModel.findOneAndUpdate(filter, update, {
          new: true,
          upsert: true,
          useFindAndModify: false
        });
        res.status(200).send(updatedObj);
      } else {
        const errorMsg = `Project is not saved due to project number limit.`;
        throw new Error(errorMsg);
        res.status(200).send({ msg: "Project is not saved due to project number limit." });
        res.end();
      }
    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Project HTML database POST request failed!");
      res.end();
    }
  })
  .delete(async (req, res) => {
    try {
      if (req.query.newDesign) {
        const projectId = req.query.id;
        const filter = { "projectId": projectId };
        const update = {
          "html": "",
        };
        await ProjectHtmlModel.findOneAndUpdate(filter, update, {
          new: true,
          useFindAndModify: false
        }).then(result => {
          res.status(200).json([]);
        });
      }else{
        await ProjectHtmlModel.deleteOne({ "projectId": req.query.id });
        let projectQuery = await ProjectHtmlModel.findOne({ "projectId": req.query.id });
        res.json(projectQuery);
      }
    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Failed to delete project HTML!");
      res.end();
    }
  })

router
  .route("/projectAutoSavedDb") // use this route to save or load project auto saved db
  .delete(async (req, res) => {
    try {
      await ProjectAutoSavedDesignDataModel.deleteOne({ "project.id": req.query.id });
      let projectQuery = await ProjectAutoSavedDesignDataModel.findOne({ "project.id": req.query.id });
      res.json(projectQuery);
    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Failed to delete project auto saved HTML!");
      res.end();
    }
  })
router
  .route("/projectNotes") // use this route to save project notes in database
  .post(async (req, res) => {
    try {
      const projectNotes = req.body.projectNotes;
      if (projectNotes) {
        let projectData = await ProjectDesignDataModel.findOneAndUpdate({ "project.id": req.body.projectId }, {
          '$set':
          {
            'project.notes': projectNotes,
          },
        },
          {
            useFindAndModify: false,
          });
        res.status(200).send(projectData);
      }
      if (!projectNotes) {
        let projectData = await ProjectDesignDataModel.findOneAndUpdate({ "project.id": req.body.projectId }, {
          '$unset': { 'project.notes': projectNotes }
        },
          {
            useFindAndModify: false,
          });
        res.status(200).send(projectData);
      }
    } catch (err) {
      console.log(err)
      res.status(500).send("Error: Failed to update notes");
      res.end();
    }
  });

router
  .route("/run")
  .post(async (req, res) => {
    try {
      let originUrl = req.get("origin"); // use origin header to determine whether call is initiated by scheduler or a user
      let userCallFlag = (originUrl && allFrontEndUrls.includes(originUrl)) ? true : false; // will be true only if the call is initiated by a user
      let project = req.body.designData;
      let priorResult = req.body.resultData;
      licenseService.licenseCompLimit(project.commLine.length, project.micro.length, project.controlUnit.length); // only proceed if limits not exceeded
      // save a copy of the latest design data in the autoSaved collection for comparison in the future
      let projectObj = JSON.parse(JSON.stringify(project.project)); // clone a copy of project information for later use
      const filter = { "project.id": projectObj.id };
      // console.log(projectObj);
      const designDataUpdate = {
        project: projectObj,
        micro: project.micro,
        controlUnit: project.controlUnit,
        commLine: project.commLine,
        boundary: project.boundary
      };
      let updatedDesignDataObj = await ProjectAutoSavedDesignDataModel.findOneAndUpdate(filter, designDataUpdate, {
        new: true,
        upsert: true,
        useFindAndModify: false
      });
      const combinedAssetThreatTable = await executeAlgorithm(project, priorResult, userCallFlag);
      // autoSave threat list result for comparison in the next modeling
      const threatListUpdate = {
        project: projectObj,
        threat: combinedAssetThreatTable
      };
      let tempFilter = {"projectId":projectObj.id}
      let updatedThreatListObj = await ProjectAutoSavedThreatListModel.findOneAndUpdate(tempFilter, threatListUpdate, {
        new: true,
        upsert: true,
        useFindAndModify: false
      });
      res.json(combinedAssetThreatTable);
    } catch (err) {
      console.log(err)
      const errMsg = err.message ? err.message : "Something went wrong. Threat engine exited unexpectedly.";
      res.status(500).send(errMsg);
      res.end();
    }
  });

router
  .route("/wp29ThreatIndexes")
  .get(async (req, res) => {
    try {
      await WP29ThreatMappingModel.find({}, { wp29AttackIndex: 1, _id: 0 }).then(result => {
        res.status(200).json(result);
      });
    } catch (err) {
      console.log(err)
      const errMsg = err.message ? err.message : "Error: Project wp29 threat database GET request failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })
  .post(async (req, res) => {
    try {
      const projectId = req.body.project.id;
      const wp29 = req.body.wp29;
      // Retrieve existing document
      const designData = await ProjectDesignDataModel.findOne({ "project.id": projectId }, { project: 1, _id: 0 });
      const project = designData.project;
      const wp29List = project && project.wp29 ? project.wp29 : [];
      const wp29ArrayIndex = wp29List.findIndex(obj => obj.wp29ThreatIndex === wp29.wp29ThreatIndex);
      if (wp29ArrayIndex > -1) {
        wp29List[wp29ArrayIndex] = wp29;
      } else {
        wp29List.push(wp29);
      }
      // // Update a document with new wp29
      const filter = { "project.id": projectId };
      const update = {
        "project.wp29": wp29List
      };
      await ProjectDesignDataModel.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      }).then(result => {
        res.status(200).json(wp29List);
      });
    } catch (err) {
      console.log(err)
      const errMsg = err.message ? err.message : "Error: Project wp29 threat index database POST request failed!";
      res.status(500).send(errMsg);
      res.end();

    }
  })
  .delete(async (req, res) => {
    try {
      const projectId = req.query.id;
      // // Update a document with new wp29
      const filter = { "project.id": projectId };
      const update = {
        "project.wp29": []
      };
      await ProjectDesignDataModel.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      }).then(result => {
        res.status(200).json([]);
      });

    } catch (err) {
      console.log(err)
      const errMsg = err.message ? err.message : "Error: Project wp29 threat index database DELETE request failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  });

// Routes to create/update/delete goal of a specific project 
router
  .route("/cybersecurityGoals")
  .get(async (req, res) => {
    try {
      const result = await ProjectCybersecurityGoalModel.findOne({ "projectId": req.query.id }, { goal: 1, _id: 0 });
      res.status(200).send(result);
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Cybersecurity Goal fetch request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })
  .post(async (req, res) => {
    try {
      const data = {
        project: req.body.projectId,
        goal: req.body.goal
      };
      const goal = await ProjectCybersecurityGoalModel.findOneAndUpdate({ "projectId": req.body.projectId }, data, {
        new: true,
        upsert: true,
        useFindAndModify: false
      });
      res.status(200).send({ msg: "Project cybersecurity goal model is saved",goal:goal.goal });
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Cybersecurity Goal save request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })
  .delete(async (req, res) => {
    try {
      if (req.query.newDesign) {
        const projectId = req.query.id;
        const filter = { "projectId": projectId };
        const update = {
          "goal": []
        };
        await ProjectCybersecurityGoalModel.findOneAndUpdate(filter, update, {
          new: true,
          useFindAndModify: false
        }).then(result => {
          res.status(200).json([]);
        });
      }else{
        await ProjectCybersecurityGoalModel.deleteOne({ "projectId": req.query.id });
        let projectQuery = await ProjectCybersecurityGoalModel.findOne({ "projectId": req.query.id });
        res.json(projectQuery);
      }
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Cybersecurity Goal database DELETE request failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  }).patch(async (req, res) => { //Add libraryId to a goal in projectGoals
    try {
      const goal = await ProjectCybersecurityGoalModel.updateOne({ 'goal.id': req.body.goal.id }, {
        '$set': {
          'goal.$.libraryId': req.body.goal.libraryId
        }
      });
      if (goal.matchedCount == 0 && goal.modifiedCount == 0) { //Add goal to project if its not already added
        const goal = await ProjectCybersecurityGoalModel.updateOne({ 'projectId': req.body.projectId }, { $push: { goal: req.body.goal } });
      }
      res.status(200).send({ msg: "Cybersecurity goal saved" });
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Cybersecurity Goal save request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })

// Route to create/update/delete projectDeletedThreatListDb according to project id
router
  .route("/projectDeletedThreatListDb")
  .get(async (req, res) => {
    try {
      if (req.query.id) {
        const deletedThreats = await ProjectDeletedThreatsModel.findOne({ "projectId": req.query.id }, { threat: 1 });
        res.status(200).send(deletedThreats);
      } else {
        res.status(200).send({});
      }
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Deleted Threat List GET request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })
  .post(async (req, res) => {
    try {
      const projectId = req.body.projectId;
      const threat = req.body.threat ? req.body.threat : [];
      if (projectId) {
        const update = {
          projectId,
          threat
        };
        await ProjectDeletedThreatsModel.findOneAndUpdate({ "projectId": projectId }, update, {
          new: true,
          useFindAndModify: false,
          upsert: true
        });
      }
      res.status(200).send({ msg: "Project deleted threats are saved" });
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Deleted Threat List save request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })
  .delete(async (req, res) => {
    try {
      if (req.query.newDesign) {
        const projectId = req.query.id;
        const filter = { "projectId": projectId };
        const update = {
          "threat": []
        };
        await ProjectDeletedThreatsModel.findOneAndUpdate(filter, update, {
          new: true,
          useFindAndModify: false
        }).then(result => {
          res.status(200).json([]);
        });
      }else{
        await ProjectDeletedThreatsModel.deleteOne({ "projectId": req.query.id });
        res.status(200).send({ msg: "Project deleted from projectDeletedThreats lib" });
      }
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Deleted Threat List delete request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  });

// Routes for re-usable cybersecurity goals, those are stored in CybersecurityGoalLib. The library stores threats created in different projects where /cybersecurityGoals stores project based goals information
router
  .route("/cybersecurityGoalsLibrary")
  .post(async (req, res) => {
    try {
      const goal = req.body.goal;
      const projectId = req.body.project.id;
      const goalExists = await CybersecurityGoalModel.findOne({ createdInProjectId: projectId, id: goal.id });
      if (goalExists) {
        const update = {
          content: goal.content,
          lastModifiedBy: goal.lastModifiedBy,
          lastModifiedAtDateTime: goal.lastModifiedAtDateTime,
          libraryId: goal.libraryId,
        }
        await CybersecurityGoalModel.findOneAndUpdate({ id: goal.id }, update, {
          new: true,
          useFindAndModify: false
        });
      } else {
        if (req.body.project.addedFromLibrary) {// if the goal is added from the library set its projectId empty
          goal.createdInProjectId = "";
        } else {
          goal.createdInProjectId = projectId;
        }

        //Get last added goal or claim row number and assign it to the new goal
        const singleGoal = await CybersecurityGoalModel.find({ type: goal.type }).sort({ _id: -1 }).limit(1);
        if (singleGoal.length) {
          goal.rowNumber = singleGoal[0]?.rowNumber + 1;
        } else {
          goal.rowNumber = 1;
        }
        const goaLToSave = new CybersecurityGoalModel(goal);
        await goaLToSave.save();
      }
      res.status(200).send({ msg: `This ${goal.type} has been added to the library successfully`, goal });
    } catch (error) {
      const errMsg = error.message ? error.message : "Error: Project Cybersecurity Goal save request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  }).get(async (req, res) => {
    try {
      if (req.query.search) { //Searching goal library
        const searchString = req.query.search
        const regex = new RegExp(searchString, 'i') // i for case insensitive
        const goalExists = await CybersecurityGoalModel.find({ content: { $regex: regex }, type: req.query.type });
        if (goalExists.length) {
          res.status(200).send(goalExists);
        } else {
          res.status(200).send([{ content: `No ${req.query.type} with such name found` }]);
        }
      } else {// get all goals or get 40 
        const limit = parseInt(req.query.limit);
        if (req.query.type == 'goal') {// If type goals only get goals
          const skip = parseInt(req.query.skip);
          const goals = await CybersecurityGoalModel.find({ type: 'goal' }).sort({ _id: -1 }).limit(limit).skip(skip);
          res.status(200).send(goals);
        } else if (req.query.type == 'claim') {// If type claims only get claims
          const skip = parseInt(req.query.skip);
          const claims = await CybersecurityGoalModel.find({ type: 'claim' }).sort({ _id: -1 }).limit(limit).skip(skip);
          res.status(200).send(claims);
        } else if (req.query.refresh) {// If query has refresh flag then get the initial data again
          const goals = await CybersecurityGoalModel.find({ type: req.query.types }).sort({ _id: -1 }).limit(limit);
          res.status(200).send(goals);
        } else {// Get the latest 40 goals and 40 claims 
          const goals = await CybersecurityGoalModel.find({ type: 'goal' }).sort({ _id: -1 }).limit(limit)
          const claims = await CybersecurityGoalModel.find({ type: 'claim' }).sort({ _id: -1 }).limit(limit)
          if (goals.length || claims.length) {
            res.status(200).send([...goals, ...claims]);
          } else {
            res.status(200).send('');
          }
        }
      }
    } catch (error) {
      const errMsg = error.message ? error.message : "Error: Goal library GET request failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  }).delete(async (req, res) => {// Delete a single goal from the library
    try {
      const goalExists = await CybersecurityGoalModel.deleteOne({ id: req.query.id });
      res.status(200).send({ msg: `This ${req.query.type} has been deleted from the library successfully` });
    } catch (error) {
      const errMsg = error.message ? error.message : "Error: Project Cybersecurity Goal delete request failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  }).patch(async (req, res) => {// Update a single goal in the library
    try {
      const goal = req.body.goal;
      const updateGoal = await CybersecurityGoalModel.updateOne({ libraryId: goal.libraryId }, goal, (err, result) => {
        if (result) {
          res.status(200).send({ msg: `This ${goal.type} has been updated in the library successfully` });
        }
      }).clone();
    } catch (error) {
      const errMsg = error.message ? error.message : "Error: Project Cybersecurity Goal update request failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })


router
  .route("/controlLib")
  .get(async (req, res) => {
    try {
      if (req.query.search) { //Searching control library
        const searchString = req.query.search
        const regex = new RegExp(searchString, 'i') // i for case insensitive
        const controlExists = await ControlLibModel.find({ content: { $regex: regex }});
        if (controlExists.length) {
          res.status(200).send(controlExists);
        } else {
          res.status(200).send([{ content: `No control with such name found` }]);
        }
      }else{
        const limit = parseInt(req.query.limit);
        const control = await ControlLibModel.find({}).limit(limit);
        res.status(200).send(control);
      }
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project Deleted Threat List GET request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })
  .post(async (req, res) => {
    try {
      const count = await ControlLibModel.find({ "projectId": req.body.projectId }).sort({ _id: -1 }).limit(1);
      const data = req.body.data;
      if (count.length) {
        data.rowNumber = count[0].rowNumber + 1;
      } else {
        data.rowNumber = 1;
      }
      const control = new ControlLibModel(data);
      control.save((err, result) => {
        if (result) {
          res.status(200).send(result);
        }
      })
    } catch (err) {
      res.status(500).send("Error: Control database Create request failed!");
    }
  })
  .patch(async (req, res) => {
    try {
      const updatedControl = await ControlLibModel.findByIdAndUpdate({ '_id': req.body.data._id },req.body.data);
      res.status(200).send(updatedControl);
    } catch (err) {
      res.status(500).send("Error: Control database Create request failed!");
    }
  })
  .delete(async (req, res) => {
    try {
      const deleteControl = await ControlLibModel.findByIdAndDelete({ '_id': req.query._id });
      res.status(200).send(deleteControl);
    } catch (err) {
      res.status(500).send("Error: Control database Create request failed!");
    }
  })
  
  
  router
    .route("/projectControl")
    .get(async (req, res) => {
      try {
        const addControls = await ProjectControlModel.find({projectId: req.query.id});
        res.status(200).send(addControls);
      } catch (error) {
        const errMsg = error.message ? error.message : "Error: Project Deleted Threat List GET request is failed!";
        res.status(500).send(errMsg);
        res.end();
      }
    })
    .post(async (req, res) => {
      try {
        // const count = await ProjectControlModel.find({ "projectId": req.body.projectId }).sort({ _id: -1 }).limit(1);
        const data = req.body.data;
        delete data._id;
        const options = {upsert:true}
        const control = await ProjectControlModel.updateOne({id:data.id},data,options);
        res.status(200).send(control);
      } catch (err) {
        res.status(500).send("Error: Control database Create request failed!");
      }
    })
    .patch(async (req, res) => {
      try {
        if(req.body.goalId){
          const data = req.body.controls;
          let addControls = data.map(item => ({
            updateOne: {
              filter: { 'id': item.id },
              update: { $set: item },
              upsert: true
            }
          }));
          ProjectControlModel.bulkWrite(addControls).then((data) => {
            if (data) {
              res.status(200).send(data);
            }
          })
        }
      } catch (err) {
        res.status(500).send("Error: Control database Create request failed!");
      }
    })
    .delete(async (req, res) => {
      try {
        if(req.query.projectDelete){
          const deleteControl = await ProjectControlModel.deleteMany({projectId:req.query.projectDelete});
          res.status(200).send(deleteControl);
        }else{
          const deleteControl = await ProjectControlModel.deleteOne({id:req.query.controlId});
          res.status(200).send(deleteControl);
        }
      } catch (err) {
        res.status(500).send("Error: Control database Create request failed!");
      }
    })




router
  .route("/wp29Threats")
  .get(async (req, res) => {
    try {
      await WP29ThreatModel.find({}).sort({ wp29AttackIndex: 1 }).then(result => {
        res.status(200).json(result);
      });
    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Error: Project wp29 threat database GET request failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  })
  .post(async (req, res) => {
    try {
      let projectData = req.body.newDesign.project;
      const projectId = projectData.id;
      let resultData = req.body.threat;
      let designData = {
        micro: req.body.newDesign.micro,
        controlUnit: req.body.newDesign.controlUnit,
        commLine: req.body.newDesign.commLine,
        boundary: req.body.newDesign.boundary
      };

      // develop algorithms in /algorithms/wp29Algo.js
      const newResultData = await wp29Algo.calculateWP29ThreatIndex(resultData);
      if (newResultData && typeof newResultData === "object") {
        const filter = { "projectId": projectId };
        const update = {
          threat: newResultData
        };
        await ProjectThreatListModel.findOneAndUpdate(filter, update,
          {
            upsert: false,
            useFindAndModify: false
          });
      }
      res.status(200).json(newResultData);

    } catch (error) {
      console.log(error)
      const errMsg = error.message ? error.message : "Something went wrong. WP29 engine exited unexpectedly.";
      res.status(500).send(errMsg);
      res.end();
    }
  })
router
  .route("/projectAssumptions")
  .delete(async (req, res, next) => {
    try {
      await ProjectAssumptionModel.deleteMany({ "projectId": req.query.id });
      res.status(200).send({ msg: "Assumptions have been deleted for given project id" });
    } catch (error) {
      const errMsg = error.message ? error.message : "Error: Project assumptions delete request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  });
router
  .route("/projectWeakness")
  .delete(async (req, res, next) => {
    try {
      await ProjectWeaknessModel.deleteMany({ "projectId": req.query.id });
      res.status(200).send({ msg: "Project weakness have been deleted for given project id" });
    } catch (error) {
      const errMsg = error.message ? error.message : "Error: Project weakness delete request is failed!";
      res.status(500).send(errMsg);
      res.end();
    }
  });
router
  .route("/temp/assetThreatMatrix")
  .get((req, res) => {
    res.json(assetThreatMatrix);
  });
router
  .route("/temp/assetThreatTable")
  .get((req, res) => {
    res.json(assetThreatTable);
  });
router
  .route("/temp/combinedAssetThreatTable")
  .get((req, res) => {
    res.json(combinedAssetThreatTable);
  });
router
  .route("/temp/analyzeAssetMetaData")
  .get((req, res) => {
    res.json(analyzeAssetMetaData);
  });
router
  .route("/temp/assetThreatTable")
  .get((req, res) => {
    res.json(assetThreatTable);
  });
router
  .route("/temp/projectById")
  .get((req, res) => {
    res.json(projectById);
  });
router
  .route("/temp/connectivityListZero")
  .get((req, res) => {
    res.json(connectivityListZero);
  });
router
  .route("/temp/connectivityListZeroPath")
  .get((req, res) => {
    res.json(connectivityListZeroPath);
  });
router
  .route("/temp/connectivityListZeroProt")
  .get((req, res) => {
    res.json(connectivityListZeroProt);
  });

module.exports.router = router;
