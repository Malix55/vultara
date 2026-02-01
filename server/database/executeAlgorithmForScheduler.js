const express = require("express");
const router = express.Router();
const { executeAlgorithm } = require("./projectDatabase");
require('dotenv').config({ path: __dirname + '/./.env' });

const ACCESS_TOKEN = require("../config").ACCESS_TOKEN;

router
  .route("/") // route for its paired scheduler server to call
  .post(async (req, res) => {
    try {
      if (req.headers.authorization !== ACCESS_TOKEN) {
        return res.status(401).send({ message: "Error occurred during the authentication process. Access denied." });
      }
      const { project, priorResult } = req.body;
      const combinedAssetThreatTable = await executeAlgorithm(project, priorResult);
      res.json(combinedAssetThreatTable);
    } catch (err) {
      const errMsg = err.message ? err.message : "Something went wrong. Threat engine exited unexpectedly.";
      res.status(500).send(errMsg);
    }
  });
module.exports.router = router;
