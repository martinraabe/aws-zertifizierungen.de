// index.js innerhalb Ihres Lambda-Code-Verzeichnisses
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  const { messageId, receiptHandle, ...itemData } = JSON.parse(event.body);
  
  // Schreiben in DynamoDB
  await dynamoDB.put({
    TableName: process.env.TABLE_NAME,
    Item: itemData,
  }).promise();

  // Löschen aus SQS
  await sqs.deleteMessage({
    QueueUrl: process.env.QUEUE_URL,
    ReceiptHandle: receiptHandle,
  }).promise();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" // Für CORS
    },
    body: JSON.stringify({ message: 'Daten gespeichert und Nachricht gelöscht' }),
  };
};