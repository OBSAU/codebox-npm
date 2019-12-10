/**
 * Deletes tags
 */
"use strict";

const AWS = require('aws-sdk');

function updateIndex(packageJson, packageName, tagName, callback) {

    delete packageJson['dist-tags'][tagName];

    let params = {
        Bucket: process.env.bucket,
        Key: `${packageName}/index.json`,
        Body: JSON.stringify(packageJson)
    };

    const s3 = new AWS.S3();

    s3.putObject(params, (err, data) => {
        if(err) {
            console.log("Error writing updated index", err);

            callback(null, {
                statusCode: 500,
                body: JSON.stringify({
                    error: err.message,
                }),
            });
        } else {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                    id: packageName,
                    'dist-tags': packageJson['dist-tags'],
                }),
            });
        }
    });
}

function loadIndex(packageName, tagName, callback) {
    let params = {
        Bucket: process.env.bucket,
        Key: `${packageName}/index.json`
    };

    const s3 = new AWS.S3();

    s3.getObject(params, (err, data) => {
        if(err) {
            console.log("Error locating package index", err);

            callback(null, {
                statusCode: 404,
                body: JSON.stringify({
                    error: err.message,
                }),
            });
        } else {
            console.log("Found index for ", params.Key);

            let json = JSON.parse(data.Body.toString());
            updateIndex(json, packageName, tagName, callback);
        }
    });
}

exports.handler = (event, context, handlerCallback) => {

    //console.log("Event received is " + JSON.stringify(event));
    const packageName = `${decodeURIComponent(event.pathParameters.name)}`;
    const tagName = event.pathParameters.tag;

    loadIndex(packageName, tagName, handlerCallback);
};
