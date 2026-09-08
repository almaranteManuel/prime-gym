/**
 * Error con status HTTP asociado. Los controladores lo delegan al
 * middleware `errorHandler`, que lo serializa como { message, code }.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, message: string, code = 'ERROR') {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
