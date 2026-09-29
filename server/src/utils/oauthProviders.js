const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');

const googleClient = new OAuth2Client(
  env.oauth.google.clientId,
  env.oauth.google.clientSecret,
  env.oauth.google.callbackUrl
);

function randomToken(size = 32) {
  return crypto
    .randomBytes(size)
    .toString('base64url');
}

function createPkceVerifier() {
  return randomToken(48);
}

function createPkceChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

function buildGoogleAuthorizationUrl({
  state,
  nonce,
}) {
  const params = new URLSearchParams({
    client_id: env.oauth.google.clientId,
    redirect_uri: env.oauth.google.callbackUrl,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    nonce,
    access_type: 'online',
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function exchangeGoogleCode(code) {
  const { tokens } = await googleClient.getToken({
    code,
    redirect_uri: env.oauth.google.callbackUrl,
  });

  if (!tokens.id_token) {
    throw new Error('Google did not return an ID token');
  }

  return tokens.id_token;
}

async function verifyGoogleIdToken(idToken, expectedNonce) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.oauth.google.clientId,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('Google identity payload missing');
  }

  if (payload.nonce !== expectedNonce) {
    throw new Error('Google nonce validation failed');
  }

  if (!payload.sub) {
    throw new Error('Google account id missing');
  }

  if (!payload.email) {
    throw new Error('Google account email missing');
  }

  if (!payload.email_verified) {
    throw new Error('Google email is not verified');
  }

  return {
    providerId: String(payload.sub),
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture || null,
  };
}

function buildGithubAuthorizationUrl({
  state,
  codeChallenge,
}) {
  const params = new URLSearchParams({
    client_id: env.oauth.github.clientId,
    redirect_uri: env.oauth.github.callbackUrl,
    scope: 'read:user user:email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}

async function exchangeGithubCode(
  code,
  codeVerifier
) {
  const response = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        'Content-Type':
          'application/x-www-form-urlencoded',
      },

      body: new URLSearchParams({
        client_id: env.oauth.github.clientId,
        client_secret:
          env.oauth.github.clientSecret,
        code,
        redirect_uri:
          env.oauth.github.callbackUrl,
        code_verifier: codeVerifier,
      }),
    }
  );

  const data = await response.json();

  if (
    !response.ok ||
    !data.access_token
  ) {
    throw new Error(
      data.error_description ||
        data.error ||
        'GitHub token exchange failed'
    );
  }

  return data.access_token;
}

async function githubApi(path, accessToken) {
  const response = await fetch(
    `https://api.github.com${path}`,
    {
      headers: {
        Accept:
          'application/vnd.github+json',

        Authorization:
          `Bearer ${accessToken}`,

        'X-GitHub-Api-Version':
          '2022-11-28',

        'User-Agent':
          'CodeSpace',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed: ${response.status}`
    );
  }

  return response.json();
}

async function getGithubProfile(accessToken) {
  const user = await githubApi(
    '/user',
    accessToken
  );

  const emails = await githubApi(
    '/user/emails',
    accessToken
  );

  const verifiedEmail =
    emails.find(
      (email) =>
        email.primary &&
        email.verified
    ) ||
    emails.find(
      (email) => email.verified
    );

  if (!verifiedEmail) {
    throw new Error(
      'No verified GitHub email was found'
    );
  }

  if (!user.id) {
    throw new Error(
      'GitHub account id missing'
    );
  }

  return {
    providerId: String(user.id),
    email:
      verifiedEmail.email.toLowerCase(),
    name:
      user.name ||
      user.login ||
      verifiedEmail.email.split('@')[0],
    avatarUrl:
      user.avatar_url || null,
  };
}

module.exports = {
  randomToken,
  createPkceVerifier,
  createPkceChallenge,

  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  verifyGoogleIdToken,

  buildGithubAuthorizationUrl,
  exchangeGithubCode,
  githubApi,
  getGithubProfile,
};