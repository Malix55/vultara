const express = require("express");
const router = express.Router();
const ProjectThreatListSchema = require("../models/projectModelSchema").ProjectThreatListSchema;
const ProjectVulnerabilitySchema = require('../models/projectVulnerabilitySchema').ProjectVulnerabilitySchema
const ProjectThreatNotificationSchema = require('../models/projectThreatNotificationSchema').ProjectThreatNotificationSchema
const ProjectMilestoneSchema = require("../models/projectModelSchema").ProjectMilestoneSchema;
require('dotenv').config({ path: __dirname + '/./.env' });
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const ProjectDashboardDataSchema = require('../models/projectDashboardDataSchema').ProjectDashboardDataSchema;
const ProjectDashboardDataModel = atlasTrialDbConnection.model('ProjectDashboardDataModel', ProjectDashboardDataSchema, 'projectDashboardData');
const ProjectThreatListModel = atlasTrialDbConnection.model("ProjectThreatListModel", ProjectThreatListSchema, "projectThreatList");
const ProjectAutoSavedMilestoneModel = atlasTrialDbConnection.model("ProjectAutoSavedMilestoneModel", ProjectMilestoneSchema, "projectAutoSavedMilestone");
const ProjectVulnerabilityModel = atlasTrialDbConnection.model("ProjectVulnerabilityModel", ProjectVulnerabilitySchema, "projectVulnerability");
const ProjectThreatNotificationModel = atlasTrialDbConnection.model("ProjectThreatNotificationModel", ProjectThreatNotificationSchema, "projectThreatNotification");
const cryptoService = require("../service/cryptoService");

ProjectThreatListSchema.index(
    { "threat.0": 1 },
    { partialFilterExpression: { "threat.0": { $exists: true } } }
);

ProjectMilestoneSchema.index(
    { "threat.0": 1 },
    { partialFilterExpression: { "threat.0": { $exists: true } } }
);

ProjectMilestoneSchema.index(
    { threat: 1 }
);

ProjectThreatListSchema.index(
    { threat: 1 }
);

ProjectThreatListSchema.index(
    { updatedAt: 1 },
);

////////////////////////////
////////// Routes //////////
////////////////////////////

router
    .route("/getProjectThreatReviewCompletionRate") // use this route to fetch Threat Review Completion Rate
    .get(async (req, res) => {
        try {

            let passQuery = [{
                name: "%",
                value: 0
            }];
            let projectQuery = await ProjectThreatListModel.findOne({ "projectId": req.query.id }, { "threat.reviewed": 1, _id: 0 });
            if (projectQuery && projectQuery.threat.length != 0) {
                for (let i = 0; i < projectQuery.threat.length; i++) {
                    if (projectQuery.threat[i].reviewed) {
                        passQuery[0].value = passQuery[0].value + 1;
                    }
                }
                passQuery[0].value = passQuery[0].value / projectQuery.threat.length * 100;
            }
            return res.status(200).json(passQuery);

        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Threat Review Completion Rate - project threat list database GET request failed!");
        }
    })

router
    .route("/getProjectThreatValidationCompletionRate") // use this route to fetch Threat Validation Completion Rate for each project
    .get(async (req, res) => {
        try {
            let passQuery = [{
                name: "percentage",
                value: 0
            }];
            let projectQuery = await ProjectThreatListModel.findOne({ "projectId": req.query.id }, { "threat.treatmentVal": 1, _id: 0 });
            if (projectQuery && projectQuery.threat.length != 0) {
                for (let i = 0; i < projectQuery.threat.length; i++) {
                    if (projectQuery.threat[i].treatmentVal) {
                        passQuery[0].value = passQuery[0].value + 1;
                    }
                }
                passQuery[0].value = passQuery[0].value / projectQuery.threat.length * 100;
            }
            return res.status(200).json(passQuery);

        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Threat Validation Completion Rate - project threat list database GET request failed!");
        }
    })

