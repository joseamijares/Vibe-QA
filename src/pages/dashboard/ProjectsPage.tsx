import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project } from '@/types/database.types';
import {
  Folder,
  Plus,
  Code,
  Copy,
  BarChart3,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit,
  Power,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  Settings,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProjectWithStats extends Project {
  feedback_count: number;
  recent_feedback_count: number;
}

export function ProjectsPage() {
  const { organization } = useOrganization();
  const { canManageProjects } = usePermissions();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    fetchProjects();
  }, [organization]);

  const fetchProjects = async () => {
    try {
      // Fetch projects first
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // For each project, fetch feedback counts separately
      const projectsWithStats = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get total feedback count
          const { count: feedbackCount } = await supabase
            .from('feedback')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Get recent feedback count (last 7 days)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { count: recentCount } = await supabase
            .from('feedback')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .gte('created_at', sevenDaysAgo);

          return {
            ...project,
            feedback_count: feedbackCount || 0,
            recent_feedback_count: recentCount || 0,
          };
        })
      );

      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectStatus = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: !currentStatus })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(
        projects.map((p) => (p.id === projectId ? { ...p, is_active: !currentStatus } : p))
      );

      toast.success(`Project ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling project status:', error);
      toast.error('Failed to update project status');
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? All feedback will be lost.')) {
      return;
    }

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const copyEmbedCode = (project: Project) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const embedCode = `<script 
  src="${supabaseUrl}/storage/v1/object/public/widget-assets/production/widget.js" 
  data-project-key="${project.api_key}"
  data-api-url="${supabaseUrl}/functions/v1"
  async>
</script>`;
    navigator.clipboard.writeText(embedCode);
    toast.success('Installation code copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094765] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your projects and view their feedback</p>
        </div>
        {canManageProjects && (
          <Link href="/dashboard/projects/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Projects Display - Dynamic Layout */}
      {projects.length === 0 ? (
        <Card className="p-16 text-center bg-gradient-to-b from-white to-gray-50/50">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-[#094765]/10 to-[#094765]/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Folder className="h-10 w-10 text-[#094765]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No projects yet</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Create your first project to start collecting valuable feedback from your users
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 text-left">
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                <p className="text-sm font-medium text-gray-900">Easy Setup</p>
                <p className="text-xs text-gray-600 mt-1">Install in minutes</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <Zap className="h-5 w-5 text-yellow-500 mb-2" />
                <p className="text-sm font-medium text-gray-900">Real-time</p>
                <p className="text-xs text-gray-600 mt-1">Instant feedback</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <TrendingUp className="h-5 w-5 text-blue-500 mb-2" />
                <p className="text-sm font-medium text-gray-900">Insights</p>
                <p className="text-xs text-gray-600 mt-1">Track & analyze</p>
              </div>
            </div>

            {canManageProjects && (
              <Link href="/dashboard/projects/new">
                <Button size="lg" className="px-8">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : projects.length === 1 ? (
        // Single Project - Enhanced Layout
        <div className="max-w-5xl mx-auto">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200"
            >
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-[#094765] to-[#0a5580] p-8 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{project.name}</h2>
                    {project.description && (
                      <p className="text-white/80 text-lg">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          project.is_active
                            ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                            : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
                        }`}
                      >
                        <Activity className="h-4 w-4" />
                        {project.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-white/60 text-sm">
                        Created {new Date(project.created_at || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {canManageProjects && (
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                        className="p-3 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-white" />
                      </button>
                      {menuOpen === project.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                            <Link href={`/dashboard/projects/${project.id}/edit`}>
                              <a className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Edit className="h-4 w-4" />
                                Edit Project
                              </a>
                            </Link>
                            <button
                              onClick={() =>
                                toggleProjectStatus(project.id, project.is_active ?? true)
                              }
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Power className="h-4 w-4" />
                              {project.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteProject(project.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Project
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="p-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{project.feedback_count}</p>
                    <p className="text-sm text-gray-600 mt-1">Feedback received</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">This Week</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {project.recent_feedback_count}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">New feedback</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="h-8 w-8 text-purple-600" />
                      <span className="text-sm text-purple-600 font-medium">Status</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">Live</p>
                    <p className="text-sm text-gray-600 mt-1">Widget is active</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Button className="w-full justify-start" variant="outline" size="lg">
                        <BarChart3 className="h-5 w-5 mr-3" />
                        View Dashboard
                      </Button>
                    </Link>
                    <Link href={`/dashboard/feedback?project=${project.id}`}>
                      <Button className="w-full justify-start" variant="outline" size="lg">
                        <MessageSquare className="h-5 w-5 mr-3" />
                        Browse Feedback
                      </Button>
                    </Link>
                    <Link href={`/dashboard/projects/${project.id}/widget`}>
                      <Button className="w-full justify-start" variant="outline" size="lg">
                        <Settings className="h-5 w-5 mr-3" />
                        Configure Widget
                      </Button>
                    </Link>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        window.open(
                          `${window.location.origin}/widget-demo.html?projectKey=${project.api_key}`,
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className="h-5 w-5 mr-3" />
                      Test Widget
                    </Button>
                  </div>
                </div>

                {/* Installation Section */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Installation</h3>
                      <p className="text-sm text-gray-600 mt-1">Add this code to your website</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyEmbedCode(project)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Code
                      </Button>
                      <Link href={`/dashboard/projects/${project.id}/widget`}>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Customize
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                    {`<script 
  src="${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/widget-assets/production/widget.js" 
  data-project-key="${project.api_key}"
  data-api-url="${import.meta.env.VITE_SUPABASE_URL}/functions/v1"
  async>
</script>`}
                  </pre>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Multiple Projects - Grid Layout
        <div
          className={`grid gap-6 ${
            projects.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {projects.map((project) => (
            <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      project.is_active ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <Folder
                      className={`h-6 w-6 ${
                        project.is_active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        project.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {project.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {canManageProjects && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    {menuOpen === project.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                          <Link href={`/dashboard/projects/${project.id}/edit`}>
                            <a className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="h-4 w-4" />
                              Edit Project
                            </a>
                          </Link>
                          <button
                            onClick={() =>
                              toggleProjectStatus(project.id, project.is_active ?? true)
                            }
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Power className="h-4 w-4" />
                            {project.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Project
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{project.feedback_count}</p>
                  <p className="text-xs text-gray-600">Total Feedback</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {project.recent_feedback_count}
                  </p>
                  <p className="text-xs text-gray-600">This Week</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/feedback?project=${project.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Feedback
                    </Button>
                  </Link>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/projects/${project.id}/widget`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Code className="h-4 w-4 mr-2" />
                      Installation
                    </Button>
                  </Link>
                  {canManageProjects && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyEmbedCode(project)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Quick Copy
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
