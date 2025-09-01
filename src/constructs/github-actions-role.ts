import type * as cdk from "aws-cdk-lib"
import * as iam from "aws-cdk-lib/aws-iam"
import * as constructs from "constructs"

interface Props extends cdk.StackProps {
  /**
   * A predefined name to use for naming the role.
   */
  roleName?: string
  /**
   * The OpenID Connect Provider for GitHub Actions.
   *
   * @default - a new provider is created
   */
  oidcProvider?: iam.IOpenIdConnectProvider
  /**
   * The GitHub repositories that should be allowed to assume
   * the role from GitHub Actions.
   */
  repositories: {
    /**
     * The name of the GitHub repository.
     */
    name: string
    /**
     * The name of the owner of the GitHub repository.
     */
    owner: string
    /**
     * The name of the GitHub branches that GitHub Actions will
     * be allowed to assume the role from.
     *
     */
    branches: string[]
  }[]
}

export class GithubActionsRole extends constructs.Construct {
  public readonly role: iam.IRole

  constructor(scope: constructs.Construct, id: string, props: Props) {
    super(scope, id)
    if (props.repositories.length === 0) {
      throw new Error(
        "You need to supply at least one repository that the role can be assumed from",
      )
    }
    for (const repository of props.repositories) {
      if (repository.branches.length === 0) {
        throw new Error(
          "Each repository needs at least one branch that the role can be assumed from",
        )
      }
    }
    let oidcProvider: iam.IOpenIdConnectProvider
    if (!props.oidcProvider) {
      const cfnOidcProvider = new iam.CfnOIDCProvider(
        this,
        "OpenIdConnectProvider",
        {
          url: "https://token.actions.githubusercontent.com",
          clientIdList: ["sts.amazonaws.com"],
        },
      )
      oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        "Provider",
        cfnOidcProvider.ref,
      )
    } else {
      oidcProvider = props.oidcProvider
    }
    this.role = new iam.Role(this, "Role", {
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              props.repositories.flatMap((repository) => [
                ...repository.branches.map(
                  (branch) =>
                    `repo:${repository.owner}/${repository.name}:ref:refs/heads/${branch}`,
                ),
              ]),
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
      roleName: props.roleName,
    })
  }
}
