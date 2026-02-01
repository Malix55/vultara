require('dotenv').config({ path: __dirname + '/./../.env' });
const { licenseFile } = require('../config');

// check component limit in license
function licenseCompLimit(commLineLength, microLength, controlUnitLength) {
    //Checking project components length against licenseConfig file values
    if (commLineLength > licenseFile.commLineRestrictionNo) {
        const errorMsg = `Your model has ${commLineLength} communication lines, exceeding the limit - ${licenseFile.commLineRestrictionNo} per project.`;
        console.log(errorMsg);
        throw Error(errorMsg);
    }
    else if (microLength > licenseFile.microRestrictionNo) {
        const errorMsg = `Your model has ${microLength} microcontrollers, exceeding the limit - ${licenseFile.microRestrictionNo} per project.`;
        console.log(errorMsg);
        throw Error(errorMsg);
    }
    else if (controlUnitLength > licenseFile.controlUnitRestrictionNo) {
        const errorMsg = `Your model has ${controlUnitLength} modules, exceeding the limit - ${licenseFile.controlUnitRestrictionNo} per project.`;
        console.log(errorMsg);
        throw Error(errorMsg);
    }
}
module.exports.licenseCompLimit = licenseCompLimit;