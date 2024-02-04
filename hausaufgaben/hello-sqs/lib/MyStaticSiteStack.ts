import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';

export class MyStaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Erstellen eines neuen S3 Buckets für das Webhosting, ohne publicReadAccess
    const bucket = new s3.Bucket(this, 'MyWebsiteBucket', {
      websiteIndexDocument: 'index.html',
      // Entfernen von publicReadAccess: true
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NICHT in der Produktion verwenden
       blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false
      }),
    });

    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');

    
    // Bucket Policy hinzufügen, um den Zugriff nur für CloudFront über OAI zu erlauben
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
      principals: [new iam.AnyPrincipal()],
    }));
    
    
    const distribution = new cloudfront.Distribution(this, 'MyDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity: oai,
        }),
      },
    });
    
        // Hochladen des Webseiteninhalts in den S3 Bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('www')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });
    
    
    // Ausgabe der Website-URL und CloudFront Distribution Domain
    new cdk.CfnOutput(this, 'WebsiteURL', { value: bucket.bucketWebsiteUrl });
    new cdk.CfnOutput(this, 'DistributionDomain', { value: distribution.distributionDomainName });
  }
}
