#!/usr/bin/env tsx

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oussjxzwtxlanuxtgmtt.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/submit-feedback`;
const PROJECT_KEY = 'proj_test123456789';

async function testFeedbackSubmission() {
  console.log('🧪 Testing Feedback Submission...\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Project Key: ${PROJECT_KEY}\n`);

  const feedbackData = {
    type: 'bug',
    title: 'Test Feedback Submission',
    description: 'This is a test feedback submission from the test script.',
    reporterEmail: 'test@example.com',
    reporterName: 'Test User',
    pageUrl: 'https://test.example.com/page',
    userAgent: 'Test Script/1.0',
    browserInfo: {
      browser: 'Node.js',
      version: process.version,
      os: process.platform,
    },
    deviceInfo: {
      type: 'desktop',
      os: process.platform,
      screenResolution: '1920x1080',
    },
    customData: {
      source: 'test-script',
      timestamp: new Date().toISOString(),
    },
  };

  try {
    console.log('📤 Sending feedback...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Key': PROJECT_KEY,
        'Origin': 'http://localhost:5173',
      },
      body: JSON.stringify(feedbackData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Submission failed:', response.status, response.statusText);
      console.error('Error:', responseData);
      process.exit(1);
    }

    console.log('✅ Feedback submitted successfully!');
    console.log('Response:', JSON.stringify(responseData, null, 2));

    if (responseData.id) {
      console.log(`\n📝 Feedback ID: ${responseData.id}`);
      console.log(`View in dashboard: ${SUPABASE_URL.replace('54321', '5173')}/dashboard/feedback/${responseData.id}`);
    }

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    process.exit(1);
  }
}

async function testWithMedia() {
  console.log('\n🖼️ Testing with media attachment...\n');

  const FormData = (await import('form-data')).default;
  const formData = new FormData();

  // Add feedback data
  const feedbackData = {
    type: 'bug',
    title: 'Test with Screenshot',
    description: 'This feedback includes a test screenshot.',
    reporterEmail: 'test@example.com',
    reporterName: 'Test User',
    pageUrl: 'https://test.example.com/screenshot-test',
    userAgent: 'Test Script/1.0',
    browserInfo: {
      browser: 'Node.js',
      version: process.version,
      os: process.platform,
    },
    deviceInfo: {
      type: 'desktop',
      os: process.platform,
      screenResolution: '1920x1080',
    },
    customData: {
      source: 'test-script-media',
      timestamp: new Date().toISOString(),
    },
  };

  formData.append('data', JSON.stringify(feedbackData));

  // Create a dummy image file
  const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  formData.append('screenshot-0', imageBuffer, {
    filename: 'test-screenshot.png',
    contentType: 'image/png',
  });

  try {
    console.log('📤 Sending feedback with media...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'X-Project-Key': PROJECT_KEY,
        'Origin': 'http://localhost:5173',
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Submission failed:', response.status, response.statusText);
      console.error('Error:', responseData);
      return;
    }

    console.log('✅ Feedback with media submitted successfully!');
    console.log('Response:', JSON.stringify(responseData, null, 2));

  } catch (error) {
    console.error('❌ Error submitting feedback with media:', error);
  }
}

// Run tests
(async () => {
  await testFeedbackSubmission();
  await testWithMedia();
  
  console.log('\n✨ All tests completed!');
})();