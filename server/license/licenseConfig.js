const localHostLicense = {
    customerName: "local",
    startDateOfLicense: new Date(2020, 3, 1), // April 1st, 2020, month is 0-indexed
    endDateOfLicense: new Date(9999, 0, 1),
    industry: "none",
    supplyChain: "none",
    numberOfProject: 50,
    vulnerabilityModule: true,
    protectModule: true,
    collectThreatRisk: true,
    commLineRestrictionNo: 50, 
    controlUnitRestrictionNo: 50,
    microRestrictionNo: 50,
    sageMakerStatus: false,
    complianceModules:["org", "proj", "dist", "concept", "dev", "v&v", "post", "continual"],
}
module.exports.localHostLicense = localHostLicense;

const trialLicense = {
    customerName: "vultara",
    startDateOfLicense: new Date(2020, 3, 1), // April 1st, 2020, month is 0-indexed
    endDateOfLicense: new Date(9999, 0, 1),
    industry: "none",
    supplyChain: "none",
    numberOfProject: 50,
    vulnerabilityModule: true,
    protectModule: true,
    collectThreatRisk: false,
    commLineRestrictionNo: 50, 
    controlUnitRestrictionNo: 50,
    microRestrictionNo: 50,
    sageMakerStatus: false,
    complianceModules:["org", "proj", "dist", "concept", "dev", "v&v", "post", "continual"],
}
module.exports.trialLicense = trialLicense;

const magnaElectronicsLicense = {
    customerName: "magnaElectronics",
    startDateOfLicense: new Date(2022, 6, 13),
    endDateOfLicense: new Date(2023, 6, 13),
    industry: "automotive",
    supplyChain: "tier-1",
    numberOfProject: 9,
    vulnerabilityModule: true,
    protectModule: false,
    collectThreatRisk: true,
    commLineRestrictionNo: 50, 
    controlUnitRestrictionNo: 50,
    microRestrictionNo: 50,
    sageMakerStatus: false,
    complianceModules:["concept"],
}
module.exports.magnaElectronicsLicense = magnaElectronicsLicense;

const dummyLicense = { // in case the deployment parameter in .env file was faulty
    customerName: "dummy",
    startDateOfLicense: new Date(2021, 3, 1), // April 1st, 2020, month is 0-indexed
    endDateOfLicense: new Date(9999, 0, 1),
    industry: "dummy",
    supplyChain: "dummy",
    numberOfProject: 1,
    vulnerabilityModule: true,
    protectModule: false,
    collectThreatRisk: false,
    commLineRestrictionNo: 50, 
    controlUnitRestrictionNo: 50,
    microRestrictionNo: 50,
    sageMakerStatus: false,
    complianceModules:["org", "proj", "dist", "concept", "dev", "v&v", "post", "continual"],
}
module.exports.dummyLicense = dummyLicense;
