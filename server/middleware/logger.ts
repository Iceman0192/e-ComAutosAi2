import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  userId?: number;
  error?: any;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(entry: LogEntry): void {
    const logString = JSON.stringify({
      ...entry,
      timestamp: this.formatTimestamp()
    });

    if (entry.level === 'error') {
      console.error(logString);
    } else if (entry.level === 'warn') {
      console.warn(logString);
    } else {
      console.log(logString);
    }
  }

  info(message: string, meta?: any): void {
    this.log({
      timestamp: this.formatTimestamp(),
      level: 'info',
      message,
      ...meta
    });
  }

  warn(message: string, meta?: any): void {
    this.log({
      timestamp: this.formatTimestamp(),
      level: 'warn',
      message,
      ...meta
    });
  }

  error(message: string, error?: any, meta?: any): void {
    this.log({
      timestamp: this.formatTimestamp(),
      level: 'error',
      message,
      error: error?.stack || error,
      ...meta
    });
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log({
        timestamp: this.formatTimestamp(),
        level: 'debug',
        message,
        ...meta
      });
    }
  }
}

export const logger = new Logger();

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).session?.userId;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration,
        userId
      });
    }
  });
  
  next();
};

export const securityLogger = {
  loginAttempt: (email: string, success: boolean, ip: string) => {
    logger.info('Login attempt', {
      email,
      success,
      ip,
      event: 'auth.login'
    });
  },

  signupAttempt: (email: string, success: boolean, ip: string) => {
    logger.info('Signup attempt', {
      email,
      success,
      ip,
      event: 'auth.signup'
    });
  },

  usageLimitReached: (userId: number, eventType: string, limit: number) => {
    logger.warn('Usage limit reached', {
      userId,
      eventType,
      limit,
      event: 'usage.limit_reached'
    });
  },

  suspiciousActivity: (message: string, meta: any) => {
    logger.warn('Suspicious activity detected', {
      message,
      ...meta,
      event: 'security.suspicious'
    });
  }
};