router
    .route("/getProjectRiskTreatmentCompletionRate") // use this route to fetch Risk Treatment Completion Rate for each project
    .get(async (req, res) => {
        try {
            let passQuery = [{
                name: "percentage",
                value: 0
            }];
            let projectQuery = await ProjectThreatListModel.findOne({ "projectId": req.query.id }, { "threat.treatment": 1, _id: 0 });
            if (projectQuery && projectQuery.threat.length != 0) {
                for (let i = 0; i < projectQuery.threat.length; i++) {
                    if (projectQuery.threat[i].treatment && projectQuery.threat[i].treatment != "no treatment") {
                        passQuery[0].value = passQuery[0].value + 1;
                    }
                }
                passQuery[0].value = passQuery[0].value / projectQuery.threat.length * 100;
            }
            return res.status(200).json(passQuery);

        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Risk Treatment Completion Rate - project threat list database GET request failed!");
        }
    })

router
    .route("/getProjectVulnerabilities") // use this route to fetch the number of vulnerabilities for each project
    .get(async (req, res) => {
        try {
            //Get a project's vulnerability baseSeverity distribution [{baseSeverity:HIGH,count:4},{baseSeverity:LOW,count:2}]
            const projectVulnerbilities = await ProjectVulnerabilityModel.aggregate([
                { $match: { "projectId": req.query.id, $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }] } },
                { $group: { _id: '$baseSeverity', count: { $sum: 1 } } }
            ])
            return res.status(200).json(projectVulnerbilities);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Vulnerabilities - project threat list database GET request failed!");
        }
    })

router
    .route("/getProjectRiskLevelChart") // use this route to fetch risk level chart for each project
    .get(async (req, res) => { // TODO: add user role-based project access control
        try {
            let reviewed = 0;
            let validated = 0;
            let score_of_all_threats = 0;
            let passQuery = [
                {
                    name: "Months",
                    series: []
                }
            ];

            let timeScore = new Object;
            var updatedAt_as_a_number;
            const month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            let projectQuery = await ProjectThreatListModel.findOne({ "projectId": req.query.id },
                { "threat.reviewed": 1, "threat.treatmentVal": 1, "threat.riskLevel": 1, updatedAt: 1 });

            if (projectQuery) {
                for (let i = 0; i < projectQuery.threat.length; i++) {
                    if (projectQuery.threat[i].reviewed) {
                        reviewed++;
                    }
                    if (projectQuery.threat[i].treatmentVal) {
                        validated++;
                    }
                    if (projectQuery.threat[i].riskLevel) {
                        score_of_all_threats = score_of_all_threats + (6 - projectQuery.threat[i].riskLevel);
                    }
                }
                reviewed = reviewed / projectQuery.threat.length;
                validated = validated / projectQuery.threat.length;
                score_of_all_threats = score_of_all_threats / (5 * projectQuery.threat.length);
                //converting timestamp to a number because when used as a key the timestamp was converted to a string that could not be sorted.
                updatedAt_as_a_number = projectQuery.updatedAt.getTime();
                timeScore[updatedAt_as_a_number] = score_of_all_threats * 50 * (reviewed + validated);
            }

            let milestones = await ProjectAutoSavedMilestoneModel.find({ "project.id": req.query.id },
                { "threat.reviewed": 1, "threat.treatmentVal": 1, "threat.riskLevel": 1, updatedAt: 1, "project.id": 1 });
            if (milestones) {
                for (let j = 0; j < milestones.length; j++) {
                    if (milestones[j].project.id === req.query.id) {
                        reviewed = 0;
                        validated = 0;
                        score_of_all_threats = 0;
                        for (let i = 0; i < milestones[j].threat.length; i++) {
                            if (milestones[j].threat[i].reviewed) {
                                reviewed++;
                            }
                            if (milestones[j].threat[i].treatmentVal) {
                                validated++;
                            }
                            if (milestones[j].threat[i].riskLevel) {
                                score_of_all_threats = score_of_all_threats + (6 - milestones[j].threat[i].riskLevel);
                            }
                        }
                        reviewed = reviewed / milestones[j].threat.length;
                        validated = validated / milestones[j].threat.length;
                        score_of_all_threats = score_of_all_threats / (5 * milestones[j].threat.length);
                        //converting timestamp to a number because when used as a key the timestamp was converted to a string that could not be sorted.
                        updatedAt_as_a_number = milestones[j].updatedAt.getTime();
                        timeScore[updatedAt_as_a_number] = score_of_all_threats * 50 * (reviewed + validated);
                    }
                }
            }
            let timeArray = Object.keys(timeScore).sort(function (a, b) { return b - a; });
            let shortTimeScore = Object.create(timeScore);
            var string_time_to_date;
            for (let i = 0; i < timeArray.length; i++) {
                string_time_to_date = new Date(parseInt(timeArray[i]));
                shortTimeScore[month_names_short[string_time_to_date.getMonth()] + ' ' + string_time_to_date.getFullYear()] = timeScore[timeArray[i]];
            }

            var reference_date = new Date(parseInt(timeArray[0]));

            for (let i = 23; i >= 0; i--) {
                var mm = month_names_short[(reference_date.getMonth() + 12 - i % 12) % 12];
                var yyyy = reference_date.getFullYear() - (Math.floor((i - 1 - reference_date.getMonth()) / 12) + 1);
                if (shortTimeScore[mm + ' ' + yyyy]) {
                    passQuery[0].series.push({
                        name: mm + ' ' + yyyy,
                        value: 100 - shortTimeScore[mm + ' ' + yyyy]
                    });
                } else {
                    passQuery[0].series.push({
                        name: mm + ' ' + yyyy,
                        value: 100
                    });
                }
            }

            return res.status(200).json(passQuery);

        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Project Risk Level Chart - project threat list database GET request failed!");
        }
    })

