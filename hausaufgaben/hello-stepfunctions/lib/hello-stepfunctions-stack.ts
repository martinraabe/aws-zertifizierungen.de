import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class HelloStepfunctionsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const startStateMachineVacationRequest = new lambda.Function(this, 'startStateMachineVacationRequest', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'startStateMachineVacationRequest.handler',
      code: lambda.Code.fromAsset('lambda'),
    });
    
        
    const stateMachineArn = 'arn:aws:states:eu-central-1:242232472692:stateMachine:VacationRequestProcess';
      startStateMachineVacationRequest.addToRolePolicy(new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [stateMachineArn],
    }));
    
    
    const submitVacationRequest = new lambda.Function(this, 'SubmitVacationRequest', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'submitVacationRequest.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    
    const validateVacationRequest = new lambda.Function(this, 'ValidateVacationRequest', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'validateVacationRequest.handler',
      code: lambda.Code.fromAsset('lambda'),
    });
    
    const approveVacationRequest = new lambda.Function(this, 'ApproveVacationRequest', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'approveVacationRequest.handler',
      code: lambda.Code.fromAsset('lambda'),
    });
    
    const notifyUser = new lambda.Function(this, 'NotifyUser', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'notifyUser.handler',
      code: lambda.Code.fromAsset('lambda'),
    });
    
    
    const submitJob = new tasks.LambdaInvoke(this, 'Submit Job', {
      lambdaFunction: submitVacationRequest,
      outputPath: '$.Payload',
    });
    
    const validateJob = new tasks.LambdaInvoke(this, 'Validate Job', {
      lambdaFunction: validateVacationRequest,
      outputPath: '$.Payload',
    });
    
    const approveJob = new tasks.LambdaInvoke(this, 'Approve Job', {
      lambdaFunction: approveVacationRequest,
      outputPath: '$.Payload',
    });
    
    const notifyUserJob = new tasks.LambdaInvoke(this, 'Notify User', {
      lambdaFunction: notifyUser,
      outputPath: '$.Payload',
    });
    
    const definition = submitJob
      .next(validateJob)
      .next(approveJob)
      .next(notifyUserJob);
    
    const vacationRequestStateMachine = new sfn.StateMachine(this, 'VacationRequestStateMachine', {
      definition,
      stateMachineName: 'VacationRequestProcess',
    });
    

    // Innerhalb der VacationRequestStack-Klasse, nachdem die Lambda-Funktionen definiert wurden
    
    const api = new apigateway.RestApi(this, 'VacationRequestApi', {
      restApiName: 'VacationRequestService',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS, // oder verwenden Sie eine spezifischere Methode
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key','Access-Control-Allow-Origin'],
      },
      description: 'API for handling vacation requests.'
    });

    // Lambda-Integrationen
    const startStateMachineVacationRequestIntegration = new apigateway.LambdaIntegration(startStateMachineVacationRequest);   
    const submitVacationRequestIntegration = new apigateway.LambdaIntegration(submitVacationRequest);
    const approveVacationRequestIntegration = new apigateway.LambdaIntegration(approveVacationRequest);
    const notifyUserIntegration = new apigateway.LambdaIntegration(notifyUser);
    const validateVacationRequestIntegration = new apigateway.LambdaIntegration(validateVacationRequest);

    // Ressourcen und Methoden hinzufügen
    const vacationRequest = api.root.addResource('vacation-request');
    
    vacationRequest.addMethod('POST',  startStateMachineVacationRequestIntegration, {
    methodResponses: [{
        statusCode: '200',
        responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': false,
            'method.response.header.Access-Control-Allow-Headers': false,
            'method.response.header.Access-Control-Allow-Methods': false,
            'method.response.header.Content-Type': false
            }
        }],
    });

    vacationRequest.addResource('approve').addMethod('POST', approveVacationRequestIntegration); // Antrag genehmigen
    vacationRequest.addResource('notify').addMethod('POST', notifyUserIntegration); // Benutzer benachrichtigen
    vacationRequest.addResource('validate').addMethod('POST', validateVacationRequestIntegration); // Urlaubsantrag validieren

    }
  }