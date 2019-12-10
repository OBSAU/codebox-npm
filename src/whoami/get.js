/*
 * Publish a new version of the package
 */
'use strict';

exports.handler = (event, context, handlerCallback) => {

    //console.log("Event received is " + JSON.stringify(event));
    handlerCallback(null, {
        statusCode: 200,
        body: JSON.stringify({
            username: event.requestContext.authorizer.username,
        }),
    });
}

