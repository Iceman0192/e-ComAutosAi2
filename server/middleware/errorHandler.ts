import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: (err as any).errors
    });
  }

  // Handle database errors
  if (err.message?.includes('duplicate key')) {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(404, `Route ${req.originalUrl} not found`);
  next(error);
};