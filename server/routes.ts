import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertBusinessSchema, insertEventSchema, insertSurveySchema, insertRewardItemSchema } from "@shared/schema";
import { supabase } from "./supabase";
import jwt from "jsonwebtoken";
import postgres from "postgres";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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
      console.log('=== LOGIN ATTEMPT ===');
      const { email, password } = req.body;
      console.log('Email:', email);
      console.log('Password length:', password?.length);
      
      // Step 1: Authenticate with Supabase Auth
      console.log('Step 1: Authenticating with Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase Auth Result:');
      console.log('- Error:', authError);
      console.log('- User ID:', authData?.user?.id);
      console.log('- User Email:', authData?.user?.email);
      console.log('- User Metadata:', authData?.user?.user_metadata);

      if (authError || !authData.user) {
        console.log('Authentication failed:', authError?.message);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Step 2: Check user role from Supabase user metadata
      console.log('Step 2: Checking user role from metadata...');
      const userRole = authData.user.user_metadata?.role || authData.user.app_metadata?.role;
      console.log('User role from metadata:', userRole);
      
      if (userRole !== "admin") {
        console.log('❌ User does not have admin role');
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log('✅ User has admin role - granting access');

      // Step 3: Create JWT token for admin user
      const token = jwt.sign({
        id: authData.user.id,
        email: authData.user.email,
        role: userRole
      }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: userRole,
          firstName: authData.user.user_metadata?.first_name || 'Admin',
          lastName: authData.user.user_metadata?.last_name || 'User'
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : "Unknown error" });
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

  app.get("/api/analytics/checkins-by-event", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getCheckinsByEvent();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checkins by event data" });
    }
  });

  app.get("/api/dashboard/recent-activity", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getRecentActivity();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity data" });
    }
  });

  app.get("/api/surveys/:id/analytics", authenticateToken, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: "Invalid survey ID" });
      }
      
      const data = await storage.getSurveyAnalytics(surveyId);
      res.json(data);
    } catch (error) {
      console.error("Survey analytics error:", error);
      res.status(500).json({
        message: "Failed to fetch survey analytics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/events/rsvp-counts", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getEventRsvpCounts();
      res.json(data);
    } catch (error) {
      console.error("Event RSVP counts error:", error);
      res.status(500).json({
        message: "Failed to fetch event RSVP counts",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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

  app.post("/api/events", authenticateToken, upload.single('image'), async (req, res) => {
    try {
      console.log('=== EVENT CREATE REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('File received:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');
      console.log('User from token:', (req as any).user);
      console.log('Authentication successful for user:', (req as any).user?.email);
      
      // Validate the eventDate field specifically
      if (req.body.eventDate) {
        console.log('Event date received:', req.body.eventDate);
        const testDate = new Date(req.body.eventDate);
        console.log('Parsed date valid:', !isNaN(testDate.getTime()));
        console.log('ISO string format:', testDate.toISOString());
      }
      
      // Use schema validation exactly like UPDATE route does
      const eventDataWithoutImage = {
        name: req.body.name,
        description: req.body.description || null,
        eventDate: req.body.eventDate, // Let schema handle the conversion
        location: req.body.location,
        organizerId: req.body.organizerId || null,
        imageUrl: null // Will be updated after image upload
      };
      
      // Use schema parsing like UPDATE route
      const eventData = insertEventSchema.parse(eventDataWithoutImage);
      console.log('✅ Schema validation passed');
      console.log('Parsed event data:', JSON.stringify(eventData, null, 2));
      
      // Step 1: Create event in database first
      const event = await storage.createEvent(eventData);
      console.log('✅ Database insert successful');
      console.log('Created event with ID:', event.id);

      // Step 2: If there's an image, upload it to folder named with event ID
      if (req.file) {
        try {
          console.log('Uploading image to event folder...');
          
          // Generate filename with extension
          const fileExtension = req.file.originalname.split('.').pop();
          const fileName = `${uuidv4()}.${fileExtension}`;
          const filePath = `${event.id}/${fileName}`;

          console.log('Uploading to Supabase storage:', filePath);

          // Upload to Supabase Storage in event-specific folder
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('event_images')
            .upload(filePath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.error('Supabase storage error:', uploadError);
            // Return event without image if upload fails
            return res.status(201).json({
              ...event,
              uploadWarning: "Event created but image upload failed: " + uploadError.message
            });
          }

          console.log('Upload successful:', uploadData);

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('event_images')
            .getPublicUrl(filePath);

          console.log('Public URL generated:', urlData.publicUrl);

          // Step 3: Update event with image URL
          const updatedEvent = await storage.updateEvent(event.id, {
            imageUrl: urlData.publicUrl
          });

          console.log('✅ Event updated with image URL');
          return res.status(201).json(updatedEvent);

        } catch (imageError) {
          console.error('Error handling image upload:', imageError);
          // Return event without image if upload fails
          return res.status(201).json({
            ...event,
            uploadWarning: "Event created but image upload failed"
          });
        }
      }
      
      // No image provided, return event as-is
      res.status(201).json(event);
    } catch (error) {
      console.error('❌ Event create error:', error);
      
      // Enhanced error reporting
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a Zod validation error
        if (error.name === 'ZodError') {
          console.error('Zod validation failed:', JSON.stringify((error as any).errors, null, 2));
        }
        
        res.status(400).json({
          message: "Invalid event data",
          error: error.message,
          details: error.name === 'ZodError' ? (error as any).errors : undefined
        });
      } else {
        res.status(400).json({ message: "Invalid event data", error: String(error) });
      }
    }
  });

  app.put("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      console.log('=== EVENT UPDATE REQUEST ===');
      console.log('Event ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User from token:', (req as any).user?.email);
      
      // Validate the eventDate field specifically
      if (req.body.eventDate) {
        console.log('Event date received:', req.body.eventDate);
        const testDate = new Date(req.body.eventDate);
        console.log('Parsed date valid:', !isNaN(testDate.getTime()));
        console.log('ISO string format:', testDate.toISOString());
      }
      
      const eventData = insertEventSchema.partial().parse(req.body);
      console.log('✅ Schema validation passed');
      console.log('Parsed event data:', JSON.stringify(eventData, null, 2));
      
      const event = await storage.updateEvent(parseInt(req.params.id), eventData);
      console.log('✅ Database update successful');
      console.log('Updated event:', JSON.stringify(event, null, 2));
      
      res.json(event);
    } catch (error) {
      console.error('❌ Event update error:', error);
      
      // Enhanced error reporting
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a Zod validation error
        if (error.name === 'ZodError') {
          console.error('Zod validation failed:', JSON.stringify((error as any).errors, null, 2));
        }
        
        res.status(400).json({
          message: "Invalid event data",
          error: error.message,
          details: error.name === 'ZodError' ? (error as any).errors : undefined
        });
      } else {
        res.status(400).json({ message: "Invalid event data", error: String(error) });
      }
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
      console.log('=== SURVEY CREATE REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const surveyData = insertSurveySchema.parse(req.body);
      console.log('Parsed survey data:', JSON.stringify(surveyData, null, 2));
      
      const survey = await storage.createSurvey(surveyData);
      console.log('Created survey:', JSON.stringify(survey, null, 2));
      
      res.status(201).json(survey);
    } catch (error) {
      console.error('Survey create error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid survey data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid survey data", error: String(error) });
      }
    }
  });

  app.put("/api/surveys/:id", authenticateToken, async (req, res) => {
    try {
      console.log('=== SURVEY UPDATE REQUEST ===');
      console.log('Survey ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const surveyData = insertSurveySchema.partial().parse(req.body);
      console.log('Parsed survey data:', JSON.stringify(surveyData, null, 2));
      
      const survey = await storage.updateSurvey(parseInt(req.params.id), surveyData);
      console.log('Updated survey:', JSON.stringify(survey, null, 2));
      
      res.json(survey);
    } catch (error) {
      console.error('Survey update error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid survey data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid survey data", error: String(error) });
      }
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

  // Reward Items routes
  app.get("/api/reward-items", authenticateToken, async (req, res) => {
    try {
      console.log('=== REWARD ITEMS GET REQUEST ===');
      console.log('Fetching reward items from Supabase database...');
      
      const rewardItems = await storage.getRewardItems();
      console.log('Retrieved reward items count:', rewardItems.length);
      console.log('Reward items data:', JSON.stringify(rewardItems, null, 2));
      
      res.json(rewardItems);
    } catch (error) {
      console.error('❌ Failed to fetch reward items:', error);
      res.status(500).json({ message: "Failed to fetch reward items" });
    }
  });

  app.get("/api/reward-items/:id", authenticateToken, async (req, res) => {
    try {
      const rewardItem = await storage.getRewardItem(parseInt(req.params.id));
      if (!rewardItem) {
        return res.status(404).json({ message: "Reward item not found" });
      }
      res.json(rewardItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reward item" });
    }
  });

  app.post("/api/reward-items", authenticateToken, async (req, res) => {
    try {
      console.log('=== REWARD ITEM CREATE REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Database URL being used:', process.env.DATABASE_URL?.substring(0, 50) + '...');
      
      const rewardItemData = insertRewardItemSchema.parse(req.body);
      console.log('Parsed reward item data:', JSON.stringify(rewardItemData, null, 2));
      
      const rewardItem = await storage.createRewardItem(rewardItemData);
      console.log('Created reward item:', JSON.stringify(rewardItem, null, 2));
      console.log('✅ Reward item successfully created in Supabase database');
      
      res.status(201).json(rewardItem);
    } catch (error) {
      console.error('❌ Reward item create error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid reward item data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid reward item data", error: String(error) });
      }
    }
  });

  app.put("/api/reward-items/:id", authenticateToken, async (req, res) => {
    try {
      console.log('=== REWARD ITEM UPDATE REQUEST ===');
      console.log('Reward item ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User from token:', (req as any).user?.email);
      
      // Validate the expirationDate field specifically
      if (req.body.expirationDate) {
        console.log('Expiration date received:', req.body.expirationDate);
        const testDate = new Date(req.body.expirationDate);
        console.log('Parsed expiration date valid:', !isNaN(testDate.getTime()));
        console.log('ISO string format:', testDate.toISOString());
      }
      
      const rewardItemData = insertRewardItemSchema.partial().parse(req.body);
      console.log('✅ Schema validation passed');
      console.log('Parsed reward item data:', JSON.stringify(rewardItemData, null, 2));
      
      const rewardItem = await storage.updateRewardItem(parseInt(req.params.id), rewardItemData);
      console.log('✅ Database update successful');
      console.log('Updated reward item:', JSON.stringify(rewardItem, null, 2));
      
      res.json(rewardItem);
    } catch (error) {
      console.error('❌ Reward item update error:', error);
      
      // Enhanced error reporting
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a Zod validation error
        if (error.name === 'ZodError') {
          console.error('Zod validation failed:', JSON.stringify((error as any).errors, null, 2));
        }
        
        res.status(400).json({
          message: "Invalid reward item data",
          error: error.message,
          details: error.name === 'ZodError' ? (error as any).errors : undefined
        });
      } else {
        res.status(400).json({ message: "Invalid reward item data", error: String(error) });
      }
    }
  });

  app.delete("/api/reward-items/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteRewardItem(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reward item" });
    }
  });

  // Test endpoint to debug reward items table
  app.get("/api/test/reward-items-raw", authenticateToken, async (req, res) => {
    try {
      console.log('=== RAW DATABASE QUERY TEST ===');
      console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
      
      // Create a postgres client for raw SQL
      const sql = postgres(process.env.DATABASE_URL!);
      
      // Raw SQL query to see exactly what's in the table
      const rows = await sql`SELECT * FROM reward_items ORDER BY created_at DESC LIMIT 10`;
      console.log('Raw SQL result:', JSON.stringify(rows, null, 2));
      
      await sql.end();
      
      res.json({
        message: "Raw database query results",
        count: rows.length,
        data: rows
      });
    } catch (error) {
      console.error('❌ Raw database query error:', error);
      res.status(500).json({
        message: "Database query failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
