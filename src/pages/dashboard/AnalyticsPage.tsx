import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MessageSquare, CheckCircle, Clock, Users, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

interface AnalyticsData {
  totalFeedback: number;
  resolvedFeedback: number;
  avgResolutionTime: number;
  activeUsers: number;
  feedbackByType: Array<{ type: string; count: number; percentage: number }>;
  feedbackOverTime: Array<{ date: string; count: number }>;
  resolutionTimeData: Array<{ date: string; avgTime: number }>;
  projectStats: Array<{
    projectId: string;
    projectName: string;
    feedbackCount: number;
    resolvedCount: number;
    avgResolutionTime: number;
  }>;
}

const feedbackTypeColors = {
  bug: '#ef4444',
  suggestion: '#3b82f6',
  praise: '#10b981',
  other: '#6b7280',
};

const dateRangeOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export function AnalyticsPage() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalFeedback: 0,
    resolvedFeedback: 0,
    avgResolutionTime: 0,
    activeUsers: 0,
    feedbackByType: [],
    feedbackOverTime: [],
    resolutionTimeData: [],
    projectStats: [],
  });

  useEffect(() => {
    if (!organization) return;
    fetchAnalytics();
  }, [organization, dateRange]);

  const fetchAnalytics = async () => {
    if (!organization?.id) {
      console.error('No organization context available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      // Fetch all feedback for the organization within date range
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select(
          `
          *,
          project:projects!inner(id, name, organization_id)
        `
        )
        .eq('project.organization_id', organization.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .limit(10000); // Prevent loading too much data

      if (feedbackError) throw feedbackError;

      // Calculate metrics
      const totalFeedback = feedbackData?.length || 0;
      const resolvedFeedback = feedbackData?.filter((f) => f.status === 'resolved').length || 0;

      // Calculate average resolution time
      const resolvedWithTime = feedbackData?.filter(
        (f) => f.status === 'resolved' && f.resolved_at && f.created_at
      );
      const avgResolutionTime =
        resolvedWithTime && resolvedWithTime.length > 0
          ? resolvedWithTime.reduce((acc, f) => {
              const created = new Date(f.created_at);
              const resolved = new Date(f.resolved_at!);
              const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
              return acc + hours;
            }, 0) / resolvedWithTime.length
          : 0;

      // Get unique reporters count
      const uniqueReporters = new Set(
        feedbackData?.map((f) => f.reporter_email || f.session_id).filter(Boolean)
      );
      const activeUsers = uniqueReporters.size;

      // Feedback by type
      const typeCount = feedbackData?.reduce(
        (acc, f) => {
          acc[f.type] = (acc[f.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const feedbackByType = Object.entries(typeCount || {}).map(([type, count]) => ({
        type,
        count: count as number,
        percentage: totalFeedback > 0 ? Math.round(((count as number) / totalFeedback) * 100) : 0,
      }));

      // Feedback over time
      const dailyCount: Record<string, number> = {};
      for (let i = 0; i < parseInt(dateRange); i++) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd');
        dailyCount[date] = 0;
      }

      feedbackData?.forEach((f) => {
        const date = format(new Date(f.created_at), 'yyyy-MM-dd');
        if (dailyCount[date] !== undefined) {
          dailyCount[date]++;
        }
      });

      const feedbackOverTime = Object.entries(dailyCount)
        .map(([date, count]) => ({
          date: format(new Date(date), 'MMM d'),
          count,
        }))
        .reverse();

      // Resolution time trend
      const resolutionByDay: Record<string, { total: number; count: number }> = {};
      resolvedWithTime?.forEach((f) => {
        const date = format(new Date(f.created_at), 'yyyy-MM-dd');
        const created = new Date(f.created_at);
        const resolved = new Date(f.resolved_at!);
        const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);

        if (!resolutionByDay[date]) {
          resolutionByDay[date] = { total: 0, count: 0 };
        }
        resolutionByDay[date].total += hours;
        resolutionByDay[date].count++;
      });

      const resolutionTimeData = Object.entries(resolutionByDay)
        .map(([date, data]) => {
          try {
            return {
              date: format(new Date(date), 'MMM d'),
              avgTime: Math.round((data.total / data.count) * 10) / 10,
            };
          } catch (err) {
            console.error('Invalid date in resolution data:', date);
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => {
          try {
            return new Date(a!.date).getTime() - new Date(b!.date).getTime();
          } catch (err) {
            return 0;
          }
        }) as Array<{ date: string; avgTime: number }>;

      // Project stats
      const projectGroups = feedbackData?.reduce(
        (acc, f) => {
          const projectId = f.project.id;
          if (!acc[projectId]) {
            acc[projectId] = {
              projectId,
              projectName: f.project.name,
              feedback: [],
            };
          }
          acc[projectId].feedback.push(f);
          return acc;
        },
        {} as Record<string, { projectId: string; projectName: string; feedback: any[] }>
      );

      const projectStats = Object.values(projectGroups || {}).map((project: any) => {
        const resolved = project.feedback.filter((f: any) => f.status === 'resolved');
        const avgTime =
          resolved.length > 0
            ? resolved.reduce((acc: number, f: any) => {
                if (f.resolved_at && f.created_at) {
                  const hours =
                    (new Date(f.resolved_at).getTime() - new Date(f.created_at).getTime()) /
                    (1000 * 60 * 60);
                  return acc + hours;
                }
                return acc;
              }, 0) / resolved.length
            : 0;

        return {
          projectId: project.projectId,
          projectName: project.projectName,
          feedbackCount: project.feedback.length,
          resolvedCount: resolved.length,
          avgResolutionTime: Math.round(avgTime * 10) / 10,
        };
      });

      setAnalyticsData({
        totalFeedback,
        resolvedFeedback,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        activeUsers,
        feedbackByType,
        feedbackOverTime,
        resolutionTimeData,
        projectStats,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      if (!analyticsData.feedbackOverTime.length) {
        toast.error('No data to export');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Total Feedback', 'Resolved', 'Average Resolution Time (hours)'];
      const rows = analyticsData.feedbackOverTime.map((day) => {
        const dayData = analyticsData.projectStats.reduce(
          (acc, project) => {
            acc.total += project.feedbackCount;
            acc.resolved += project.resolvedCount;
            return acc;
          },
          { total: 0, resolved: 0 }
        );
        return [day.date, day.count, dayData.resolved, analyticsData.avgResolutionTime];
      });

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibeqa-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success('Analytics exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error(
        `Failed to export analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  const resolutionRate =
    analyticsData.totalFeedback > 0
      ? Math.round((analyticsData.resolvedFeedback / analyticsData.totalFeedback) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Track feedback trends and team performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">in the last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.resolvedFeedback} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgResolutionTime}h</div>
            <p className="text-xs text-muted-foreground">average time to resolve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
            <p className="text-xs text-muted-foreground">unique reporters</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="volume" className="space-y-4">
        <TabsList>
          <TabsTrigger value="volume">Feedback Volume</TabsTrigger>
          <TabsTrigger value="types">Feedback Types</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Time</TabsTrigger>
          <TabsTrigger value="projects">Project Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Over Time</CardTitle>
              <CardDescription>Daily feedback submissions</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {analyticsData.feedbackOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.feedbackOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No feedback data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback by Type</CardTitle>
              <CardDescription>Distribution of feedback categories</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {analyticsData.feedbackByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.feedbackByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.type}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.feedbackByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={feedbackTypeColors[entry.type as keyof typeof feedbackTypeColors]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No feedback data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Time Trend</CardTitle>
              <CardDescription>Average time to resolve feedback (hours)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {analyticsData.resolutionTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgTime" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No resolution data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Analytics</CardTitle>
              <CardDescription>Feedback metrics by project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.projectStats.map((project) => (
                  <div
                    key={project.projectId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{project.projectName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.feedbackCount} total feedback
                      </p>
                    </div>
                    <div className="flex gap-8 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{project.resolvedCount}</p>
                        <p className="text-muted-foreground">Resolved</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">
                          {project.feedbackCount > 0
                            ? Math.round((project.resolvedCount / project.feedbackCount) * 100)
                            : 0}
                          %
                        </p>
                        <p className="text-muted-foreground">Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{project.avgResolutionTime}h</p>
                        <p className="text-muted-foreground">Avg Time</p>
                      </div>
                    </div>
                  </div>
                ))}
                {analyticsData.projectStats.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No project data available for this period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
