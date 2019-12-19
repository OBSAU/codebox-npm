"use strict";

const AWS = require('aws-sdk-mock');

const classUnderTest = require("../../src/adapters/token.js");
const TOKEN_VALUE = "D)#F$%^_GGA#Ddt4r";

beforeAll(() => {
    AWS.mock("SSM", "getParameter", (params, callback) => {
        expect(params.Name).toBeDefined();
        expect(params.WithDecryption).toBeTruthy();

        let ok_data = {
            Parameter: {
                Name: params.Name,
                Value: TOKEN_VALUE
            }
        };

        callback(null, ok_data);
    });
});

afterAll(() => {
    AWS.restore();
});

describe("Token encoding and decoding", () => {
    test("Basic encoding", async(done) => {

        const userName = "my-user";
        const result = classUnderTest.encode(userName);

        expect(result).toBeDefined();

        expect(classUnderTest.check(result)).toBeTruthy();
    });
});
