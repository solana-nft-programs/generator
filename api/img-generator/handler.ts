import { getImage } from "./generator";

module.exports.generate = async (event) => {
  const buffer = await getImage(
    event?.pathParameters?.mintId,
    event?.queryStringParameters?.uri,
    event?.queryStringParameters?.text,
    event?.queryStringParameters?.cluster
  );

  const response = {
    statusCode: 200,
    headers: {
      "content-type": "image/png",
      "content-disposition": `inline;filename="${
        (event.pathParameters && event.pathParameters.mintId) || "untitled"
      }.png"`,
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };
  return response;
};
