import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('=====================================');
console.log('Supabase Key Configuration Check');
console.log('=====================================');
console.log('');

// Check for Supabase keys
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Current Configuration:');
console.log('---------------------');
console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${anonKey ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Set' : '❌ Not set'}`);

console.log('\n');
console.log('Key Identification Guide:');
console.log('------------------------');
console.log('In your Supabase Dashboard (https://app.supabase.com):');
console.log('');
console.log('1. Go to your project');
console.log('2. Click "Settings" (gear icon) in the sidebar');
console.log('3. Click "API" in the settings menu');
console.log('');
console.log('You should see a section called "Project API keys" with:');
console.log('');
console.log('• anon public: This is your VITE_SUPABASE_ANON_KEY');
console.log('  - Safe to use in frontend code');
console.log('  - Has limited permissions based on RLS policies');
console.log('');
console.log('• service_role secret: This is your SUPABASE_SERVICE_ROLE_KEY');
console.log('  - NEVER expose this in frontend code');
console.log('  - Has full admin access to your database');
console.log('  - Needed for admin operations like creating users');
console.log('');
console.log('Note: If you see different key names or "legacy" labels,');
console.log('you might be looking at a different section or service.');
console.log('Make sure you\'re in the Supabase project settings, not Stripe or another service.');
console.log('');

// Test if the keys look valid
if (serviceRoleKey) {
    console.log('Service Role Key Validation:');
    console.log('---------------------------');
    
    // Basic validation
    if (serviceRoleKey.includes('your_') || serviceRoleKey.length < 30) {
        console.log('❌ Service role key appears to be a placeholder');
    } else if (serviceRoleKey.startsWith('eyJ')) {
        console.log('✅ Service role key appears to be a valid JWT token');
    } else {
        console.log('⚠️  Service role key format is unexpected');
        console.log('   Make sure you copied the entire key');
    }
}

console.log('\n');
console.log('Next Steps:');
console.log('-----------');
if (!serviceRoleKey || serviceRoleKey.includes('your_')) {
    console.log('1. Copy the service_role key from your Supabase dashboard');
    console.log('2. Add it to your .env.local file:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=<paste-key-here>');
    console.log('3. Run ./scripts/create-superadmin-auto.sh');
} else {
    console.log('✅ Your configuration looks good!');
    console.log('   You can now run: ./scripts/create-superadmin-auto.sh');
}