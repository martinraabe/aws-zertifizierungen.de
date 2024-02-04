import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class HelloSqsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // SQS-Queue erstellen
    const queue = new sqs.Queue(this, 'HelloSqsQueue', {
      visibilityTimeout: Duration.seconds(300),
    });

    // Erstellen der DynamoDB-Tabelle
    const table = new dynamodb.Table(this, 'MyTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // oder PROVISIONED
    });

    // Lambda-Funktion erstellen
    const helloLambda = new lambda.Function(this, 'HelloLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'hello.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });

   // Erstellen der Lambda-Funktion für speichern in dynamo und löschen in SQS
    const savedynamodbdeletesqs = new lambda.Function(this, 'savedynamodbdeletesqs', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'savedynamodbdeletesqs.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        QUEUE_URL: queue.queueUrl,
        TABLE_NAME: table.tableName,
      },
    });

    const sqsReader = new lambda.Function(this, 'SQSReader', {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: 'sqsreader.handler',
        code: lambda.Code.fromAsset('lambda'),
        environment: {
            SQS_QUEUE_URL: queue.queueUrl,
        },
    });

    // Berechtigung zum Senden von Nachrichten an die SQS-Queue erteilen
    queue.grantSendMessages(helloLambda);

    const api = new apigateway.RestApi(this, 'HelloApi', {
        restApiName: 'HelloService',
        defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: apigateway.Cors.ALL_METHODS, // oder verwenden Sie eine spezifischere Methode
            allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key','Access-Control-Allow-Origin'],
        },
    });


    const helloIntegration = new apigateway.LambdaIntegration(helloLambda);
    api.root.addMethod('POST', helloIntegration);
    
    const getSqsMessages = api.root.addResource('messages');

      // Hinzufügen der GET Methode mit Lambda-Integration und spezifischen Response-Headern
      getSqsMessages.addMethod('GET', new apigateway.LambdaIntegration(sqsReader), {
          methodResponses: [{
              statusCode: '200',
              responseParameters: {
                  'method.response.header.Access-Control-Allow-Origin': true,
                  'method.response.header.Access-Control-Allow-Headers': true,
                  'method.response.header.Access-Control-Allow-Methods': true,
                  'method.response.header.Content-Type': true,
              }
          }],
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
                  'method.response.header.Content-Type': true,
              }
          }],
    
    });

      // Berechtigung erteilen, damit die Lambda-Funktion Nachrichten aus SQS lesen kann
      queue.grantConsumeMessages(sqsReader);
      
       // Gewähren der notwendigen Berechtigungen für die Lambda-Funktion
    table.grantWriteData(savedynamodbdeletesqs); // Berechtigung zum Schreiben in die DynamoDB-Tabelle
    queue.grantConsumeMessages(savedynamodbdeletesqs); // Berechtigung zum Löschen von Nachrichten aus der SQS-Queue

    // Erstellen des API Gateways
  }
}
