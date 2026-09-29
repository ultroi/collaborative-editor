const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const env = require("../config/env");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/tokens");

const {
  randomToken,
  createPkceVerifier,
  createPkceChallenge,

  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  verifyGoogleIdToken,

  buildGithubAuthorizationUrl,
  exchangeGithubCode,
  getGithubProfile,
} = require("../utils/oauthProviders");

const REFRESH_COOKIE = "refreshToken";

const GOOGLE_STATE_COOKIE = "googleOAuthState";
const GOOGLE_NONCE_COOKIE = "googleOAuthNonce";

const GITHUB_STATE_COOKIE = "githubOAuthState";
const GITHUB_VERIFIER_COOKIE = "githubOAuthVerifier";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const oauthCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 10 * 60 * 1000,
};

function clearOAuthCookies(res) {
  const options = {
    path: "/api/auth",
  };

  res.clearCookie(GOOGLE_STATE_COOKIE, options);

  res.clearCookie(GOOGLE_NONCE_COOKIE, options);

  res.clearCookie(GITHUB_STATE_COOKIE, options);

  res.clearCookie(GITHUB_VERIFIER_COOKIE, options);
}

function oauthFailure(res, provider) {
  clearOAuthCookies(res);

  const url = new URL("/login", env.clientOrigin);

  url.searchParams.set("oauthError", provider);

  return res.redirect(url.toString());
}

function ensureOAuthConfigured(provider) {
  const config = env.oauth[provider];

  if (!config.clientId || !config.clientSecret) {
    throw ApiError.serviceUnavailable(`${provider} OAuth is not configured`);
  }
}

function sanitizeUsername(value) {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return cleaned.length >= 3 ? cleaned : "user";
}

async function createUniqueUsername(preferred) {
  const base = sanitizeUsername(preferred);

  let username = base;
  let counter = 1;

  while (await User.exists({ username })) {
    counter += 1;

    const suffix = `-${counter}`;

    username = `${base.slice(0, 30 - suffix.length)}${suffix}`;
  }

  return username;
}

async function findOrCreateOAuthUser({
  provider,
  providerId,
  email,
  name,
  avatarUrl,
}) {
  const providerField = provider === "google" ? "googleId" : "githubId";

  const normalizedEmail = email.trim().toLowerCase();

  let providerUser = await User.findOne({
    [providerField]: providerId,
  });

  const emailUser = await User.findOne({
    email: normalizedEmail,
  });

  if (providerUser && emailUser && !providerUser._id.equals(emailUser._id)) {
    throw ApiError.conflict(
      "This OAuth account and email belong to different CodeSpace accounts",
    );
  }

  let user = providerUser || emailUser;

  if (!user) {
    const username = await createUniqueUsername(name);

    user = new User({
      name: name || '',
      username,
      email: normalizedEmail,
      avatarUrl: avatarUrl || null,
      [providerField]: providerId,
    });

    await user.save();

    return user;
  }

  user[providerField] = providerId;

  if (avatarUrl && !user.avatarUrl) {
    user.avatarUrl = avatarUrl;
  }

  await user.save();

  return user;
}

async function issueSession(res, user) {
  const accessToken = signAccessToken(user);

  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);

  await user.save();

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

  return accessToken;
}

/* =========================================
   Manual registration
========================================= */

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existing) {
    throw ApiError.conflict(
      existing.email === email
        ? "Email is already registered"
        : "Username is already taken",
    );
  }

  const user = new User({
    username,
    email,
  });

  await user.setPassword(password);

  await user.save();

  const accessToken = await issueSession(res, user);

  new ApiResponse(
    201,
    {
      user: user.toPublicJSON(),
      accessToken,
    },
    "Account created",
  ).send(res);
});

/* =========================================
   Manual login
========================================= */

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  }).select("+passwordHash");

  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await user.comparePassword(password);

  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = await issueSession(res, user);

  new ApiResponse(
    200,
    {
      user: user.toPublicJSON(),
      accessToken,
    },
    "Logged in",
  ).send(res);
});

/* =========================================
   Google OAuth
========================================= */

const googleStart = asyncHandler(async (req, res) => {
  ensureOAuthConfigured("google");

  const state = randomToken(32);

  const nonce = randomToken(32);

  res.cookie(GOOGLE_STATE_COOKIE, state, oauthCookieOptions);

  res.cookie(GOOGLE_NONCE_COOKIE, nonce, oauthCookieOptions);

  const authorizationUrl = buildGoogleAuthorizationUrl({
    state,
    nonce,
  });

  res.redirect(authorizationUrl);
});

