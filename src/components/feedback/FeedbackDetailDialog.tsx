import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bug,
  Lightbulb,
  Heart,
  Circle,
  Link as LinkIcon,
  Send,
  Globe,
  Monitor,
  Download,
  Mic,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Feedback,
  FeedbackMedia,
  FeedbackStatus,
  FeedbackPriority,
  Project,
  Comment,
  OrganizationMember,
} from '@/types/database.types';
import { format, formatDistanceToNow } from 'date-fns';

interface FeedbackWithDetails extends Feedback {
  project: Project;
  media: FeedbackMedia[];
  assigned_user?: {
    id: string;
    email: string;
  };
  comments?: CommentWithUser[];
}

interface CommentWithUser extends Comment {
  user: {
    id: string;
    email: string;
  };
}

interface FeedbackDetailDialogProps {
  feedback: FeedbackWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const feedbackTypeConfig = {
  bug: { icon: Bug, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Bug' },
  suggestion: {
    icon: Lightbulb,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    label: 'Suggestion',
  },
  praise: { icon: Heart, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Praise' },
  other: { icon: Circle, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Other' },
};

const feedbackStatusOptions: { value: FeedbackStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

const feedbackPriorityOptions: { value: FeedbackPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function FeedbackDetailDialog({
  feedback,
  open,
  onOpenChange,
  onUpdate,
}: FeedbackDetailDialogProps) {
  const { session } = useAuth();
  const { organization } = useOrganization();
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [priority, setPriority] = useState<FeedbackPriority>(feedback.priority);
  const [assignedTo, setAssignedTo] = useState<string>(feedback.assigned_to || '');
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [teamMembers, setTeamMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<FeedbackMedia | null>(null);

  const TypeIcon = feedbackTypeConfig[feedback.type].icon;

  useEffect(() => {
    if (open) {
      fetchComments();
      fetchTeamMembers();
    }
  }, [open, feedback.id]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('feedback_id', feedback.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // For now, we'll use user_id as the display name
      // In a real app, you'd have a users table or profile table to join with
      const commentsWithUsers = (commentsData || []).map((comment) => ({
        ...comment,
        user: {
          id: comment.user_id,
          email: `User ${comment.user_id.substring(0, 8)}...`, // Temporary display
        },
      }));

      setComments(commentsWithUsers);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization!.id);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
    }
  };

  const updateFeedback = async () => {
    try {
      setLoading(true);
      const updates: any = {
        status,
        priority,
        assigned_to: assignedTo || null,
      };

      if (status === 'resolved' && feedback.status !== 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = session?.user?.id;
      }

      const { error } = await supabase.from('feedback').update(updates).eq('id', feedback.id);

      if (error) throw error;

      toast.success('Feedback updated successfully');
      onUpdate();
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from('comments').insert({
        feedback_id: feedback.id,
        user_id: session!.user.id,
        content: newComment,
        is_internal: true,
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const downloadMedia = (media: FeedbackMedia) => {
    window.open(media.url, '_blank');
  };

  const getMediaPreview = (media: FeedbackMedia) => {
    if (media.type === 'screenshot') {
      return (
        <img
          src={media.thumbnail_url || media.url}
          alt="Screenshot"
          className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setSelectedMedia(media)}
        />
      );
    }

    return (
      <div
        className="w-full h-32 bg-gray-100 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => setSelectedMedia(media)}
      >
        <Mic className="h-8 w-8 text-gray-500 mb-2" />
        <span className="text-sm text-gray-600">Audio Recording</span>
        {media.duration && <span className="text-xs text-gray-500">{media.duration}s</span>}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${feedbackTypeConfig[feedback.type].bgColor}`}>
                <TypeIcon className={`h-5 w-5 ${feedbackTypeConfig[feedback.type].color}`} />
              </div>
              <span>{feedback.title || `${feedbackTypeConfig[feedback.type].label} Feedback`}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <Label className="text-base font-semibold mb-2">Description</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {feedback.description}
                </p>
              </div>

              {/* Media Attachments */}
              {feedback.media.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-2">Attachments</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {feedback.media.map((media) => (
                      <div key={media.id} className="relative">
                        {getMediaPreview(media)}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => downloadMedia(media)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <Label className="text-base font-semibold mb-2">Comments</Label>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{comment.user.email}</span>
                          <span className="text-xs text-muted-foreground">
                            {comment.created_at
                              ? formatDistanceToNow(new Date(comment.created_at), {
                                  addSuffix: true,
                                })
                              : 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Metadata */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Project</Label>
                  <p className="text-sm font-medium">{feedback.project.name}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Reporter</Label>
                  <p className="text-sm font-medium">
                    {feedback.reporter_name || feedback.reporter_email || 'Anonymous'}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="text-sm font-medium">
                    {feedback.created_at
                      ? format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')
                      : 'Unknown'}
                  </p>
                </div>

                {feedback.page_url && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Page URL</Label>
                    <a
                      href={feedback.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      {new URL(feedback.page_url).pathname}
                    </a>
                  </div>
                )}

                {feedback.browser_info && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Browser</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {(feedback.browser_info as any).browser}{' '}
                      {(feedback.browser_info as any).version}
                    </p>
                  </div>
                )}

                {feedback.device_info && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Device</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {(feedback.device_info as any).type} - {(feedback.device_info as any).os}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as FeedbackStatus)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as FeedbackPriority)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackPriorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignee">Assign To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.user_id || member.id} value={member.user_id || ''}>
                          User {member.user_id ? member.user_id.substring(0, 8) : 'Unknown'}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={updateFeedback} disabled={loading}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Media Preview</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {selectedMedia.type === 'screenshot' ? (
                <img
                  src={selectedMedia.url}
                  alt="Screenshot"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <audio src={selectedMedia.url} controls className="w-full" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
