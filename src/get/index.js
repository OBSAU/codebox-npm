/*
 * Gets the details about a package
 */
'use strict';

const AWS = require('aws-sdk');

function loadIndex(packageName, callback) {

    let params = {
        Bucket: process.env.bucket,
        Key: `${packageName}/index.json`
    }

    const s3 = new AWS.S3();

    s3.getObject(params, (err, data) => {
        if(err) {
            console.log("failed fetching index", err);
            callback(null, {
              statusCode: 404,
              body: JSON.stringify({
                error: err.message,
              }),
            });
        } else {
            const json = JSON.parse(data.Body.toString());
            json._attachments = {}; // eslint-disable-line no-underscore-dangle

            const version = json['dist-tags'].latest;

            console.log("Latest version is ", version);

            callback(null, {
              statusCode: 200,
              body: JSON.stringify(json),
            });
        }
    });
}

exports.handler = (event, context, handlerCallback) => {

    console.log("Event received is " + JSON.stringify(event));

    const name = `${decodeURIComponent(event.pathParameters.name)}`;

   loadIndex(name, handlerCallback);
}
