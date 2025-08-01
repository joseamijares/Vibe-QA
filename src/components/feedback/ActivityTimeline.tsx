import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  MessageSquare,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { ActivityLog } from '@/hooks/useActivityLogs';
import { ACTIVITY_ACTIONS, FEEDBACK_PRIORITY } from '@/constants/activity';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading?: boolean;
}

const actionConfig: Record<
  string,
  { icon: React.ComponentType<any>; color: string; bgColor: string; label: string }
> = {
  [ACTIVITY_ACTIONS.STATUS_CHANGED]: {
    icon: Activity,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Status changed',
  },
  [ACTIVITY_ACTIONS.ASSIGNMENT_CHANGED]: {
    icon: User,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    label: 'Assignment changed',
  },
  [ACTIVITY_ACTIONS.PRIORITY_CHANGED]: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Priority changed',
  },
  [ACTIVITY_ACTIONS.COMMENT_ADDED]: {
    icon: MessageSquare,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Comment added',
  },
  [ACTIVITY_ACTIONS.RESOLVED]: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    label: 'Resolved',
  },
};

const priorityConfig: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  [FEEDBACK_PRIORITY.LOW]: { icon: ArrowDownRight, color: 'text-gray-400' },
  [FEEDBACK_PRIORITY.MEDIUM]: { icon: ArrowUpRight, color: 'text-yellow-400' },
  [FEEDBACK_PRIORITY.HIGH]: { icon: ArrowUpRight, color: 'text-orange-400' },
  [FEEDBACK_PRIORITY.CRITICAL]: { icon: ArrowUpRight, color: 'text-red-400' },
};

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-white/10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400 opacity-50" />
        <p className="text-sm text-gray-400">No activity yet</p>
      </div>
    );
  }

  const formatActivityMessage = (activity: ActivityLog): string => {
    const userName = activity.user?.email || 'System';

    switch (activity.action) {
      case ACTIVITY_ACTIONS.STATUS_CHANGED:
        return `${userName} changed status from ${activity.details.old_status} to ${activity.details.new_status}`;
      case ACTIVITY_ACTIONS.ASSIGNMENT_CHANGED:
        if (activity.details.new_assignee) {
          return `${userName} assigned this to ${activity.details.new_assignee}`;
        } else {
          return `${userName} unassigned this`;
        }
      case ACTIVITY_ACTIONS.PRIORITY_CHANGED:
        return `${userName} changed priority from ${activity.details.old_priority} to ${activity.details.new_priority}`;
      case ACTIVITY_ACTIONS.COMMENT_ADDED:
        return `${userName} added a comment`;
      case ACTIVITY_ACTIONS.RESOLVED:
        const hours = Math.round(activity.details.resolution_time_hours);
        return `${userName} resolved this after ${hours} hours`;
      default:
        return `${userName} performed ${activity.action}`;
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-8 bottom-0 w-px bg-white/10" />

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const config = actionConfig[activity.action] || {
            icon: Activity,
            color: 'text-gray-400',
            bgColor: 'bg-gray-500/20',
            label: activity.action,
          };
          const Icon = config.icon;

          return (
            <div key={activity.id} className="relative flex gap-3">
              {/* Icon with background */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor} backdrop-blur-sm border border-white/10 ${
                  index === 0 ? 'shadow-lg shadow-black/20' : ''
                }`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <p className="text-sm text-gray-200">{formatActivityMessage(activity)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activity.createdAt
                    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
                    : 'Unknown time'}
                </p>

                {/* Additional details for specific actions */}
                {activity.action === ACTIVITY_ACTIONS.PRIORITY_CHANGED && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      {priorityConfig[activity.details.old_priority] &&
                        (() => {
                          const OldIcon = priorityConfig[activity.details.old_priority].icon;
                          return (
                            <>
                              <OldIcon
                                className={`h-3 w-3 ${
                                  priorityConfig[activity.details.old_priority].color
                                }`}
                              />
                              <span className="text-xs text-gray-400">
                                {activity.details.old_priority}
                              </span>
                            </>
                          );
                        })()}
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                    <div className="flex items-center gap-1">
                      {priorityConfig[activity.details.new_priority] &&
                        (() => {
                          const NewIcon = priorityConfig[activity.details.new_priority].icon;
                          return (
                            <>
                              <NewIcon
                                className={`h-3 w-3 ${
                                  priorityConfig[activity.details.new_priority].color
                                }`}
                              />
                              <span className="text-xs font-medium text-white">
                                {activity.details.new_priority}
                              </span>
                            </>
                          );
                        })()}
                    </div>
                  </div>
                )}

                {activity.action === ACTIVITY_ACTIONS.STATUS_CHANGED && (
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        activity.details.old_status === 'new'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : activity.details.old_status === 'in_progress'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : activity.details.old_status === 'resolved'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}
                    >
                      {activity.details.old_status}
                    </span>
                    <span className="text-xs text-gray-400">→</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        activity.details.new_status === 'new'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : activity.details.new_status === 'in_progress'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : activity.details.new_status === 'resolved'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}
                    >
                      {activity.details.new_status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
