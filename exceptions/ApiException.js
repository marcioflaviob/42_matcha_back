class ApiException extends Error {
    constructor(statusCode, message) {
      super(message);
      this.name = 'ApiException';
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = ApiException;