import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as crypto from 'crypto';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const ADMIN_EMAIL = 'support@vibeqa.app';

// Generate a secure password
function generatePassword(): string {
  return crypto.randomBytes(16).toString('base64').slice(0, 24);
}

async function createSuperadmin() {
  // Check required environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Missing required environment variables');
    console.error('Please ensure the following are set in your .env.local file:');
    console.error('- VITE_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('=====================================');
  console.log('VibeQA Superadmin User Creation');
  console.log('=====================================');
  console.log('');

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(user => user.email === ADMIN_EMAIL);

    let userId: string;
    let password: string | undefined;

    if (userExists) {
      console.log(`ℹ️  User ${ADMIN_EMAIL} already exists`);
      const user = existingUser?.users?.find(user => user.email === ADMIN_EMAIL);
      userId = user!.id;
    } else {
      // Generate password
      password = generatePassword();
      
      // Create the user
      console.log(`Creating user ${ADMIN_EMAIL}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: password,
        email_confirm: true
      });

      if (error) {
        console.error('❌ Error creating user:', error.message);
        process.exit(1);
      }

      userId = data.user!.id;
      console.log('✅ User created successfully');
    }

    // Now run the SQL to set up organization
    console.log('');
    console.log('Setting up organization and permissions...');

    // Get the SQL script content
    const { data: orgData, error: orgError } = await supabase.rpc('create_organization_for_user', {
      user_id: userId,
      org_name: 'VibeQA Support',
      org_slug: 'vibeqa-support'
    });

    if (orgError && !orgError.message.includes('already exists')) {
      // Try alternative approach - direct SQL
      const { error: sqlError } = await supabase.from('organizations').upsert({
        name: 'VibeQA Support',
        slug: 'vibeqa-support',
        settings: {
          is_internal: true,
          created_by: 'system',
          purpose: 'Internal support and administration'
        }
      }, {
        onConflict: 'slug'
      });

      if (!sqlError) {
        // Get the organization ID
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', 'vibeqa-support')
          .single();

        if (org) {
          // Add user as owner
          await supabase.from('organization_members').upsert({
            organization_id: org.id,
            user_id: userId,
            role: 'owner'
          }, {
            onConflict: 'organization_id,user_id'
          });

          // Create internal testing project
          await supabase.from('projects').upsert({
            organization_id: org.id,
            name: 'Internal Testing',
            slug: 'internal-testing',
            description: 'Project for internal testing and support purposes',
            settings: {
              allow_anonymous_feedback: true,
              require_email: false
            },
            is_active: true
          }, {
            onConflict: 'organization_id,slug'
          });

          console.log('✅ Organization and permissions set up successfully');
        }
      }
    } else if (!orgError) {
      console.log('✅ Organization created successfully');
    }

    console.log('');
    console.log('=====================================');
    console.log('Setup Complete!');
    console.log('=====================================');
    console.log(`Superadmin Email: ${ADMIN_EMAIL}`);
    if (password) {
      console.log(`Password: ${password}`);
      console.log('');
      console.log('⚠️  IMPORTANT: Save this password securely!');
      console.log('⚠️  This is the only time it will be displayed!');
    }
    console.log('');
    console.log('The superadmin user can now log in at:');
    console.log('- Local: http://localhost:5173/login');
    console.log('- Production: https://app.vibeqa.app/login');
    console.log('');
    console.log('Organization: VibeQA Support (slug: vibeqa-support)');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
createSuperadmin();