export interface VibeQAWidgetConfig {
  projectKey: string;
  apiUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  triggerType?: 'button' | 'custom' | 'both';
  buttonText?: string;
  zIndex?: number;
  debug?: boolean;
  metadata?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
  onSuccess?: (feedbackId: string) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error: string | null;
  feedbackType: 'bug' | 'suggestion' | 'praise' | 'other';
  currentStep: 'type' | 'details' | 'media' | 'success';
  attachments?: MediaAttachment[];
}

export interface MediaAttachment {
  type: 'screenshot' | 'voice' | 'video';
  blob: Blob;
  filename: string;
  size: number;
  duration?: number;
  thumbnail?: string;
}

export interface FeedbackSubmission {
  projectKey: string;
  type: 'bug' | 'suggestion' | 'praise' | 'other';
  title?: string;
  description: string;
  reporterEmail?: string;
  reporterName?: string;
  pageUrl: string;
  userAgent: string;
  browserInfo: {
    browser: string;
    version: string;
    os: string;
  };
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    screenResolution: string;
  };
  customData?: Record<string, any>;
  attachments?: {
    screenshots?: Blob[];
    recordings?: Blob[];
  };
}

export interface WidgetAPI {
  open: () => void;
  close: () => void;
  toggle: () => void;
  submit: (feedback: Partial<FeedbackSubmission>) => Promise<void>;
  destroy: () => void;
  updateConfig: (config: Partial<VibeQAWidgetConfig>) => void;
}

export type FeedbackType = 'bug' | 'suggestion' | 'praise' | 'other';
