import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import { setupVite, serveStatic, log } from "./vite";
import { setupApiRoutes } from "./apiRoutes";
import { setupAuctionMindRoutes } from "./auctionMindRoutes";
import { setupAuctionMindV2Routes } from "./auctionMindV2Routes";
import { registerSubscriptionRoutes } from "./subscriptionRoutes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";
import { registerUsageRoutes } from "./usageRoutes";
import { registerDatasetRoutes } from "./datasetRoutes";
// Removed AI analysis routes for production launch
import { freshDataManager } from "./freshDataManager";
import { productionMonitor } from "./productionMonitor";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create HTTP server
  const server = createServer(app);
  
  // Set up clean cache routes (now the primary system)
  setupApiRoutes(app);
  
  // Set up AuctionMind AI analysis routes
  setupAuctionMindRoutes(app);
  
  // Set up AuctionMind V2 routes
  setupAuctionMindV2Routes(app);
  
  // Set up authentication routes
  setupAuthRoutes(app);
  
  // Set up subscription and billing routes
  registerSubscriptionRoutes(app);
  
  // Initialize database with subscription plans
  import('./dbInit').then(({ initializeDatabase, createIndexes }) => {
    initializeDatabase().then(() => {
      createIndexes();
    });
  });
  
  // Set up admin routes
  setupAdminRoutes(app);
  
  // Set up usage tracking routes
  registerUsageRoutes(app);
  
  // Set up dataset management routes
  registerDatasetRoutes(app);
  
  // Health monitoring endpoints
  app.get('/health', async (_req, res) => {
    try {
      const health = await productionMonitor.checkDatabaseHealth();
      const metrics = await productionMonitor.getMetrics();
      const memory = productionMonitor.getMemoryUsage();
      
      res.json({
        status: health.healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: health,
        performance: metrics,
        memory,
        uptime: metrics.uptime
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: process.env.NODE_ENV === 'production' ? 'Internal error' : error
      });
    }
  });

  // Removed AI analysis routes for production launch
  
  // Start 3-day migration scheduler
  setInterval(async () => {
    try {
      await freshDataManager.migrateExpiredData();
    } catch (error) {
      console.error('Migration cycle error:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run every 24 hours
  
  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? (status === 500 ? 'Internal Server Error' : err.message)
      : err.message || "Internal Server Error";

    // Log error in production
    if (process.env.NODE_ENV === 'production') {
      console.error(`Error ${status} on ${req.method} ${req.path}:`, err.message);
      if (err.stack) {
        console.error(err.stack);
      }
    }

    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // Set up Vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server on port 5000
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running on port ${port}`);
  });
})().catch((error) => {
  console.error('Server startup error:', error);
});
