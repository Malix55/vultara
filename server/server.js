// require("./database/localDatabaseConnect");
require("./database/atlasTrialDatabaseConnect");
const express = require("express");
const fs = require('fs');
const path = require('path');
const app = express();
var cookieParser = require('cookie-parser');
const projectDb = require("./database/projectDatabase").router;
const executeAlgorithmForScheduler = require('./database/executeAlgorithmForScheduler').router;
const dashboardRoutes = require("./database/routesForDashboard").router;
const threatLibDb = require("./database/threatLibDb");
const componentDb = require("./database/componentLibDb");
const featureDb = require("./database/featureLibDb");
const assetDb = require("./database/assetLibDb");
const systemConfigDb = require("./database/systemConfigDb");
const mitreAttackDb = require("./database/mitreAttackDb");
const userAccess = require("./database/userAccessDb");
const milestoneSchedulerDb = require("./database/milestoneScheduleDb");
const sharedComponentDb = require("./database/sharedComponentDb");
const assetLibManualScript = require("./database/assetLibManualScript");
const projectVulnerbilityDb = require("./database/vulnerbilityDb")
const projectAssumptionDb = require("./database/projectAssumptionDb")
const projectReportsDb = require("./database/reports")
const riskUpdateNotificationDb = require("./database/riskUpdateNotificationDb");
const securedUserAccess = require("./database/securedUserAccessDb");
const otherNotificationsDb = require("./database/otherNotificationsDb");
const projectMilestoneDb = require("./database/projectMilestoneDb");
const storeReportInformation = require("./database/storeReportInformation");
const helpPageDb = require("./database/helpPageDb");
const weaknessDb = require("./database/weaknessDb");
const passport = require('passport');
const session = require('express-session');
const morgan = require("morgan");
require('dotenv').config({ path: __dirname + '/./.env' });
const cryptoService = require("./service/cryptoService");

const frontEndURL = require("./config").frontEndURL;

app.use(passport.initialize());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan(':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer"'))

// CORS access control header
app.use((req, res, next) => {
  switch (process.env.AWS_DEPLOY) {
    case "prod":
      const allowedOrigins = [...frontEndURL];
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin); // restrict it to the required domain
      }
      break;

    default:
      res.header("Access-Control-Allow-Origin", frontEndURL);
      break;
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", true); // for sessions
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE,GET");
    return res.status(200).json({});
  };
  next();
});

// session setup for local strategy
// const sessionStore = new MongoStore({ mongooseConnection: connection, collection: 'sessions' });
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     store: sessionStore,
//     cookie: {
//         maxAge: 1000 * 60 * 60 * 24, // 1000 msec = 1 sec, 60 secs, 60 mins, 24 hours
//         secure: false,
//     }
// }));
// require("./service/passportLocalSetup");
// app.use(passport.initialize());
// app.use(passport.session());
// app.use((req, res, next) => {
//     console.log(req.session);
//     console.log(req.user);
//     console.log("isAuthenticated: " + req.isAuthenticated());
//     // console.log(req);
//     next();
// });

// function that excludes specific paths from middleware
const ignorePath = (middleware, ...paths) => (req, res, next) => paths.some(path => path === req.path) ? next() : middleware(req, res, next);


// route to show the server is up running
app.get("/", (req, res) => {
  res.send("Server is running.");
});
// account-related route that doesn't require security check, such as user login
app.use("/api/user", userAccess);
// routes for shared components, including protocolLib, microLib, commLineLib
app.use("/api/sharedcomponents", passport.authenticate('jwt', { session: false }), sharedComponentDb);
// route for project data and project execution
app.use("/api/projects", passport.authenticate('jwt', { session: false }), ignorePath(cryptoService.userAuth, "/getAllProjectIdsOfUser", "/cybersecurityGoalsLibrary", "/wp29Threats","/controlLib"), projectDb);
app.use('/api/executealgorithm', executeAlgorithmForScheduler)
// route for dashboard
app.use("/api/dashboard", passport.authenticate('jwt', { session: false }), cryptoService.userAuth, dashboardRoutes);
// route for customer-specific component DB
app.use("/api/components", passport.authenticate('jwt', { session: false }), componentDb);
// route for feature data
app.use("/api/features", passport.authenticate('jwt', { session: false }), featureDb);
// route for asset data
app.use("/api/assets", passport.authenticate('jwt', { session: false }), assetDb);
// route for system configurations
app.use("/api/config", passport.authenticate('jwt', { session: false }), systemConfigDb);
// route for mitreAttack
app.use("/api/mitreattack", passport.authenticate('jwt', { session: false }), mitreAttackDb);
// route to use threat libraries. only NodeJS uses this route. No direct front end access is allowed.
app.use("/api/libraries", threatLibDb);
// scheduler route that should be executed only from backend when node-scheduler find out specified EST time (Sunday 7PM)
app.use("/api/milestone-schedule", milestoneSchedulerDb);
// Manually update all project's asset information
app.use("/api/manualscript/assetlib", assetLibManualScript);
// route for vulnerability
app.use("/api/vulnerability", passport.authenticate('jwt', { session: false }), cryptoService.userAuth, projectVulnerbilityDb);
// route for assumption
app.use("/api/assumption", passport.authenticate('jwt', { session: false }), cryptoService.userAuth, projectAssumptionDb);
// route for reports
app.use("/api/reports", passport.authenticate('jwt', { session: false }), projectReportsDb);
// route for notifications
app.use("/api/riskUpdate", passport.authenticate('jwt', { session: false }), ignorePath(cryptoService.userAuth, "/email"), riskUpdateNotificationDb);
// account-related route that requires security check
app.use("/api/secureduser", passport.authenticate('jwt', { session: false }), securedUserAccess);
// route for other notifications
app.use("/api/otherNotifications", passport.authenticate('jwt', { session: false }), cryptoService.userAuth, otherNotificationsDb);
// route for project milestones
app.use("/api/milestones", passport.authenticate('jwt', { session: false }), cryptoService.userAuth, projectMilestoneDb);
// route for storing report information from the EC2 server
app.use("/api/storeReports", storeReportInformation);
// route for helpPage
app.use("/api/helpPage", passport.authenticate('jwt', { session: false }), helpPageDb);
// route for weaknesses
app.use("/api/weakness", passport.authenticate('jwt', { session: false }), cryptoService.userAuth, weaknessDb);

if (process.env.AWS_DEPLOY == "local") { // local host on port 4201
  const port = 4201;
  app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
  });
} else if (process.env.AWS_DEPLOY == 'trial') { //
  var serverless = require('serverless-http');
  module.exports.handler = serverless(app);
  // const port = process.env.PORT;
  // app.listen(port, () => {
  //   console.log(`Listening on port ${port}...`);
  // });
} else if (process.env.AWS_DEPLOY == 'prod') {
  var serverless = require('serverless-http');
  module.exports.handler = serverless(app);
} else {
  console.log(`Error: Missing .env file or value of AWS_DEPLOY in .env file is invalid. Valid AWS_DEPLOY values include "local", "trial", and "prod".`);
}
// this port is running, but not tested
//https.createServer(options, app).listen(8080);
