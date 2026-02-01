require('dotenv').config({ path: __dirname + '/./.env' });
const AWSSecretManager = require('./service/awsSecretManager');
const awsSecretManagerInstance = new AWSSecretManager();

const licenseConfig = require("./license/licenseConfig");
const frontEndUrl_Local = "http://localhost:4200";
const frontEndUrl_Trial = "https://awsportal.vultara.com";
const frontEndUrl_Prod = ["https://magnaelectronics.vultara.com"];
const sageMakerEndPointName_Trial = "";
const sageMakerEndPointName_ME_Prod = "";


let frontEndURL = frontEndUrl_Local; // Local deployment
let allFrontEndUrls = [frontEndUrl_Local, frontEndUrl_Trial, ...frontEndUrl_Prod];
let sageMakerEndPointName = sageMakerEndPointName_Trial;
let awsSecretManagerName = "";
let secretAccessKey = null, accessKeyId = null;

var licenseFile = licenseConfig.dummyLicense;

const prod_Secret_Manager_ID = "arn:aws:secretsmanager:us-east-1:837491041518:secret:me_prod_dotenv-tFo1Rc";
const trial_Secret_Manager_ID = "arn:aws:secretsmanager:us-east-1:837491041518:secret:vultara_trial_dotenv-AtHiX9";

const APP_SERVER_LOCAL_ROOT_HTTP_URL = "http://localhost:4201/api/";
const APP_SERVER_TRIAL_ROOT_HTTP_URL = "https://evbmjfeizk.execute-api.us-east-1.amazonaws.com/trial/api/";
const APP_SERVER_PROD_ROOT_HTTP_URL = "https://8l2pig761j.execute-api.us-east-1.amazonaws.com/me-prod/api/";

const APP_SERVER_LOCAL_HTTP_URL = "http://localhost:4201/api/libraries/";
const APP_SERVER_TRIAL_HTTP_URL = "https://evbmjfeizk.execute-api.us-east-1.amazonaws.com/trial/api/libraries/";
const APP_SERVER_PROD_HTTP_URL = "https://8l2pig761j.execute-api.us-east-1.amazonaws.com/me-prod/api/libraries/";

// URLs for nodejs server to access the report generator server, which sits in the same VPC as trial but not prod
const REPORT_SERVER_LOCAL_HTTP_URL = "http://localhost:4202/api/reports/";
const REPORT_SERVER_TRIAL_HTTP_URL = "http://ip-10-0-3-16.ec2.internal:4202/api/reports/";
const REPORT_SERVER_PROD_HTTP_URL = "http://vpce-0a4d84749c5e94d69-yc86kdmd.vpce-svc-06975ae424ca102d6.us-east-1.vpce.amazonaws.com/api/reports/";

// default setups are for local hosts
let APPServerRootHTTPURL = APP_SERVER_LOCAL_ROOT_HTTP_URL;
let APPServerHTTPURL = APP_SERVER_LOCAL_HTTP_URL;
let ReportServerHTTPURL = REPORT_SERVER_LOCAL_HTTP_URL;
const dbNameLocal = "MongoDB Atlas FreeClusterForTrial-libraries";
const dbNameTrial = "MongoDB Atlas VultaraDB Cluster0-librariesCustomer";
const dbNameProd = "MongoDB Atlas ME-PROD Cluster0-librariesCustomer";
var atlasDbConnection, algoDbConnection, userAccessDbConnection, dataAnalyticsDbConnection, componentDbConnection;
var dbName = dbNameLocal;
var dbNameAlgo = "MongoDB Atlas FreeClusterForTrial-libraries algorithm collections";
var dbNameDataAnalytics = "MongoDB Atlas FreeClusterForTrial-libraries dataAnalytics collections";
var dbNameComponent = "MongoDB Atlas FreeClusterForTrial-libraries componentDb collections";

// Deployment: Additional API Suffix for trial and prod
let DEPLOYMENT_API_SUFFIX = '';

