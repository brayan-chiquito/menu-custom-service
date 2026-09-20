export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 500,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
  }
}
