import { useEffect, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  User,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  Image as ImageIcon,
  Video,
  Mic,
  Download,
  CheckSquare,
  Square,
  ArrowUpDown,
  Users,
  AlertTriangle,
  Flame,
  Hash,
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
import { cn } from '@/lib/utils';

interface FeedbackWithDetails extends Feedback {
  project: Project;
  media: FeedbackMedia[];
  assigned_user?: {
    id: string;
    email: string;
    rawUserMetaData?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

interface TeamMember {
  user_id: string;
  role: string;
  user: {
    id: string;
    email: string;
    rawUserMetaData?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

const feedbackTypeConfig = {
  bug: { icon: Bug, color: 'text-red-500', bgColor: 'bg-red-50', label: 'Bug' },
  suggestion: {
    icon: Lightbulb,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'Suggestion',
  },
  praise: { icon: Heart, color: 'text-green-500', bgColor: 'bg-green-50', label: 'Praise' },
  other: { icon: Circle, color: 'text-gray-500', bgColor: 'bg-gray-50', label: 'Other' },
};

const feedbackStatusConfig = {
  new: {
    icon: AlertCircle,
    color: 'text-[#ff6b35]',
    bgColor: 'bg-[#ff6b35]/10',
    borderColor: 'border-[#ff6b35]/20',
    label: 'New',
  },
  in_progress: {
    icon: Clock,
    color: 'text-[#3387a7]',
    bgColor: 'bg-[#3387a7]/10',
    borderColor: 'border-[#3387a7]/20',
    label: 'In Progress',
  },
  resolved: {
    icon: CheckCircle2,
    color: 'text-[#20e3b2]',
    bgColor: 'bg-[#20e3b2]/10',
    borderColor: 'border-[#20e3b2]/20',
    label: 'Resolved',
  },
  archived: {
    icon: Archive,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    label: 'Archived',
  },
};

const feedbackPriorityConfig = {
  low: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-l-4 border-gray-300',
    icon: Hash,
    label: 'Low',
  },
  medium: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-l-4 border-yellow-400',
    icon: AlertTriangle,
    label: 'Medium',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-l-4 border-orange-400',
    icon: AlertCircle,
    label: 'High',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-4 border-red-500',
    icon: Flame,
    label: 'Critical',
  },
};

type SortOption = 'date_desc' | 'date_asc' | 'priority_desc' | 'priority_asc' | 'status';

const ITEMS_PER_PAGE = 25;

export function FeedbackPage() {
  const { organization } = useOrganization();
  const [feedbackList, setFeedbackList] = useState<FeedbackWithDetails[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<FeedbackPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  useEffect(() => {
    if (!organization) return;
    fetchProjects();
    fetchTeamMembers();
    fetchFeedback();
  }, [organization]);

  useEffect(() => {
    if (!organization) return;
    setCurrentPage(1);
    fetchFeedback();
  }, [filterProject, filterType, filterStatus, filterPriority, sortBy]);

  useEffect(() => {
    if (!organization) return;
    fetchFeedback();
  }, [currentPage]);

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

  const fetchTeamMembers = async () => {
    try {
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organization!.id);

      if (membersError) throw membersError;

      const userIds = members?.map((m) => m.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, rawUserMetaData')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const teamMembersData =
        members?.map((member) => ({
          user_id: member.user_id,
          role: member.role,
          user: profiles?.find((p) => p.id === member.user_id) || {
            id: member.user_id,
            email: 'Unknown',
          },
        })) || [];

      setTeamMembers(teamMembersData as TeamMember[]);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);

      // Determine order based on sort option
      let orderColumn = 'created_at';
      let orderAscending = false;

      switch (sortBy) {
        case 'date_desc':
          orderColumn = 'created_at';
          orderAscending = false;
          break;
        case 'date_asc':
          orderColumn = 'created_at';
          orderAscending = true;
          break;
        case 'priority_desc':
          orderColumn = 'priority';
          orderAscending = false;
          break;
        case 'priority_asc':
          orderColumn = 'priority';
          orderAscending = true;
          break;
        case 'status':
          orderColumn = 'status';
          orderAscending = true;
          break;
      }

      // First get total count for pagination
      let countQuery = supabase
        .from('feedback')
        .select('*, project:projects!inner(organization_id)', { count: 'exact', head: true })
        .eq('project.organization_id', organization!.id);

      // Apply filters to count query
      if (filterProject !== 'all') {
        countQuery = countQuery.eq('project_id', filterProject);
      }
      if (filterType !== 'all') {
        countQuery = countQuery.eq('type', filterType);
      }
      if (filterStatus !== 'all') {
        countQuery = countQuery.eq('status', filterStatus);
      }
      if (filterPriority !== 'all') {
        countQuery = countQuery.eq('priority', filterPriority);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Now fetch paginated data
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
        .order(orderColumn, { ascending: orderAscending })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

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

      // Fetch assigned user details
      const feedbackWithAssignees = await Promise.all(
        (data || []).map(async (feedback) => {
          if (feedback.assigned_to) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, email, rawUserMetaData')
              .eq('id', feedback.assigned_to)
              .single();

            return {
              ...feedback,
              assigned_user: userData,
            };
          }
          return feedback;
        })
      );

      setFeedbackList(feedbackWithAssignees);
      setSelectedItems(new Set());
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

  const assignFeedback = async (feedbackId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ assigned_to: userId })
        .eq('id', feedbackId);

      if (error) throw error;

      toast.success(userId ? 'Feedback assigned' : 'Assignment removed');
      fetchFeedback();
    } catch (error: any) {
      console.error('Error assigning feedback:', error);
      toast.error('Failed to assign feedback');
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

  const handleSelectAll = () => {
    if (selectedItems.size === feedbackList.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(feedbackList.map((f) => f.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkStatusUpdate = async (status: FeedbackStatus) => {
    if (selectedItems.size === 0) return;

    setBulkActionLoading(true);
    try {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('feedback')
        .update(updates)
        .in('id', Array.from(selectedItems));

      if (error) throw error;

      toast.success(`${selectedItems.size} items updated to ${feedbackStatusConfig[status].label}`);
      setSelectedItems(new Set());
      fetchFeedback();
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback items');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Status',
      'Priority',
      'Project',
      'Reporter',
      'Description',
      'URL',
    ];
    const rows = filteredFeedback.map((f) => [
      f.created_at ? new Date(f.created_at).toLocaleDateString() : '',
      f.type,
      f.status,
      f.priority,
      f.project.name,
      f.reporter_name || f.reporter_email || 'Anonymous',
      f.description.replace(/,/g, ';'),
      f.page_url || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Feedback exported to CSV');
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

  // Group feedback by status
  const groupedFeedback = filteredFeedback.reduce(
    (acc, feedback) => {
      const status = feedback.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(feedback);
      return acc;
    },
    {} as Record<FeedbackStatus, FeedbackWithDetails[]>
  );

  const openFeedbackDetail = (feedback: FeedbackWithDetails) => {
    setSelectedFeedback(feedback);
    setDetailOpen(true);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading feedback...</div>
      </div>
    );
  }

  const renderFeedbackCard = (feedback: FeedbackWithDetails) => {
    const TypeIcon = feedbackTypeConfig[feedback.type].icon;
    const StatusIcon = feedbackStatusConfig[feedback.status].icon;
    const PriorityIcon = feedbackPriorityConfig[feedback.priority].icon;

    return (
      <div
        key={feedback.id}
        className={cn(
          'glass-card-dashboard rounded-xl group hover:scale-[1.01] transition-all duration-200 cursor-pointer',
          feedbackPriorityConfig[feedback.priority].borderColor
        )}
        onClick={() => openFeedbackDetail(feedback)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleSelectItem(feedback.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {selectedItems.has(feedback.id) ? (
                  <CheckSquare className="h-4 w-4 text-[#3387a7]" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', feedbackTypeConfig[feedback.type].bgColor)}>
                    <TypeIcon className={cn('h-5 w-5', feedbackTypeConfig[feedback.type].color)} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {feedback.title || `${feedback.type} feedback`}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          feedbackStatusConfig[feedback.status].bgColor,
                          feedbackStatusConfig[feedback.status].color,
                          feedbackStatusConfig[feedback.status].borderColor,
                          'border'
                        )}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {feedbackStatusConfig[feedback.status].label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{feedback.project.name}</span>
                      <span>•</span>
                      <span>
                        {feedback.created_at
                          ? formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })
                          : 'Unknown'}
                      </span>
                      {feedback.reporter_name ||
                        (feedback.reporter_email && (
                          <>
                            <span>•</span>
                            <span>{feedback.reporter_name || feedback.reporter_email}</span>
                          </>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {feedback.assigned_to ? (
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                      {feedback.assigned_user?.rawUserMetaData?.avatar_url ? (
                        <AvatarImage
                          src={feedback.assigned_user.rawUserMetaData.avatar_url}
                          alt={feedback.assigned_user.email}
                        />
                      ) : null}
                      <AvatarFallback className="bg-[#3387a7] text-white text-xs">
                        {feedback.assigned_user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                      <Users className="h-3 w-3" />
                      <span>Unassigned</span>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">Assign to</DropdownMenuLabel>
                      {feedback.assigned_to && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            assignFeedback(feedback.id, null);
                          }}
                        >
                          <User className="h-3 w-3 mr-2" />
                          Unassign
                        </DropdownMenuItem>
                      )}
                      {teamMembers.map((member) => (
                        <DropdownMenuItem
                          key={member.user_id}
                          onClick={(e) => {
                            e.stopPropagation();
                            assignFeedback(feedback.id, member.user_id);
                          }}
                          disabled={feedback.assigned_to === member.user_id}
                        >
                          <User className="h-3 w-3 mr-2" />
                          {member.user.email}
                          {member.role === 'owner' && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Owner
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">{feedback.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', feedbackPriorityConfig[feedback.priority].color)}
                  >
                    <PriorityIcon className="h-3 w-3 mr-1" />
                    {feedbackPriorityConfig[feedback.priority].label}
                  </Badge>

                  {feedback.media.length > 0 && (
                    <div className="flex items-center gap-1">
                      {feedback.media.map((media, index) => {
                        const MediaIcon = getMediaIcon(media.type);
                        return <MediaIcon key={index} className="h-4 w-4 text-muted-foreground" />;
                      })}
                    </div>
                  )}

                  {feedback.page_url && <LinkIcon className="h-4 w-4 text-muted-foreground" />}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold gradient-text-modern">Feedback</h2>
          <p className="text-muted-foreground">
            Manage and respond to user feedback across all projects
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={filteredFeedback.length === 0}
          className="btn-dashboard-secondary rounded-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Project Selector */}
      <div className="w-full md:w-auto">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-full md:w-[300px] h-12 text-base border-2 border-[#094765]/20 focus:border-[#3387a7]">
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

      {/* Filters Bar */}
      <div className="glass-card-dashboard rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-[#094765]/10">
              {Object.entries(feedbackTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() =>
                      setFilterType(filterType === type ? 'all' : (type as FeedbackType))
                    }
                    className={cn(
                      'p-2',
                      filterType === type
                        ? 'bg-[#094765] hover:bg-[#094765]/90'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4', filterType === type ? 'text-white' : config.color)}
                    />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-[#094765]/10">
              {Object.entries(feedbackStatusConfig).map(([status, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() =>
                      setFilterStatus(filterStatus === status ? 'all' : (status as FeedbackStatus))
                    }
                    className={cn(
                      'px-3 py-2',
                      filterStatus === status
                        ? 'bg-[#094765] hover:bg-[#094765]/90'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 mr-1',
                        filterStatus === status ? 'text-white' : config.color
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs',
                        filterStatus === status ? 'text-white' : 'text-gray-700'
                      )}
                    >
                      {config.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-[#094765]/10">
              {Object.entries(feedbackPriorityConfig).map(([priority, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={priority}
                    variant={filterPriority === priority ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() =>
                      setFilterPriority(
                        filterPriority === priority ? 'all' : (priority as FeedbackPriority)
                      )
                    }
                    className={cn(
                      'px-3 py-2',
                      filterPriority === priority
                        ? 'bg-[#094765] hover:bg-[#094765]/90'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 mr-1',
                        filterPriority === priority ? 'text-white' : config.color
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs',
                        filterPriority === priority ? 'text-white' : 'text-gray-700'
                      )}
                    >
                      {config.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px] bg-white">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-[#094765]" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="priority_desc">Highest Priority</SelectItem>
              <SelectItem value="priority_asc">Lowest Priority</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-[#094765]/20 focus:border-[#3387a7]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="glass-card-dashboard rounded-xl p-4 border-[#094765]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#094765]">
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems(new Set())}
                className="text-[#094765] hover:text-[#094765]/80"
              >
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkActionLoading}
                    className="text-[#094765] border-[#094765] hover:bg-[#094765] hover:text-white"
                  >
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('in_progress')}>
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('resolved')}>
                    Mark as Resolved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('archived')}>
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 hover:text-[#094765] transition-colors"
          >
            {selectedItems.size === feedbackList.length && feedbackList.length > 0 ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Select all
          </button>
          <span>•</span>
          <span>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
          </span>
        </div>
      </div>

      {/* Feedback List by Status */}
      <div className="space-y-8">
        {filteredFeedback.length === 0 ? (
          <div className="glass-card-dashboard rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No feedback found matching your filters.</p>
          </div>
        ) : sortBy === 'status' ? (
          // Group by status when sorting by status
          ['new', 'in_progress', 'resolved', 'archived'].map((status) => {
            const statusFeedback = groupedFeedback[status as FeedbackStatus] || [];
            if (statusFeedback.length === 0) return null;

            const StatusIcon = feedbackStatusConfig[status as FeedbackStatus].icon;
            const statusConfig = feedbackStatusConfig[status as FeedbackStatus];

            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-3 sticky top-0 bg-background z-10 py-2">
                  <div
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg',
                      statusConfig.bgColor
                    )}
                  >
                    <StatusIcon className={cn('h-5 w-5', statusConfig.color)} />
                    <h3 className={cn('font-semibold', statusConfig.color)}>
                      {statusConfig.label}
                    </h3>
                    <Badge variant="secondary" className="ml-2">
                      {statusFeedback.length}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">{statusFeedback.map(renderFeedbackCard)}</div>
              </div>
            );
          })
        ) : (
          // Regular list when not sorting by status
          <div className="space-y-3">{filteredFeedback.map(renderFeedbackCard)}</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={!hasPrevPage}
              className="text-[#094765] border-[#094765] hover:bg-[#094765] hover:text-white disabled:opacity-50"
            >
              Previous
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'w-10',
                      currentPage === pageNum
                        ? 'bg-[#094765] hover:bg-[#094765]/90'
                        : 'text-[#094765] border-[#094765] hover:bg-[#094765] hover:text-white'
                    )}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={!hasNextPage}
              className="text-[#094765] border-[#094765] hover:bg-[#094765] hover:text-white disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
