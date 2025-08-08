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
    console.log('=== DASHBOARD FUNCTION ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Check authentication for all dashboard endpoints
    const auth = authenticateToken(req);
    if (auth.error) {
      console.log('Authentication failed:', auth.error);
      return res.status(401).json({ message: auth.error });
    }
    console.log('Authentication successful');
    
    // Dashboard stats endpoint
    if (req.url === '/api/dashboard' || req.url?.includes('stats')) {
      try {
        console.log('=== DASHBOARD STATS ===');
        
        // Use direct Supabase queries
        const { count: checkinsCount, error: checkinsError } = await supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true });
        
        const { count: eventsCount, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gt('event_date', new Date().toISOString());
        
        const { count: surveyResponsesCount, error: surveyError } = await supabase
          .from('survey_responses')
          .select('*', { count: 'exact', head: true });
        
        const { count: rewardRedemptionsCount, error: rewardsError } = await supabase
          .from('reward_redemptions')
          .select('*', { count: 'exact', head: true });

        console.log('Query results:');
        console.log('- Checkins:', checkinsCount, checkinsError);
        console.log('- Events:', eventsCount, eventsError);
        console.log('- Survey responses:', surveyResponsesCount, surveyError);
        console.log('- Reward redemptions:', rewardRedemptionsCount, rewardsError);

        const result = {
          totalCheckins: checkinsCount || 0,
          activeEvents: eventsCount || 0,
          surveyResponses: surveyResponsesCount || 0,
          rewardsRedeemed: rewardRedemptionsCount || 0,
        };
        
        console.log('Dashboard stats result:', result);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({ 
          message: "Failed to fetch dashboard stats",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    // Recent activity endpoint
    if (req.url?.includes('recent-activity')) {
      try {
        console.log('=== RECENT ACTIVITY ===');
        
        const activities: { type: string; description: string; timestamp: string; icon: string }[] = [];

        // Get recent events
        const { data: recentEvents } = await supabase
          .from('events')
          .select('name, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        recentEvents?.forEach(event => {
          if (event.created_at) {
            activities.push({
              type: 'event',
              description: `New event created: ${event.name}`,
              timestamp: event.created_at,
              icon: 'calendar'
            });
          }
        });

        // Get recent reward items
        const { data: recentRewards } = await supabase
          .from('reward_items')
          .select('name, point_threshold, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        recentRewards?.forEach(reward => {
          if (reward.created_at) {
            activities.push({
              type: 'reward',
              description: `New reward added: ${reward.name} - ${reward.point_threshold} points`,
              timestamp: reward.created_at,
              icon: 'gift'
            });
          }
        });

        // Get recent surveys
        const { data: recentSurveys } = await supabase
          .from('surveys')
          .select('title, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        recentSurveys?.forEach(survey => {
          if (survey.created_at) {
            activities.push({
              type: 'survey',
              description: `New survey created: ${survey.title}`,
              timestamp: survey.created_at,
              icon: 'vote'
            });
          }
        });

        // Sort all activities by timestamp and return top 10
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

        return res.status(200).json(sortedActivities);
      } catch (error) {
        console.error('Recent activity error:', error);
        return res.status(500).json({ 
          message: "Failed to fetch recent activity data",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    return res.status(404).json({ message: "Endpoint not found" });
    
  } catch (error) {
    console.error('Dashboard handler error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}