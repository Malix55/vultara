const express = require("express");
const router = express.Router();
const { s3HelpPageBucketName, accessKeyId, secretAccessKey } = require("../config");
const AWS = require("aws-sdk");
const HelpSchema = require('../models/helpModelSchema').HelpSchema;
switch (process.env.AWS_DEPLOY) {
    // local servers use help data stored in the same trialDB as project data
    case "local":
        var atlasTrialDbConnection = require('./atlasTrialDatabaseConnect').atlasTrialDbConnection;
        var HelpSchemaModel = atlasTrialDbConnection.model("helpPageModel", HelpSchema, "helpData");
        break;
    // for aws-hosted applications, helpData is stored in VultaraDB, in the same DB with componentDB
    case "trial":
    case "prod":
        var atlasComponentDbConnection = require('./atlasTrialDatabaseConnect').atlasComponentDbConnection;
        var HelpSchemaModel = atlasComponentDbConnection.model("helpPageModel", HelpSchema, "helpData");
        break;
    default:
        var atlasTrialDbConnection = require('./atlasTrialDatabaseConnect').atlasTrialDbConnection;
        var HelpSchemaModel = atlasTrialDbConnection.model("helpPageModel", HelpSchema, "helpData");
        break;
}


router
    .route("/")
    .get(async (req, res, next) => {
        let input = `${req.query.id}/`
        const objectUrls = []
        try {
            // Aws configuration for development 
            AWS.config.credentials = new AWS.Credentials({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            });
            // In params we are setting bucket name and in prefix input s3 folder name 
            const params = {
                Bucket: s3HelpPageBucketName,
                Delimiter: '/',
                Prefix: input 
            };
            let s3 = new AWS.S3();

            // get list of all objects inside s3 folder
            s3.listObjects(params, function (err, objList) {
                if (err) {
                    console.log(err); // an error occurred
                }
                // get signed url for each object 
                if (objList) {
                    let length = objList.Contents.length;
                    objList.Contents.forEach((x, i) => {
                        const params1 = {
                            Bucket: s3HelpPageBucketName,
                            Key: x.Key,
                            Expires: 60
                        }
                        s3.getSignedUrl('getObject', params1, function (err, signedUrl) {
                            if (err) {
                                console.log(err)
                            }
                            if (signedUrl) {
                                // store all signed url in arrau objectUrls
                                objectUrls.push(signedUrl);
                                if (i == length - 1) {
                                    res.status(200).send(objectUrls);
                                }
                            }
                        })
                    });

                }
            });

        } catch (err) {
            console.log(err);
            res.status(500).send("Failed to load media from s3");
        }
    })
//   Route to get documents data from database
router
    .route("/getData")
    .get(async (req, res, next) => {
        try {
            const filter = { "helpDocumentId": req.query.id }
            let helpData = await HelpSchemaModel.find(filter);
            res.status(200).send(helpData);
        } catch (err) {
            console.log(err);
            res.status(500).send("failed to get data");
        }
    })
//Route to get help page tabs 
router
    .route("/getTabs")
    .get(async (req, res, next) => {
        try {
            let helpData = await HelpSchemaModel.aggregate([
              {
                $match: {
                  $or: [
                    { displayType: "heading" },
                    { displayType: "text" },
                    { displayType: "video" },
                  ],
                },
              },
              {
                $group: {
                  _id: "$helpDocumentId",
                  records: { $push: "$$ROOT" },
                },
              },
              {
                // this is needed to sort items in the array
                $unwind: "$records",
              },

              {
                $sort: {
                  // specify sort params here
                  "records.position": 1,
                },
              },
              {
                $group: {
                  _id: "$_id",
                  records: { $push: "$records" },
                },
              },
              {
                $project: {
                  _id: 0,
                  records: {
                    $slice: ["$records", 0, 3],
                  },
                },
              },
            ]);
            res.status(200).send(helpData);
        } catch (err) {
            console.log(err);
            res.status(500).send("failed to get tabs data");
        }
    });

// code for video objects later use 
router.route("/getVideo")
    .get(async (req, res, next) => {
        let videoId = req.query.id;
        let arr=[];
        try {
            AWS.config.credentials = new AWS.Credentials({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            });

            const params = {
                Bucket: s3HelpPageBucketName,
                Key: videoId,
                Expires: 120
            };
            let s3 = new AWS.S3();
            s3.getSignedUrl('getObject',params, function (err, url) {
                if (err) {
                    res.status(400).send(err);
                }
                if (url) {
                    arr.push(url)
                    res.status(200).send(arr);
                }
            });

        } catch (err) {
            console.log(err);
            res.status(500).send("failed to load video from s3");
        }
    });


module.exports = router;