switch (process.env.AWS_DEPLOY) {
  case "trial":
    // License information
    licenseFile = licenseConfig.trialLicense;

    // URL information
    frontEndURL = frontEndUrl_Trial; // AWS trial deployment
    APPServerRootHTTPURL = APP_SERVER_TRIAL_ROOT_HTTP_URL;
    APPServerHTTPURL = APP_SERVER_TRIAL_HTTP_URL; // AWS trial deployment
    ReportServerHTTPURL = REPORT_SERVER_TRIAL_HTTP_URL;
    DEPLOYMENT_API_SUFFIX = "/trial";

    // Secret Manager information
    awsSecretManagerName = "vultara_trial_dotenv";
    if (!secretAccessKey || !accessKeyId) { // Do not call AWS secret manager if the access is already there.
      awsSecretManagerInstance.getAWSSecretValues(trial_Secret_Manager_ID).then((result) => {
        if (result) {
          // AWS credentials
          secretAccessKey = result.secretAccessKey;
          accessKeyId = result.accessKeyId;
        }
      });
    }

    // Database information
    atlasDbConnection = process.env.ATLASDB; // AWS trial deployment
    dbName = dbNameTrial;
    algoDbConnection = process.env.ATLASDB_ALGOREAD; // prod server algorithm database
    userAccessDbConnection = process.env.ATLASDB_USERACCESS;
    dataAnalyticsDbConnection = process.env.ATLASDB_DATAANALYTICS;
    componentDbConnection = process.env.ATLASDB_COMPONENTREAD;
    dbNameAlgo = "MongoDB Atlas VultaraDB Cluster0-algorithmDb";
    dbNameComponent = "MongoDB Atlas VultaraDB Cluster0-componentDb";
    break;
  case "prod":
    // License information
    licenseFile = licenseConfig.magnaElectronicsLicense;

    // SageMaker API information
    sageMakerEndPointName = sageMakerEndPointName_ME_Prod;

    // URL information
    frontEndURL = frontEndUrl_Prod; // AWS production deployment
    APPServerRootHTTPURL = APP_SERVER_PROD_ROOT_HTTP_URL;
    APPServerHTTPURL = APP_SERVER_PROD_HTTP_URL; // AWS production deployment
    ReportServerHTTPURL = REPORT_SERVER_PROD_HTTP_URL;
    DEPLOYMENT_API_SUFFIX = "/me-prod";

    // Secret Manager information
    awsSecretManagerName = "me_prod_dotenv";
    if (!secretAccessKey || !accessKeyId) { // Do not call AWS secret manager if the access is already there.
      awsSecretManagerInstance.getAWSSecretValues(prod_Secret_Manager_ID).then((result) => {
        if (result) {
          // AWS credentials
          secretAccessKey = result.secretAccessKey;
          accessKeyId = result.accessKeyId;
        }
      });
    }

    // Database information
    atlasDbConnection = process.env.ATLASDB; // AWS production deployment
    userAccessDbConnection = process.env.ATLASDB_USERACCESS;
    dbName = dbNameProd;
    algoDbConnection = process.env.ATLASDB_ALGOREAD; // prod server algorithm database
    dataAnalyticsDbConnection = process.env.ATLASDB_DATAANALYTICS;
    componentDbConnection = process.env.ATLASDB_COMPONENTREAD;
    dbNameAlgo = "MongoDB Atlas ME-PROD Cluster0-algorithmDb";
    dbNameDataAnalytics = "MongoDB Atlas ME-PROD Cluster0-dataAnalyticsDb";
    dbNameComponent = "MongoDB Atlas ME-PROD Cluster0-componentDb";
    break;
  case "local":
    // License information
    licenseFile = licenseConfig.localHostLicense;

    // URL information
    frontEndURL = frontEndUrl_Local; // Local deployment
    APPServerRootHTTPURL = APP_SERVER_LOCAL_ROOT_HTTP_URL;
    APPServerHTTPURL = APP_SERVER_LOCAL_HTTP_URL; // Local deployment
    ReportServerHTTPURL = REPORT_SERVER_LOCAL_HTTP_URL;

    // Database information
    atlasDbConnection = process.env.ATLASTRIALDB_LOCAL; // Local deployment
    algoDbConnection = process.env.ATLASTRIALDB_LOCAL; // prod server algorithm database
    userAccessDbConnection = process.env.ATLASTRIALDB_NONPRODJWTUSERACCESSDB;
    dataAnalyticsDbConnection = process.env.ATLASTRIALDB_LOCALDATAANALYTICS;
    componentDbConnection = process.env.ATLASTRIALDB_LOCAL;

    // AWS credentials
    secretAccessKey = process.env.secretAccessKey;
    accessKeyId = process.env.accessKeyId;
    break;
  default:
    licenseFile = licenseConfig.dummyLicense;
    const errorMsg = `ERROR: license file configuration error. Please make sure a proper license file is selected.`;
    console.log(errorMsg);
    throw Error(errorMsg);
}
module.exports.DEPLOYMENT_API_SUFFIX = DEPLOYMENT_API_SUFFIX;
module.exports.licenseFile = licenseFile;
module.exports.frontEndURL = frontEndURL;
module.exports.allFrontEndUrls = allFrontEndUrls;
module.exports.s3HelpPageBucketName = "vultara-help-page-bucket";
module.exports.s3ReportsBucketName = "vultara-reports-bucket";
module.exports.secretAccessKey = secretAccessKey;
module.exports.accessKeyId = accessKeyId;
module.exports.sageMakerEndPointName = sageMakerEndPointName;
module.exports.awsSecretManagerName = awsSecretManagerName;
module.exports.nvdDatabaseS3 = {
  aws: {
    region: "us-east-1",
    awsBaseUrl: "https://vultara-nvdsync-data.s3.amazonaws.com",
    awsBucket: "vultara-nvdsync-data"
  }
}
module.exports.ACCESS_TOKEN = "nmpj924YjeCzue5s";
module.exports.APPServerRootHTTPURL = APPServerRootHTTPURL;
module.exports.APPServerHTTPURL = APPServerHTTPURL;
module.exports.ReportServerHTTPURL = ReportServerHTTPURL;
module.exports.atlasDbConnection = atlasDbConnection;
module.exports.algoDbConnection = algoDbConnection; module.exports.userAccessDbConnection = userAccessDbConnection;
module.exports.dataAnalyticsDbConnection = dataAnalyticsDbConnection;
module.exports.componentDbConnection = componentDbConnection;
module.exports.dbName = dbName;
module.exports.dbNameAlgo = dbNameAlgo;
module.exports.dbNameDataAnalytics = dbNameDataAnalytics;
module.exports.dbNameComponent = dbNameComponent;
