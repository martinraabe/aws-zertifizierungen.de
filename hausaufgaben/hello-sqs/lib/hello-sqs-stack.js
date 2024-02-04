"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var aws_cdk_lib_1 = require("aws-cdk-lib");
var sqs = require("aws-cdk-lib/aws-sqs");
var lambda = require("aws-cdk-lib/aws-lambda");
var apigateway = require("aws-cdk-lib/aws-apigateway");
var dynamodb = require("aws-cdk-lib/aws-dynamodb");
var HelloSqsStack = /** @class */ (function (_super) {
    __extends(HelloSqsStack, _super);
    function HelloSqsStack(scope, id, props) {
        var _this = _super.call(this, scope, id, props) || this;
        // SQS-Queue erstellen
        var queue = new sqs.Queue(_this, 'HelloSqsQueue', {
            visibilityTimeout: aws_cdk_lib_1.Duration.seconds(300)
        });
        // Erstellen der DynamoDB-Tabelle
        var table = new dynamodb.Table(_this, 'MyTable', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });
        // Lambda-Funktion erstellen
        var helloLambda = new lambda.Function(_this, 'HelloLambda', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hello.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                QUEUE_URL: queue.queueUrl
            }
        });
        // Erstellen der Lambda-Funktion für speichern in dynamo und löschen in SQS
        var savedynamodbdeletesqs = new lambda.Function(_this, 'savedynamodbdeletesqs', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'savedynamodbdeletesqs.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                QUEUE_URL: queue.queueUrl,
                TABLE_NAME: table.tableName
            }
        });
        var sqsReader = new lambda.Function(_this, 'SQSReader', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'sqsreader.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                SQS_QUEUE_URL: queue.queueUrl
            }
        });
        // Berechtigung zum Senden von Nachrichten an die SQS-Queue erteilen
        queue.grantSendMessages(helloLambda);
        var api = new apigateway.RestApi(_this, 'HelloApi', {
            restApiName: 'HelloService',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'Access-Control-Allow-Origin']
            }
        });
        var helloIntegration = new apigateway.LambdaIntegration(helloLambda);
        api.root.addMethod('POST', helloIntegration);
        var getSqsMessages = api.root.addResource('messages');
        // Hinzufügen der GET Methode mit Lambda-Integration und spezifischen Response-Headern
        getSqsMessages.addMethod('GET', new apigateway.LambdaIntegration(sqsReader), {
            methodResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Headers': true,
                        'method.response.header.Access-Control-Allow-Methods': true,
                        'method.response.header.Content-Type': true
                    }
                }]
        });
        // Hinzufügen einer POST-Methode für die Lambda-Funktion
        // naming hier falsch, da getSqsMessages hier wiederverwendet wird, aber das war nicht geplant
        getSqsMessages.addMethod('POST', new apigateway.LambdaIntegration(savedynamodbdeletesqs), {
            methodResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Headers': true,
                        'method.response.header.Access-Control-Allow-Methods': true,
                        'method.response.header.Content-Type': true
                    }
                }]
        });
        // Berechtigung erteilen, damit die Lambda-Funktion Nachrichten aus SQS lesen kann
        queue.grantConsumeMessages(sqsReader);
        // Gewähren der notwendigen Berechtigungen für die Lambda-Funktion
        table.grantWriteData(savedynamodbdeletesqs); // Berechtigung zum Schreiben in die DynamoDB-Tabelle
        queue.grantConsumeMessages(savedynamodbdeletesqs); // Berechtigung zum Löschen von Nachrichten aus der SQS-Queue
        return _this;
        // Erstellen des API Gateways
    }
    return HelloSqsStack;
}(aws_cdk_lib_1.Stack));
exports.HelloSqsStack = HelloSqsStack;
