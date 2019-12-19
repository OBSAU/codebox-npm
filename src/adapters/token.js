/**
 * Common code for handling auth tokens
 */
"use strict";

const jwt = require('jwt-simple');
const AWS = require('aws-sdk');

const TOKEN_SECRET_PARAM = "/system/auth/npm/secret";

let tokenSecretKey;

/** Effectively the internal constructor */
async function moduleInit() {
    const ssm = new AWS.SSM();

    let params = {
        Name: TOKEN_SECRET_PARAM,
        WithDecryption: true
    };

    const result = await ssm.getParameter(params).promise();
    tokenSecretKey = result.data.Parameter.Value;
}

function encodeToken(userId) {
    const playload = {
        exp: Date.parse("2099-12-31"),
        iat: Date.now(),
        sub: userId
    };

    return jwt.encode(playload, tokenSecretKey);
}

function checkToken(userId, token) {
    const payload = jwt.decode(token, tokenSecretKey);

    return userId == payload.sub && Date.now > payload.exp;
}

// Run the constructor
moduleInit();

module.exports = {
    encode: encodeToken,
    check: checkToken
}