/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { mintToken } from "./generator";

module.exports.generate = async (event) => {
  const { requestorAddress } = event.body;
  const json = await mintToken(
    requestorAddress,
    event.pathParameters && event.pathParameters.mintClass,
    event.queryStringParameters && event.queryStringParameters.cluster
  );
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "content-type": "application/json",
    },
    body: JSON.stringify(json),
  };
  return response;
};
