require('dotenv').config({ path: __dirname + '/./../.env' });
const aws = require('aws-sdk');
const { secretAccessKey, accessKeyId } = require('../config');
const { aws: { region } } = require('../config').nvdDatabaseS3;

/**
 * Send email to recipients
 * @param {String} content 
 * @param {String} title 
 * @param {String Array} recipients 
 * @returns {Object | Error}
 */
module.exports.sendEmail = async (content, title = 'No title is provided', recipients = []) => {
    try {
        aws.config.update({
            secretAccessKey: secretAccessKey,
            accessKeyId: accessKeyId,
            region
        });

        const originatingEmail = 'no-reply@vultara.com'
        const params = {
            Destination: {
                ToAddresses: recipients,
            },
            Message: {
                Body: { Text: { Charset: 'UTF-8', Data: content } },
                Subject: { Charset: 'UTF-8', Data: title },
            },
            Source: `Vultara <${originatingEmail}>`,
            ReplyToAddresses: [originatingEmail],
        }
        // Create the promise and SES service object
        return new aws.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
    } catch (e) {
        throw new Error(e)
    }
}
