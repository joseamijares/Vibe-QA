import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Loader2 } from 'lucide-react';

interface OrganizationStepProps {
  onNext: () => void;
  onOrganizationCreated: () => void;
}

export function OrganizationStep({ onOrganizationCreated }: OrganizationStepProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState('');

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an organization name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Generate a unique slug
      const slug =
        organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        Math.random().toString(36).substr(2, 9);

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          slug: slug,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: session!.user.id,
        role: 'owner',
      });

      if (memberError) throw memberError;

      // Initialize trial status
      const { error: trialError } = await supabase.from('organization_trial_status').insert({
        organization_id: org.id,
      });

      if (trialError && trialError.code !== '23505') {
        // Ignore duplicate key error
        console.error('Trial initialization error:', trialError);
      }

      toast({
        title: 'Success!',
        description: 'Your organization has been created.',
      });

      onOrganizationCreated();

      // Refresh the page to update the organization context
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Create Your Organization</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Organizations help you manage projects, team members, and billing in one place.
        </p>
      </div>

      <form onSubmit={handleCreateOrganization} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            type="text"
            placeholder="e.g., Acme Corp, My Startup"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            disabled={loading}
            className="w-full"
            autoFocus
          />
          <p className="text-sm text-gray-500">
            This is how your organization will appear throughout the app
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">What's included:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Unlimited projects</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Team collaboration features</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Centralized billing and usage tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>7-day free trial with all features</span>
            </li>
          </ul>
        </div>

        <Button
          type="submit"
          disabled={loading || !organizationName.trim()}
          className="w-full magnetic-button"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Organization...
            </>
          ) : (
            'Create Organization'
          )}
        </Button>
      </form>
    </div>
  );
}
