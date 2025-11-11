import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { discordBot } from "./discord-bot";
import { insertClassSchema, adminAuthSchema, forceAnnounceSchema } from "@shared/schema";
import { z } from "zod";

// Extend Express session type
declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

// Admin password from environment - fail fast if not set
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.trim() === "") {
  throw new Error("ADMIN_PASSWORD environment variable must be set and non-empty");
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized. Please log in as admin." });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Discord bot
  discordBot.start();

  // Auth endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { password } = adminAuthSchema.parse(req.body);
      
      if (password === ADMIN_PASSWORD) {
        // Regenerate session to prevent session fixation attacks
        req.session.regenerate((err) => {
          if (err) {
            res.status(500).json({ error: "Failed to create session" });
            return;
          }
          req.session.isAdmin = true;
          res.json({ success: true });
        });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: "Failed to logout" });
      } else {
        res.json({ success: true });
      }
    });
  });

  app.get("/api/auth/check", (req, res) => {
    res.json({ isAdmin: req.session.isAdmin || false });
  });

  // Get all classes (public)
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  // Get classes by day (public)
  app.get("/api/classes/day/:day", async (req, res) => {
    try {
      const { day } = req.params;
      const classes = await storage.getClassesByDay(day);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  // Get single class (public)
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const classItem = await storage.getClass(id);
      if (!classItem) {
        res.status(404).json({ error: "Class not found" });
        return;
      }
      res.json(classItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class" });
    }
  });

  // Create class (admin only)
  app.post("/api/classes", requireAuth, async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create class" });
      }
    }
  });

  // Update class (admin only)
  app.patch("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const classData = insertClassSchema.partial().parse(req.body);
      const updatedClass = await storage.updateClass(id, classData);
      
      if (!updatedClass) {
        res.status(404).json({ error: "Class not found" });
        return;
      }
      
      res.json(updatedClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update class" });
      }
    }
  });

  // Delete class (admin only)
  app.delete("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteClass(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Class not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  // Force announce (admin only)
  app.post("/api/announce", requireAuth, async (req, res) => {
    try {
      const { classId, customMessage } = forceAnnounceSchema.parse(req.body);
      
      if (classId) {
        const classItem = await storage.getClass(classId);
        if (!classItem) {
          res.status(404).json({ error: "Class not found" });
          return;
        }
        await discordBot.forceAnnounce(classItem);
      } else if (customMessage) {
        await discordBot.sendCustomAnnouncement(customMessage);
      } else {
        res.status(400).json({ error: "Either classId or customMessage is required" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send announcement" });
      }
    }
  });

  // Get settings (public)
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
