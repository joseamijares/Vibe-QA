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

async function seedFeedback() {
  console.log('🌱 Seeding feedback data...\n');

  try {
    // Get the first organization
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (orgError || !orgs || orgs.length === 0) {
      console.error('❌ No organizations found. Please create an organization first.');
      return;
    }

    const org = orgs[0];
    console.log(`📋 Using organization: ${org.name}`);

    // Get projects for this organization
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', org.id);

    if (projectError || !projects || projects.length === 0) {
      console.error('❌ No projects found. Please create a project first.');
      return;
    }

    console.log(`📂 Found ${projects.length} project(s)`);

    // Sample feedback data
    const feedbackSamples = [
      {
        type: 'bug',
        status: 'new',
        priority: 'high',
        title: 'Login button not working on mobile',
        description: 'When I try to tap the login button on my iPhone, nothing happens. The button seems to be unresponsive. This is happening on Safari browser.',
        reporter_name: 'Sarah Johnson',
        reporter_email: 'sarah.j@example.com',
        page_url: 'https://app.example.com/login',
        browser_info: { browser: 'Safari', version: '15.0', os: 'iOS' },
        device_info: { type: 'mobile', os: 'iOS 15.0', model: 'iPhone 13' },
      },
      {
        type: 'suggestion',
        status: 'in_progress',
        priority: 'medium',
        title: 'Add dark mode support',
        description: 'It would be great to have a dark mode option for the application. Many users prefer dark themes, especially when working late at night.',
        reporter_name: 'Mike Chen',
        reporter_email: 'mike.c@example.com',
        page_url: 'https://app.example.com/settings',
        browser_info: { browser: 'Chrome', version: '120.0', os: 'Windows' },
        device_info: { type: 'desktop', os: 'Windows 11', resolution: '1920x1080' },
      },
      {
        type: 'praise',
        status: 'resolved',
        priority: 'low',
        title: 'Great user experience!',
        description: 'Just wanted to say that the new dashboard design is fantastic! It\'s much easier to navigate and find what I need. Keep up the great work!',
        reporter_name: 'Emily Davis',
        reporter_email: 'emily.d@example.com',
        page_url: 'https://app.example.com/dashboard',
        browser_info: { browser: 'Firefox', version: '121.0', os: 'macOS' },
        device_info: { type: 'desktop', os: 'macOS 14.0', model: 'MacBook Pro' },
      },
      {
        type: 'bug',
        status: 'new',
        priority: 'critical',
        title: 'Data loss when saving form',
        description: 'When I fill out the project creation form and click save, all my data disappears and nothing is saved. This is a critical issue affecting our workflow.',
        reporter_name: 'John Smith',
        reporter_email: 'john.s@example.com',
        page_url: 'https://app.example.com/projects/new',
        browser_info: { browser: 'Edge', version: '120.0', os: 'Windows' },
        device_info: { type: 'desktop', os: 'Windows 10', resolution: '2560x1440' },
      },
      {
        type: 'suggestion',
        status: 'new',
        priority: 'low',
        title: 'Keyboard shortcuts',
        description: 'Would love to see keyboard shortcuts for common actions like creating new projects (Cmd+N) and searching (Cmd+K).',
        reporter_name: 'Alex Rivera',
        reporter_email: 'alex.r@example.com',
        page_url: 'https://app.example.com',
        browser_info: { browser: 'Chrome', version: '120.0', os: 'macOS' },
        device_info: { type: 'desktop', os: 'macOS 14.0', model: 'MacBook Air' },
      },
    ];

    // Insert feedback for each project
    for (const project of projects) {
      console.log(`\n📝 Adding feedback for project: ${project.name}`);
      
      for (const feedbackData of feedbackSamples) {
        const { data, error } = await supabase
          .from('feedback')
          .insert({
            project_id: project.id,
            ...feedbackData,
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating feedback: ${error.message}`);
        } else {
          console.log(`✅ Created ${feedbackData.type} feedback: "${feedbackData.title}"`);

          // Add some media attachments for bug reports
          if (feedbackData.type === 'bug' && data) {
            const { error: mediaError } = await supabase
              .from('feedback_media')
              .insert({
                feedback_id: data.id,
                type: 'screenshot',
                url: `https://placeholder.com/screenshot-${data.id}.png`,
                thumbnail_url: `https://placeholder.com/screenshot-${data.id}-thumb.png`,
                file_size: 245678,
              });

            if (!mediaError) {
              console.log(`  📷 Added screenshot attachment`);
            }
          }
        }
      }
    }

    console.log('\n✨ Feedback seeding complete!');
    console.log('🚀 You can now view the feedback in your dashboard.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the seed function
seedFeedback().then(() => {
  process.exit(0);
});