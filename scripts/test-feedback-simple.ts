#!/usr/bin/env tsx

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oussjxzwtxlanuxtgmtt.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/submit-feedback`;
const PROJECT_KEY = 'proj_test123456789';

async function testSimpleFeedback() {
  console.log('🧪 Testing Simple Feedback Submission...\n');

  const feedbackData = {
    type: 'bug',
    title: 'Simple Test',
    description: 'This is a simple test without media.',
    reporterEmail: 'test@example.com',
    reporterName: 'Test User',
    pageUrl: 'https://test.example.com/simple',
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
  };

  try {
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
      return;
    }

    console.log('✅ Feedback submitted successfully!');
    console.log('Response:', JSON.stringify(responseData, null, 2));
    console.log(`\n📝 Feedback ID: ${responseData.id}`);

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
  }
}

// Run test
testSimpleFeedback();