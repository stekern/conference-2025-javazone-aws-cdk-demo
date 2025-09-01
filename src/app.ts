import * as cdk from "aws-cdk-lib"
import { accounts, defaultRegion, trustedRepositories } from "./config"
import { PipelineStack } from "./pipelines/pipeline"

const app = new cdk.App()

new PipelineStack(app, "pipeline", {
  env: {
    account: accounts.dev,
    region: defaultRegion,
  },
  artifactBucketName: `${accounts.dev}-artifact-bucket`,
  githubActionsRoleName: "github-actions-role",
  trustedRepositories: trustedRepositories,
})
