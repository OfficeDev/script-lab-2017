export class ServerError extends Error {
  /**
   * @constructor
   *
   * @param message Error message to be propagated.
   */
  constructor(
    name: string,
    public code: number = 500,
    public message: string,
    public innerError?: Error
  ) {
    super(message);
    this.name = `${name}: ${message}`;
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      let error = new Error();
      if (error.stack) {
        let last_part = error.stack.match(/[^\s]+$/);
        this.stack = `${this.name} at ${last_part}`;
      }
    }
  }
}

export class UnauthorizedError extends ServerError {
  constructor(message: string, public innerError?: any) {
    super('UnauthorizedError', 401, message, innerError);
  }
}

export class BadRequestError extends ServerError {
  constructor(message: string, public details?: string, public innerError?: any) {
    super('BadRequestError', 400, message, innerError);
  }
}

export class NotFoundError extends ServerError {
  constructor(message: string, public innerError?: any) {
    super('NotFoundError', 404, message, innerError);
  }
}

/** A not-really-an-error to pass along information and display it using the ServerError infrastructure */
export class InformationalError extends Error {
  constructor(message: string, public details?: string) {
    super(message);
  }
}
