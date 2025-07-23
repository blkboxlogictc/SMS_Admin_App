import { storage } from './storage';
import bcryptjs from 'bcryptjs';

// Simple admin creation without external dependencies
export async function ensureAdminUser() {
  try {
    console.log('Checking for admin user...');
    
    // Try to get existing admin
    try {
      const existingAdmin = await storage.getUserByEmail('admin@stuartmainstreet.com');
      if (existingAdmin) {
        console.log('✅ Admin user already exists');
        return;
      }
    } catch (err) {
      console.log('Admin user check failed, continuing with creation...');
    }
    
    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    
    const adminUser = await storage.createUser({
      email: 'admin@stuartmainstreet.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('✅ Admin user created successfully:', adminUser.email);
    
  } catch (error) {
    console.error('❌ Failed to ensure admin user:', error);
    throw error;
  }
}