import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('=====================================');
console.log('Supabase Connection Debugger');
console.log('=====================================');
console.log('');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
console.log(`Project Reference: ${projectRef || 'Could not extract'}`);
console.log(`Project URL: ${supabaseUrl}`);
console.log('');

// Test anon key
console.log('Testing ANON key connection...');
try {
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data, error } = await anonClient.from('organizations').select('count').limit(1);
  
  if (error) {
    console.log(`❌ ANON key test failed: ${error.message}`);
  } else {
    console.log('✅ ANON key is valid and working');
  }
} catch (e) {
  console.log(`❌ ANON key connection error: ${e}`);
}

console.log('');

// Test service role key
console.log('Testing SERVICE ROLE key connection...');
try {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Try to list users (requires service role)
  const { data, error } = await serviceClient.auth.admin.listUsers({
    page: 1,
    perPage: 1
  });
  
  if (error) {
    console.log(`❌ SERVICE ROLE key test failed: ${error.message}`);
    
    // Additional debugging
    if (error.message.includes('Invalid API key')) {
      console.log('');
      console.log('⚠️  The service role key is not valid for this project.');
      console.log('');
      console.log('Common causes:');
      console.log('1. The key is from a different Supabase project');
      console.log('2. The key was not copied completely');
      console.log('3. There are extra spaces or quotes around the key');
      console.log('');
      console.log('To fix this:');
      console.log('1. Go to https://app.supabase.com');
      console.log('2. Select YOUR project (make sure it matches the URL above)');
      console.log('3. Go to Settings → API');
      console.log('4. Copy the ENTIRE "service_role" key (it\'s very long!)');
      console.log('5. Replace the SUPABASE_SERVICE_ROLE_KEY in your .env file');
      console.log('');
      console.log('Make sure:');
      console.log('- You\'re copying from the right project');
      console.log('- You copy the complete key (use the copy button)');
      console.log('- There are no quotes around the key in .env');
    }
  } else {
    console.log('✅ SERVICE ROLE key is valid and working');
    console.log(`   Found ${data.users.length} users in the system`);
  }
} catch (e) {
  console.log(`❌ SERVICE ROLE key connection error: ${e}`);
}

console.log('');
console.log('Key Format Check:');
console.log('-----------------');
console.log(`ANON key starts with: ${anonKey.substring(0, 10)}...`);
console.log(`ANON key length: ${anonKey.length} characters`);
console.log(`SERVICE ROLE key starts with: ${serviceRoleKey.substring(0, 10)}...`);
console.log(`SERVICE ROLE key length: ${serviceRoleKey.length} characters`);

// Decode JWT to check if project ref matches
try {
  const payload = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString());
  console.log('');
  console.log('Service Role Key Details:');
  console.log(`- Project Ref in Key: ${payload.ref}`);
  console.log(`- Role: ${payload.role}`);
  console.log(`- Issued: ${new Date(payload.iat * 1000).toISOString()}`);
  
  if (payload.ref !== projectRef) {
    console.log('');
    console.log('❌ MISMATCH: The service role key is for a different project!');
    console.log(`   Key is for project: ${payload.ref}`);
    console.log(`   But URL is for project: ${projectRef}`);
    console.log('');
    console.log('You need to get the service role key from the correct project.');
  }
} catch (e) {
  console.log('Could not decode service role key');
}