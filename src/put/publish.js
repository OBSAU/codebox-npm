/*
 * Publish a new version of the package
 */
'use strict';

const AWS = require('aws-sdk');

function commitIndex(packageJson, packageName, callback) {
    let params = {
        Bucket: process.env.bucket,
        Key: `${packageName}/index.json`,
        Body: JSON.stringify(packageJson)
    };

    const s3 = new AWS.S3();

    s3.putObject(params, (err, data) => {
        if(err) {
            console.log("Failed to write updated index file", err);
            callback(null, {
              statusCode: 404,
              body: JSON.stringify({
                error: err.message,
              }),
            });
        } else {
            console.log("Committed updated index to s3: ", params.Key);
            return callback(null, {
              statusCode: 200,
              body: JSON.stringify({
                success: true,
              }),
            });
        }
    });
}

function uploadContent(packageJson, packageName, version, fileData, callback) {
    console.log("Uploading file content", packageName, version);

    let params = {
        Bucket: process.env.bucket,
        Key: `${packageName}/${version}.tgz`,
        Body: Buffer.from(fileData, 'base64')
    };

    const s3 = new AWS.S3();

    s3.putObject(params, (err, data) => {
        if(err) {
            console.log("Failed to write content file", err);
            callback(null, {
              statusCode: 404,
              body: JSON.stringify({
                error: err.message,
              }),
            });
        } else {
            console.log("Wrote file to s3: ", params.Key);
            commitIndex(packageJson, packageName, callback);
        }
    });
}

function updateIndex(packageJson, packageName, version, fileData, tag, srcPackage, callback) {
    console.log("Updating index", packageName, version);

    if (packageJson.versions[version]) {
        console.log("Existing version found", packageJson.versions);

        return callback(null, {
            statusCode: 403,
            body: JSON.stringify({
                success: false,
                error: `You cannot publish over the previously published version ${version}.`,
            }),
        });
    }

    packageJson['dist-tags'][tag] = version;
    packageJson._attachments = {}; // eslint-disable-line no-underscore-dangle
    packageJson._attachments[`${packageName}-${version}.tgz`] = srcPackage; // eslint-disable-line no-underscore-dangle
    packageJson.versions[version] = fileData;

    let fileContent = packageJson._attachments[`${packageName}-${version}.tgz`].data;

    uploadContent(packageJson, packageName, version, fileContent, callback);
}

function loadIndex(packageName, version, fileData, tag, srcPackage, rawContent, callback) {
    let params = {
        Bucket: process.env.bucket,
        Key: `${packageName}/index.json`
    };

    const s3 = new AWS.S3();

    s3.getObject(params, (err, data) => {
        if(err) {

            if(err.code === 'NoSuchKey') {
                console.log("No package exists yet, creating a new one", params.Key);

                console.log("Raw content is", rawContent);

                let json = rawContent;
                json['dist-tags'].latest = version;

                let fileContent = rawContent._attachments[`${packageName}-${version}.tgz`].data;

                uploadContent(json, packageName, version, fileContent, callback);
            } else {
                console.log("Error locating package index", err);

                callback(null, {
                    statusCode: 404,
                    body: JSON.stringify({
                        error: err.message,
                    }),
                });
            }

        } else {
            console.log("Found index for ", params.Key);

            let json = JSON.parse(data.Body.toString());
            updateIndex(json, packageName, version, fileData, tag, srcPackage, callback);
        }
    });
}

exports.handler = (event, context, handlerCallback) => {

    //console.log("Event received is " + JSON.stringify(event));

    const packageName = `${decodeURIComponent(event.pathParameters.name)}`;

    let body = event.body;
    if(event.isBase64Encoded) {
        let buff = Buffer.from(body, 'base64');
        body = buff.toString('ascii');
    }

    const pkg = JSON.parse(body);
    const tag = Object.keys(pkg['dist-tags'])[0];
    const version = pkg['dist-tags'][tag];
    const versionData = pkg.versions[version];

    const apiEndpoint = `https://${event.requestContext.domainName}${event.requestContext.path}`;

    const tarballFilename = encodeURIComponent(versionData.dist.tarball.split('/-/')[1]);
    versionData.dist.tarball = `${apiEndpoint}/-/${tarballFilename}`;

    const srcPackage = pkg._attachments[`${packageName}-${version}.tgz`];

    loadIndex(packageName, version, versionData, tag, srcPackage, pkg, handlerCallback);
};
