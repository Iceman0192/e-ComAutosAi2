import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, requireAuth } from "./simpleAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupSimpleAuth(app);

  // Auth routes
  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected route example
  app.get("/api/protected", requireAuth, async (req, res) => {
    const userId = req.user?.id;
    res.json({ message: "This is a protected route", userId });
  });

  const httpServer = createServer(app);
  return httpServer;
}