router
    .route("/getCyberSecurityEventsAndIncidents") // use this route to fetch the number of cyber security events and incidents
    .get(async (req, res) => {
        try {
            let totalCount = 0;
            let vulnerabiltyCount = 0;
            let threatsCount = 0;
            let arr = [];
            arr.push(req.query.idList)
            const newArr = arr[0].split(',').map(x => x.trim());
            threatsCount = await ProjectThreatNotificationModel.find({ "projectId": { $in: newArr }, "acceptStatus": { $in: [false] }, "rejectStatus": { $in: [false] } }).count()
            vulnerabiltyCount = await ProjectVulnerabilityModel.find({ "projectId": { $in: newArr }, "isDeleted": { $nin: [true] } }).count()
            totalCount = vulnerabiltyCount + threatsCount;
            let passQuery = [
                {
                    name: "Cybersecurity Events",
                    value: totalCount
                },
                {
                    name: "Cybersecurity Incidents",
                    value: 0
                }
            ];
            return res.status(200).json(passQuery);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Security Events - project threat list database GET request failed!");
        }
    })

router
    .route("/getProjectCyberSecurityEventsAndIncidents") // use this route to fetch the number of cyber security events and incidents for each project
    .get(async (req, res) => {
        try {
            //  fetch count notifications on dashboard for project
            let totalCount = 0;
            let projectVulnerabiltyCount = 0;
            let projectThreatCount = 0;
            projectVulnerabiltyCount = await ProjectVulnerabilityModel.countDocuments({
                "projectId": req.query.id, "isDeleted": { $nin: [true] }
            })
            projectThreatCount = await ProjectThreatNotificationModel.countDocuments({
                "projectId": req.query.id, "acceptStatus": false, "rejectStatus": false
            })
            totalCount = projectVulnerabiltyCount + projectThreatCount;
            let passQuery = [
                {
                    name: "Cybersecurity Events",
                    value: totalCount
                },
                {
                    name: "Cybersecurity Incidents",
                    value: 0
                }
            ];
            return res.status(200).json(passQuery);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Security Events - project vulnerability and threat list GET request failed!");
        }
    });

