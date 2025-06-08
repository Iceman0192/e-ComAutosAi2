import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import { setupVite, serveStatic, log } from "./vite";
import { setupApiRoutes } from "./apiRoutes";
import { setupAuctionMindRoutes } from "./auctionMindRoutes";
import { setupAuctionMindV2Routes } from "./auctionMindV2Routes";
import { registerSubscriptionRoutes } from "./subscriptionRoutes";
import { setupUnifiedAuth } from "./auth/unifiedAuth";
import { trialScheduler } from "./trialScheduler";
import { setupAdminRoutes } from "./adminRoutes";
import { setupUsageRoutes } from "./routes/usageRoutes";
import { setupHealthRoutes } from "./routes/healthRoutes";
import { registerDataCollectionRoutes } from "./dataCollectionRoutes";
import { freshDataManager } from "./freshDataManager";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { requestLogger, logger } from "./middleware/logger";
import { securityHeaders, corsConfig, sanitizeInput, preventParameterPollution } from "./middleware/security";
import { rateLimiters } from "./middleware/rateLimiter";

const app = express();

// Security middleware - applied first
app.use(securityHeaders);
app.use(cors(corsConfig));
app.use(preventParameterPollution);
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

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
  
  // Set up unified authentication system
  setupUnifiedAuth(app);
  
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
  
  // Set up usage tracking routes with rate limiting
  app.use('/api/usage', rateLimiters.api);
  setupUsageRoutes(app);
  
  // Set up health check routes
  setupHealthRoutes(app);
  
  // Set up data collection routes
  registerDataCollectionRoutes(app);
  
  // Start 3-day migration scheduler
  setInterval(async () => {
    try {
      await freshDataManager.migrateExpiredData();
    } catch (error) {
      console.error('Migration cycle error:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run every 24 hours
  
  // Start trial monitoring scheduler
  trialScheduler.start();
  
  // Handle 404s for undefined routes
  app.use(notFound);
  
  // Enterprise error handler
  app.use(errorHandler);

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
