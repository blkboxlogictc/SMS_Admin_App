import { VercelRequest, VercelResponse } from '@vercel/node';

// Simple test handler to debug the issue
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
    
    // Simple test response
    if (req.url === '/api/test') {
      return res.status(200).json({
        message: "API is working",
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
      });
    }
    
    // For now, return a simple response for all other routes
    return res.status(200).json({
      message: "API handler is working",
      method: req.method,
      url: req.url,
      note: "Full routes will be implemented after testing"
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