export const ACTIVITY_ACTIONS = {
  STATUS_CHANGED: 'status_changed',
  ASSIGNMENT_CHANGED: 'assignment_changed',
  PRIORITY_CHANGED: 'priority_changed',
  COMMENT_ADDED: 'comment_added',
  RESOLVED: 'resolved',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export const FEEDBACK_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
} as const;

export type FeedbackStatusType = (typeof FEEDBACK_STATUS)[keyof typeof FEEDBACK_STATUS];

export const FEEDBACK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type FeedbackPriorityType = (typeof FEEDBACK_PRIORITY)[keyof typeof FEEDBACK_PRIORITY];
