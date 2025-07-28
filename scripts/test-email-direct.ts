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

// Test configuration
const TEST_EMAIL = process.argv[2] || 'test@example.com';

async function testDirectEmailInvocation() {
  console.log('🚀 Testing Email System - Direct Edge Function Call\n');
  console.log(`📧 Sending test invitation to: ${TEST_EMAIL}`);
  console.log('====================================\n');

  try {
    const invitationId = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    console.log('📤 Invoking Edge Function directly...');
    
    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        invitationId,
        email: TEST_EMAIL,
        organizationName: 'Test Organization',
        inviterName: 'Test Admin',
        recipientName: TEST_EMAIL.split('@')[0],
        role: 'member',
        expiryDate: expiryDate.toISOString(),
      },
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      
      if (error.message.includes('not found')) {
        console.log('\n⚠️  Edge Function not found. Please deploy it first:');
        console.log('   supabase functions deploy send-invitation-email');
      } else if (error.message.includes('BREVO_API_KEY')) {
        console.log('\n⚠️  BREVO_API_KEY not configured. Set it with:');
        console.log('   supabase secrets set BREVO_API_KEY=your-key');
      }
    } else {
      console.log('✅ Edge Function called successfully!');
      console.log('📬 Response:', JSON.stringify(data, null, 2));
      
      // Check email queue
      console.log('\n📊 Checking email queue...');
      const { data: queueData, error: queueError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('to_email', TEST_EMAIL)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!queueError && queueData) {
        console.log(`Found ${queueData.length} email(s) in queue for ${TEST_EMAIL}:`);
        queueData.forEach((email, index) => {
          console.log(`\n${index + 1}. Status: ${email.status}`);
          console.log(`   Created: ${new Date(email.created_at).toLocaleString()}`);
          if (email.error) {
            console.log(`   Error: ${email.error}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n====================================');
  console.log('📝 Next Steps:');
  console.log('1. If successful, check your email (including spam)');
  console.log('2. If failed, check the error message above');
  console.log('3. View Edge Function logs:');
  console.log('   supabase functions logs send-invitation-email');
}

// Run the test
testDirectEmailInvocation().then(() => {
  console.log('\n✨ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});