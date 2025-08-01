'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  Trash2,
  Shield,
  Eye,
  Edit,
  Plus,
  X,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import { ProjectMember, OrganizationMember, ProjectRole } from '@/types/database.types';
import { toast } from 'sonner';

interface ProjectTeamSettingsProps {
  projectId: string;
}

interface ProjectMemberWithUser extends ProjectMember {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export function ProjectTeamSettings({ projectId }: ProjectTeamSettingsProps) {
  const { session } = useAuth();
  const { organization, membership } = useOrganization();
  const [projectMembers, setProjectMembers] = useState<ProjectMemberWithUser[]>([]);
  const [availableMembers, setAvailableMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectId || !organization) return;
    fetchProjectMembers();
    fetchAvailableMembers();
  }, [projectId, organization]);

  const fetchProjectMembers = async () => {
    try {
      // Try edge function first
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-project-members?project_id=${projectId}`;

      try {
        const response = await fetch(functionUrl, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const functionData = await response.json();
          if (functionData?.data) {
            setProjectMembers(functionData.data);
            return;
          }
        }
      } catch (functionError) {
        console.error('Edge function error:', functionError);
      }

      // Fallback to client-side
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      const transformedMembers: ProjectMemberWithUser[] = (data || []).map((member) => ({
        ...member,
        user: {
          id: member.user_id,
          email:
            member.user_id === session?.user?.id && session?.user?.email
              ? session.user.email
              : `User ${member.user_id.slice(0, 8)}`,
          user_metadata: {},
        },
      }));

      setProjectMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching project members:', error);
      toast.error('Failed to load project team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization!.id);

      if (error) throw error;

      // Filter out members who are already in the project
      const existingUserIds = projectMembers.map((pm) => pm.user_id);
      const available = (data || []).filter((om) => !existingUserIds.includes(om.user_id));

      setAvailableMembers(available);
    } catch (error) {
      console.error('Error fetching available members:', error);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembersToAdd.length === 0) return;

    setSaving(true);
    try {
      const membersToAdd = selectedMembersToAdd.map((userId) => ({
        project_id: projectId,
        user_id: userId,
        role: 'viewer' as ProjectRole,
        invited_by: session!.user.id,
      }));

      const { error } = await supabase.from('project_members').insert(membersToAdd);

      if (error) throw error;

      toast.success(`Added ${selectedMembersToAdd.length} member(s) to the project`);
      setSelectedMembersToAdd([]);
      setAddMemberModalOpen(false);
      await fetchProjectMembers();
      await fetchAvailableMembers();
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add members to the project');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: ProjectRole) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setProjectMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast.success('Member role updated');
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    // Don't allow removing organization owners
    const isOrgOwner = membership?.role === 'owner' && userId === session?.user?.id;
    if (isOrgOwner) {
      toast.error('Cannot remove organization owner from projects');
      return;
    }

    if (!confirm('Are you sure you want to remove this member from the project?')) return;

    try {
      const { error } = await supabase.from('project_members').delete().eq('id', memberId);

      if (error) throw error;

      setProjectMembers((prev) => prev.filter((m) => m.id !== memberId));
      await fetchAvailableMembers();
      toast.success('Member removed from project');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembersToAdd((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getRoleIcon = (role: ProjectRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-100';
      case 'editor':
        return 'text-blue-600 bg-blue-100';
      case 'viewer':
        return 'text-gray-600 bg-gray-100';
    }
  };

  const canManageProjectTeam = membership?.role === 'owner' || membership?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Team</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage who has access to this project and their permissions
          </p>
        </div>
        {canManageProjectTeam && availableMembers.length > 0 && (
          <Button
            onClick={() => setAddMemberModalOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Members
          </Button>
        )}
      </div>

      {/* Team Members List */}
      <Card className="p-6">
        <div className="space-y-4">
          {projectMembers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No team members assigned to this project yet.
            </p>
          ) : (
            projectMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {member.user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {member.user.user_metadata?.full_name || member.user.email}
                      </p>
                      <span
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          member.role
                        )}`}
                      >
                        {getRoleIcon(member.role)}
                        {member.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>

                {canManageProjectTeam && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as ProjectRole)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Members Modal */}
      {addMemberModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setAddMemberModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Team Members</h3>
                <button
                  onClick={() => setAddMemberModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select organization members to add to this project:
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {availableMembers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      All organization members are already in this project
                    </p>
                  ) : (
                    availableMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={() => toggleMemberSelection(member.user_id!)}
                          className="text-left"
                        >
                          {selectedMembersToAdd.includes(member.user_id!) ? (
                            <CheckSquare className="h-5 w-5 text-[#094765]" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <span>User {member.user_id?.slice(0, 8)}</span>
                        <span className="text-sm text-gray-500 ml-auto">{member.role}</span>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAddMembers}
                    disabled={saving || selectedMembersToAdd.length === 0}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add {selectedMembersToAdd.length} Member
                        {selectedMembersToAdd.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddMemberModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Role Descriptions */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-medium text-sm mb-2">Project Role Permissions</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 mt-0.5 text-gray-500" />
            <div>
              <span className="font-medium">Viewer:</span> Can view project feedback and comments
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Edit className="h-4 w-4 mt-0.5 text-blue-500" />
            <div>
              <span className="font-medium">Editor:</span> Can manage feedback, add comments, and
              update statuses
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-purple-500" />
            <div>
              <span className="font-medium">Admin:</span> Full project control including settings
              and team management
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
