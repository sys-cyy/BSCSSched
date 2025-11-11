import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { Server as SocketIOServer } from "socket.io"; // ✅ added for real-time viewer tracking

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration - fail fast if SESSION_SECRET is not set
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET || SESSION_SECRET.trim() === "") {
  throw new Error("SESSION_SECRET environment variable must be set and non-empty");
}

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax", // CSRF protection
    },
  })
);

// Middleware for logging API requests
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
  // Register all API routes
  const server = await registerRoutes(app);

  // ✅ --- Add Socket.IO setup below ---
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // allow all origins or specify your domain
      methods: ["GET", "POST"],
    },
  });

  // Track live viewer count
    let viewerCount = 0;

    io.on("connection", (socket) => {
    socket.on("viewer-joined", () => {
    viewerCount++;
    io.emit("viewer-count-update", viewerCount);
    });

  socket.on("viewer-left", () => {
    viewerCount = Math.max(0, viewerCount - 1);
    io.emit("viewer-count-update", viewerCount);
    });

  socket.on("disconnect", () => {
    viewerCount = Math.max(0, viewerCount - 1);
    io.emit("viewer-count-update", viewerCount);
    });
  });


  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup for dev vs production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve both API + client on same port
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`✅ Serving on port ${port}`);
    }
  );
})();
