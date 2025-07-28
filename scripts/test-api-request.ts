import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function testApiRequest() {
  console.log('Testing Supabase API request...\n');

  // Test with fetch directly
  const url = `${supabaseUrl}/rest/v1/organization_members?select=*&user_id=eq.3240face-781f-4530-9d97-0d30c16eafba`;
  
  console.log('Request URL:', url);
  console.log('Using anon key:', anonKey.substring(0, 20) + '...');
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Profile': 'public',
        'Content-Profile': 'public'
      }
    });

    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success! Data:', data);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testApiRequest();