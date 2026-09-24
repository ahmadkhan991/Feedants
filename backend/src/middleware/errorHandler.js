// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.isApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details || undefined });
  }

  if (err.name === 'ValidationError') {
    // Mongoose schema validation
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate resource', details: err.keyValue });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  const status = process.env.NODE_ENV === 'production' ? 500 : err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = errorHandler;
