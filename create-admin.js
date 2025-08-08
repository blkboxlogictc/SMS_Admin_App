import { createClient } from '@supabase/supabase-js';
import { config } from "dotenv";

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔧 Creating admin user for Stuart Main Street Admin Hub...');
  
  const adminEmail = 'admin@stuartmainstreet.com';
  const adminPassword = 'admin123!'; // Change this to a secure password
  
  try {
    // Step 1: Create user in Supabase Auth with admin role in metadata
    console.log('Step 1: Creating user in Supabase Auth with admin role...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role:', authData.user.user_metadata.role);
    console.log('👤 User ID:', authData.user.id);
    console.log('');
    console.log('🎉 You can now log in to your admin panel!');
    console.log('⚠️  Remember to change the password after first login');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createAdminUser();