class ApiResponse {
  success: boolean;
  message: string;
  data: any;
  statusCode: number;
  constructor(
    success: boolean,
    message: string,
    data: any,
    statusCode: number
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }
}

export default ApiResponse;
