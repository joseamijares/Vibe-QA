'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Loader2, Copy, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  is_active: boolean;
}

interface ApiUsage {
  project_id: string;
  api_calls: number;
  last_used: string | null;
}

export function ApiKeysSettings() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiUsage, setApiUsage] = useState<Record<string, ApiUsage>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      fetchProjects();
      fetchApiUsage();
    }
  }, [organization]);

  const fetchProjects = async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      // Error is handled silently
    }
  };

  const fetchApiUsage = async () => {
    if (!organization) return;

    try {
      // This would typically come from your analytics/usage tracking system
      // For now, we'll use placeholder data
      const usage: Record<string, ApiUsage> = {};

      // You would implement actual usage tracking here
      setApiUsage(usage);
    } catch (error) {
      // Error is handled silently
    }
  };

  const toggleKeyVisibility = (projectId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const regenerateApiKey = async (projectId: string) => {
    setRegeneratingKey(projectId);
    try {
      // Generate new API key
      const newApiKey = `proj_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      const { error } = await supabase
        .from('projects')
        .update({
          api_key: newApiKey,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, api_key: newApiKey } : p))
      );

      toast({
        title: 'Success',
        description: 'API key regenerated successfully. Update your integrations with the new key.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate API key.',
        variant: 'destructive',
      });
    } finally {
      setRegeneratingKey(null);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  if (orgLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-900">API Key Security</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Keep your API keys secure and never expose them in client-side code or public
              repositories. Regenerate keys immediately if they are compromised.
            </p>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No projects yet. Create a project to get an API key.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <a href="/dashboard/projects/new">Create Project</a>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const usage = apiUsage[project.id];
            const isVisible = visibleKeys.has(project.id);

            return (
              <Card key={project.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDistanceToNow(new Date(project.created_at))} ago
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          project.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {project.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                        {isVisible ? project.api_key : maskApiKey(project.api_key)}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(project.id)}
                      >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(project.api_key, 'API key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => regenerateApiKey(project.id)}
                        disabled={regeneratingKey === project.id}
                      >
                        {regeneratingKey === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {usage && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">API Calls (This Month)</p>
                        <p className="text-2xl font-semibold">{usage.api_calls.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Used</p>
                        <p className="text-sm font-medium">
                          {usage.last_used
                            ? formatDistanceToNow(new Date(usage.last_used)) + ' ago'
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">API Documentation</h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Learn how to integrate VibeQA into your applications using our API.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="/docs/api" target="_blank">
                API Reference
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/docs/widget" target="_blank">
                Widget Documentation
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
