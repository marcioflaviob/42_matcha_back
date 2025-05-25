const ApiException = require("../exceptions/ApiException");

function errorHandler(err, req, res, next) {
  
  if (err instanceof ApiException) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
}

module.exports = errorHandler;