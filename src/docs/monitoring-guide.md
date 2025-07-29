# VibeQA Monitoring Guide

## Overview

This guide covers monitoring strategies for the VibeQA platform, including the feedback widget, Edge Functions, database performance, and user analytics.

## Monitoring Stack

### Core Components

- **Supabase Dashboard**: Built-in metrics and logs
- **Edge Function Logs**: Real-time function monitoring
- **Database Metrics**: Query performance and usage
- **Storage Analytics**: Media upload tracking
- **Custom Analytics**: Widget usage and feedback patterns

## Edge Function Monitoring

### Real-time Logs

Monitor function execution in real-time:

```bash
# Tail logs for specific function
supabase functions logs submit-feedback --tail

# View logs with timestamp
supabase functions logs submit-feedback --since 1h

# Filter by error level
supabase functions logs submit-feedback --filter "level=error"
```

### Function Metrics Dashboard

Access via Supabase Dashboard → Functions:

1. **Invocation Count**
   - Total invocations per hour/day
   - Success vs failure rate
   - Geographic distribution

2. **Performance Metrics**
   - Average execution time
   - P95 and P99 latency
   - Memory usage patterns

3. **Error Tracking**
   - Error rate percentage
   - Error types and messages
   - Stack traces for debugging

### Setting Up Alerts

Configure alerts in Supabase Dashboard:

```javascript
// Example alert conditions
{
  "error_rate": {
    "threshold": 5, // 5% error rate
    "duration": "5m",
    "action": "email"
  },
  "latency": {
    "threshold": 3000, // 3 seconds
    "percentile": "p95",
    "action": "slack"
  }
}
```

## Database Monitoring

### Query Performance

Monitor slow queries:

```sql
-- Find slow queries (>100ms)
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Table Statistics

Track table growth and usage:

```sql
-- Table sizes and row counts
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Connection Monitoring

```sql
-- Active connections by state
SELECT
  state,
  COUNT(*) as count,
  MAX(NOW() - state_change) as max_duration
FROM pg_stat_activity
GROUP BY state
ORDER BY count DESC;
```

## Storage Monitoring

### Bucket Usage

Track storage consumption:

```sql
-- Storage usage by bucket
SELECT
  name as bucket_name,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_bytes,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
GROUP BY name
ORDER BY total_bytes DESC;
```

### Upload Patterns

Monitor file upload trends:

```sql
-- Daily upload statistics
SELECT
  DATE(created_at) as upload_date,
  COUNT(*) as uploads,
  SUM((metadata->>'size')::bigint) as bytes_uploaded,
  AVG((metadata->>'size')::bigint) as avg_file_size
FROM storage.objects
WHERE bucket_id = 'feedback-media'
GROUP BY DATE(created_at)
ORDER BY upload_date DESC
LIMIT 30;
```

## Widget Analytics

### Custom Event Tracking

Implement analytics in widget configuration:

```javascript
window.vibeQAConfig = {
  projectKey: 'your-key',
  onOpen: () => {
    // Track widget opens
    gtag('event', 'vibeqa_widget_open', {
      page: window.location.pathname,
    });
  },
  onSuccess: (feedbackId) => {
    // Track successful submissions
    gtag('event', 'vibeqa_feedback_submitted', {
      feedback_id: feedbackId,
      page: window.location.pathname,
    });
  },
  onError: (error) => {
    // Track errors
    gtag('event', 'vibeqa_error', {
      error_message: error.message,
      page: window.location.pathname,
    });
  },
};
```

### Widget Load Performance

Monitor widget loading times:

```javascript
// Add to your site
window.addEventListener('load', () => {
  const widgetScript = document.querySelector('script[src*="widget.js"]');
  if (widgetScript) {
    performance.mark('widget_loaded');
    const measure = performance.measure('widget_load_time', 'navigationStart', 'widget_loaded');

    // Send to analytics
    gtag('event', 'timing_complete', {
      name: 'widget_load',
      value: Math.round(measure.duration),
    });
  }
});
```

## Feedback Analytics

### Feedback Trends

```sql
-- Daily feedback volume
SELECT
  DATE(created_at) as date,
  COUNT(*) as feedback_count,
  COUNT(DISTINCT project_id) as active_projects,
  COUNT(CASE WHEN type = 'bug' THEN 1 END) as bugs,
  COUNT(CASE WHEN type = 'feature' THEN 1 END) as features,
  COUNT(CASE WHEN type = 'improvement' THEN 1 END) as improvements
FROM feedback
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

### Response Time Metrics

```sql
-- Average time to first response
SELECT
  p.name as project_name,
  COUNT(f.id) as total_feedback,
  AVG(
    EXTRACT(EPOCH FROM (fc.created_at - f.created_at))/3600
  )::numeric(10,2) as avg_response_hours
