import { storage } from './storage';
import bcryptjs from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail('admin@stuartmainstreet.com');
    
    if (!existingAdmin) {
      // Create default admin user
      const hashedPassword = await bcryptjs.hash('admin123', 10);
      
      const adminUser = await storage.createUser({
        email: 'admin@stuartmainstreet.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('✅ Admin user already exists');
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };