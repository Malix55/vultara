const AWS = require('aws-sdk'), region = "us-east-1";
require("dotenv").config({ path: __dirname + "/./../.env" });

const client = new AWS.SecretsManager({
    region: region
});

class AWSSecretManager {
    // Get AWS secret value from AWS secret manager.
    async getAWSSecretValues(SecretId) {
        try {
            const data = await client.getSecretValue({ SecretId }).promise()
            const parsedData = JSON.parse(data.$response.data.SecretString);
            return parsedData;
        } catch (error) {
            console.log("There is an error when fetching AWS secret. Error: " + error.message);
        }
    }
}

module.exports = AWSSecretManager;