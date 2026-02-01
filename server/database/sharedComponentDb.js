// these are for the shared component database, which is stored centrally for all aws-hosted servers (regardless which customer a server is for)
const express = require("express");
const router = express.Router();
const atlasComponentDbConnection = require("./atlasTrialDatabaseConnect").atlasComponentDbConnection;
const ProtocolSchema = require("../models/componentModelSchema").ProtocolSchema;
const microSchema = require("../models/componentModelSchema").microSchema;
const commLineSchema = require("../models/componentModelSchema").commLineSchema;
const ProtocolModel = atlasComponentDbConnection.model("ProtocolModel", ProtocolSchema, "protocolLib");
const microModel = atlasComponentDbConnection.model("microModel", microSchema, "microLib");
const commLineModel = atlasComponentDbConnection.model("commLineModel", commLineSchema, "commLineLib");

require('dotenv').config({ path: __dirname + '/./../.env' });

router
    .route("/protocollib")
    .get(async (req, res, next) => {
        try {
            let output = await ProtocolModel.find();
            res.send(output);
        } catch (error) {
            res.status(500).send({ msg: "GET request for protocol retrieval failed!", error });
        }
    });

router
    .route("/microlib")
    .post(async (req, res, next) => {
      try {
        let micro = await microModel.find({$or:[{'manufacturer': {'$regex': req.body.filterValue, '$options': 'i'}},{'model': {'$regex': req.body.filterValue, '$options': 'i'}}]}).limit(10);
        res.status(200).send(micro);
      } catch (err) {
        res.status(500).send("Error: micro library retrieval error!");
        res.end();
      }
    })

router
    .route("/commlinelib")
    .get(async (req, res, next) => {
      try {
        let commLine = await commLineModel.find({});
        res.status(200).send(commLine);
      } catch (err) {
        res.status(500).send("Error: commLine library retrieval error!");
        res.end();
      }
    })

module.exports = router;