import { useEffect, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
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

        // Fetch team members count - with simple RLS we can only see our own record
        // TODO: Add proper RLS policies to allow counting team members
        const teamCount = 1;

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
      gradient: 'from-blue-500 to-cyan-600',
      iconBg: 'from-blue-100 to-cyan-100',
      iconColor: 'text-blue-600',
      link: '/dashboard/feedback',
    },
    {
      title: 'New Today',
      value: metrics.newFeedback,
      icon: AlertCircle,
      gradient: 'from-orange-500 to-amber-600',
      iconBg: 'from-orange-100 to-amber-100',
      iconColor: 'text-orange-600',
      link: '/dashboard/feedback?status=new',
    },
    {
      title: 'Resolved',
      value: metrics.resolvedFeedback,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'from-green-100 to-emerald-100',
      iconColor: 'text-green-600',
      link: '/dashboard/feedback?status=resolved',
    },
    {
      title: 'Active Projects',
      value: metrics.activeProjects,
      icon: Folder,
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'from-purple-100 to-pink-100',
      iconColor: 'text-purple-600',
      link: '/dashboard/projects',
    },
    {
      title: 'Team Members',
      value: metrics.teamMembers,
      icon: Users,
      gradient: 'from-indigo-500 to-blue-600',
      iconBg: 'from-indigo-100 to-blue-100',
      iconColor: 'text-indigo-600',
      link: '/dashboard/team',
    },
    {
      title: 'Avg Resolution',
      value: metrics.avgResolutionTime,
      icon: Clock,
      gradient: 'from-gray-500 to-slate-600',
      iconBg: 'from-gray-100 to-slate-100',
      iconColor: 'text-gray-600',
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
        <h1 className="text-3xl font-bold gradient-text-modern">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric) => (
          <Link key={metric.title} href={metric.link || '#'}>
            <div className="metric-card rounded-2xl p-6 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${metric.iconBg} group-hover:scale-110 transition-transform`}
                >
                  <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
              </div>
              <div>
                <p
                  className={`text-3xl font-bold bg-gradient-to-br ${metric.gradient} bg-clip-text text-transparent`}
                >
                  {metric.value}
                </p>
                <p className="text-sm text-gray-600 mt-1">{metric.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Feedback and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <div className="glass-card-dashboard rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
            <Link href="/dashboard/feedback">
              <span className="text-sm bg-gradient-to-r from-[#094765] to-[#3387a7] bg-clip-text text-transparent hover:from-[#3387a7] hover:to-[#094765] font-medium cursor-pointer transition-all">
                View all →
              </span>
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
            <div className="space-y-8">
              {recentFeedback.slice(0, 5).map((feedback) => (
                <Link key={feedback.id} href={`/dashboard/feedback/${feedback.id}`}>
                  <div className="p-5 rounded-xl glass-dashboard-dark hover:bg-white/50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${
                              feedback.type === 'bug'
                                ? 'bg-red-500/10 text-red-600 border border-red-200/50'
                                : feedback.type === 'suggestion'
                                  ? 'bg-blue-500/10 text-blue-600 border border-blue-200/50'
                                  : 'bg-green-500/10 text-green-600 border border-green-200/50'
                            }`}
                          >
                            {feedback.type}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {feedback.project.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2 group-hover:text-gray-700 leading-relaxed">
                          {feedback.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {feedback.created_at
                            ? formatRelativeTime(feedback.created_at)
                            : 'Unknown'}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm flex-shrink-0 ${
                          feedback.status === 'new'
                            ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-200/50'
                            : feedback.status === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-200/50'
                              : feedback.status === 'resolved'
                                ? 'bg-green-500/10 text-green-600 border border-green-200/50'
                                : 'bg-gray-500/10 text-gray-600 border border-gray-200/50'
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
        </div>

        {/* Quick Stats */}
        <div className="glass-card-dashboard rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Feedback Trends</h2>
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-slate-100">
              <BarChart3 className="h-5 w-5 bg-gradient-to-br from-gray-500 to-slate-600 bg-clip-text text-transparent" />
            </div>
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
              <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500 shadow-sm"
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
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-600">Bugs</span>
                </div>
                <span className="text-sm font-semibold bg-gradient-to-br from-red-500 to-rose-600 bg-clip-text text-transparent">
                  {recentFeedback.filter((f) => f.type === 'bug').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-600">Suggestions</span>
                </div>
                <span className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                  {recentFeedback.filter((f) => f.type === 'suggestion').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-600">Praise</span>
                </div>
                <span className="text-sm font-semibold bg-gradient-to-br from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  {recentFeedback.filter((f) => f.type === 'praise').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#094765] to-[#3387a7] opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
        <div className="relative p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                Ready to collect more feedback?
              </h3>
              <p className="text-white/80">
                Create a new project or share your widget to get started.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/projects/new">
                <Button className="bg-white/90 backdrop-blur-sm text-[#094765] hover:bg-white font-semibold shadow-lg transition-all hover:scale-105">
                  Create Project
                </Button>
              </Link>
              <Link href="/dashboard/projects">
                <Button
                  variant="outline"
                  className="border-white/50 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white font-semibold transition-all"
                >
                  View Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
