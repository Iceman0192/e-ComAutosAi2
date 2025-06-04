import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { setupVite, serveStatic, log } from "./vite";
import { setupApiRoutes } from "./apiRoutes";
import { setupAuctionMindRoutes } from "./auctionMindRoutes";
import { setupAuctionMindV2Routes } from "./auctionMindV2Routes";
import { registerSubscriptionRoutes } from "./subscriptionRoutes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";
import { registerUsageRoutes } from "./usageRoutes";
import { registerDatasetRoutes } from "./datasetRoutes";
import { registerOpportunityRoutes } from "./opportunityRoutes";
import { freshDataManager } from "./freshDataManager";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
  
  // Set up opportunity analysis routes
  registerOpportunityRoutes(app);
  
  // Start 3-day migration scheduler
  setInterval(async () => {
    try {
      await freshDataManager.migrateExpiredData();
    } catch (error) {
      console.error('Migration cycle error:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run every 24 hours
  
  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
