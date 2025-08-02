import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  Send,
  Globe,
  Monitor,
  Download,
  Mic,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  X,
  Maximize2,
  Smartphone,
  Image as ImageIcon,
  Volume2,
  FileText,
  User,
  Clock,
  Link2,
  Settings,
  Save,
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
      // First fetch comments
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('feedback_id', feedback.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];

      // Fetch user profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      const profileMap =
        profileData?.reduce(
          (acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          },
          {} as Record<string, any>
        ) || {};

      // Map comments with user data
      const commentsWithUsers = commentsData.map((comment) => ({
        ...comment,
        user: profileMap[comment.user_id] || {
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
    if (!organization) {
      console.log('No organization available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization.id);

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 border-0 bg-gray-50/95">
          {/* Aurora Background Effects */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="aurora-light-layer aurora-light-1" />
            <div className="aurora-light-layer aurora-light-2" />
            <div className="aurora-light-layer aurora-light-3" />
          </div>

          {/* Content wrapper */}
          <div className="relative glass-modern-light rounded-xl flex flex-col h-full bg-white/60 backdrop-blur-xl">
            {/* Clean header */}
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${feedbackTypeConfig[feedback.type].bgColor}`}>
                    <TypeIcon className={`h-6 w-6 ${feedbackTypeConfig[feedback.type].color}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold gradient-text-modern">
                      {feedback.title || `${feedbackTypeConfig[feedback.type].label} Feedback`}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Submitted{' '}
                      {feedback.created_at
                        ? formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })
                        : 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-3">
                  {feedback.status !== 'resolved' && (
                    <Button
                      onClick={async () => {
                        // Update state and then trigger the update
                        const oldStatus = status;
                        setStatus('resolved');

                        try {
                          setLoading(true);
                          const updates = {
                            status: 'resolved',
                            priority,
                            assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
                            resolved_at: new Date().toISOString(),
                            resolved_by: session?.user?.id,
                          };

                          const { error } = await supabase
                            .from('feedback')
                            .update(updates)
                            .eq('id', feedback.id);

                          if (error) throw error;

                          toast.success('Feedback marked as resolved');
                          onUpdate();
                        } catch (error: any) {
                          console.error('Error resolving feedback:', error);
                          toast.error('Failed to resolve feedback');
                          setStatus(oldStatus); // Revert on error
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Resolved
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main content area with scrolling */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description Card */}
                  <div className="glass-card-dashboard rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#094765]" />
                      Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {feedback.description}
                    </p>
                  </div>

                  {/* Media Attachments - Enhanced Display */}
                  {feedback.media.length > 0 && (
                    <div className="glass-card-dashboard rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        {feedback.media[0].type === 'screenshot' ? (
                          <>
                            <ImageIcon className="h-5 w-5 text-[#094765]" />
                            Screenshots
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-5 w-5 text-green-400" />
                            Audio Recordings
                          </>
                        )}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {feedback.media.map((media) => (
                          <div key={media.id} className="relative group">
                            {media.type === 'screenshot' ? (
                              <div className="relative overflow-hidden rounded-xl">
                                <img
                                  src={media.thumbnail_url || media.url}
                                  alt="Screenshot"
                                  className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                  onClick={() => setSelectedMedia(media)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedMedia(media)}
                                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full"
                                  >
                                    <Maximize2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => downloadMedia(media)}
                                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 cursor-pointer hover:from-green-500/30 hover:to-emerald-600/30 transition-all duration-300"
                                onClick={() => setSelectedMedia(media)}
                              >
                                <div className="flex flex-col items-center">
                                  <Mic className="h-12 w-12 text-green-400 mb-3" />
                                  <span className="text-white font-medium">Audio Recording</span>
                                  {media.duration && (
                                    <span className="text-gray-300 text-sm mt-1">
                                      {media.duration} seconds
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments & Activity - Modern Tabs */}
                  <div className="glass-card-dashboard rounded-xl p-6">
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) => setActiveTab(v as 'comments' | 'activity')}
                    >
                      <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                        <TabsTrigger
                          value="comments"
                          className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 rounded-lg transition-all"
                        >
                          Comments ({comments.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="activity"
                          className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 rounded-lg transition-all"
                        >
                          Activity ({activities.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="comments" className="mt-6">
                        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-2">
                          {comments.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                              No comments yet. Be the first to comment!
                            </p>
                          ) : (
                            comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                                  <AvatarImage
                                    src={comment.user.rawUserMetaData?.avatar_url}
                                    alt={
                                      comment.user.rawUserMetaData?.full_name || comment.user.email
                                    }
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-[#156c8b] to-[#3f90b3] text-white">
                                    {getInitials(
                                      comment.user.rawUserMetaData?.full_name,
                                      comment.user.email
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-gray-900 font-medium">
                                        {comment.user.rawUserMetaData?.full_name ||
                                          comment.user.email}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                          {comment.created_at
                                            ? formatDistanceToNow(new Date(comment.created_at), {
                                                addSuffix: true,
                                              })
                                            : 'Unknown'}
                                        </span>
                                        {comment.user_id === session?.user?.id && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                              >
                                                <MoreVertical className="h-3 w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              align="end"
                                              className="bg-slate-800 border-slate-700"
                                            >
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setEditingCommentId(comment.id);
                                                  setEditingCommentContent(comment.content);
                                                }}
                                                className="text-white hover:bg-slate-700"
                                              >
                                                <Edit2 className="h-3 w-3 mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => setDeletingCommentId(comment.id)}
                                                className="text-red-400 hover:bg-slate-700"
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
                                          className="resize-none text-sm bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                                          rows={2}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => updateComment(comment.id)}
                                            disabled={!editingCommentContent.trim()}
                                            className="bg-[#094765] hover:bg-[#156c8b] text-white"
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
                                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-gray-700 whitespace-pre-wrap">
                                        {comment.content}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="resize-none bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3f90b3] focus:ring-2 focus:ring-[#3f90b3]/20 rounded-xl"
                            rows={3}
                          />
                          <Button
                            onClick={addComment}
                            disabled={!newComment.trim()}
                            className="bg-gradient-to-r from-[#ff6b35] to-[#e85d2f] hover:from-[#e85d2f] hover:to-[#d14d29] text-white rounded-xl px-4"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="activity" className="mt-6">
                        <ActivityTimeline activities={activities} loading={activitiesLoading} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Metadata Card */}
                  <div className="glass-card-dashboard rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#094765]" />
                      Details
                    </h3>
                    <div className="space-y-5">
                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                          PROJECT
                        </p>
                        <p className="text-gray-900 font-semibold text-sm">
                          {feedback.project.name}
                        </p>
                      </div>

                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                          REPORTER
                        </p>
                        <p className="text-gray-900 font-medium flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          {feedback.reporter_name || feedback.reporter_email || 'Anonymous'}
                        </p>
                      </div>

                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                          SUBMITTED
                        </p>
                        <p className="text-gray-900 font-medium flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {feedback.created_at
                            ? format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')
                            : 'Unknown'}
                        </p>
                      </div>

                      {feedback.page_url && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                            PAGE URL
                          </p>
                          <a
                            href={feedback.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#094765] hover:text-[#156c8b] flex items-center gap-2 transition-colors text-sm font-medium"
                          >
                            <Link2 className="h-4 w-4" />
                            <span className="truncate">{feedback.page_url}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Device & Browser Info Card */}
                  {(feedback.browser_info || feedback.device_info) && (
                    <div className="glass-card-dashboard rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-[#094765]" />
                        Device Information
                      </h3>
                      <div className="space-y-4">
                        {feedback.browser_info && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                              BROWSER
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900 font-medium">
                                  {(feedback.browser_info as any).browser}{' '}
                                  {(feedback.browser_info as any).version}
                                </span>
                              </div>
                              {(feedback.browser_info as any).engine && (
                                <p className="text-sm text-gray-600 pl-6">
                                  Engine: {(feedback.browser_info as any).engine}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {feedback.device_info && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                              SYSTEM
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900 font-medium">
                                  {(feedback.device_info as any).os}{' '}
                                  {(feedback.device_info as any).osVersion || ''}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 pl-6">
                                Device: {(feedback.device_info as any).type}
                              </p>
                              {(feedback.device_info as any).screenWidth && (
                                <p className="text-sm text-gray-600 pl-6">
                                  Screen: {(feedback.device_info as any).screenWidth} ×{' '}
                                  {(feedback.device_info as any).screenHeight}
                                </p>
                              )}
                              {(feedback.device_info as any).viewport && (
                                <p className="text-sm text-gray-600 pl-6">
                                  Viewport: {(feedback.device_info as any).viewport.width} ×{' '}
                                  {(feedback.device_info as any).viewport.height}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions Card */}
                  <div className="glass-card-dashboard rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-[#094765]" />
                      Actions
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="status" className="text-gray-600 text-sm font-medium">
                          Status
                        </Label>
                        <Select
                          value={status}
                          onValueChange={(value) => setStatus(value as FeedbackStatus)}
                        >
                          <SelectTrigger
                            id="status"
                            className="bg-white border-gray-200 text-gray-900 mt-1.5 hover:border-gray-300"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {feedbackStatusOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority" className="text-gray-600 text-sm font-medium">
                          Priority
                        </Label>
                        <Select
                          value={priority}
                          onValueChange={(value) => setPriority(value as FeedbackPriority)}
                        >
                          <SelectTrigger
                            id="priority"
                            className="bg-white border-gray-200 text-gray-900 mt-1.5 hover:border-gray-300"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {feedbackPriorityOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="assignee" className="text-gray-600 text-sm font-medium">
                          Assign To
                        </Label>
                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                          <SelectTrigger
                            id="assignee"
                            className="bg-white border-gray-200 text-gray-900 mt-1.5 hover:border-gray-300"
                          >
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            <SelectItem
                              value="unassigned"
                              className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                            >
                              Unassigned
                            </SelectItem>
                            {teamMembers.map((member) => (
                              <SelectItem
                                key={member.user_id || member.id}
                                value={member.user_id || `member_${member.id}`}
                                className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                              >
                                User {member.user_id ? member.user_id.substring(0, 8) : 'Unknown'}
                                ...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-[#ff6b35] to-[#e85d2f] hover:from-[#e85d2f] hover:to-[#d14d29] text-white rounded-xl mt-6 flex items-center justify-center gap-2"
                        onClick={updateFeedback}
                        disabled={loading}
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Preview Modal - Modern Design */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-5xl p-0 border-0 bg-black/90 backdrop-blur-xl">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="p-8">
                {selectedMedia.type === 'screenshot' ? (
                  <img
                    src={selectedMedia.url}
                    alt="Screenshot"
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl mx-auto"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl p-12 max-w-md mx-auto">
                    <div className="flex flex-col items-center space-y-6">
                      <Volume2 className="h-16 w-16 text-green-400" />
                      <audio src={selectedMedia.url} controls className="w-full" />
                      {selectedMedia.duration && (
                        <p className="text-white text-lg">
                          Duration: {selectedMedia.duration} seconds
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog - Modern Design */}
      <Dialog open={!!deletingCommentId} onOpenChange={() => setDeletingCommentId(null)}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/20">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Comment</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Are you sure you want to delete this comment? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingCommentId(null)}
                className="border-slate-700 text-gray-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deletingCommentId && deleteComment(deletingCommentId)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
