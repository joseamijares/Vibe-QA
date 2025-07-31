'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, X } from 'lucide-react';

/* eslint-disable @next/next/no-img-element */

export function OrganizationSettings() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    settings: {
      notifications: {
        emailNewFeedback: true,
        emailWeeklyReport: false,
        emailTeamInvites: true,
      },
      defaultFeedbackSettings: {
        autoAssignToOwner: false,
        requireScreenshot: false,
        allowAnonymous: true,
      },
    },
  });

  useEffect(() => {
    if (organization) {
      // Safely merge organization settings with defaults
      const orgSettings = organization.settings as any;
      const mergedSettings = {
        notifications: {
          emailNewFeedback: orgSettings?.notifications?.emailNewFeedback ?? true,
          emailWeeklyReport: orgSettings?.notifications?.emailWeeklyReport ?? false,
          emailTeamInvites: orgSettings?.notifications?.emailTeamInvites ?? true,
        },
        defaultFeedbackSettings: {
          autoAssignToOwner: orgSettings?.defaultFeedbackSettings?.autoAssignToOwner ?? false,
          requireScreenshot: orgSettings?.defaultFeedbackSettings?.requireScreenshot ?? false,
          allowAnonymous: orgSettings?.defaultFeedbackSettings?.allowAnonymous ?? true,
        },
      };

      setFormData({
        name: organization.name,
        slug: organization.slug,
        description: '',
        logo_url: organization.logo_url || '',
        settings: mergedSettings,
      });
    }
  }, [organization]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    setUploading(true);
    try {
      // Upload to organization-assets bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('organization-assets').getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logo_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setLoading(true);
    try {
      // Check if slug is being changed and if it's unique
      if (formData.slug !== organization.slug) {
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', formData.slug)
          .single();

        if (existingOrg) {
          toast({
            title: 'Error',
            description: 'This organization slug is already taken. Please choose a different one.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          slug: formData.slug,
          logo_url: formData.logo_url || null,
          settings: formData.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Organization settings updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization settings.',
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
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Acme Inc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Organization Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="acme-inc"
            pattern="[a-z0-9-]+"
            title="Only lowercase letters, numbers, and hyphens"
            required
          />
          <p className="text-sm text-muted-foreground">
            Used in URLs and must be unique. Only lowercase letters, numbers, and hyphens.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Organization Logo</Label>
          <div className="flex items-start gap-4">
            {formData.logo_url ? (
              <div className="relative">
                <img
                  src={formData.logo_url}
                  alt="Organization logo"
                  width={80}
                  height={80}
                  className="rounded-lg border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={removeLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Logo'
                    )}
                  </span>
                </Button>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Recommended: 200x200px PNG or JPEG
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={formData.settings.notifications.emailNewFeedback}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    notifications: {
                      ...prev.settings.notifications,
                      emailNewFeedback: e.target.checked,
                    },
                  },
                }))
              }
            />
            <span className="text-sm">Email notifications for new feedback</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={formData.settings.notifications.emailWeeklyReport}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    notifications: {
                      ...prev.settings.notifications,
                      emailWeeklyReport: e.target.checked,
                    },
                  },
                }))
              }
            />
            <span className="text-sm">Weekly summary reports</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={formData.settings.notifications.emailTeamInvites}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    notifications: {
                      ...prev.settings.notifications,
                      emailTeamInvites: e.target.checked,
                    },
                  },
                }))
              }
            />
            <span className="text-sm">Team invitation notifications</span>
          </label>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Default Feedback Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={formData.settings.defaultFeedbackSettings.autoAssignToOwner}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultFeedbackSettings: {
                      ...prev.settings.defaultFeedbackSettings,
                      autoAssignToOwner: e.target.checked,
                    },
                  },
                }))
              }
            />
            <span className="text-sm">Auto-assign new feedback to project owner</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={formData.settings.defaultFeedbackSettings.requireScreenshot}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultFeedbackSettings: {
                      ...prev.settings.defaultFeedbackSettings,
                      requireScreenshot: e.target.checked,
                    },
                  },
                }))
              }
            />
            <span className="text-sm">Require screenshot with feedback</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={formData.settings.defaultFeedbackSettings.allowAnonymous}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultFeedbackSettings: {
                      ...prev.settings.defaultFeedbackSettings,
                      allowAnonymous: e.target.checked,
                    },
                  },
                }))
              }
            />
            <span className="text-sm">Allow anonymous feedback submissions</span>
          </label>
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
