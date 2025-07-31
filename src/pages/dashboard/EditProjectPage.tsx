import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Project } from '@/types/database.types';
import { generateSlug, validateProjectName, parseAllowedDomains } from '@/lib/utils/project';

interface ProjectFormData {
  name: string;
  description: string;
  allowedDomains: string;
}

export function EditProjectPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { organization } = useOrganization();
  const { canManageProjects, loading: permLoading } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [originalSlug, setOriginalSlug] = useState('');
  const [slugPreview, setSlugPreview] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setError,
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      allowedDomains: '',
    },
  });

  const nameValue = watch('name');

  // Fetch project data
  useEffect(() => {
    if (!organization || !id) return;

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('organization_id', organization.id)
          .single();

        if (error) throw error;

        setProject(data);
        setOriginalSlug(data.slug);

        // Populate form with project data
        reset({
          name: data.name,
          description: data.description || '',
          allowedDomains: data.allowed_domains?.join('\n') || '',
        });
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project');
        navigate('/dashboard/projects');
      }
    };

    fetchProject();
  }, [organization, id, reset, navigate]);

  // Check permissions
  useEffect(() => {
    if (!permLoading && !canManageProjects) {
      toast.error('You do not have permission to edit projects');
      navigate(`/dashboard/projects/${id}`);
    }
  }, [canManageProjects, permLoading, navigate, id]);

  // Generate slug preview as user types
  useEffect(() => {
    if (nameValue && project) {
      const newSlug = generateSlug(nameValue);
      setSlugPreview(newSlug);

      // Only check for conflicts if slug is changing
      if (newSlug !== originalSlug) {
        const timer = setTimeout(async () => {
          setIsCheckingSlug(true);
          setSlugError(null);

          try {
            const { data } = await supabase
              .from('projects')
              .select('id')
              .eq('organization_id', organization!.id)
              .eq('slug', newSlug)
              .neq('id', project.id) // Exclude current project
              .single();

            if (data) {
              setSlugError('A project with this URL already exists');
            }
          } catch {
            // No matching project found, slug is available
          } finally {
            setIsCheckingSlug(false);
          }
        }, 500);

        return () => clearTimeout(timer);
      } else {
        setSlugError(null);
      }
    }
  }, [nameValue, organization, originalSlug, project]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!organization || !project) {
      toast.error('No organization or project found');
      return;
    }

    // Validate project name
    const validation = validateProjectName(data.name);
    if (!validation.valid) {
      setError('name', { message: validation.error });
      return;
    }

    // Check slug error
    if (slugError) {
      toast.error(slugError);
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(data.name);
      const allowedDomains = parseAllowedDomains(data.allowedDomains);

      const { error } = await supabase
        .from('projects')
        .update({
          name: data.name.trim(),
          slug,
          description: data.description.trim() || null,
          allowed_domains: allowedDomains,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .eq('organization_id', organization.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('A project with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Project updated successfully!');
      navigate(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094765] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(`/dashboard/projects/${project.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-gray-600 mt-1">Update your project settings</p>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Name */}
          <div>
            <Label htmlFor="name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="My Awesome App"
              {...register('name', {
                required: 'Project name is required',
                validate: (value) => {
                  const validation = validateProjectName(value);
                  return validation.valid || validation.error;
                },
              })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}

            {/* Slug Preview */}
            {slugPreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Project URL: <span className="font-mono">{slugPreview}</span>
                  {slugPreview !== originalSlug && (
                    <span className="ml-2 text-amber-600">(will change)</span>
                  )}
                  {isCheckingSlug && (
                    <span className="ml-2 text-gray-500">Checking availability...</span>
                  )}
                </p>
                {slugError && <p className="text-sm text-red-500 mt-1">{slugError}</p>}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your project"
              rows={3}
              {...register('description')}
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional. Help your team understand what this project is for.
            </p>
          </div>

          {/* Allowed Domains */}
          <div>
            <Label htmlFor="allowedDomains">Allowed Domains</Label>
            <Textarea
              id="allowedDomains"
              placeholder="example.com&#10;app.example.com&#10;staging.example.com"
              rows={4}
              {...register('allowedDomains')}
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional. Enter domains that are allowed to use this project's widget. One domain per
              line or comma-separated.
            </p>
          </div>

          {/* API Key Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>API Key:</strong>{' '}
              <code className="font-mono bg-white px-2 py-1 rounded">{project.api_key}</code>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              The API key cannot be changed. If you need a new key, create a new project.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading || isCheckingSlug || !!slugError}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Project...
                </>
              ) : (
                'Update Project'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/dashboard/projects/${project.id}`)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
