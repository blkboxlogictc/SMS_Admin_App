import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Dynamic database connection function
async function getDbConnection() {
  try {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found');
    }
    
    const queryClient = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    return drizzle(queryClient);
  } catch (error) {
    console.error('Database connection error:', error);
    return null;
  }
}

// Dynamic schema imports
async function getSchemas() {
  try {
    const schema = await import("../shared/schema");
    const { eq, desc, count, sql } = await import("drizzle-orm");
    return { ...schema, eq, desc, count, sql };
  } catch (error) {
    console.error('Schema import error:', error);
    return null;
  }
}

// Authentication middleware
function authenticateToken(req: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Access token required' };
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { user };
  } catch (err) {
    return { error: 'Invalid token' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('=== SERVERLESS FUNCTION CALLED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Handle login route
    if (req.url === '/api/auth/login' && req.method === 'POST') {
      try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);
        
        // Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError || !authData.user) {
          console.log('Authentication failed:', authError?.message);
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check user role from metadata
        const userRole = authData.user.user_metadata?.role || authData.user.app_metadata?.role;
        console.log('User role from metadata:', userRole);
        
        if (userRole !== "admin") {
          console.log('User does not have admin role');
          return res.status(403).json({ message: "Admin access required" });
        }

        // Create JWT token
        const token = jwt.sign({
          id: authData.user.id,
          email: authData.user.email,
          role: userRole
        }, JWT_SECRET, { expiresIn: '24h' });
        
        return res.status(200).json({
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
        return res.status(500).json({
          message: "Login failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    // Dashboard stats endpoint - simplified with direct Supabase queries
    if (req.url === '/api/dashboard/stats' && req.method === 'GET') {
      try {
        console.log('=== DASHBOARD STATS REQUEST (SIMPLIFIED) ===');
        
        // Check authentication
        const auth = authenticateToken(req);
        if (auth.error) {
          console.log('Authentication failed:', auth.error);
          return res.status(401).json({ message: auth.error });
        }
        console.log('Authentication successful for user:', auth.user);
        
        console.log('Using direct Supabase queries...');
        
        // Use direct Supabase queries instead of Drizzle ORM
        const { data: checkins, error: checkinsError } = await supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true });
        
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gt('event_date', new Date().toISOString());
        
        const { data: surveyResponses, error: surveyError } = await supabase
          .from('survey_responses')
          .select('*', { count: 'exact', head: true });
        
        const { data: rewardRedemptions, error: rewardsError } = await supabase
          .from('reward_redemptions')
          .select('*', { count: 'exact', head: true });

        console.log('Query results:');
        console.log('- Checkins count:', checkins);
        console.log('- Events count:', events);
        console.log('- Survey responses count:', surveyResponses);
        console.log('- Reward redemptions count:', rewardRedemptions);
        
        console.log('Query errors:');
        console.log('- Checkins error:', checkinsError);
        console.log('- Events error:', eventsError);
        console.log('- Survey error:', surveyError);
        console.log('- Rewards error:', rewardsError);

        const result = {
          totalCheckins: checkins || 0,
          activeEvents: events || 0,
          surveyResponses: surveyResponses || 0,
          rewardsRedeemed: rewardRedemptions || 0,
        };
        
        console.log('Dashboard stats final result:', result);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Dashboard stats error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        return res.status(500).json({
          message: "Failed to fetch dashboard stats",
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    // Dashboard recent activity endpoint
    if (req.url === '/api/dashboard/recent-activity' && req.method === 'GET') {
      try {
        console.log('=== RECENT ACTIVITY REQUEST ===');
        const db = await getDbConnection();
        const schemas = await getSchemas();
        
        if (!db || !schemas) {
          throw new Error('Database connection or schemas not available');
        }

        const { events, rewardItems, surveys, desc } = schemas;
        const activities: { type: string; description: string; timestamp: Date; icon: string }[] = [];

        // Get recent events
        const recentEvents = await db.select({
          name: events.name,
          createdAt: events.createdAt,
        }).from(events)
          .orderBy(desc(events.createdAt))
          .limit(3);

        recentEvents.forEach(event => {
          if (event.createdAt) {
            activities.push({
              type: 'event',
              description: `New event created: ${event.name}`,
              timestamp: event.createdAt,
              icon: 'calendar'
            });
          }
        });

        // Get recent reward items
        const recentRewards = await db.select({
          name: rewardItems.name,
          pointThreshold: rewardItems.pointThreshold,
          createdAt: rewardItems.createdAt,
        }).from(rewardItems)
          .orderBy(desc(rewardItems.createdAt))
          .limit(3);

        recentRewards.forEach(reward => {
          if (reward.createdAt) {
            activities.push({
              type: 'reward',
              description: `New reward added: ${reward.name} - ${reward.pointThreshold} points`,
              timestamp: reward.createdAt,
              icon: 'gift'
            });
          }
        });

        // Get recent surveys
        const recentSurveys = await db.select({
          title: surveys.title,
          createdAt: surveys.createdAt,
        }).from(surveys)
          .orderBy(desc(surveys.createdAt))
          .limit(3);

        recentSurveys.forEach(survey => {
          if (survey.createdAt) {
            activities.push({
              type: 'survey',
              description: `New survey created: ${survey.title}`,
              timestamp: survey.createdAt,
              icon: 'vote'
            });
          }
        });

        // Sort all activities by timestamp and return top 10
        const sortedActivities = activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);

        return res.status(200).json(sortedActivities);
      } catch (error) {
        console.error('Recent activity error:', error);
        return res.status(500).json({
          message: "Failed to fetch recent activity data",
    // Simple database test endpoint (no auth required for debugging)
    if (req.url === '/api/debug/db-test' && req.method === 'GET') {
      try {
        console.log('=== SIMPLE DATABASE TEST ===');
        
        const db = await getDbConnection();
        const schemas = await getSchemas();
        
        if (!db || !schemas) {
          return res.status(500).json({ 
            error: 'Database connection or schemas failed',
            hasDb: !!db,
            hasSchemas: !!schemas
          });
        }

        const { events, checkins, surveys, rewardItems, count } = schemas;

        // Test basic queries to see what data exists
        console.log('Testing database queries...');
        
        const [eventCount] = await db.select({ count: count() }).from(events);
        console.log('Events count:', eventCount);
        
        const [checkinCount] = await db.select({ count: count() }).from(checkins);
        console.log('Checkins count:', checkinCount);
        
        const [surveyCount] = await db.select({ count: count() }).from(surveys);
        console.log('Surveys count:', surveyCount);
        
        const [rewardCount] = await db.select({ count: count() }).from(rewardItems);
        console.log('Reward items count:', rewardCount);

        // Get sample data
        const sampleEvents = await db.select().from(events).limit(3);
        const sampleCheckins = await db.select().from(checkins).limit(3);

        return res.status(200).json({
          message: "Database connection successful",
          counts: {
            events: eventCount.count,
            checkins: checkinCount.count,
            surveys: surveyCount.count,
            rewardItems: rewardCount.count
          },
          samples: {
            events: sampleEvents,
            checkins: sampleCheckins
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Database test error:', error);
        return res.status(500).json({
          error: "Database test failed",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Analytics endpoints for dashboard charts
    if (req.url === '/api/analytics/checkins-by-event' && req.method === 'GET') {
      try {
        const db = await getDbConnection();
        const schemas = await getSchemas();
        
        if (!db || !schemas) {
          throw new Error('Database connection or schemas not available');
        }

        const { checkins, events, eq, desc, count } = schemas;

        const result = await db
          .select({
            eventName: events.name,
            checkins: count(checkins.id),
          })
          .from(checkins)
          .leftJoin(events, eq(checkins.eventId, events.id))
          .groupBy(events.name)
          .orderBy(desc(count(checkins.id)));

        const data = result.map(row => ({ eventName: row.eventName || 'Unknown Event', checkins: row.checkins }));
        return res.status(200).json(data);
      } catch (error) {
        console.error('Checkins by event error:', error);
        return res.status(500).json({
          message: "Failed to fetch checkins by event data",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (req.url === '/api/analytics/event-rsvp-trends' && req.method === 'GET') {
      try {
        const db = await getDbConnection();
        const schemas = await getSchemas();
        
        if (!db || !schemas) {
          throw new Error('Database connection or schemas not available');
        }

        const { events, eventRsvps, eq, count, sql } = schemas;

        const result = await db
          .select({
            date: sql<string>`DATE(${events.eventDate})`,
            rsvps: count(eventRsvps.id),
          })
          .from(events)
          .leftJoin(eventRsvps, eq(events.id, eventRsvps.eventId))
          .groupBy(sql`DATE(${events.eventDate})`)
          .orderBy(sql`DATE(${events.eventDate})`);

        const data = result.map(row => ({ date: row.date, rsvps: row.rsvps }));
        return res.status(200).json(data);
      } catch (error) {
        console.error('Event RSVP trends error:', error);
        return res.status(500).json({
          message: "Failed to fetch RSVP trends",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Health check endpoint
    if (req.url === '/api/health' && req.method === 'GET') {
      return res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasJwtSecret: !!process.env.JWT_SECRET
        }
      });
    }

    // Test endpoint
    if (req.url === '/api/test') {
      return res.status(200).json({
        message: "API is working",
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
      });
    }
    
    // For other routes, return a placeholder response
    return res.status(200).json({
      message: "API endpoint not implemented yet",
      method: req.method,
      url: req.url,
      note: "This endpoint will be implemented soon"
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}