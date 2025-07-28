import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDatabaseSchema() {
  console.log('Checking database schema...\n');

  try {
    // Check if tables exist
    const tables = [
      'organizations',
      'organization_members',
      'projects',
      'feedback',
      'feedback_media',
      'comments',
      'activity_logs',
      'invitations',
      'email_queue',
      'email_templates'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ Table '${table}' - Error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    // Check for the superadmin user's organization
    console.log('\nChecking superadmin setup...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'vibeqa-support')
      .single();

    if (orgData) {
      console.log('✅ VibeQA Support organization exists');
      
      // Check membership
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgData.id);
        
      console.log(`   Members in organization: ${memberData?.length || 0}`);
    } else {
      console.log('❌ VibeQA Support organization not found');
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkDatabaseSchema();