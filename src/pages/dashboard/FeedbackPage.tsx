import { useEffect, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bug,
  Lightbulb,
  Heart,
  Circle,
  Search,
  MoreVertical,
  ChevronRight,
  Calendar,
  User,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  Image as ImageIcon,
  Video,
  Mic,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Feedback,
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  Project,
  FeedbackMedia,
} from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import { FeedbackDetailDialog } from '@/components/feedback/FeedbackDetailDialog';

interface FeedbackWithDetails extends Feedback {
  project: Project;
  media: FeedbackMedia[];
  assigned_user?: {
    id: string;
    email: string;
  };
}

const feedbackTypeConfig = {
  bug: { icon: Bug, color: 'text-red-500', bgColor: 'bg-red-100' },
  suggestion: { icon: Lightbulb, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  praise: { icon: Heart, color: 'text-green-500', bgColor: 'bg-green-100' },
  other: { icon: Circle, color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

const feedbackStatusConfig = {
  new: { icon: AlertCircle, color: 'text-yellow-500', label: 'New' },
  in_progress: { icon: Clock, color: 'text-blue-500', label: 'In Progress' },
  resolved: { icon: CheckCircle2, color: 'text-green-500', label: 'Resolved' },
  archived: { icon: Archive, color: 'text-gray-500', label: 'Archived' },
};

const feedbackPriorityConfig = {
  low: { color: 'text-gray-500', bgColor: 'bg-gray-100' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function FeedbackPage() {
  const { organization } = useOrganization();
  const [feedbackList, setFeedbackList] = useState<FeedbackWithDetails[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<FeedbackPriority | 'all'>('all');

  useEffect(() => {
    if (!organization) return;
    fetchProjects();
    fetchFeedback();
  }, [organization]);

  useEffect(() => {
    if (!organization) return;
    fetchFeedback();
  }, [filterProject, filterType, filterStatus, filterPriority]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('feedback')
        .select(
          `
          *,
          project:projects!inner(*),
          media:feedback_media(*)
        `
        )
        .eq('project.organization_id', organization!.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterProject !== 'all') {
        query = query.eq('project_id', filterProject);
      }
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedbackList(data || []);
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: FeedbackStatus) => {
    try {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        // TODO: Get current user ID from auth context
        // updates.resolved_by = user.id;
      }

      const { error } = await supabase.from('feedback').update(updates).eq('id', feedbackId);

      if (error) throw error;

      toast.success(`Feedback marked as ${feedbackStatusConfig[status].label}`);
      fetchFeedback();
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback status');
    }
  };

  const getMediaIcon = (type: FeedbackMedia['type']) => {
    switch (type) {
      case 'screenshot':
        return ImageIcon;
      case 'video':
        return Video;
      case 'audio':
        return Mic;
      default:
        return ImageIcon;
    }
  };

  const filteredFeedback = feedbackList.filter((feedback) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        feedback.description.toLowerCase().includes(query) ||
        feedback.title?.toLowerCase().includes(query) ||
        feedback.reporter_email?.toLowerCase().includes(query) ||
        feedback.reporter_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const openFeedbackDetail = (feedback: FeedbackWithDetails) => {
    setSelectedFeedback(feedback);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Feedback</h2>
          <p className="text-muted-foreground">
            Manage and respond to user feedback across all projects
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="praise">Praise</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filterPriority}
              onValueChange={(value) => setFilterPriority(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No feedback found matching your filters.</p>
          </Card>
        ) : (
          filteredFeedback.map((feedback) => {
            const TypeIcon = feedbackTypeConfig[feedback.type].icon;
            const StatusIcon = feedbackStatusConfig[feedback.status].icon;

            return (
              <Card
                key={feedback.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openFeedbackDetail(feedback)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${feedbackTypeConfig[feedback.type].bgColor}`}
                        >
                          <TypeIcon
                            className={`h-5 w-5 ${feedbackTypeConfig[feedback.type].color}`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {feedback.title || `${feedback.type} feedback`}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(feedback.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {feedback.reporter_name || feedback.reporter_email || 'Anonymous'}
                            </span>
                            {feedback.page_url && (
                              <span className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                <span className="truncate max-w-xs">{feedback.page_url}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFeedbackStatus(feedback.id, 'in_progress');
                            }}
                          >
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFeedbackStatus(feedback.id, 'resolved');
                            }}
                          >
                            Mark as Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFeedbackStatus(feedback.id, 'archived');
                            }}
                          >
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {feedback.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {feedback.project.name}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${feedbackStatusConfig[feedback.status].color}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {feedbackStatusConfig[feedback.status].label}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            feedbackPriorityConfig[feedback.priority].color
                          } ${feedbackPriorityConfig[feedback.priority].bgColor}`}
                        >
                          {feedback.priority}
                        </Badge>
                        {feedback.media.length > 0 && (
                          <div className="flex items-center gap-1">
                            {feedback.media.map((media, index) => {
                              const MediaIcon = getMediaIcon(media.type);
                              return (
                                <MediaIcon key={index} className="h-4 w-4 text-muted-foreground" />
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Feedback Detail Dialog */}
      {selectedFeedback && (
        <FeedbackDetailDialog
          feedback={selectedFeedback}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={() => fetchFeedback()}
        />
      )}
    </div>
  );
}
