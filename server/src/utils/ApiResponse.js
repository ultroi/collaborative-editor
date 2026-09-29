/**
 * Consistent success envelope so the frontend never has to guess the
 * response shape. { success, data, message }
 */
class ApiResponse {
  constructor(statusCode, data = null, message = 'OK') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      data: this.data,
      message: this.message,
    });
  }
}

module.exports = { ApiResponse };
