// lambda/sqsReaderLambda.js
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
    const params = {
        QueueUrl: process.env.SQS_QUEUE_URL, // Die Queue URL wird über Umgebungsvariablen bereitgestellt
        MaxNumberOfMessages: 1 // Anpassen, wie benötigt
    };

    try {
        const data = await sqs.receiveMessage(params).promise();
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Achten Sie auf Sicherheitsaspekte
            },
            body: JSON.stringify(data.Messages)
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ein Fehler ist aufgetreten' })
        };
    }
};
