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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('=== AUTH FUNCTION ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Handle login route
    if (req.method === 'POST') {
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
    
    return res.status(405).json({ message: "Method not allowed" });
    
  } catch (error) {
    console.error('Auth handler error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}