router
    .route("/getResidualRiskData") // use this route to fetch residual risk data
    .get(async (req, res) => { // TODO: add user role-based project access control
        try {
            req.query = req.query?.idList?.split(", ");
            let passQuery = [];
            let projectQuery = [];
            await ProjectThreatListModel
                .find({ "threat.0": { $exists: true } }, { "threat.riskLevel": 1, _id: 0 })
                .then(projects => {
                    if (projects.length != 'undefined') {
                        for (let i = 0; i < projects.length; i++) {
                            for (let j = 0; j < projects[i].threat.length; j++) {
                                if (projects[i].threat[j].riskLevel) {
                                    if (passQuery.find(x => x.name == projects[i].threat[j].riskLevel)) {
                                        let updateItem = passQuery.find(x => x.name == projects[i].threat[j].riskLevel);
                                        let index = passQuery.indexOf(updateItem);
                                        passQuery[index].value = passQuery[index].value + 1;
                                    } else {
                                        passQuery.push({
                                            name: projects[i].threat[j].riskLevel,
                                            value: 1,
                                        });
                                    }
                                } else {
                                    if (passQuery.find(x => x.name == 'undetermined')) {
                                        let updateItem = passQuery.find(x => x.name == 'undetermined');
                                        let index = passQuery.indexOf(updateItem);
                                        passQuery[index].value = passQuery[index].value + 1;
                                    } else {
                                        passQuery.push({
                                            name: 'undetermined',
                                            value: 1,
                                        });
                                    }
                                }
                                passQuery.sort((a, b) => (a.name < b.name) ? 1 : -1);
                            }
                        }
                    }
                    return res.status(200).json(passQuery);
                })
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Residual Risk - project threat list database GET request failed!");
        }
    })

