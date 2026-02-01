const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const assetLibSchema = require("../models/threatLibModelSchema").AssetLibSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const assetLibModel = atlasTrialDbConnection.model("assetLibModel", assetLibSchema, "assetLib");
const FeatureAssetSchema = require("../models/featureAssetModelSchema").FeatureAssetSchema;
const featureAssetModel = atlasTrialDbConnection.model("featureAssetModel", FeatureAssetSchema, "featureAssetLib");

require('dotenv').config({ path: __dirname + '/./../.env' });

// Method to update usedInProjectId property via a bulkWrite execution
const updateAssetUsedInProjectIdProperty = async (assetsToUpdate) => {
    const queries = [];
    assetsToUpdate.forEach(_ => {
        const query = {
            updateOne:
            {
                "filter": { "_id": _._id },
                "update": { "usedInProjectId": _.usedInProjectId },
            }
        }
        queries.push(query);
    });
    await assetLibModel.bulkWrite(queries);
}

// Route to add/update/delete project id for corresponding asset
router
    .route("/assetLib/usedInProjectId")
    .put(async (req, res, next) => {
        try {
            const assetId = req.body ? req.body.assetId : [];
            const projectId = req.body ? req.body.projectId : null;
            if (projectId && assetId.length > 0) {
                const existingAssetsUsedInProject = await assetLibModel.find({
                    usedInProjectId: {
                        $in: [projectId]
                    }
                });
                let existingAssetsNotUsedInProject = existingAssetsUsedInProject.filter(_ => !assetId.includes(_._id.toString()));
                if (existingAssetsNotUsedInProject.length > 0) {
                    existingAssetsNotUsedInProject = existingAssetsNotUsedInProject.map(_ => {
                        const usedInProjectId = _.usedInProjectId;
                        const indexOfProjectId = usedInProjectId.indexOf(projectId);
                        if (indexOfProjectId > -1) {
                            usedInProjectId.splice(indexOfProjectId, 1);
                            _.usedInProjectId = usedInProjectId;
                        }
                        return _;
                    });
                    await updateAssetUsedInProjectIdProperty(existingAssetsNotUsedInProject);
                }

                const existingAssetsAlreadyUsedInProjectId = existingAssetsUsedInProject.filter(_ => assetId.includes(_._id.toString())).map(_ => _._id.toString());
                const remainingUnusedAssetsProjectId = assetId.filter(_ => !existingAssetsAlreadyUsedInProjectId.includes(_));
                if (remainingUnusedAssetsProjectId.length > 0) {
                    const existingAssetsUsedInProject = await assetLibModel.find({
                        _id: {
                            $in: remainingUnusedAssetsProjectId
                        }
                    });
                    const assetsToUpdate = existingAssetsUsedInProject
                        .map(_ => {
                            _.usedInProjectId = [...new Set([...(_.usedInProjectId ? _.usedInProjectId : []), projectId])];
                            return _;
                        });

                    await updateAssetUsedInProjectIdProperty(assetsToUpdate);
                }
            }
            res.status(200).send({ msg: "Asset's usedInProjectId property is updated" });
        } catch (error) {
            res.status(500).send("Error: Asset's usedInProjectId property update error");
            res.end();
        }
    })
    .delete(async (req, res, next) => {
        try {
            const projectId = req.query.id;
            if (projectId) {
                const existingAssetsUsedInProject = await assetLibModel.find({
                    usedInProjectId: {
                        $in: [projectId]
                    }
                });
                const projectIdToDelete = existingAssetsUsedInProject.map(_ => {
                    const usedInProjectId = _.usedInProjectId;
                    const indexOfProjectId = usedInProjectId.indexOf(projectId);
                    if (indexOfProjectId > -1) {
                        usedInProjectId.splice(indexOfProjectId, 1);
                        _.usedInProjectId = usedInProjectId;
                    }
                    return _;
                });
                await updateAssetUsedInProjectIdProperty(projectIdToDelete);
            }
            res.status(200).send({ msg: "Asset's usedInProjectId property is deleted" });
        } catch (error) {
            res.status(500).send("Error: Asset's usedInProjectId property delete error");
            res.end();
        }
    });


