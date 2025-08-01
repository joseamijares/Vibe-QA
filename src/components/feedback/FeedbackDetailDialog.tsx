import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ActivityTimeline } from './ActivityTimeline';

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
    rawUserMetaData?: {
      full_name?: string;
      avatar_url?: string;
    };
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
  const [assignedTo, setAssignedTo] = useState<string>(feedback.assigned_to || 'unassigned');
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [teamMembers, setTeamMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<FeedbackMedia | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const { activities, loading: activitiesLoading } = useActivityLogs(feedback.id);

  const TypeIcon = feedbackTypeConfig[feedback.type].icon;

  useEffect(() => {
    if (open) {
      fetchComments();
      fetchTeamMembers();
    }
  }, [open, feedback.id]);

  const fetchComments = async () => {
    try {
      // Fetch comments with user profiles in a single query
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(
          `
          *,
          user:profiles!user_id(
            id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq('feedback_id', feedback.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Map comments with user data
      const commentsWithUsers = (commentsData || []).map((comment) => ({
        ...comment,
        user: comment.user || {
          id: comment.user_id,
          email: `User ${comment.user_id.substring(0, 8)}...`,
          rawUserMetaData: {},
        },
      }));

      setComments(commentsWithUsers);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
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
        assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
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

  const updateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editingCommentContent })
        .eq('id', commentId)
        .eq('user_id', session!.user.id); // Only allow users to edit their own comments

      if (error) throw error;

      setEditingCommentId(null);
      setEditingCommentContent('');
      fetchComments();
      toast.success('Comment updated');
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session!.user.id); // Only allow users to delete their own comments

      if (error) throw error;

      fetchComments();
      toast.success('Comment deleted');
      setDeletingCommentId(null);
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
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

              {/* Comments & Activity */}
              <div>
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as 'comments' | 'activity')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
                    <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="comments" className="mt-4">
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No comments yet
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={comment.user.rawUserMetaData?.avatar_url}
                                alt={comment.user.rawUserMetaData?.full_name || comment.user.email}
                              />
                              <AvatarFallback>
                                {getInitials(
                                  comment.user.rawUserMetaData?.full_name,
                                  comment.user.email
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">
                                    {comment.user.rawUserMetaData?.full_name || comment.user.email}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {comment.created_at
                                        ? formatDistanceToNow(new Date(comment.created_at), {
                                            addSuffix: true,
                                          })
                                        : 'Unknown'}
                                    </span>
                                    {comment.user_id === session?.user?.id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEditingCommentId(comment.id);
                                              setEditingCommentContent(comment.content);
                                            }}
                                          >
                                            <Edit2 className="h-3 w-3 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => setDeletingCommentId(comment.id)}
                                            className="text-destructive"
                                          >
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>
                                {editingCommentId === comment.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editingCommentContent}
                                      onChange={(e) => setEditingCommentContent(e.target.value)}
                                      className="resize-none text-sm"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => updateComment(comment.id)}
                                        disabled={!editingCommentContent.trim()}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingCommentId(null);
                                          setEditingCommentContent('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                )}
                              </div>
                            </div>
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
                  </TabsContent>

                  <TabsContent value="activity" className="mt-4">
                    <ActivityTimeline activities={activities} loading={activitiesLoading} />
                  </TabsContent>
                </Tabs>
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
                      <SelectItem value="unassigned">Unassigned</SelectItem>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCommentId} onOpenChange={() => setDeletingCommentId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this comment? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingCommentId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingCommentId && deleteComment(deletingCommentId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
