import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
import {
  generateSlug,
  generateApiKey,
  validateProjectName,
  parseAllowedDomains,
} from '@/lib/utils/project';

interface ProjectFormData {
  name: string;
  description: string;
  allowedDomains: string;
}

export function NewProjectPage() {
  const [, navigate] = useLocation();
  const { organization } = useOrganization();
  const { canManageProjects } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [slugPreview, setSlugPreview] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
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

  // Check if user has permission
  useEffect(() => {
    if (!canManageProjects) {
      toast.error('You do not have permission to create projects');
      navigate('/dashboard/projects');
    }
  }, [canManageProjects, navigate]);

  // Generate slug preview as user types
  useEffect(() => {
    if (nameValue) {
      const slug = generateSlug(nameValue);
      setSlugPreview(slug);

      // Debounced slug uniqueness check
      const timer = setTimeout(async () => {
        if (slug) {
          setIsCheckingSlug(true);
          setSlugError(null);

          try {
            const { data } = await supabase
              .from('projects')
              .select('id')
              .eq('organization_id', organization!.id)
              .eq('slug', slug)
              .single();

            if (data) {
              setSlugError('A project with this URL already exists');
            }
          } catch {
            // No matching project found, slug is available
          } finally {
            setIsCheckingSlug(false);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSlugPreview('');
      setSlugError(null);
    }
  }, [nameValue, organization]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!organization) {
      toast.error('No organization found');
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
      const apiKey = generateApiKey();
      const allowedDomains = parseAllowedDomains(data.allowedDomains);

      const { error } = await supabase
        .from('projects')
        .insert({
          organization_id: organization.id,
          name: data.name.trim(),
          slug,
          description: data.description.trim() || null,
          api_key: apiKey,
          allowed_domains: allowedDomains,
          is_active: true,
          settings: {},
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          toast.error('A project with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Project created successfully!');
      navigate('/dashboard/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/dashboard/projects')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-1">Set up a new project to start collecting feedback</p>
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
                  Creating Project...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/projects')}
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