router
    .route("/getTopFiveThreats") // use this route to fetch top five threats
    .get(async (req, res) => { // TODO: add user role-based project access control
        try {
            let baseArray = [
                {
                    name: "Spoofing",
                    value: 0
                },
                {
                    name: "Tampering",
                    value: 0
                },
                {
                    name: "Repudiation",
                    value: 0
                },
                {
                    name: "Information Disclosure",
                    value: 0
                },
                {
                    name: "Denial of Service",
                    value: 0
                },
                {
                    name: "Elevation of Privilege",
                    value: 0
                },
            ];
            let passQuery = [];
            let strideNumber = [0, 0, 0, 0, 0, 0];
            await ProjectThreatListModel
                .find({ "threat.0": { $exists: true } }, { "threat.securityPropertyStride": 1 })
                .then(projects => {
                    if (projects.length != 'undefined') {
                        for (let i = 0; i < projects.length; i++) {
                            for (let j = 0; j < projects[i].threat.length; j++) {
                                switch (projects[i].threat[j].securityPropertyStride) {
                                    case "s":
                                        strideNumber[0] = strideNumber[0] + 1;
                                        break;
                                    case "t":
                                        strideNumber[1] = strideNumber[1] + 1;
                                        break;
                                    case "r":
                                        strideNumber[2] = strideNumber[2] + 1;
                                        break;
                                    case "i":
                                        strideNumber[3] = strideNumber[3] + 1;
                                        break;
                                    case "d":
                                        strideNumber[4] = strideNumber[4] + 1;
                                        break;
                                    case "e":
                                        strideNumber[5] = strideNumber[5] + 1;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                        let index_1 = strideNumber.indexOf(Math.max(...strideNumber));
                        baseArray[index_1].value = strideNumber[index_1];
                        passQuery[0] = baseArray[index_1]; // this is the largest
                        strideNumber[index_1] = -1;
                        let index_2 = strideNumber.indexOf(Math.max(...strideNumber));
                        baseArray[index_2].value = strideNumber[index_2];
                        passQuery[1] = baseArray[index_2]; // this is the 2nd
                        strideNumber[index_2] = -1;
                        let index_3 = strideNumber.indexOf(Math.max(...strideNumber));
                        baseArray[index_3].value = strideNumber[index_3];
                        passQuery[2] = baseArray[index_3]; // this is the 3rd
                        strideNumber[index_3] = -1;
                        let index_4 = strideNumber.indexOf(Math.max(...strideNumber));
                        baseArray[index_4].value = strideNumber[index_4];
                        passQuery[3] = baseArray[index_4]; // this is the 4th
                        strideNumber[index_4] = -1;
                        let index_5 = strideNumber.indexOf(Math.max(...strideNumber));
                        baseArray[index_5].value = strideNumber[index_5];
                        passQuery[4] = baseArray[index_5]; // this is the 5th
                        strideNumber[index_5] = -1;
                        return res.status(200).json(passQuery);
                    } else {
                        return res.status(200).json(passQuery);
                    }
                })
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Top 5 Threats - project threat list database GET request failed!");
        }
    })

router
    .route("/getTopFiveVulnerabilities") // use this route to fetch top five vulnerabilities
    .get(async (req, res) => {
        try {
            /* 
            only retrieve highest severity vulnerabilities that are "not treated" from db. 
            if there are equal severities, use the one with most occurrences. 
            if the most severe ones have the same occurrences, prioritize the most recent ones.
            */
            // const vulnerabilities = await ProjectVulnerabilityModel.aggregate([
            //     { $match: { treatment: 'no treatment', baseScore: { $gte: 9 } } },
            //     { $project: { _id: 0, baseScore: 1, cveDataMetaIds: 1, publishedDate: 1 } },
            //     {
            //         "$group": {
            //             "_id": { "name": "$cveDataMetaIds", "value": "$baseScore" },
            //             "count": { "$sum": 1 },
            //             "data": { $push: "$$ROOT" }
            //         }
            //     },
            //     { "$sort": { "_id.value": -1, "count": -1, "data.publishedDate": -1 } }
            // ])
            let projectIds = req.query.idList.split(',').map(item=>item.replace(/\s/g, ""));
            const vulnerabilities = await ProjectVulnerabilityModel.aggregate([
                { $match: {"projectId":{$in:projectIds}, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] } },
                { $group: { _id: '$baseSeverity', count: { $sum: 1 } } }
            ])
            res.status(200).json(vulnerabilities);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get top 5 vulnerabilities request failed!");
        }
    })

router
    .route("/getTopFiveWeaknesses") // use this route to fetch top five weaknesses
    .get(async (req, res) => {
        try {
            let passQuery = [];
            return res.status(200).json(passQuery);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Top 5 Weaknesses - project threat list database GET request failed!");
        }
    })

router
    .route("/getRiskLevelChart") // use this route to fetch risk level chart
    .get(async (req, res) => { // TODO: add user role-based project access control
        try {
            let dashboardCollectionData = await ProjectDashboardDataModel.find({ dashboardDataType: "organizationAggregatedRiskChart" }, { _id: 0, name: 1, series: 1 }).limit(1);
            let riskChartData = null;
            if (dashboardCollectionData && dashboardCollectionData.length > 0) {
                riskChartData = dashboardCollectionData[0];
                let seriesDifference = riskChartData.series.length - 24;
                while (seriesDifference > 0) { // Remove historical data that is more than last 24 months
                    riskChartData.series.shift();
                    seriesDifference = seriesDifference - 1;
                }
            }
            return res.status(200).json(riskChartData);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Risk Level Chart - project threat list database GET request failed!");
        }
    })

router
    .route("/getProjectResidualRiskData") // use this route to fetch residual risk data for each project
    .get(async (req, res) => {
        try {
            let passQuery = [];
            let projectQuery = await ProjectThreatListModel.findOne({ "projectId": req.query.id });

            if (projectQuery) {
                for (let i = 0; i < projectQuery.threat.length; i++) {
                    if (projectQuery.threat[i].riskLevel) {
                        if (passQuery.find(x => x.name == projectQuery.threat[i].riskLevel)) {
                            let updateItem = passQuery.find(x => x.name == projectQuery.threat[i].riskLevel);
                            let index = passQuery.indexOf(updateItem);
                            passQuery[index].value = passQuery[index].value + 1;
                        } else {
                            passQuery.push({
                                name: projectQuery.threat[i].riskLevel,
                                value: 1,
                            });
                        }
                    } else {
                        if (passQuery.find(x => x.name == 'undetermined')) {
                            let updateItem = passQuery.find(x => x.name == 'undetermined');
                            let index = passQuery.indexOf(updateItem);
                            passQuery[index].value = passQuery[index].value + 1;
                        } else {
                            passQuery.push({
                                name: 'undetermined',
                                value: 1,
                            });
                        }
                    }
                }
                passQuery.sort((a, b) => (a.name < b.name) ? 1 : -1);
            } else {
                passQuery = [];
            }
            return res.status(200).json(passQuery);

        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Project Residual Risk - project threat list database GET request failed!");
        }
    })

router
    .route("/getProjectTopFiveWeaknesses") // use this route to fetch top five weaknesses for each project
    .get(async (req, res) => {
        try {
            let passQuery = [];
            return res.status(200).json(passQuery);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error: Get Project Top 5 Weakness - project threat list database GET request failed!");
        }
    })
module.exports = { router };
