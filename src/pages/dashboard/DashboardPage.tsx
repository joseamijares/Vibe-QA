import { useEffect, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Folder,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { Link } from 'wouter';
import { Feedback, Project } from '@/types/database.types';

interface DashboardMetrics {
  totalFeedback: number;
  newFeedback: number;
  resolvedFeedback: number;
  activeProjects: number;
  teamMembers: number;
  avgResolutionTime: string;
}

export function DashboardPage() {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalFeedback: 0,
    newFeedback: 0,
    resolvedFeedback: 0,
    activeProjects: 0,
    teamMembers: 0,
    avgResolutionTime: '0h',
  });
  const [recentFeedback, setRecentFeedback] = useState<(Feedback & { project: Project })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;

    async function fetchDashboardData() {
      try {
        // Fetch projects for this organization
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('organization_id', organization!.id);

        const projectIds = projects?.map((p) => p.id) || [];

        // Fetch feedback metrics
        const { data: allFeedback } = await supabase
          .from('feedback')
          .select('status, created_at, resolved_at')
          .in('project_id', projectIds);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const totalFeedback = allFeedback?.length || 0;
        const newFeedback =
          allFeedback?.filter((f) => new Date(f.created_at) >= today && f.status === 'new')
            .length || 0;
        const resolvedFeedback = allFeedback?.filter((f) => f.status === 'resolved').length || 0;

        // Calculate average resolution time
        const resolvedWithTime = allFeedback?.filter((f) => f.resolved_at) || [];
        let avgResolutionHours = 0;
        if (resolvedWithTime.length > 0) {
          const totalHours = resolvedWithTime.reduce((acc, f) => {
            const created = new Date(f.created_at).getTime();
            const resolved = new Date(f.resolved_at!).getTime();
            return acc + (resolved - created) / (1000 * 60 * 60); // Convert to hours
          }, 0);
          avgResolutionHours = totalHours / resolvedWithTime.length;
        }

        // Fetch team members count
        const { count: teamCount } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization!.id);

        // Fetch recent feedback with project details
        const { data: recent } = await supabase
          .from('feedback')
          .select(
            `
            *,
            project:projects(*)
          `
          )
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(10);

        setMetrics({
          totalFeedback,
          newFeedback,
          resolvedFeedback,
          activeProjects: projects?.length || 0,
          teamMembers: teamCount || 0,
          avgResolutionTime:
            avgResolutionHours > 24
              ? `${Math.round(avgResolutionHours / 24)}d`
              : `${Math.round(avgResolutionHours)}h`,
        });

        setRecentFeedback(recent || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [organization]);

  const metricCards = [
    {
      title: 'Total Feedback',
      value: metrics.totalFeedback,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/dashboard/feedback',
    },
    {
      title: 'New Today',
      value: metrics.newFeedback,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/dashboard/feedback?status=new',
    },
    {
      title: 'Resolved',
      value: metrics.resolvedFeedback,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/dashboard/feedback?status=resolved',
    },
    {
      title: 'Active Projects',
      value: metrics.activeProjects,
      icon: Folder,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/dashboard/projects',
    },
    {
      title: 'Team Members',
      value: metrics.teamMembers,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/dashboard/team',
    },
    {
      title: 'Avg Resolution',
      value: metrics.avgResolutionTime,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094765] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Helper function to format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric) => (
          <Link key={metric.title} href={metric.link || '#'}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.title}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Feedback and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
            <Link href="/dashboard/feedback">
              <a className="text-sm text-[#094765] hover:text-[#156c8b] font-medium">View all →</a>
            </Link>
          </div>

          {recentFeedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No feedback yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Share your widget to start collecting feedback
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFeedback.slice(0, 5).map((feedback) => (
                <Link key={feedback.id} href={`/dashboard/feedback/${feedback.id}`}>
                  <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              feedback.type === 'bug'
                                ? 'bg-red-100 text-red-700'
                                : feedback.type === 'suggestion'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {feedback.type}
                          </span>
                          <span className="text-xs text-gray-500">{feedback.project.name}</span>
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2">{feedback.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(feedback.created_at)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          feedback.status === 'new'
                            ? 'bg-yellow-100 text-yellow-700'
                            : feedback.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : feedback.status === 'resolved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {feedback.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Feedback Trends</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.totalFeedback > 0
                    ? `${Math.round((metrics.resolvedFeedback / metrics.totalFeedback) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width:
                      metrics.totalFeedback > 0
                        ? `${(metrics.resolvedFeedback / metrics.totalFeedback) * 100}%`
                        : '0%',
                  }}
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Bugs</span>
                </div>
                <span className="text-sm font-medium">
                  {recentFeedback.filter((f) => f.type === 'bug').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Suggestions</span>
                </div>
                <span className="text-sm font-medium">
                  {recentFeedback.filter((f) => f.type === 'suggestion').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Praise</span>
                </div>
                <span className="text-sm font-medium">
                  {recentFeedback.filter((f) => f.type === 'praise').length}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-[#094765] to-[#3387a7] text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Ready to collect more feedback?</h3>
            <p className="text-white/80">
              Create a new project or share your widget to get started.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/projects/new">
              <Button className="bg-white text-[#094765] hover:bg-gray-100">Create Project</Button>
            </Link>
            <Link href="/dashboard/projects">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                View Projects
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
