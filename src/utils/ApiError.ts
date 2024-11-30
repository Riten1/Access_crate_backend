class ApiError {
  success: boolean;
  message: string;
  data: any;
  statusCode: number;
  errors: any[];
  stack?: string;

  constructor(
    success: boolean,
    message: string = "Something went wrong",
    data: any = null,
    statusCode: number = 500,
    errors: any[] = [],
    stack?: string
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