router
    .route("/assetlib")
    .get(async (req, res, next) => {
        try {
            let assetArray;
            let numberOfAssetToDisplay = 0;
            if (req.query.limit) {
                numberOfAssetToDisplay = parseInt(req.query.limit);
            };
            // console.log(`numberOfAssetToDisplay is ${numberOfAssetToDisplay}`)
            if (req.query.global == '1') { // req.query.global 1 means we have to search for all three
                assetArray = await assetLibModel.find({$and:[
                        {
                        //It filters Traffic bandwidth from databaseView/assetlib so that it could not be deleted by mistake.
                            _id: {$ne: "5ed9119de6d87341602cbbb9"}
                        },
                        {$or: [
                        {
                            "name": new RegExp(req.query.searchTerm.toLowerCase(), "ig")
                        },
                        {
                            "assetType": new RegExp(req.query.searchTerm.toLowerCase(), "ig")
                        },
                        {
                            "subType": new RegExp(req.query.searchTerm.toLowerCase(), "ig")
                        },
                        {
                            "tag": new RegExp(req.query.searchTerm.toLowerCase(), "ig")
                        },
                    ]
                }]}).sort({ _id: -1 }).limit(numberOfAssetToDisplay);
            } else { // req.query.global === 0 means we are searching in name only
                assetArray = await assetLibModel.find({$and:[
                    {
                    //It filters Traffic bandwidth from ModelingView/Security Settings.
                        _id: {$ne: "5ed9119de6d87341602cbbb9"}
                    },
                    {"name": { $regex: new RegExp(req.query.searchTerm.toLowerCase(), "ig") }},
                ]}).limit(numberOfAssetToDisplay);
            }
            res.status(200).send(assetArray);
        } catch (err) {
            res.status(500).send("Error: asset library retrieval error");
            res.end();
        }
    })
    .post(async (req, res, next) => {
        try {
            // console.log(req.body);
            let filter = { _id: "" }
            const assetId = req.body._id;
            const name = req.body.name;
            if (req.body._id) {
                filter = { _id: req.body._id };
            } else {
                filter = { _id: mongoose.Types.ObjectId() }
            }
            // console.log(filter);
            const update = {
                name: name,
                assetType: req.body.assetType,
                subType: req.body.subType,
                tag: req.body.tag,
            };
            const options = {
                new: true,  // return the updated document
                upsert: true,
                useFindAndModify: false
            };
            let updatedDoc = await assetLibModel.findOneAndUpdate(filter, update, options);

            if (assetId) {
                await featureAssetModel.find({ assetsId: { $exists: true, $not: { $size: 0 }, $elemMatch: { $eq: assetId } } })
                    .then(async (features) => {
                        if (features && features.length > 0) {
                            for (const feature of features) {
                                const index = feature.assetsId.findIndex(x => x == assetId);
                                if (index > -1) {
                                    feature.assets[index] = name;
                                    const _update = { assets: feature.assets };
                                    await featureAssetModel.updateOne({ _id: feature.id }, _update, options);
                                }
                            }
                        }

                    }).catch((err) => {
                        console.error(err);
                    });

            }

            res.status(200).send(updatedDoc);

            // if (req.body.delete) { // delete a document
            //     let updatedDoc = await assetLibModel.findByIdAndDelete(req.body._id)
            //     res.status(200).send(updatedDoc);
            // } else { // modify or add a document
            //     const update = {
            //         name: req.body.name,
            //         assetType: req.body.assetType,
            //         subType: req.body.subType,
            //     };
            //     const options = {
            //         new: true,  // return the updated document
            //         upsert: true,
            //         useFindAndModify: false
            //     };
            //     let updatedDoc = await assetLibModel.findOneAndUpdate(filter, update, options)
            //     res.status(200).send(updatedDoc);
            // }
        } catch (err) {
            res.status(500).send("Error: asset library update error");
            res.end();
        }
    })
    .delete(async (req, res) => {
        try {
            const assetId = req.query._id;
            if (assetId) {
                const assetToRemove = await assetLibModel.findOne({ _id: assetId });
                if (assetToRemove && assetToRemove.usedInProjectId.length > 0) {
                    res.status(500).send({ msg: "This asset is in use, and thus cannot be deleted." });
                } else {
                    let updatedDoc = await assetLibModel.findByIdAndDelete(assetId);
                    const options = {
                        new: true,  // return the updated document
                        upsert: true,
                        useFindAndModify: false
                    };

                    await featureAssetModel.find({ assetsId: { $exists: true, $not: { $size: 0 }, $elemMatch: { $eq: assetId } } })
                        .then(async (features) => {
                            if (features && features.length > 0) {
                                for (const feature of features) {
                                    const index = feature.assetsId.findIndex(x => x == assetId);
                                    if (index > -1) {
                                        feature.assetsId.splice(index, 1);
                                        feature.assets.splice(index, 1);

                                        const _update = {
                                            assetsId: feature.assetsId,
                                            assets: feature.assets,
                                        };

                                        await featureAssetModel.updateOne({ _id: feature.id }, _update, options);

                                    }
                                }
                            }

                        }).catch((err) => {
                            console.error(err);
                        });

                    res.status(200).send(updatedDoc);
                }
            } else {
                res.status(500).send({ msg: "Asset id is empty" });
            }
        } catch (err) {
            res.status(500).send("Error: asset library DELETE error");
        }
    })

// Search single asset by asset ID
router
    .route("/asset")
    .get(async (req, res, next) => {
        try {
            if (req.query.assetId) {
                const asset = await assetLibModel.findOne({
                    "_id": req.query.assetId,
                });
                if (asset) {
                    res.status(200).send(asset);
                } else {
                    res.status(500).send("Error: Asset id doesn't exist in the asset library.");
                }
            } else {
                res.status(500).send("Error: Asset id can not be empty");
                res.end();
            }
        } catch (err) {
            res.status(500).send("Error: asset library retrieval error");
            res.end();
        }
    });

// Get assets by assetType
router
    .route("/assetLibByType")
    .get(async (req, res, next) => {
        try {
            const assetsType = req.query.assetType ? req.query.assetType.split(",") : [];
            let assets = await assetLibModel.find({
                assetType: {
                    $in: assetsType
                }
            });
            res.status(200).send(assets);
        } catch (error) {
            res.status(500).send("Error: asset library retrieval by asset type error");
            res.end();
        }
    });

// Get assets by multiple assetId
router
    .route("/assetLibByIds")
    .get(async (req, res, next) => {
        try {
            const assetIds = req.query.assetIds ? JSON.parse(req.query.assetIds) : [];
            let assets = await assetLibModel.find({
                _id: {
                    $in: assetIds
                }
            }, { assetType: 1, subType: 1 });
            res.status(200).send(assets);
        } catch (error) {
            res.status(500).send("Error: asset library retrieval by asset ids error");
            res.end();
        }
    });

module.exports = router;