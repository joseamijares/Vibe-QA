import { useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EmailService } from '@/lib/email';
import { Feedback } from '@/types/database.types';

export function useFeedbackNotifications() {
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization) return;

    // Subscribe to feedback changes for the organization's projects
    const channel = supabase
      .channel(`feedback-notifications-${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback',
          filter: `project_id=in.(${getProjectIds()})`,
        },
        async (payload) => {
          const feedback = payload.new as Feedback;
          await handleNewFeedback(feedback);
        }
      )
      .subscribe();

    async function getProjectIds() {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organization!.id);

      return data?.map((p) => p.id).join(',') || '';
    }

    async function handleNewFeedback(feedback: Feedback) {
      // Show in-app notification
      toast.info('New feedback received!', {
        description: `${feedback.type} feedback: ${feedback.description.substring(0, 50)}...`,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to feedback page or open detail modal
            window.location.href = '/dashboard/feedback';
          },
        },
      });

      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', feedback.project_id)
        .single();

      if (!project) return;

      // Get team members with email notifications enabled
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id, email_notifications')
        .eq('organization_id', organization!.id);

      if (!members) return;

      // Send email notifications to team members who have them enabled
      const notificationPromises = members
        .filter((member) => {
          const prefs = member.email_notifications as any;
          return prefs?.feedback === true;
        })
        .map(async (member) => {
          // Get user email
          const { data: userData } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', member.user_id)
            .single();

          if (!userData?.email) return;

          // Send feedback notification email
          await EmailService.sendFeedbackNotification({
            feedbackId: feedback.id,
            projectId: project.id,
            projectName: project.name,
            feedbackType: feedback.type,
            reporterName: feedback.reporter_name || undefined,
            reporterEmail: feedback.reporter_email || undefined,
            pageUrl: feedback.page_url || undefined,
            description: feedback.description,
          });
        });

      await Promise.all(notificationPromises);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization]);
}

// Hook to use in the Dashboard layout to enable notifications app-wide
export function useFeedbackRealtimeSubscription() {
  useFeedbackNotifications();
}
