import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: number;
  statusCode?: number;
  duration?: number;
  error?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  
  log(entry: LogEntry) {
    // In production, this would write to a file or external service
    const logLine = JSON.stringify(entry);
    console.log(logLine);
    
    // Keep last 1000 logs in memory for admin panel
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }
  
  getLogs(filter?: { userId?: number; method?: string; minStatus?: number }) {
    let filtered = [...this.logs];
    
    if (filter?.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }
    if (filter?.method) {
      filtered = filtered.filter(log => log.method === filter.method);
    }
    if (filter?.minStatus !== undefined) {
      filtered = filtered.filter(log => (log.statusCode || 0) >= filter.minStatus!);
    }
    
    return filtered.reverse(); // Most recent first
  }
}

export const logger = new Logger();

export const requestLogger = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log response after it's sent
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    res.send(data);
    
    const duration = Date.now() - start;
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      statusCode: res.statusCode,
      duration
    };
    
    // Add error info for 4xx and 5xx responses
    if (res.statusCode >= 400) {
      try {
        const errorData = JSON.parse(data);
        logEntry.error = errorData.message || 'Unknown error';
      } catch {
        // Not JSON response
      }
    }
    
    logger.log(logEntry);
    
    return res;
  };
  
  next();
};