FROM feedback f
JOIN projects p ON f.project_id = p.id
LEFT JOIN feedback_comments fc ON f.id = fc.feedback_id
WHERE fc.is_first_response = true
GROUP BY p.name
ORDER BY total_feedback DESC;
```

### User Engagement

```sql
-- Most active users (by feedback)
SELECT
  reporter_email,
  COUNT(*) as feedback_count,
  COUNT(DISTINCT project_id) as projects_used,
  MAX(created_at) as last_feedback
FROM feedback
WHERE reporter_email IS NOT NULL
GROUP BY reporter_email
ORDER BY feedback_count DESC
LIMIT 50;
```

## Health Checks

### API Health Endpoint

Create a health check function:

```typescript
// supabase/functions/health/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  try {
    // Check database connection
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('projects').select('id').limit(1);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      }
    );
  }
});
```

### Uptime Monitoring

Use external services to monitor availability:

1. **Uptime Robot**
   - Monitor: `https://your-app.com/api/health`
   - Check interval: 5 minutes
   - Alert channels: Email, Slack

2. **Better Uptime**
   - Monitor widget CDN
   - Monitor Edge Functions
   - Status page integration

## Performance Optimization

### Identifying Bottlenecks

1. **Slow Queries**

   ```sql
   -- Enable query logging
   ALTER DATABASE postgres SET log_min_duration_statement = 100;
   ```

2. **Memory Usage**

   ```bash
   # Monitor Edge Function memory
   supabase functions logs submit-feedback | grep "Memory"
   ```

3. **Cache Hit Rates**
   ```sql
   -- Check cache effectiveness
   SELECT
     sum(heap_blks_read) as heap_read,
     sum(heap_blks_hit) as heap_hit,
     sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
   FROM pg_statio_user_tables;
   ```

## Dashboards & Reporting

### Key Metrics Dashboard

Create a monitoring dashboard with:

1. **System Health**
   - API uptime percentage
   - Edge Function success rate
   - Database connection count
   - Storage usage percentage

2. **Business Metrics**
   - Daily active projects
   - Feedback submission rate
   - User engagement metrics
   - Feature adoption rates

3. **Performance Metrics**
   - API response times
   - Widget load times
   - Database query performance
   - CDN cache hit rates

### Weekly Reports

Generate automated reports:

```sql
-- Weekly summary query
WITH weekly_stats AS (
  SELECT
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as feedback_count,
    COUNT(DISTINCT project_id) as active_projects,
    COUNT(DISTINCT organization_id) as active_orgs
  FROM feedback
  WHERE created_at > NOW() - INTERVAL '4 weeks'
  GROUP BY week
)
SELECT
  week,
  feedback_count,
  active_projects,
  active_orgs,
  feedback_count - LAG(feedback_count) OVER (ORDER BY week) as feedback_growth,
  ROUND(
    100.0 * (feedback_count - LAG(feedback_count) OVER (ORDER BY week)) /
    LAG(feedback_count) OVER (ORDER BY week),
    2
  ) as growth_percentage
FROM weekly_stats
ORDER BY week DESC;
```

## Incident Response

### Monitoring Alerts

Set up alerts for critical issues:

1. **High Error Rate**: >5% failures
2. **Slow Response**: >3s p95 latency
3. **Storage Full**: >90% capacity
4. **Database Connections**: >80% of max

### Response Procedures

1. **Acknowledge Alert**: Within 15 minutes
2. **Initial Assessment**: Check dashboards
3. **Diagnose Issue**: Review logs and metrics
4. **Implement Fix**: Deploy hotfix if needed
5. **Post-Mortem**: Document and prevent recurrence

## Cost Monitoring

### Track Usage Costs

Monitor Supabase usage:

1. **Database Size**: Stay within tier limits
2. **Bandwidth**: Monitor CDN usage
3. **Function Invocations**: Track monthly calls
4. **Storage**: Monitor media uploads

### Optimization Tips

1. **Enable RLS**: Reduce unnecessary data transfer
2. **Optimize Queries**: Use indexes effectively
3. **Compress Media**: Reduce storage costs
4. **Cache Responses**: Minimize function calls

## Tools & Resources

### Recommended Tools

1. **Monitoring**
   - Datadog (comprehensive monitoring)
   - New Relic (APM)
   - Sentry (error tracking)

2. **Analytics**
   - Google Analytics 4
   - Mixpanel (product analytics)
   - PostHog (open source)

3. **Alerting**
   - PagerDuty
   - Opsgenie
   - Slack webhooks

### Documentation

- Supabase Monitoring: https://supabase.com/docs/guides/platform/monitoring
- PostgreSQL Stats: https://www.postgresql.org/docs/current/monitoring-stats.html
- Deno Deploy Metrics: https://deno.com/deploy/docs/metrics
