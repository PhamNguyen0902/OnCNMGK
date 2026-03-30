const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");

const info = {
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
};

module.exports = {
  dynamodbClient: DynamoDBDocument.from(new DynamoDBClient(info)),
  s3Client: new S3Client(info),
};