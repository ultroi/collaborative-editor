require('dotenv').config();

const required = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const port = parseInt(process.env.PORT || '5000', 10);
const clientOrigin =
  process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const serverOrigin =
  process.env.SERVER_ORIGIN || `http://localhost:${port}`;

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',

  port,

  mongoUri: process.env.MONGODB_URI,

  clientOrigin,

  serverOrigin,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn:
      process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        `${serverOrigin}/api/auth/google/callback`,
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL ||
        `${serverOrigin}/api/auth/github/callback`,
    },
  },
};