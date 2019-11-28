/* eslint-disable no-underscore-dangle */
import GitHub from '@octokit/rest';
import subject from '../../src/authorizers/github';

describe('GitHub Authorizer', () => {
  let event;
  let callback;
  let gitHubSpy;
  let gitHubInstance;

  beforeEach(() => {
    const env = {
      githubClientId: 'foo-client-id',
      githubSecret: 'bar-secret',
      githubUrl: 'https://example.com',
    };

    process.env = env;

    callback = stub();
  });

  describe('invalid access token', () => {
    context('with github application', () => {
      let checkAuthStub;

      beforeEach(() => {
        event = {
          authorizationToken: 'Bearer foo-invalid-github-token',
          methodArn: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry',
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);
          checkAuthStub = stub().throws(new Error('Invalid token with GitHub app'));

          gitHubInstance.oauthAuthorizations = {
            check: checkAuthStub,
          };
          gitHubInstance.authenticate = stub();

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should deny get, put and delete', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          principalId: 'foo-invalid-github-token',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/PUT/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/DELETE/registry*',
              },
            ],
          },
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });

    context('authorization header', () => {
      beforeEach(() => {
        event = {
          authorizationToken: 'foo-invalid-token',
          methodArn: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry',
        };
      });

      it('should deny get, put and delete', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          principalId: 'foo-invalid-token',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/PUT/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/DELETE/registry*',
              },
            ],
          },
        }));
      });
    });
  });

  describe('valid access token', () => {
    context('not an adminstrator', () => {
      let authStub;
      let checkAuthStub;

      beforeEach(() => {
        process.env.admins = '';

        event = {
          authorizationToken: 'Bearer foo-valid-token',
          methodArn: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry',
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);
          authStub = stub();
          checkAuthStub = stub().returns({
            user: {
              login: 'foo-user',
              avatar_url: 'https://example.com',
            },
            created_at: '2001-01-01T00:00:00Z',
            updated_at: '2001-02-01T00:00:00Z',
          });

          gitHubInstance.authenticate = authStub;
          gitHubInstance.oauthAuthorizations = {
            getAuthorization: checkAuthStub,
          };

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should check token with github', async () => {
        await subject(event, stub(), callback);

        assert(checkAuthStub.calledWithExactly({
          authorization_id: 'foo-valid-token',
        }));
      });

      it('should only allow get access', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          principalId: 'foo-valid-token',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/PUT/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/DELETE/registry*',
              },
            ],
          },
          context: {
            username: 'foo-user',
            avatar: 'https://example.com',
            createdAt: '2001-01-01T00:00:00Z',
            updatedAt: '2001-02-01T00:00:00Z',
          },
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });

    context('is an adminstrator', () => {
      let authStub;
      let checkAuthStub;

      beforeEach(() => {
        process.env.admins = 'foo-user';

        event = {
          authorizationToken: 'Bearer foo-valid-token',
          methodArn: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry',
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);
          authStub = stub();
          checkAuthStub = stub().returns({
            user: {
              login: 'foo-user',
              avatar_url: 'https://example.com',
            },
            created_at: '2001-01-01T00:00:00Z',
            updated_at: '2001-02-01T00:00:00Z',
          });

          gitHubInstance.authenticate = authStub;
          gitHubInstance.oauthAuthorizations = {
            getAuthorization: checkAuthStub,
          };

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should allow get, put and delete access', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          principalId: 'foo-valid-token',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/GET/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/PUT/registry*',
              },
              {
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: 'arn:aws:execute-api:foo-region:bar-account:baz-api/foo-stage/DELETE/registry*',
              },
            ],
          },
          context: {
            username: 'foo-user',
            avatar: 'https://example.com',
            createdAt: '2001-01-01T00:00:00Z',
            updatedAt: '2001-02-01T00:00:00Z',
          },
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });
  });
});
