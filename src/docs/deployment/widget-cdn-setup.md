# Widget CDN Distribution Setup

This guide covers setting up CDN distribution for the VibeQA feedback widget using Supabase Storage.

## Overview

The widget is distributed through Supabase Storage, leveraging the same infrastructure as the rest of the application. This provides a unified deployment approach with built-in CDN capabilities.

## Build Process

```bash
# Build the production widget bundle
npm run build:widget
```

This creates:

- `dist-widget/widget.js` - Minified production bundle (247.80 kB, 58.55 kB gzipped)
- `dist-widget/widget-demo.html` - Demo page for testing

## Supabase Storage Distribution

### Storage Structure

The widget is stored in the `widget-assets` public bucket with the following structure:

```
widget-assets/
├── v1.0.0/widget.js        # Immutable versioned releases
├── v1.0.1/widget.js
├── production/widget.js    # Production channel (latest stable)
├── staging/widget.js       # Staging channel (pre-release)
├── beta/widget.js          # Beta channel (experimental)
└── latest/widget.js        # Always points to latest production
```

### Deployment Process

1. **Set Environment Variables:**

```bash
export SUPABASE_PROJECT_ID=your-project-id
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. **Deploy to Supabase Storage:**

```bash
# Deploy to production (default)
./scripts/deploy-widget-supabase.sh

# Deploy to staging
./scripts/deploy-widget-supabase.sh staging

# Deploy to beta
./scripts/deploy-widget-supabase.sh beta
```

### Database Setup

Run the migration to create the storage bucket and version tracking:

```bash
supabase db push
```

This creates:

- `widget-assets` storage bucket (public)
- `widget_versions` table for version tracking
- Appropriate RLS policies

## Widget URLs

### Direct Storage URLs

```
# Latest production version
https://[project-id].supabase.co/storage/v1/object/public/widget-assets/production/widget.js

# Specific version (immutable)
https://[project-id].supabase.co/storage/v1/object/public/widget-assets/v1.0.0/widget.js

# Staging/Beta channels
https://[project-id].supabase.co/storage/v1/object/public/widget-assets/staging/widget.js
https://[project-id].supabase.co/storage/v1/object/public/widget-assets/beta/widget.js
```

### Edge Function URLs (Optimized)

```
# Via Edge Function (adds compression, caching headers)
https://[project-id].supabase.co/functions/v1/serve-widget/production
https://[project-id].supabase.co/functions/v1/serve-widget/v1.0.0
https://[project-id].supabase.co/functions/v1/serve-widget/latest
```

## Versioning Strategy

The deployment script automatically handles versioning:

- **Versioned releases** (`v1.0.0`): Immutable, cached forever
- **Channel releases** (`production`, `staging`, `beta`): Updated with each deployment
- **Latest pointer**: Always points to the current production version

## Cache Strategy

- **Versioned files**: `Cache-Control: public, max-age=31536000, immutable`
- **Channel files**: `Cache-Control: public, max-age=300`
- **Edge Function**: Additional edge caching for performance

## Integration Testing

After deployment, test the widget:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Widget Test</title>
  </head>
  <body>
    <h1>VibeQA Widget Test</h1>

    <!-- Production Widget via Storage -->
    <script
      src="https://[project-id].supabase.co/storage/v1/object/public/widget-assets/production/widget.js"
      data-project-key="your-project-key"
      data-api-url="https://[project-id].supabase.co/functions/v1"
      async
    ></script>

    <!-- Or via Edge Function (optimized) -->
    <script
      src="https://[project-id].supabase.co/functions/v1/serve-widget/production"
      data-project-key="your-project-key"
      data-api-url="https://[project-id].supabase.co/functions/v1"
      async
    ></script>
  </body>
</html>
```

## Monitoring

Monitor widget distribution through:

- Supabase Dashboard → Storage → widget-assets bucket
- Edge Function logs for serve-widget
- Database widget_versions table for deployment history

## Security

1. **Storage Policies**: Only service role can upload
2. **Public Read Access**: Widget files are publicly accessible
3. **Version Immutability**: Versioned files cannot be overwritten
4. **CORS Headers**: Automatically configured for cross-origin access

## Rollback Strategy

To rollback to a previous version:

```bash
# Deploy a specific version to production channel
./scripts/deploy-widget-supabase.sh production
# Then manually update the production/widget.js to point to previous version
```

## Custom Domain Setup (Optional)

For a cleaner URL, you can set up a custom domain:

1. Add a CNAME record: `cdn.vibe.qa → [project-id].supabase.co`
2. Configure custom domain in Supabase Dashboard
3. Update widget URLs to use custom domain

## Next Steps

1. Run the storage migration: `supabase db push`
2. Deploy the edge function: `supabase functions deploy serve-widget`
3. Set environment variables for deployment script
4. Deploy your first widget version
5. Update project embed codes to use new URLs
