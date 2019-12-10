/**
 * Lists tags on a package
 */
"use strict";

const AWS = require('aws-sdk');

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

            callback(null, {
                statusCode: 200,
                body: JSON.stringify(json['dist-tags']),
            });
        }
    });
}

exports.handler = (event, context, handlerCallback) => {

    //console.log("Event received is " + JSON.stringify(event));
    const packageName = `${decodeURIComponent(event.pathParameters.name)}`;
    const tagName = event.pathParameters.tag;

    loadIndex(packageName, tagName, handlerCallback);
};
