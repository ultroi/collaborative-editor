const { ApiError } = require('../utils/ApiError');
const env = require('../config/env');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Translate a few common non-ApiError failure modes into clean responses
  // instead of leaking Mongo/JWT internals to the client.
  if (err.name === 'ValidationError') {
    error = ApiError.badRequest('Validation failed', Object.keys(err.errors).map((k) => ({
      field: k,
      message: err.errors[k].message,
    })));
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    error = ApiError.conflict(`That ${field} is already taken`);
  } else if (!(err instanceof ApiError)) {
    console.error('[unhandled error]', err);
    error = new ApiError(500, 'Internal server error');
  }

  const body = {
    success: false,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(env.nodeEnv === 'development' && !error.isOperational ? { stack: err.stack } : {}),
  };

  res.status(error.statusCode || 500).json(body);
}

module.exports = { notFoundHandler, errorHandler };
