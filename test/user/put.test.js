/* eslint-disable no-underscore-dangle */
import GitHub from '@octokit/rest';
import subject from '../../src/user/put';

describe('PUT /registry/-/user/{id}', () => {
  let event;
  let callback;
  let gitHubSpy;
  let gitHubInstance;

  beforeEach(() => {
    const env = {
      githubClientId: 'foo-client-id',
      githubSecret: 'bar-secret',
      githubUrl: 'https://example.com',
      restrictedOrgs: 'foo-org',
    };

    process.env = env;

    callback = stub();
  });

  describe('login', () => {
    context('with 2FA', () => {
      let authStub;
      let getCreateAuthStub;

      beforeEach(() => {
        event = {
          pathParameters: {
            id: 'foo-user.123456',
          },
          body: '{"name":"foo-user.123456","password":"bar-password"}',
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);
          getCreateAuthStub = stub().returns({ data: { hashed_token: 'foo-token' }});
          authStub = stub();

          gitHubInstance.authenticate = authStub;
          gitHubInstance.oauthAuthorizations = {
            getOrCreateAuthorizationForApp: getCreateAuthStub,
          };

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should get or create authorization for app correctly with otp', async () => {
        await subject(event, stub(), callback);

        assert(getCreateAuthStub.calledWithExactly({
          scopes: ['user:email', 'read:org'],
          client_id: 'foo-client-id',
          client_secret: 'bar-secret',
          note: 'codebox private npm registry',
          headers: {
            'X-GitHub-OTP': '123456',
          },
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });

    context('first time without 2FA', () => {
      let authStub;
      let getCreateAuthStub;

      beforeEach(() => {
        event = {
          pathParameters: {
            id: 'foo-user',
          },
          body: '{"name":"foo-user","password":"bar-password"}',
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);
          getCreateAuthStub = stub().returns({ data: { hashed_token: 'foo-token' }});
          authStub = stub();

          gitHubInstance.authenticate = authStub;
          gitHubInstance.oauthAuthorizations = {
            getOrCreateAuthorizationForApp: getCreateAuthStub,
          };

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should get or create authorization for app correctly', async () => {
        await subject(event, stub(), callback);

        assert(getCreateAuthStub.calledWithExactly({
          scopes: ['user:email', 'read:org'],
          client_id: 'foo-client-id',
          client_secret: 'bar-secret',
          note: 'codebox private npm registry',
          headers: {
            'X-GitHub-OTP': '',
          },
        }));
      });

      it('should return correct status code and token response', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 201,
          body: '{"ok":true,"token":"foo-token"}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });

    context('logged in previously without 2FA', () => {
      let authStub;
      let getCreateAuthStub;
      let createAuthStub;
      let deleteAuthStub;

      beforeEach(() => {
        event = {
          pathParameters: {
            id: 'foo-user',
          },
          body: '{"name":"foo-user","password":"bar-password"}',
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);

          // GitHub does not return a token
          // if you already have one assigned
          getCreateAuthStub = stub().returns({ id: 'foo-user', data: { hashed_token: '' } });

          authStub = stub();
          deleteAuthStub = stub();
          createAuthStub = stub().returns({ id: 'foo-user', data: { hashed_token: 'new-foo-token' } });

          gitHubInstance.authenticate = authStub;
          gitHubInstance.oauthAuthorizations = {
            getOrCreateAuthorizationForApp: getCreateAuthStub,
            deleteAuthorization: deleteAuthStub,
            createAuthorization: createAuthStub,
          };

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should delete current token from github', async () => {
        await subject(event, stub(), callback);

        assert(deleteAuthStub.calledWithExactly({
          authorization_id: 'foo-user',
          headers: {
            'X-GitHub-OTP': '',
          },
        }));
      });

      it('should create a new token against github app', async () => {
        await subject(event, stub(), callback);

        assert(createAuthStub.calledWithExactly({
          scopes: ['user:email', 'read:org'],
          client_id: 'foo-client-id',
          client_secret: 'bar-secret',
          note: 'codebox private npm registry',
          headers: {
            'X-GitHub-OTP': '',
          },
        }));
      });

      it('should attempts to get or create authorization for app correctly', async () => {
        await subject(event, stub(), callback);

        assert(getCreateAuthStub.calledWithExactly({
          scopes: ['user:email', 'read:org'],
          client_id: 'foo-client-id',
          client_secret: 'bar-secret',
          note: 'codebox private npm registry',
          headers: {
            'X-GitHub-OTP': '',
          },
        }));
      });

      it('should return correct status code and token response', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 201,
          body: '{"ok":true,"token":"new-foo-token"}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });
  });
});
