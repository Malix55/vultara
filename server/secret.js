const AWS = require("aws-sdk");
const awsSecretManagerName = require('./config').awsSecretManagerName;

// Create a Secrets Manager client
const client = new AWS.SecretsManager({
    region: 'us-east-1'
});

const getAllSecret = () => {
    return new Promise((resolve, reject) => {
        let secrets = {};
        const secretName = awsSecretManagerName;
        client.getSecretValue({ SecretId: secretName }, function (err, data) {
            if (err) {
                console.error('getAllSecret - error: ', err);
                reject(err);
            }
            else {
                // Depending on whether the secret is a string or binary, one of these fields will be populated.
                if ('SecretString' in data) {
                    secrets = data.SecretString;
                }
                else {
                    let buff = new Buffer(data.SecretBinary, 'base64');
                    secrets = buff.toString('ascii');
                }
                secrets = JSON.parse(secrets);
                resolve(secrets);
            }
        });
    });
};

module.exports.getSecrets = async () => {
    const keys = await getAllSecret();
    return {
        ATLASDB: keys.ATLASDB,
        ATLASDB_COMPONENTREAD: keys.ATLASDB_COMPONENTREAD,
        ATLASDB_DATAANALYTICS: keys.ATLASDB_DATAANALYTICS,
        ATLASDB_ALGOREAD: keys.ATLASDB_ALGOREAD,
        ATLASDB_USERACCESS: keys.ATLASDB_USERACCESS
    }
}