const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
    const params = {
        MessageBody: JSON.stringify(event.body),
        QueueUrl: process.env.QUEUE_URL,
    };

    try {
        await sqs.sendMessage(params).promise();
        return { 
            statusCode: 200, 
            headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Für Produktionsumgebungen sollten Sie dies auf Ihre Domain beschränken
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            body: JSON.stringify({ message: 'Message sent to SQS' }) };
    } catch (error) {
        console.error(error);
        return { 
            statusCode: 500,
            headers: {
            "Access-Control-Allow-Origin": "*", // Für Produktionsumgebungen sollten Sie dies auf Ihre Domain beschränken
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            body: 'Failed to send message' };
    }
};

