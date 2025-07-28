import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyEmailTables() {
  console.log('🔍 Verifying email system database tables...\n');

  try {
    // Check email_queue table
    console.log('📧 Checking email_queue table:');
    const { data: queueData, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .limit(1);

    if (queueError) {
      console.error('❌ email_queue table error:', queueError.message);
    } else {
      console.log('✅ email_queue table exists');
      
      // Get count of emails in queue
      const { count } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true });
      
      console.log(`   Total emails in queue: ${count || 0}`);
    }

    // Check email_templates table
    console.log('\n📝 Checking email_templates table:');
    const { data: templatesData, error: templatesError } = await supabase
      .from('email_templates')
      .select('name, subject, is_active');

    if (templatesError) {
      console.error('❌ email_templates table error:', templatesError.message);
    } else {
      console.log('✅ email_templates table exists');
      console.log('   Available templates:');
      templatesData?.forEach(template => {
        console.log(`   - ${template.name}: "${template.subject}" (${template.is_active ? 'active' : 'inactive'})`);
      });
    }

    // Check organization_members email_notifications column
    console.log('\n👥 Checking organization_members email preferences:');
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('email_notifications')
      .limit(1);

    if (memberError) {
      console.error('❌ organization_members check error:', memberError.message);
    } else if (memberData && memberData.length > 0 && 'email_notifications' in memberData[0]) {
      console.log('✅ email_notifications column exists in organization_members');
    } else {
      console.log('⚠️  email_notifications column might be missing');
    }

    // Check recent email activity
    console.log('\n📊 Email Queue Status:');
    const { data: statusData, error: statusError } = await supabase
      .from('email_queue')
      .select('status, count:id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!statusError && statusData) {
      const statusCounts: Record<string, number> = {};
      statusData.forEach(row => {
        statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} emails`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run verification
verifyEmailTables().then(() => {
  console.log('\n✨ Email system database verification complete!');
  process.exit(0);
});