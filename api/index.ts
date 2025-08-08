import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('=== MAIN API FUNCTION ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
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
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}