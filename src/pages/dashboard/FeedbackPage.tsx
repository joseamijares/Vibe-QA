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
  ChevronLeft,
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
  Download,
  Filter,
  CheckSquare,
  Square,
  CalendarDays,
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
import { formatDistanceToNow, format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { FeedbackDetailDialog } from '@/components/feedback/FeedbackDetailDialog';

interface FeedbackWithDetails extends Feedback {
  project: Project;
  media: FeedbackMedia[];
  assigned_user?: {
    id: string;
    email: string;
  };
}

interface TeamMember {
  user_id: string;
  role: string;
  user: {
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
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<FeedbackPriority | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    if (!organization) return;
    fetchProjects();
    fetchTeamMembers();
    fetchFeedback();
  }, [organization]);

  useEffect(() => {
    if (!organization) return;
    setCurrentPage(1); // Reset to first page when filters change
    fetchFeedback();
  }, [filterProject, filterType, filterStatus, filterPriority, dateRange]);

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

      // Get user details for each member
      const userIds = members?.map((m) => m.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine member data with user profiles
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
      if (dateRange.start) {
        countQuery = countQuery.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange.end) {
        countQuery = countQuery.lte('created_at', dateRange.end.toISOString());
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
        .order('created_at', { ascending: false })
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
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedbackList(data || []);
      setSelectedItems(new Set()); // Clear selections on page change
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
      f.description.replace(/,/g, ';'), // Replace commas to avoid CSV issues
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Feedback</h2>
          <p className="text-muted-foreground">
            Manage and respond to user feedback across all projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredFeedback.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
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
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as any)}
                >
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

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Date Range:</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      start: e.target.value ? new Date(e.target.value) : null,
                    }))
                  }
                  className="w-40"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      end: e.target.value ? new Date(e.target.value) : null,
                    }))
                  }
                  className="w-40"
                />
                {(dateRange.start || dateRange.end) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({ start: null, end: null })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={bulkActionLoading}>
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
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
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
              <Card key={feedback.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSelectItem(feedback.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {selectedItems.has(feedback.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <div
                    className="flex-1 space-y-3 cursor-pointer"
                    onClick={() => openFeedbackDetail(feedback)}
                  >
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
                              {feedback.created_at
                                ? formatDistanceToNow(new Date(feedback.created_at), {
                                    addSuffix: true,
                                  })
                                : 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {feedback.reporter_name || feedback.reporter_email || 'Anonymous'}
                            </span>
                            {feedback.assigned_to && (
                              <span className="flex items-center gap-1 text-primary">
                                <User className="h-3 w-3" />
                                Assigned:{' '}
                                {teamMembers.find((m) => m.user_id === feedback.assigned_to)?.user
                                  .email || 'Unknown'}
                              </span>
                            )}
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
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            );
          })
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
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
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
                    className="w-10"
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
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
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
