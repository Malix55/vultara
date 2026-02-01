const express = require("express");
const { DEPLOYMENT_API_SUFFIX } = require("../config");
const { getTARAReportInformation } = require("../service/objOperation");
const router = express.Router();
const generateTaraReportInWord = require("../service/httpService").generateTaraReportInWord;

// Save TARA report information to "Other Notifications" database collection
router
    .route("/generateTaraReportInWord")
    .post(async (req, res) => {
        getTARAReportInformation(req.headers.authorization, req.body).then(async (response) => {
            try {
                if (response.success) {
                    const hostUrl = req.protocol + '://' + req.get('host') + DEPLOYMENT_API_SUFFIX;
                    const data = { ...req.body, ...response.data, hostUrl };
                    const taraReportConfirmation = await generateTaraReportInWord(data);
                    if (taraReportConfirmation.success) {
                        return res.status(200).send({ message: "... You will be notified via email once the report is generated.", success: true });
                    }
                }
            } catch (error) {
                return res.status(500).send("Something went wrong when trying to generate the TARA report. Error: " + error.message);
            }
        })
    });

module.exports = router;
