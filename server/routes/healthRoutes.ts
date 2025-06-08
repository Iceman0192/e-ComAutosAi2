import { Request, Response, Express } from 'express';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

const checkDatabase = async (): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> => {
  try {
    const start = Date.now();
    await db.select().from(users).limit(1);
    const responseTime = Date.now() - start;
    
    return {
      status: 'up',
      responseTime
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
};

const getMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  
  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round((usedMemory / totalMemory) * 100)
  };
};

const getCpuUsage = (): Promise<number> => {
  return new Promise((resolve) => {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();
    
    setTimeout(() => {
      const currentUsage = process.cpuUsage(startUsage);
      const currentTime = Date.now();
      
      const timeDiff = currentTime - startTime;
      const cpuPercent = (currentUsage.user + currentUsage.system) / (timeDiff * 1000);
      
      resolve(Math.round(cpuPercent * 100));
    }, 100);
  });
};

export function setupHealthRoutes(app: Express) {
  // Basic health check
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const [dbCheck, cpuUsage] = await Promise.all([
        checkDatabase(),
        getCpuUsage()
      ]);
      
      const memoryUsage = getMemoryUsage();
      
      const healthStatus: HealthStatus = {
        status: dbCheck.status === 'up' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: dbCheck,
          memory: memoryUsage,
          cpu: {
            usage: cpuUsage
          }
        }
      };

      // Determine overall status
      if (dbCheck.status === 'down') {
        healthStatus.status = 'unhealthy';
        return res.status(503).json(healthStatus);
      }
      
      if (memoryUsage.percentage > 90 || cpuUsage > 90) {
        healthStatus.status = 'degraded';
        return res.status(200).json(healthStatus);
      }

      res.status(200).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  });

  // Detailed health check for monitoring systems
  app.get('/health/detailed', async (req: Request, res: Response) => {
    try {
      const [dbCheck, cpuUsage] = await Promise.all([
        checkDatabase(),
        getCpuUsage()
      ]);
      
      const memoryUsage = getMemoryUsage();
      const diskUsage = process.memoryUsage();
      
      const detailedHealth = {
        status: dbCheck.status === 'up' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid,
        checks: {
          database: dbCheck,
          memory: {
            ...memoryUsage,
            rss: Math.round(diskUsage.rss / 1024 / 1024),
            external: Math.round(diskUsage.external / 1024 / 1024)
          },
          cpu: {
            usage: cpuUsage
          }
        },
        limits: {
          memory_warning: 80, // Percentage
          memory_critical: 90,
          cpu_warning: 70,
          cpu_critical: 90,
          db_response_warning: 100, // milliseconds
          db_response_critical: 500
        }
      };

      const status = dbCheck.status === 'up' ? 200 : 503;
      res.status(status).json(detailedHealth);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Detailed health check failed'
      });
    }
  });

  // Readiness probe - checks if app is ready to receive traffic
  app.get('/ready', async (req: Request, res: Response) => {
    try {
      const dbCheck = await checkDatabase();
      
      if (dbCheck.status === 'up') {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          reason: 'Database connection failed'
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed'
      });
    }
  });

  // Liveness probe - checks if app is alive
  app.get('/live', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    });
  });
}