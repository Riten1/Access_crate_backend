class ApiError {
  constructor(
    success,
    message = "Something went wrong",
    data,
    statusCode = 500,
    errors = [],
    stack
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.errors = errors;

    if (this.stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
