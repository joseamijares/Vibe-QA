import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../src/lib/email.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
const TEST_EMAIL = process.argv[2] || 'test@example.com';
const ORGANIZATION_NAME = 'Test Organization';
const INVITER_NAME = 'Test Admin';

async function testEmailInvitation() {
  console.log('🚀 Testing Email Invitation System\n');
  console.log(`📧 Sending test invitation to: ${TEST_EMAIL}`);
  console.log('====================================\n');

  try {
    // Create a test invitation ID
    const invitationId = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now

    console.log('📤 Calling EmailService.sendInvitationEmail()...');
    
    const result = await EmailService.sendInvitationEmail({
      invitationId,
      email: TEST_EMAIL,
      organizationName: ORGANIZATION_NAME,
      inviterName: INVITER_NAME,
      recipientName: TEST_EMAIL.split('@')[0],
      role: 'member',
      expiryDate: expiryDate.toISOString(),
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Response:', JSON.stringify(result.data, null, 2));
      
      // Check email queue status
      console.log('\n📊 Checking email queue status...');
      const queueStatus = await EmailService.getEmailQueueStatus(TEST_EMAIL);
      
      if (queueStatus && queueStatus.length > 0) {
        console.log('📋 Recent emails for this address:');
        queueStatus.forEach((email, index) => {
          console.log(`\n${index + 1}. Email ID: ${email.id}`);
          console.log(`   Status: ${email.status}`);
          console.log(`   Template: ${email.template}`);
          console.log(`   Created: ${new Date(email.created_at).toLocaleString()}`);
          if (email.sent_at) {
            console.log(`   Sent: ${new Date(email.sent_at).toLocaleString()}`);
          }
          if (email.error) {
            console.log(`   Error: ${email.error}`);
          }
        });
      }
    } else {
      console.error('❌ Failed to send email:', result.error);
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }

  console.log('\n====================================');
  console.log('📝 Next Steps:');
  console.log('1. Check your email inbox (and spam folder)');
  console.log('2. Verify the email content and formatting');
  console.log('3. Click the invitation link to test it works');
  console.log('4. Check Brevo dashboard for delivery status');
  console.log('\nIf the email was not received:');
  console.log('- Run: npm run verify-email-tables');
  console.log('- Check Supabase Edge Function logs');
  console.log('- Verify BREVO_API_KEY is set correctly');
}

// Run the test
testEmailInvitation().then(() => {
  console.log('\n✨ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});