import GitHub from '@octokit/rest';

const generatePolicy = ({
  effect,
  methodArn,
  token,
  isAdmin,
}) => {
  const methodParts = methodArn.split(':');
  const region = methodParts[3];
  const accountArn = methodParts[4];
  const apiId = methodParts[5].split('/')[0];
  const stage = methodParts[5].split('/')[1];

  const authResponse = {};
  authResponse.principalId = token;

  const policyDocument = {};
  policyDocument.Version = '2012-10-17';
  policyDocument.Statement = [];

  const statementOne = {};
  statementOne.Action = 'execute-api:Invoke';
  statementOne.Effect = effect;
  statementOne.Resource = `arn:aws:execute-api:${region}:${accountArn}:${apiId}/${stage}/GET/registry*`;
  policyDocument.Statement[0] = statementOne;

  const statementTwo = {};
  statementTwo.Action = 'execute-api:Invoke';
  statementTwo.Effect = isAdmin ? 'Allow' : 'Deny';
  statementTwo.Resource = `arn:aws:execute-api:${region}:${accountArn}:${apiId}/${stage}/PUT/registry*`;
  policyDocument.Statement[1] = statementTwo;

  const statementThree = {};
  statementThree.Action = 'execute-api:Invoke';
  statementThree.Effect = isAdmin ? 'Allow' : 'Deny';
  statementThree.Resource = `arn:aws:execute-api:${region}:${accountArn}:${apiId}/${stage}/DELETE/registry*`;
  policyDocument.Statement[2] = statementThree;

  authResponse.policyDocument = policyDocument;

  return authResponse;
};

export default async ({ methodArn, authorizationToken }, context, callback) => {
  const tokenParts = authorizationToken.split('Bearer ');

  if (tokenParts.length <= 1) {
    console.log("Not enough token parts:", JSON.stringify(tokenParts, 0, 2));
    return callback(null, generatePolicy({
      token: authorizationToken,
      effect: 'Deny',
      methodArn,
      isAdmin: false,
    }));
  }

  const token = tokenParts[1];

  const github = new GitHub({
    auth: {
      username: 'obs-integrations',
      password: token
    }
  });

  try {
    const user = await github.users.getAuthenticated();
    const updated_at = user.data.updated_at;
    const created_at = user.data.created_at;

    let isAdmin = false;

    if (process.env.admins) {
      isAdmin = process.env.admins.split(',').indexOf(user.data.login) > -1;
    }

    const policy = generatePolicy({
      effect: 'Allow',
      methodArn,
      token,
      isAdmin,
    });

    policy.context = {
      username: user.data.login,
      avatar: user.data.avatar_url,
      updatedAt: updated_at,
      createdAt: created_at,
    };

    return callback(null, policy);
  } catch (error) {
    console.log("Authorizer error", JSON.stringify(error, 0, 2));
    return callback(null, generatePolicy({
      token: tokenParts[1],
      effect: 'Deny',
      methodArn,
      isAdmin: false,
    }));
  }
};
