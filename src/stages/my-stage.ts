import * as cdk from "aws-cdk-lib"
import type * as constructs from "constructs"
import { MyApiStack } from "../stacks/my-api-stack"

/**
 * A collection of stacks that represent our environment
 */
export class MyStage extends cdk.Stage {
  public readonly myApiStack: MyApiStack

  constructor(scope: constructs.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)
    this.myApiStack = new MyApiStack(this, "my-api")

    /*
     * NOTE: Add more stacks here as needed
     *
     * this.networking   = new NetworkingStack(this, "networking")
     * this.anotherStack = new AnotherStack(this, "another")
     * this.coolAppStack = new CoolAppStack(this, "cool-app")
     */
  }
}
