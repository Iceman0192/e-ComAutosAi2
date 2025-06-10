import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import { setupVite, serveStatic, log } from "./vite";
import { setupApiRoutes } from "./apiRoutes";
import { setupAuctionMindRoutes } from "./auctionMindRoutes";
import { setupAuctionMindV2Routes } from "./auctionMindV2Routes";
import { setupRecommendationRoutes } from "./recommendationRoutes";
import { registerSubscriptionRoutes } from "./subscriptionRoutes";
import { setupUnifiedAuth } from "./auth/unifiedAuth";
import { trialScheduler } from "./trialScheduler";
import { setupAdminRoutes } from "./adminRoutes";
import { setupUsageRoutes } from "./routes/usageRoutes";
import { setupHealthRoutes } from "./routes/healthRoutes";
import { registerDataCollectionRoutes } from "./dataCollectionRoutes";
import { setupTeamRoutes } from "./routes/teamRoutes";
import { setupVinRoutes } from "./routes/vinRoutes";
import { setupTargetedCollectionRoutes } from "./targetedCollectionRoutes";
import { setupHondurasRoutes } from "./hondurasRoutes";
import { setupElSalvadorRoutes } from "./elSalvadorRoutes";
import { setupGuatemalaRoutes } from "./guatemalaRoutes";
import { setupNicaraguaRoutes } from "./nicaraguaRoutes";
import { freshDataManager } from "./freshDataManager";
import { autoCollectionService } from "./autoCollectionService";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { requestLogger, logger } from "./middleware/logger";
import { securityHeaders, corsConfig, sanitizeInput, preventParameterPollution } from "./middleware/security";
import { rateLimiters } from "./middleware/rateLimiter";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Basic middleware first
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(cookieParser());

  // CORS configuration
  if (app.get("env") === "development") {
    app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:5000'],
      credentials: true
    }));
  } else {
    app.use(cors(corsConfig));
  }

  // Apply security middleware to API routes only in development, all routes in production
  if (app.get("env") === "development") {
    app.use('/api', securityHeaders);
    app.use('/api', preventParameterPollution);
    app.use('/api', sanitizeInput);
    app.use('/api', requestLogger);
  } else {
    app.use(securityHeaders);
    app.use(preventParameterPollution);
    app.use(sanitizeInput);
    app.use(requestLogger);
  }

  // Performance monitoring middleware
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
      if (duration > 1000 && !path.startsWith('/@vite') && !path.includes('.hot-update')) {
        logger.log({
          timestamp: new Date().toISOString(),
          method: req.method,
          url: path,
          ip: req.ip || 'unknown',
          statusCode: res.statusCode,
          duration,
          error: `Slow request: ${req.method} ${path} took ${duration}ms`
        });
      }
    });

    next();
  });

  // Authentication setup using simple auth
  const { setupSimpleAuth } = await import("./simpleAuth");
  setupSimpleAuth(app);

  // Rate limiting middleware
  app.use('/api/auth/login', rateLimiters.auth);
  app.use('/api/auth/signup', rateLimiters.auth);
  app.use('/api/ai-chat', rateLimiters.aiChat);
  app.use('/api/ai-lot-analysis', rateLimiters.aiAnalysis);
  app.use('/api/auction-mind', rateLimiters.auctionMind);
  app.use('/api/sales-history', rateLimiters.salesHistory);
  app.use('/api/cars', rateLimiters.vehicleSearch);
  app.use('/api/find-comparables', rateLimiters.comparables);
  app.use('/api/admin', rateLimiters.admin);

  // API Routes
  setupApiRoutes(app);
  setupAuctionMindRoutes(app);
  setupAuctionMindV2Routes(app);
  setupRecommendationRoutes(app);
  registerSubscriptionRoutes(app);
  setupAdminRoutes(app);
  setupUsageRoutes(app);
  setupHealthRoutes(app);
  registerDataCollectionRoutes(app);
  setupTeamRoutes(app);
  setupVinRoutes(app);
  setupTargetedCollectionRoutes(app);
  setupHondurasRoutes(app);
  setupElSalvadorRoutes(app);
  setupGuatemalaRoutes(app);
  setupNicaraguaRoutes(app);

  // Fresh data migration scheduler
  setInterval(async () => {
    try {
      await freshDataManager.migrateExpiredData();
    } catch (error) {
      console.error('Migration cycle error:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run every 24 hours
  
  // Start trial monitoring scheduler
  trialScheduler.start();
  
  // Set up Vite in development mode AFTER API routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Handle 404s for undefined routes (after Vite/static setup)
  app.use(notFound);
  
  // Enterprise error handler
  app.use(errorHandler);

  // Start server
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port} in ${app.get("env")} mode`);
    if (app.get("env") === "development") {
      log(`Frontend: http://localhost:${port}`);
      log(`API: http://localhost:${port}/api`);
      log(`Health: http://localhost:${port}/health`);
    }
  });

  return server;
}

// Start the server
startServer().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});