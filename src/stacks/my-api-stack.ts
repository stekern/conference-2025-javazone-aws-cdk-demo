import * as cdk from "aws-cdk-lib"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import type * as constructs from "constructs"

export class MyApiStack extends cdk.Stack {
  public readonly apiUrl: cdk.CfnOutput

  constructor(scope: constructs.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    const lambdaFunction = new lambda.Function(this, "LambdaFunction", {
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      code: new lambda.InlineCode(`
        exports.handler = async () => {
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8"
            },
            body: "<h1>Hello JavaZone 👋</h1>"
          }
        }
      `),
    })

    const api = new apigw.LambdaRestApi(this, "Api", {
      handler: lambdaFunction,
    })

    this.apiUrl = new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    })
  }
}
