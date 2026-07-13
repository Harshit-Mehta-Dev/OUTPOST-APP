const errorHandler = (err, req, res, next) => {
  console.error('🔥 Centralized Error Handler:', err);

  const statusCode = err.statusCode || 500;
  let errorMsg = err.message || 'Internal Server Error';

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Data Validation Error',
      details: Object.values(err.errors).map(val => val.message)
    });
  }

  // Handle MongoDB Duplicate Key Errors
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate Field Value Entered',
      details: err.keyValue
    });
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Your token has expired. Please log in again.' });
  }

  if (statusCode === 500) {
    errorMsg = 'An unexpected internal error occurred.';
  }

  res.status(statusCode).json({
    error: errorMsg,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, raw: err.message })
  });
};

module.exports = errorHandler;
