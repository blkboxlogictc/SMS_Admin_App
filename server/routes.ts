import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertBusinessSchema, insertEventSchema, insertRewardSchema, insertSurveySchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role = "user" } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashedPassword, role });
      
      res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Dashboard analytics
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/analytics/checkins-by-business", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getCheckinsByBusiness();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checkins data" });
    }
  });

  app.get("/api/analytics/event-rsvp-trends", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getEventRsvpTrends();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVP trends" });
    }
  });

  app.get("/api/analytics/reward-redemption-trends", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getRewardRedemptionTrends();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch redemption trends" });
    }
  });

  app.get("/api/analytics/survey-response-distribution", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getSurveyResponseDistribution();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey data" });
    }
  });

  // Businesses routes
  app.get("/api/businesses", authenticateToken, async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get("/api/businesses/:id", authenticateToken, async (req, res) => {
    try {
      const business = await storage.getBusiness(parseInt(req.params.id));
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post("/api/businesses", authenticateToken, async (req, res) => {
    try {
      const businessData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness(businessData);
      res.status(201).json(business);
    } catch (error) {
      res.status(400).json({ message: "Invalid business data" });
    }
  });

  app.put("/api/businesses/:id", authenticateToken, async (req, res) => {
    try {
      const businessData = insertBusinessSchema.partial().parse(req.body);
      const business = await storage.updateBusiness(parseInt(req.params.id), businessData);
      res.json(business);
    } catch (error) {
      res.status(400).json({ message: "Invalid business data" });
    }
  });

  app.delete("/api/businesses/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteBusiness(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete business" });
    }
  });

  // Events routes
  app.get("/api/events", authenticateToken, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", authenticateToken, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.put("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(parseInt(req.params.id), eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteEvent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Rewards routes
  app.get("/api/rewards", authenticateToken, async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get("/api/rewards/:id", authenticateToken, async (req, res) => {
    try {
      const reward = await storage.getReward(parseInt(req.params.id));
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      res.json(reward);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reward" });
    }
  });

  app.post("/api/rewards", authenticateToken, async (req, res) => {
    try {
      const rewardData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      res.status(400).json({ message: "Invalid reward data" });
    }
  });

  app.put("/api/rewards/:id", authenticateToken, async (req, res) => {
    try {
      const rewardData = insertRewardSchema.partial().parse(req.body);
      const reward = await storage.updateReward(parseInt(req.params.id), rewardData);
      res.json(reward);
    } catch (error) {
      res.status(400).json({ message: "Invalid reward data" });
    }
  });

  app.delete("/api/rewards/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteReward(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  // Surveys routes
  app.get("/api/surveys", authenticateToken, async (req, res) => {
    try {
      const surveys = await storage.getSurveys();
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  app.get("/api/surveys/:id", authenticateToken, async (req, res) => {
    try {
      const survey = await storage.getSurvey(parseInt(req.params.id));
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey" });
    }
  });

  app.post("/api/surveys", authenticateToken, async (req, res) => {
    try {
      const surveyData = insertSurveySchema.parse(req.body);
      const survey = await storage.createSurvey(surveyData);
      res.status(201).json(survey);
    } catch (error) {
      res.status(400).json({ message: "Invalid survey data" });
    }
  });

  app.put("/api/surveys/:id", authenticateToken, async (req, res) => {
    try {
      const surveyData = insertSurveySchema.partial().parse(req.body);
      const survey = await storage.updateSurvey(parseInt(req.params.id), surveyData);
      res.json(survey);
    } catch (error) {
      res.status(400).json({ message: "Invalid survey data" });
    }
  });

  app.delete("/api/surveys/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteSurvey(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete survey" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
