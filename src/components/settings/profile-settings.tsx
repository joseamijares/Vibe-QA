'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, X, Eye, EyeOff } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */

export function ProfileSettings() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    notification_preferences: {
      emailNewFeedback: true,
      emailMentions: true,
      emailAssignments: true,
    },
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (session?.user) {
      // Fetch user profile from profiles table
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: session.user.email || '',
          avatar_url: data.avatar_url || '',
          notification_preferences:
            data.notification_preferences || formData.notification_preferences,
        });
      } else {
        // If no profile exists, use session data
        setFormData({
          ...formData,
          email: session.user.email || '',
        });
      }
    } catch (error) {
      // Error is handled silently - profile will remain with default values
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user) return;

    setUploading(true);
    try {
      // Upload to organization-assets bucket (or create a user-avatars bucket)
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${session.user.id}/avatar.${fileExt}`;

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

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar_url: '' }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setLoading(true);
    try {
      // Update or insert profile
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        full_name: formData.full_name,
        avatar_url: formData.avatar_url || null,
        notification_preferences: formData.notification_preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password updated successfully.',
      });

      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return <div>Please sign in to view your profile settings.</div>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
            <p className="text-sm text-muted-foreground">Your email address cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-start gap-4">
              {formData.avatar_url ? (
                <div className="relative">
                  <img
                    src={formData.avatar_url}
                    alt="Profile picture"
                    width={80}
                    height={80}
                    className="rounded-full border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeAvatar}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-20 h-20 border-2 border-dashed rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
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
                        'Upload Picture'
                      )}
                    </span>
                  </Button>
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: Square image, at least 200x200px
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.notification_preferences.emailNewFeedback}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notification_preferences: {
                      ...prev.notification_preferences,
                      emailNewFeedback: e.target.checked,
                    },
                  }))
                }
              />
              <span className="text-sm">New feedback in my projects</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.notification_preferences.emailMentions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notification_preferences: {
                      ...prev.notification_preferences,
                      emailMentions: e.target.checked,
                    },
                  }))
                }
              />
              <span className="text-sm">Someone mentions me in a comment</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.notification_preferences.emailAssignments}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notification_preferences: {
                      ...prev.notification_preferences,
                      emailAssignments: e.target.checked,
                    },
                  }))
                }
              />
              <span className="text-sm">Feedback is assigned to me</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </form>

      <div className="border-t pt-8">
        <h3 className="text-lg font-medium mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                placeholder="Enter new password"
                minLength={8}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              placeholder="Confirm new password"
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