const googleCallback = asyncHandler(async (req, res) => {
  try {
    ensureOAuthConfigured("google");

    const { code, state, error } = req.query;

    if (error) {
      return oauthFailure(res, "google");
    }

    const expectedState = req.cookies?.[GOOGLE_STATE_COOKIE];

    const nonce = req.cookies?.[GOOGLE_NONCE_COOKIE];

    if (
      !code ||
      !state ||
      !expectedState ||
      state !== expectedState ||
      !nonce
    ) {
      return oauthFailure(res, "google");
    }

    clearOAuthCookies(res);

    const idToken = await exchangeGoogleCode(code);

    const profile = await verifyGoogleIdToken(idToken, nonce);

    const user = await findOrCreateOAuthUser({
      provider: "google",
      providerId: profile.providerId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });

    await issueSession(res, user);

    return res.redirect(`${env.clientOrigin}/auth/callback`);
  } catch (error) {
    console.error("[oauth] Google callback failed:", error);

    return oauthFailure(res, "google");
  }
});

/* =========================================
   GitHub OAuth
========================================= */

const githubStart = asyncHandler(async (req, res) => {
  ensureOAuthConfigured("github");

  const state = randomToken(32);

  const verifier = createPkceVerifier();

  const challenge = createPkceChallenge(verifier);

  res.cookie(GITHUB_STATE_COOKIE, state, oauthCookieOptions);

  res.cookie(GITHUB_VERIFIER_COOKIE, verifier, oauthCookieOptions);

  const authorizationUrl = buildGithubAuthorizationUrl({
    state,
    codeChallenge: challenge,
  });

  res.redirect(authorizationUrl);
});

const githubCallback = asyncHandler(async (req, res) => {
  try {
    ensureOAuthConfigured("github");

    const { code, state, error } = req.query;

    if (error) {
      return oauthFailure(res, "github");
    }

    const expectedState = req.cookies?.[GITHUB_STATE_COOKIE];

    const verifier = req.cookies?.[GITHUB_VERIFIER_COOKIE];

    if (
      !code ||
      !state ||
      !expectedState ||
      state !== expectedState ||
      !verifier
    ) {
      return oauthFailure(res, "github");
    }

    clearOAuthCookies(res);

    const accessToken = await exchangeGithubCode(code, verifier);

    const profile = await getGithubProfile(accessToken);

    const user = await findOrCreateOAuthUser({
      provider: "github",
      providerId: profile.providerId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });

    // Keep the GitHub token server-side so later authenticated API calls
    // can list/import repositories without exposing it to the browser.
    user.githubAccessToken = accessToken;
    await user.save();

    await issueSession(res, user);

    return res.redirect(`${env.clientOrigin}/auth/callback`);
  } catch (error) {
    console.error("[oauth] GitHub callback failed:", error);

    return oauthFailure(res, "github");
  }
});

/* =========================================
   Refresh session
========================================= */

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (!token) {
    throw ApiError.unauthorized("No refresh token provided");
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Refresh token invalid or expired");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");

  if (!user || user.refreshTokenHash !== hashToken(token)) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  // FIX: Only generate a new access token for memory.
  // Do NOT call issueSession() here to avoid race conditions with React Strict Mode.
  const accessToken = signAccessToken(user);

  new ApiResponse(
    200,
    {
      accessToken,
    },
    "Session refreshed",
  ).send(res);
});

/* =========================================
   Logout
========================================= */

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (token) {
    try {
      const payload = verifyRefreshToken(token);

      await User.findByIdAndUpdate(payload.sub, {
        refreshTokenHash: null,
      });
    } catch {
      // Already invalid/expired.
    }
  }

  res.clearCookie(REFRESH_COOKIE, {
    path: "/api/auth",
  });

  clearOAuthCookies(res);

  new ApiResponse(200, null, "Logged out").send(res);
});

/* =========================================
   Current user
========================================= */

const me = asyncHandler(async (req, res) => {
  new ApiResponse(200, {
    user: req.user.toPublicJSON(),
  }).send(res);
});

module.exports = {
  register,
  login,

  googleStart,
  googleCallback,

  githubStart,
  githubCallback,

  refresh,
  logout,
  me,
};
