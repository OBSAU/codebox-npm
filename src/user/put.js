/*
 * Publish a new version of the package
 */
'use strict';

const AWS = require('aws-sdk');

exports.handler = (event, context, handlerCallback) => {

    //console.log("Event received is " + JSON.stringify(event));

    let body = event.body;
    if(event.isBase64Encoded) {
        let buff = Buffer.from(body, 'base64');
        body = buff.toString('ascii');
    }

    const request = JSON.parse(body);

    let username = request.name;
    const password = request.password;

    const nameParts = name.split('.');
    const username = nameParts[0];

    ssm = new AWS.SSM();

    // fetch password and username
}

export default async ({ body }, context, callback) => {
  const {
    name,
    password,
  } = JSON.parse(body);

  const scopes = ['user:email'];

  if (process.env.restrictedOrgs) {
    scopes.push('read:org');
  }

  const nameParts = name.split('.');
  const username = nameParts[0];
  const otp = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const github = new GitHub({
    auth: {
       username: username,
       password: password
    }
  });

  let auth = {};
  try {
    auth = await github.oauthAuthorizations.getOrCreateAuthorizationForApp({
      scopes,
      client_id: process.env.githubClientId,
      client_secret: process.env.githubSecret,
      note: 'codebox private npm registry',
      headers: {
        'X-GitHub-OTP': otp,
      },
    });

    if (!auth.data.token.length) {
      await github.oauthAuthorizations.deleteAuthorization({
        authorization_id: auth.data.id,
        headers: {
          'X-GitHub-OTP': otp,
        },
      });

      auth = await github.oauthAuthorizations.createAuthorization({
        scopes,
        client_id: process.env.githubClientId,
        client_secret: process.env.githubSecret,
        note: 'codebox private npm registry',
        headers: {
          'X-GitHub-OTP': otp,
        },
      });
    }

    return callback(null, {
      statusCode: 201,
      body: JSON.stringify({
        ok: true,
        token: auth.data.token,
      }),
    });
  } catch (error) {
    return callback(null, {
      statusCode: 403,
      body: JSON.stringify({
        ok: false,
        error: error.message,
      }),
    });
  }
};
