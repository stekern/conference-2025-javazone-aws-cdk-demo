# conference-2025-javazone-aws-cdk-demo
A demo repository that contains:
- A CDK application that uses CDK Pipelines and creates an API Gateway REST API backed by AWS Lambda
- A GitHub Actions workflow for synthesizing the CDK application, and uploading the resulting Cloud Assembly (i.e., `cdk.out`) to S3
- An AWS CodePipeline that deploys the Cloud Assembly

## Usage
If you want to try out the demo for yourself:
1. Fork or clone the repository.
1. Replace the account ID in `.github/workflows/ci.yml`, and account ID and GitHub repository in `src/config.ts` with your values.
1. [Bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html) your AWS account for usage with AWS CDK. This can easily be done through the AWS CDK CLI: `npx cdk bootstrap "aws://123456789012/eu-west-1"`.
1. Manually deploy the deployment pipeline itself (this is a one-time operation - the pipeline automatically keeps itself updated afterwards): `npx cdk deploy pipeline`.
1. Push a commit to trunk, and follow your change through GitHub Actions and AWS CodePipeline, and verify that the API Gateway REST API has been deployed.
