/*
 * Gets the details about a package
 */
'use strict';

const AWS = require('aws-sdk');

function loadIndex(packageName, tarName, callback) {

    const fileName = tarName.replace(`${packageName}-`, '');

    let params = {
        Bucket: process.env.bucket,
        Key: `${packageName}/${fileName}`
    };

    const s3 = new AWS.S3();

    s3.getObject(params, (err, data) => {
        if(err) {
            console.log("failed fetching package content", err);
            callback(null, {
              statusCode: 404,
              body: JSON.stringify({
                error: err.message,
              }),
            });
        } else {
            console.log("Found content for ", params.Key);

            const response = {
                statusCode: 200,
                headers: {
                    "Content-Type" : "application/octet-stream"
                },
                isBase64Encoded: true,
                body: data.Body.toString('base64'),
            };

            callback(null, response);
        }
    });
}

exports.handler = function (event, context, handlerCallback)  {
    console.log("Event received is " + JSON.stringify(event));

    const packageName = `${decodeURIComponent(event.pathParameters.name)}`;
    const tarName = `${decodeURIComponent(event.pathParameters.tar)}`;

    loadIndex(packageName, tarName, handlerCallback);
};
