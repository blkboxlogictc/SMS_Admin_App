import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users,
  businesses,
  events,
  rewards,
  rewardItems,
  surveys,
  checkins,
  surveyResponses,
  rewardRedemptions,
  eventRsvps,
  promotions,
} from "../shared/schema";
import { eq, desc, count, sql } from "drizzle-orm";

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

// Initialize database connection for analytics queries
let db: any = null;
function getDb() {
  if (!db && process.env.DATABASE_URL) {
    const queryClient = postgres(process.env.DATABASE_URL);
    db = drizzle(queryClient);
  }
  return db;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Handler called:', req.method, req.url);
    
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
    
    // Dashboard stats endpoint
    if (req.url === '/api/dashboard/stats' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const [totalCheckins] = await database.select({ count: count() }).from(checkins);
        const [activeEvents] = await database.select({ count: count() }).from(events).where(sql`${events.eventDate} > NOW()`);
        const [surveyResponsesCount] = await database.select({ count: count() }).from(surveyResponses);
        const [rewardsRedeemedCount] = await database.select({ count: count() }).from(rewardRedemptions);

        return res.status(200).json({
          totalCheckins: totalCheckins.count,
          activeEvents: activeEvents.count,
          surveyResponses: surveyResponsesCount.count,
          rewardsRedeemed: rewardsRedeemedCount.count,
        });
      } catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({ message: "Failed to fetch dashboard stats" });
      }
    }

    // Analytics endpoints
    if (req.url === '/api/analytics/checkins-by-event' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database
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
        return res.status(500).json({ message: "Failed to fetch checkins by event data" });
      }
    }

    if (req.url === '/api/analytics/event-rsvp-trends' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database
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
        return res.status(500).json({ message: "Failed to fetch RSVP trends" });
      }
    }

    if (req.url === '/api/dashboard/recent-activity' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const activities: { type: string; description: string; timestamp: Date; icon: string }[] = [];

        // Get recent events
        const recentEvents = await database.select({
          name: events.name,
          createdAt: events.createdAt,
        }).from(events)
          .orderBy(desc(events.createdAt))
          .limit(5);

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
        const recentRewards = await database.select({
          name: rewardItems.name,
          pointThreshold: rewardItems.pointThreshold,
          createdAt: rewardItems.createdAt,
        }).from(rewardItems)
          .orderBy(desc(rewardItems.createdAt))
          .limit(5);

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
        const recentSurveys = await database.select({
          title: surveys.title,
          createdAt: surveys.createdAt,
        }).from(surveys)
          .orderBy(desc(surveys.createdAt))
          .limit(5);

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
        return res.status(500).json({ message: "Failed to fetch recent activity data" });
      }
    }

    // Analytics page endpoints
    if (req.url === '/api/analytics/reward-redemption-trends' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database
          .select({
            date: sql<string>`DATE(${rewardRedemptions.createdAt})`,
            redemptions: count(rewardRedemptions.id),
          })
          .from(rewardRedemptions)
          .groupBy(sql`DATE(${rewardRedemptions.createdAt})`)
          .orderBy(sql`DATE(${rewardRedemptions.createdAt})`);

        const data = result.map(row => ({ date: row.date, redemptions: row.redemptions }));
        return res.status(200).json(data);
      } catch (error) {
        console.error('Reward redemption trends error:', error);
        return res.status(500).json({ message: "Failed to fetch redemption trends" });
      }
    }

    if (req.url === '/api/analytics/survey-response-distribution' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database
          .select({
            surveyTitle: surveys.title,
            responses: count(surveyResponses.id),
          })
          .from(surveyResponses)
          .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
          .groupBy(surveys.title)
          .orderBy(desc(count(surveyResponses.id)));

        const data = result.map(row => ({ surveyTitle: row.surveyTitle, responses: row.responses }));
        return res.status(200).json(data);
      } catch (error) {
        console.error('Survey response distribution error:', error);
        return res.status(500).json({ message: "Failed to fetch survey data" });
      }
    }

    // Businesses endpoint
    if (req.url === '/api/businesses' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const businessList = await database.select().from(businesses).orderBy(desc(businesses.createdAt));
        return res.status(200).json(businessList);
      } catch (error) {
        console.error('Businesses error:', error);
        return res.status(500).json({ message: "Failed to fetch businesses" });
      }
    }

    // Events endpoints
    if (req.url === '/api/events' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const eventsList = await database.select().from(events).orderBy(desc(events.eventDate));
        return res.status(200).json(eventsList);
      } catch (error) {
        console.error('Events error:', error);
        return res.status(500).json({ message: "Failed to fetch events" });
      }
    }

    if (req.url === '/api/events/rsvp-counts' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database
          .select({
            eventId: eventRsvps.eventId,
            rsvpCount: count(eventRsvps.id),
          })
          .from(eventRsvps)
          .groupBy(eventRsvps.eventId);

        const data = result.map(row => ({
          eventId: row.eventId,
          rsvpCount: row.rsvpCount
        }));
        return res.status(200).json(data);
      } catch (error) {
        console.error('Event RSVP counts error:', error);
        return res.status(500).json({ message: "Failed to fetch event RSVP counts" });
      }
    }

    // Surveys endpoints
    if (req.url === '/api/surveys' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const surveysList = await database.select().from(surveys).orderBy(desc(surveys.createdAt));
        return res.status(200).json(surveysList);
      } catch (error) {
        console.error('Surveys error:', error);
        return res.status(500).json({ message: "Failed to fetch surveys" });
      }
    }

    // Survey analytics endpoint
    if (req.url?.startsWith('/api/surveys/') && req.url?.endsWith('/analytics') && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const surveyId = parseInt(req.url.split('/')[3]);
        if (isNaN(surveyId)) {
          return res.status(400).json({ message: "Invalid survey ID" });
        }

        // Get the survey details
        const [survey] = await database.select().from(surveys).where(eq(surveys.id, surveyId)).limit(1);
        if (!survey) {
          return res.status(404).json({ message: "Survey not found" });
        }

        // Get all responses for this survey
        const responses = await database.select({
          id: surveyResponses.id,
          responses: surveyResponses.responses,
          createdAt: surveyResponses.createdAt,
        }).from(surveyResponses)
          .where(eq(surveyResponses.surveyId, surveyId));

        // Parse survey questions
        let questions = [];
        try {
          questions = typeof survey.questions === "string"
            ? JSON.parse(survey.questions)
            : Array.isArray(survey.questions)
            ? survey.questions
            : [];
        } catch (e) {
          questions = [];
        }

        // Analyze responses for each question
        const questionAnalytics = questions.map((question: any, index: number) => {
          const questionId = (index + 1).toString();
          const questionText = question.text || question.question || `Question ${questionId}`;
          const questionType = question.type || 'text';
          const options = question.options || [];

          // Collect all answers for this question
          const allAnswers: string[] = [];
          const textResponses: string[] = [];

          responses.forEach(response => {
            try {
              const answersObj = typeof response.responses === 'string'
                ? JSON.parse(response.responses)
                : response.responses;
              
              if (answersObj && answersObj[questionId]) {
                const answer = answersObj[questionId];
                
                // Handle checkbox questions - split comma-separated values
                if (questionType === 'checkbox') {
                  const checkboxAnswers = answer.split(',').map((a: string) => a.trim());
                  checkboxAnswers.forEach((checkboxAnswer: string) => {
                    if (checkboxAnswer) {
                      allAnswers.push(checkboxAnswer);
                    }
                  });
                } else {
                  allAnswers.push(answer);
                }
                
                // For text questions, keep the full text
                if (questionType === 'text' || questionType === 'textarea') {
                  textResponses.push(answer);
                }
              }
            } catch (e) {
              console.error('Error parsing response answers:', e);
            }
          });

          // Count responses by answer
          const answerCounts: { [key: string]: number } = {};
          allAnswers.forEach(answer => {
            answerCounts[answer] = (answerCounts[answer] || 0) + 1;
          });

          // Convert to array format
          const responseData = Object.entries(answerCounts).map(([answer, count]) => ({
            answer,
            count
          })).sort((a, b) => b.count - a.count); // Sort by count descending

          return {
            questionId,
            questionText,
            questionType,
            options,
            responses: responseData,
            textResponses: questionType === 'text' || questionType === 'textarea' ? textResponses.slice(0, 10) : undefined // Limit text responses
          };
        });

        const result = {
          survey,
          totalResponses: responses.length,
          questionAnalytics
        };

        return res.status(200).json(result);
      } catch (error) {
        console.error('Survey analytics error:', error);
        return res.status(500).json({ message: "Failed to fetch survey analytics" });
      }
    }

    // Reward Items endpoints
    if (req.url === '/api/reward-items' && req.method === 'GET') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const rewardItemsList = await database.select().from(rewardItems).orderBy(desc(rewardItems.createdAt));
        return res.status(200).json(rewardItemsList);
      } catch (error) {
        console.error('Reward items error:', error);
        return res.status(500).json({ message: "Failed to fetch reward items" });
      }
    }

    // Reward Items CRUD endpoints
    if (req.url === '/api/reward-items' && req.method === 'POST') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database.insert(rewardItems).values(req.body).returning();
        return res.status(201).json(result[0]);
      } catch (error) {
        console.error('Create reward item error:', error);
        return res.status(400).json({ message: "Invalid reward item data" });
      }
    }

    // Handle reward item by ID endpoints
    if (req.url?.startsWith('/api/reward-items/') && req.url.split('/').length === 4) {
      const rewardItemId = parseInt(req.url.split('/')[3]);
      if (isNaN(rewardItemId)) {
        return res.status(400).json({ message: "Invalid reward item ID" });
      }

      const database = getDb();
      if (!database) {
        return res.status(500).json({ message: 'Database connection not available' });
      }

      if (req.method === 'PUT') {
        try {
          const result = await database.update(rewardItems).set(req.body).where(eq(rewardItems.id, rewardItemId)).returning();
          if (!result[0]) {
            return res.status(404).json({ message: "Reward item not found" });
          }
          return res.status(200).json(result[0]);
        } catch (error) {
          console.error('Update reward item error:', error);
          return res.status(400).json({ message: "Invalid reward item data" });
        }
      }

      if (req.method === 'DELETE') {
        try {
          await database.delete(rewardItems).where(eq(rewardItems.id, rewardItemId));
          return res.status(204).end();
        } catch (error) {
          console.error('Delete reward item error:', error);
          return res.status(500).json({ message: "Failed to delete reward item" });
        }
      }
    }

    // Events CRUD endpoints
    if (req.url === '/api/events' && req.method === 'POST') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database.insert(events).values(req.body).returning();
        return res.status(201).json(result[0]);
      } catch (error) {
        console.error('Create event error:', error);
        return res.status(400).json({ message: "Invalid event data" });
      }
    }

    // Handle event by ID endpoints
    if (req.url?.startsWith('/api/events/') && req.url.split('/').length === 4 && !req.url.includes('rsvp-counts')) {
      const eventId = parseInt(req.url.split('/')[3]);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const database = getDb();
      if (!database) {
        return res.status(500).json({ message: 'Database connection not available' });
      }

      if (req.method === 'GET') {
        try {
          const [event] = await database.select().from(events).where(eq(events.id, eventId)).limit(1);
          if (!event) {
            return res.status(404).json({ message: "Event not found" });
          }
          return res.status(200).json(event);
        } catch (error) {
          console.error('Get event error:', error);
          return res.status(500).json({ message: "Failed to fetch event" });
        }
      }

      if (req.method === 'PUT') {
        try {
          const result = await database.update(events).set(req.body).where(eq(events.id, eventId)).returning();
          if (!result[0]) {
            return res.status(404).json({ message: "Event not found" });
          }
          return res.status(200).json(result[0]);
        } catch (error) {
          console.error('Update event error:', error);
          return res.status(400).json({ message: "Invalid event data" });
        }
      }

      if (req.method === 'DELETE') {
        try {
          await database.delete(events).where(eq(events.id, eventId));
          return res.status(204).end();
        } catch (error) {
          console.error('Delete event error:', error);
          return res.status(500).json({ message: "Failed to delete event" });
        }
      }
    }

    // Surveys CRUD endpoints
    if (req.url === '/api/surveys' && req.method === 'POST') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database.insert(surveys).values(req.body).returning();
        return res.status(201).json(result[0]);
      } catch (error) {
        console.error('Create survey error:', error);
        return res.status(400).json({ message: "Invalid survey data" });
      }
    }

    // Handle survey by ID endpoints (excluding analytics)
    if (req.url?.startsWith('/api/surveys/') && req.url.split('/').length === 4 && !req.url.includes('analytics')) {
      const surveyId = parseInt(req.url.split('/')[3]);
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: "Invalid survey ID" });
      }

      const database = getDb();
      if (!database) {
        return res.status(500).json({ message: 'Database connection not available' });
      }

      if (req.method === 'GET') {
        try {
          const [survey] = await database.select().from(surveys).where(eq(surveys.id, surveyId)).limit(1);
          if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
          }
          return res.status(200).json(survey);
        } catch (error) {
          console.error('Get survey error:', error);
          return res.status(500).json({ message: "Failed to fetch survey" });
        }
      }

      if (req.method === 'PUT') {
        try {
          const result = await database.update(surveys).set(req.body).where(eq(surveys.id, surveyId)).returning();
          if (!result[0]) {
            return res.status(404).json({ message: "Survey not found" });
          }
          return res.status(200).json(result[0]);
        } catch (error) {
          console.error('Update survey error:', error);
          return res.status(400).json({ message: "Invalid survey data" });
        }
      }

      if (req.method === 'DELETE') {
        try {
          await database.delete(surveys).where(eq(surveys.id, surveyId));
          return res.status(204).end();
        } catch (error) {
          console.error('Delete survey error:', error);
          return res.status(500).json({ message: "Failed to delete survey" });
        }
      }
    }

    // Businesses CRUD endpoints
    if (req.url === '/api/businesses' && req.method === 'POST') {
      try {
        const database = getDb();
        if (!database) {
          throw new Error('Database connection not available');
        }

        const result = await database.insert(businesses).values(req.body).returning();
        return res.status(201).json(result[0]);
      } catch (error) {
        console.error('Create business error:', error);
        return res.status(400).json({ message: "Invalid business data" });
      }
    }

    // Handle business by ID endpoints
    if (req.url?.startsWith('/api/businesses/') && req.url.split('/').length === 4) {
      const businessId = parseInt(req.url.split('/')[3]);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Invalid business ID" });
      }

      const database = getDb();
      if (!database) {
        return res.status(500).json({ message: 'Database connection not available' });
      }

      if (req.method === 'GET') {
        try {
          const [business] = await database.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
          if (!business) {
            return res.status(404).json({ message: "Business not found" });
          }
          return res.status(200).json(business);
        } catch (error) {
          console.error('Get business error:', error);
          return res.status(500).json({ message: "Failed to fetch business" });
        }
      }

      if (req.method === 'PUT') {
        try {
          const result = await database.update(businesses).set(req.body).where(eq(businesses.id, businessId)).returning();
          if (!result[0]) {
            return res.status(404).json({ message: "Business not found" });
          }
          return res.status(200).json(result[0]);
        } catch (error) {
          console.error('Update business error:', error);
          return res.status(400).json({ message: "Invalid business data" });
        }
      }

      if (req.method === 'DELETE') {
        try {
          await database.delete(businesses).where(eq(businesses.id, businessId));
          return res.status(204).end();
        } catch (error) {
          console.error('Delete business error:', error);
          return res.status(500).json({ message: "Failed to delete business" });
        }
      }
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