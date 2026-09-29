const { ApiError } = require('../utils/ApiError');

/**
 * Validates req.body against a zod schema. Replaces req.body with the
 * parsed (and thus coerced/trimmed) result so downstream code can trust it.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
