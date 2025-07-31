'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/database.types';

interface TeamSettingsData {
  defaultRole: UserRole;
  requireApproval: boolean;
  autoAcceptDomain: string;
  maxMembers: number | null;
}

export function TeamSettings() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeamSettingsData>({
    defaultRole: 'member',
    requireApproval: true,
    autoAcceptDomain: '',
    maxMembers: null,
  });

  useEffect(() => {
    if (organization?.settings) {
      const teamSettings = (organization.settings as any)?.teamSettings;
      if (teamSettings) {
        setFormData({
          defaultRole: teamSettings.defaultRole || 'member',
          requireApproval: teamSettings.requireApproval ?? true,
          autoAcceptDomain: teamSettings.autoAcceptDomain || '',
          maxMembers: teamSettings.maxMembers || null,
        });
      }
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setLoading(true);
    try {
      const currentSettings = (organization.settings as any) || {};
      const updatedSettings = {
        ...currentSettings,
        teamSettings: formData,
      };

      const { error } = await supabase
        .from('organizations')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team preferences updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team preferences.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="default-role">Default Role for New Members</Label>
          <Select
            value={formData.defaultRole}
            onValueChange={(value: UserRole) =>
              setFormData((prev) => ({ ...prev, defaultRole: value }))
            }
          >
            <SelectTrigger id="default-role">
              <SelectValue placeholder="Select default role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer - Can only view feedback</SelectItem>
              <SelectItem value="member">Member - Can create and manage feedback</SelectItem>
              <SelectItem value="admin">Admin - Can manage team and projects</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The role automatically assigned to new team members when they join.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="auto-accept-domain">Auto-Accept Email Domain</Label>
          <input
            id="auto-accept-domain"
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.autoAcceptDomain}
            onChange={(e) => setFormData((prev) => ({ ...prev, autoAcceptDomain: e.target.value }))}
            placeholder="example.com"
          />
          <p className="text-sm text-muted-foreground">
            Users with email addresses from this domain will automatically be accepted when they
            request to join. Leave empty to disable auto-accept.
          </p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Invitation Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.requireApproval}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requireApproval: e.target.checked }))
                }
              />
              <div>
                <span className="text-sm font-medium">Require approval for join requests</span>
                <p className="text-sm text-muted-foreground">
                  When enabled, admins must approve requests to join the organization
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Team Limits</h3>
          <div className="space-y-2">
            <Label htmlFor="max-members">Maximum Team Members</Label>
            <input
              id="max-members"
              type="number"
              min="1"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.maxMembers || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxMembers: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
              placeholder="No limit"
            />
            <p className="text-sm text-muted-foreground">
              Set a maximum number of team members allowed. Leave empty for no limit.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
