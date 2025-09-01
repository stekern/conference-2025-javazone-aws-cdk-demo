import * as cdk from "aws-cdk-lib"
import * as codebuild from "aws-cdk-lib/aws-codebuild"
import * as codepipeline from "aws-cdk-lib/aws-codepipeline"
import * as actions from "aws-cdk-lib/aws-codepipeline-actions"
import * as events from "aws-cdk-lib/aws-events"
import * as targets from "aws-cdk-lib/aws-events-targets"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as pipelines from "aws-cdk-lib/pipelines"
import type * as constructs from "constructs"
import { accounts, defaultRegion } from "../config"
import { GithubActionsRole } from "../constructs/github-actions-role"
import { MyStage } from "../stages/my-stage"

interface Props extends cdk.StackProps {
  artifactBucketName: string
  githubActionsRoleName: string
  trustedRepositories: {
    name: string
    owner: string
    branches: string[]
  }[]
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: constructs.Construct, id: string, props: Props) {
    super(scope, id, props)
    // A bucket for uploading Cloud Assemblies to from GitHub Actions
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      versioned: true,
      bucketName: props.artifactBucketName,
      eventBridgeEnabled: true,
    })

    // A role that can be assumed by GitHub Actions
    const githubActionsRole = new GithubActionsRole(this, "GithubActionsRole", {
      roleName: props.githubActionsRoleName,
      repositories: props.trustedRepositories,
    })
    artifactBucket.grantReadWrite(githubActionsRole.role)

    // We get a bit more control over the deployment pipeline
    // by creating the underlying CodePipeline ourselves instead of
    // letting CDK Pipelines do it
    const codePipeline = new codepipeline.Pipeline(this, "CodePipeline", {
      crossAccountKeys: false,
      restartExecutionOnUpdate: true,
      pipelineType: codepipeline.PipelineType.V2,
    })

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      codePipeline,
      useChangeSets: false,
      codeBuildDefaults: {
        // Speed up CodeBuild jobs a bit by using Lambda
        buildEnvironment: {
          buildImage: codebuild.LinuxLambdaBuildImage.AMAZON_LINUX_2023_NODE_20,
          computeType: codebuild.ComputeType.LAMBDA_4GB,
        },
      },
      synth: pipelines.CodePipelineSource.s3(
        artifactBucket,
        "cloud-assembly.zip",
        {
          trigger: actions.S3Trigger.NONE,
        },
      ),
    })

    new events.Rule(this, "PipelineTrigger", {
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["Object Created"],
        detail: {
          bucket: {
            name: [artifactBucket.bucketName],
          },
          object: {
            key: ["cloud-assembly.zip"],
          },
        },
      },
      targets: [new targets.CodePipeline(codePipeline)],
    })

    // Instantiate our environment
    const dev = new MyStage(this, "dev", {
      env: {
        account: accounts.dev,
        region: defaultRegion,
      },
    })

    // Add our stage to CDK Pipelines
    pipeline.addStage(dev, {
      post: [
        new pipelines.ShellStep("SmokeTest", {
          envFromCfnOutputs: {
            API_URL: dev.myApiStack.apiUrl,
          },
          commands: [
            "set -eu",
            `result="$(curl --silent --fail "$API_URL")"`,
            `echo "$result" | grep "World"`,
          ],
        }),
      ],
    })

    /*
     * NOTE: We could instantiate the same environment in other AWS accounts
     *
     * const staging = new MyStage(this, "staging", {
     *   env: {
     *     account: accounts.staging,
     *     region: defaultRegion,
     *   },
     * })
     * pipeline.addStage(staging)
     */
  }
}
