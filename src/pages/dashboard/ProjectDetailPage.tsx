import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project } from '@/types/database.types';
import { WidgetButtonPreview } from '@/components/WidgetButtonPreview';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Calendar,
  Edit,
  Power,
  Trash2,
  Code2,
  Settings,
  TestTube,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProjectStats {
  total_feedback: number;
  weekly_feedback: number;
  monthly_feedback: number;
  last_feedback_at: string | null;
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { organization } = useOrganization();
  const { canManageProjects } = usePermissions();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!organization || !id) return;
    fetchProjectDetails();
  }, [organization, id]);

  const fetchProjectDetails = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization!.id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch feedback statistics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get total count
      const { count: totalCount } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

      // Get weekly count
      const { count: weeklyCount } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .gte('created_at', weekAgo.toISOString());

      // Get monthly count
      const { count: monthlyCount } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .gte('created_at', monthAgo.toISOString());

      // Get last feedback date
      const { data: lastFeedback } = await supabase
        .from('feedback')
        .select('created_at')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        total_feedback: totalCount || 0,
        weekly_feedback: weeklyCount || 0,
        monthly_feedback: monthlyCount || 0,
        last_feedback_at: lastFeedback?.created_at || null,
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectStatus = async () => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: !project.is_active })
        .eq('id', project.id);

      if (error) throw error;

      setProject({ ...project, is_active: !project.is_active });
      toast.success(`Project ${!project.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling project status:', error);
      toast.error('Failed to update project status');
    }
  };

  const deleteProject = async () => {
    if (!project) return;

    if (!confirm('Are you sure you want to delete this project? All feedback will be lost.')) {
      return;
    }

    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);

      if (error) throw error;

      toast.success('Project deleted successfully');
      navigate('/dashboard/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const copyEmbedCode = () => {
    if (!project) return;

    // Get the Supabase project URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const widgetUrl = `${supabaseUrl}/storage/v1/object/public/widget-assets/production/widget.js`;

    const embedCode = `<script 
  src="${widgetUrl}" 
  data-project-key="${project.api_key}"
  data-api-url="${supabaseUrl}/functions/v1"
  async>
</script>`;

    navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    toast.success('Installation code copied to clipboard');

    setTimeout(() => setCopiedCode(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094765] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Project not found</p>
        <Link href="/dashboard/projects">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description || 'No description'}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {project.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Project Info (60%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Feedback Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <MessageSquare className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.total_feedback || 0}</p>
                <p className="text-sm text-gray-600">Total Feedback</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats?.weekly_feedback || 0}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">{stats?.monthly_feedback || 0}</p>
                <p className="text-sm text-gray-600">This Month</p>
              </div>
            </div>
            {stats?.last_feedback_at && (
              <p className="text-sm text-gray-600 mt-4">
                Last feedback received: {new Date(stats.last_feedback_at).toLocaleString()}
              </p>
            )}
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <Link href={`/dashboard/feedback?project=${project.id}`}>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Feedback
                </Button>
              </Link>

              <Link href={`/dashboard/projects/${project.id}/widget`}>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Customize Widget
                </Button>
              </Link>

              {canManageProjects && (
                <>
                  <Link href={`/dashboard/projects/${project.id}/edit`}>
                    <Button className="w-full justify-start" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Project
                    </Button>
                  </Link>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={toggleProjectStatus}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {project.is_active ? 'Deactivate' : 'Activate'} Project
                  </Button>

                  <Button
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                    variant="outline"
                    onClick={deleteProject}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Installation (40%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Installation */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Installation</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Add this code to your website's HTML, just before the closing{' '}
                  <code>&lt;/body&gt;</code> tag:
                </p>
                <div className="relative">
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {`<script 
  src="${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/widget-assets/production/widget.js" 
  data-project-key="${project.api_key}"
  data-api-url="${import.meta.env.VITE_SUPABASE_URL}/functions/v1"
  async>
</script>`}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={copyEmbedCode}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Link href={`/dashboard/projects/${project.id}/widget`}>
                  <Button className="w-full">
                    <Code2 className="h-4 w-4 mr-2" />
                    Advanced Configuration
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Setup Guide */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Setup Guide</h2>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#094765] text-white rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <div>
                  <p className="font-medium">Copy the installation code</p>
                  <p className="text-gray-600">Click the copy button above to get the code</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#094765] text-white rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <div>
                  <p className="font-medium">Add to your website</p>
                  <p className="text-gray-600">Paste it before the closing &lt;/body&gt; tag</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#094765] text-white rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <div>
                  <p className="font-medium">Test the widget</p>
                  <p className="text-gray-600">Look for the feedback button on your site</p>
                </div>
              </li>
            </ol>

            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  window.open(
                    `${window.location.origin}/widget-demo.html?projectKey=${project.api_key}`,
                    '_blank'
                  )
                }
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Widget
              </Button>
            </div>
          </Card>

          {/* Widget Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Widget Preview</h2>
            <WidgetButtonPreview />
          </Card>

          {/* Additional Resources */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Resources</h2>
            <div className="space-y-2">
              <a
                href="/docs/widget-integration"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#094765] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Widget Documentation
              </a>
              <a
                href="/docs/api"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#094765] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                API Reference
              </a>
              <a
                href="/docs/troubleshooting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#094765] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Troubleshooting Guide
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
