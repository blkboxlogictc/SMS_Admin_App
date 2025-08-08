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
    console.log('=== ANALYTICS FUNCTION ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Check authentication
    const auth = authenticateToken(req);
    if (auth.error) {
      console.log('Authentication failed:', auth.error);
      return res.status(401).json({ message: auth.error });
    }
    console.log('Authentication successful');
    
    // Checkins by event endpoint
    if (req.url?.includes('checkins-by-event')) {
      try {
        console.log('=== CHECKINS BY EVENT ===');
        
        // Get checkins with event names using a join-like query
        const { data: checkins } = await supabase
          .from('checkins')
          .select(`
            id,
            events!inner(name)
          `);

        // Group by event name and count
        const eventCounts: { [key: string]: number } = {};
        checkins?.forEach(checkin => {
          const eventName = (checkin as any).events?.name || 'Unknown Event';
          eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
        });

        // Convert to array format
        const data = Object.entries(eventCounts)
          .map(([eventName, checkins]) => ({ eventName, checkins }))
          .sort((a, b) => b.checkins - a.checkins);

        console.log('Checkins by event result:', data);
        return res.status(200).json(data);
      } catch (error) {
        console.error('Checkins by event error:', error);
        return res.status(500).json({ 
          message: "Failed to fetch checkins by event data",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    // Event RSVP trends endpoint
    if (req.url?.includes('event-rsvp-trends')) {
      try {
        console.log('=== EVENT RSVP TRENDS ===');
        
        // Get RSVPs with event dates
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select(`
            id,
            events!inner(event_date)
          `);

        // Group by date and count
        const dateCounts: { [key: string]: number } = {};
        rsvps?.forEach(rsvp => {
          const eventDate = (rsvp as any).events?.event_date;
          if (eventDate) {
            const date = new Date(eventDate).toISOString().split('T')[0];
            dateCounts[date] = (dateCounts[date] || 0) + 1;
          }
        });

        // Convert to array format and sort by date
        const data = Object.entries(dateCounts)
          .map(([date, rsvps]) => ({ date, rsvps }))
          .sort((a, b) => a.date.localeCompare(b.date));

        console.log('Event RSVP trends result:', data);
        return res.status(200).json(data);
      } catch (error) {
        console.error('Event RSVP trends error:', error);
        return res.status(500).json({ 
          message: "Failed to fetch RSVP trends",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    return res.status(404).json({ message: "Analytics endpoint not found" });
    
  } catch (error) {
    console.error('Analytics handler error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}