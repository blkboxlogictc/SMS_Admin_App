import express from "express";
import { registerRoutes } from "../server/routes";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add basic logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Register all routes
let routesRegistered = false;
let routePromise: Promise<any> | null = null;

async function ensureRoutes() {
  if (!routesRegistered && !routePromise) {
    routePromise = registerRoutes(app);
    await routePromise;
    routesRegistered = true;
  } else if (routePromise) {
    await routePromise;
  }
}

// Export the handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    await ensureRoutes();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}