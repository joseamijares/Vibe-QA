import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Folder, Loader2, ArrowRight } from 'lucide-react';

interface ProjectStepProps {
  onNext: () => void;
  onProjectCreated: () => void;
  canSkip?: boolean;
}

export function ProjectStep({ onNext, onProjectCreated, canSkip }: ProjectStepProps) {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a project name',
        variant: 'destructive',
      });
      return;
    }

    if (!organization) {
      toast({
        title: 'Error',
        description: 'No organization found. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          organization_id: organization.id,
          website_url: projectUrl || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your first project has been created.',
      });

      onProjectCreated();
      onNext();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Folder className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Create Your First Project</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Projects help you organize feedback from different products, websites, or applications.
        </p>
      </div>

      <form onSubmit={handleCreateProject} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name *</Label>
          <Input
            id="project-name"
            type="text"
            placeholder="e.g., Main Website, Mobile App, Dashboard"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={loading}
            className="w-full"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-url">Website URL (optional)</Label>
          <Input
            id="project-url"
            type="url"
            placeholder="https://example.com"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            disabled={loading}
            className="w-full"
          />
          <p className="text-sm text-gray-500">The URL where you'll embed the feedback widget</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-200">
          <h4 className="font-semibold text-blue-900">What happens next?</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>You'll get a unique API key for this project</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>We'll show you how to embed the feedback widget</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Start collecting feedback immediately</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !projectName.trim()}
            className="flex-1 magnetic-button"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              <>
                Create Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          {canSkip && (
            <Button type="button" variant="outline" onClick={handleSkip} disabled={loading}>
              Skip for now
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
