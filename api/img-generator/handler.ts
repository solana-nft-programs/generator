/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { getImage } from "./generator";

module.exports.generate = async (event) => {
  const buffer = await getImage(
    event?.pathParameters?.mintId,
    event.queryStringParameters && event.queryStringParameters.name,
    event.queryStringParameters && event.queryStringParameters.uri,
    event.queryStringParameters && event.queryStringParameters.text,
    event.queryStringParameters && event.queryStringParameters.cluster
  );

  console.log("Returning image buffer", buffer);
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "content-type": "image/png",
      "content-disposition": `inline;filename="${
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        (event.pathParameters && event.pathParameters.mintId) || "untitled"
      }.png"`,
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };
  return response;
};
