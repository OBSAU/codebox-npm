import GitHub from '@octokit/rest';

export default async ({ pathParameters }, context, callback) => {
  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
    }),
  });
};
