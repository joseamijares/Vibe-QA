import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ActivityLog {
  id: string;
  feedbackId: string;
  userId: string | null;
  action: string;
  details: any;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    rawUserMetaData?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

const ACTIVITY_LOG_LIMIT = 50;

export function useActivityLogs(feedbackId: string) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!feedbackId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    let subscription: any;

    async function fetchActivities() {
      try {
        setError(null);

        // Fetch activity logs with limit
        const {
          data: logsData,
          error: logsError,
          count,
        } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact' })
          .eq('feedback_id', feedbackId)
          .order('created_at', { ascending: false })
          .limit(ACTIVITY_LOG_LIMIT);

        if (logsError) throw logsError;

        // Check if there are more activities
        setHasMore((count || 0) > ACTIVITY_LOG_LIMIT);

        if (!logsData || logsData.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }

        // Get unique user IDs
        const userIds = [...new Set(logsData.map((log) => log.user_id).filter(Boolean))];

        // Fetch user information from profiles table
        let userMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .in('id', userIds);

          if (!profileError && profileData) {
            userMap = profileData.reduce(
              (acc, profile) => {
                acc[profile.id] = {
                  id: profile.id,
                  email: profile.email || '',
                  rawUserMetaData: {
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                  },
                };
                return acc;
              },
              {} as Record<string, any>
            );
          }
        }

        // Map activities with user information
        const activitiesWithUsers = logsData.map((log) => ({
          id: log.id,
          feedbackId: log.feedback_id,
          userId: log.user_id,
          action: log.action,
          details: log.details,
          createdAt: log.created_at,
          user: log.user_id ? userMap[log.user_id] : undefined,
        }));

        setActivities(activitiesWithUsers);
      } catch (err) {
        console.error('Error fetching activity logs:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();

    // Subscribe to new activity logs with error handling
    subscription = supabase
      .channel(`activity-logs-${feedbackId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `feedback_id=eq.${feedbackId}`,
        },
        (payload) => {
          // Only fetch if we're showing recent activities
          if (!hasMore) {
            fetchActivities();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Activity log subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Activity log subscription error');
          setError(new Error('Failed to subscribe to activity updates'));
        }
      });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [feedbackId]);

  return { activities, loading, error, hasMore };
}
