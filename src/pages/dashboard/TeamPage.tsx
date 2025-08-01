import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Crown,
  User,
  Send,
  X,
  Copy,
  FolderOpen,
  CheckSquare,
  Square,
} from 'lucide-react';
import { OrganizationMember, Invitation, UserRole, Project } from '@/types/database.types';
import { toast } from 'sonner';
import { EmailService } from '@/lib/email';

interface MemberWithUser extends OrganizationMember {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export function TeamPage() {
  const { session } = useAuth();
  const { organization, membership } = useOrganization();
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member'); // Always 'member' for MVP
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectAllProjects, setSelectAllProjects] = useState(true);
  const [sending, setSending] = useState(false);
  const [manageProjectsModalOpen, setManageProjectsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null);
  const [memberProjectIds, setMemberProjectIds] = useState<string[]>([]);
  const [savingProjects, setSavingProjects] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    fetchTeamMembers();
    fetchInvitations();
    fetchProjects();
  }, [organization?.id]);

  const fetchTeamMembers = async () => {
    try {
      // Try to use the edge function first
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-team-members?organization_id=${organization!.id}`;

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
            setMembers(functionData.data);
            return;
          }
        }
      } catch (functionError) {
        console.error('Edge function error:', functionError);
      }

      // Fallback to client-side approach if function fails
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization!.id);

      if (membersError) throw membersError;

      const transformedMembers: MemberWithUser[] = (membersData || []).map((member) => ({
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
      setMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', organization!.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
      // Default to all projects selected
      setSelectedProjectIds((data || []).map((p) => p.id));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !organization) return;

    setSending(true);
    try {
      // Check if user is already a member
      const existingMember = members.find((m) => m.user.email === inviteEmail);
      if (existingMember) {
        toast.error('This user is already a team member');
        return;
      }

      // Check if there's a pending invitation
      const existingInvite = invitations.find((i) => i.email === inviteEmail);
      if (existingInvite) {
        toast.error('An invitation has already been sent to this email');
        return;
      }

      // Create invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: organization.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: session!.user.id,
          expires_at: expiresAt.toISOString(),
          project_ids: selectAllProjects ? [] : selectedProjectIds, // Empty array means all projects
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setInvitations([data, ...invitations]);

      // Send invitation email
      const emailResult = await EmailService.sendInvitationEmail({
        invitationId: data.id,
        email: inviteEmail,
        organizationName: organization.name,
        inviterName: session!.user.email?.split('@')[0] || 'Team Admin',
        recipientName: inviteEmail.split('@')[0],
        role: inviteRole,
        expiryDate: expiresAt.toISOString(),
      });

      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
        toast.warning(
          'Invitation created but email could not be sent. You can copy the invitation link to share manually.'
        );
      } else {
        toast.success('Invitation sent successfully');
      }

      // Reset form
      setInviteEmail('');
      setInviteRole('member');
      setSelectedProjectIds(projects.map((p) => p.id));
      setSelectAllProjects(true);
      setInviteModalOpen(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', invitationId);

      if (error) throw error;

      setInvitations(invitations.filter((i) => i.id !== invitationId));
      toast.success('Invitation cancelled');
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const copyInvitationLink = (invitationId: string) => {
    const link = `${window.location.origin}/accept-invitation/${invitationId}`;
    navigator.clipboard.writeText(link);
    toast.success('Invitation link copied to clipboard');
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
    setSelectAllProjects(false);
  };

  const handleSelectAllProjects = () => {
    if (selectAllProjects) {
      setSelectedProjectIds([]);
      setSelectAllProjects(false);
    } else {
      setSelectedProjectIds(projects.map((p) => p.id));
      setSelectAllProjects(true);
    }
  };

  // Role updates removed for MVP - only owners and members exist

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member?.role === 'owner') {
      toast.error('Cannot remove organization owner');
      return;
    }

    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase.from('organization_members').delete().eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter((m) => m.id !== memberId));
      toast.success('Team member removed');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const openManageProjects = async (member: MemberWithUser) => {
    setSelectedMember(member);
    setManageProjectsModalOpen(true);

    // Fetch current project access for this member
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', member.user_id);

      if (error) throw error;

      setMemberProjectIds((data || []).map((pm) => pm.project_id));
    } catch (error) {
      console.error('Error fetching member projects:', error);
      toast.error('Failed to load member project access');
    }
  };

  const handleUpdateMemberProjects = async () => {
    if (!selectedMember) return;

    setSavingProjects(true);
    try {
      // Get current project memberships
      const { data: currentMemberships, error: fetchError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', selectedMember.user_id);

      if (fetchError) throw fetchError;

      const currentProjectIds = (currentMemberships || []).map((pm) => pm.project_id);

      // Determine which projects to add and remove
      const projectsToAdd = memberProjectIds.filter((id) => !currentProjectIds.includes(id));
      const projectsToRemove = currentProjectIds.filter((id) => !memberProjectIds.includes(id));

      // Remove member from projects
      if (projectsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('project_members')
          .delete()
          .eq('user_id', selectedMember.user_id)
          .in('project_id', projectsToRemove);

        if (removeError) throw removeError;
      }

      // Add member to new projects
      if (projectsToAdd.length > 0) {
        const newMemberships = projectsToAdd.map((projectId) => ({
          project_id: projectId,
          user_id: selectedMember.user_id,
          role: 'viewer' as const,
          invited_by: session!.user.id,
        }));

        const { error: addError } = await supabase.from('project_members').insert(newMemberships);

        if (addError) throw addError;
      }

      toast.success('Member project access updated successfully');
      setManageProjectsModalOpen(false);
      setSelectedMember(null);
      setMemberProjectIds([]);
    } catch (error) {
      console.error('Error updating member projects:', error);
      toast.error('Failed to update member project access');
    } finally {
      setSavingProjects(false);
    }
  };

  const canManageTeam = membership?.role === 'owner'; // Only owners can manage team in MVP

  const getRoleIcon = (role: UserRole) => {
    return role === 'owner' ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleColor = (role: UserRole) => {
    return role === 'owner' ? 'text-purple-600 bg-purple-100' : 'text-green-600 bg-green-100';
  };

  const getRoleDisplayName = (role: UserRole) => {
    // For MVP: Only show Owner or Member
    return role === 'owner' ? 'Owner' : 'Member';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094765] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">Manage your team members and their permissions</p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setInviteModalOpen(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-sm text-gray-600">Team Members</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Crown className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {members.filter((m) => m.role === 'owner').length}
              </p>
              <p className="text-sm text-gray-600">Owners</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{invitations.length}</p>
              <p className="text-sm text-gray-600">Pending Invitations</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Team Members</h2>
        <div className="space-y-4">
          {members.map((member) => (
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
                      {getRoleDisplayName(member.role)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
              </div>

              {canManageTeam && member.role !== 'owner' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openManageProjects(member)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Manage project access"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pending Invitations</h2>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Mail className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited as Member • Expires{' '}
                      {invitation.expires_at
                        ? new Date(invitation.expires_at).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
                {canManageTeam && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyInvitationLink(invitation.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy invitation link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel invitation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setInviteModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Invite Team Member</h3>
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e: React.FormEvent) => handleInviteMember(e)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                  />
                </div>

                {/* Role is always 'member' for MVP - field hidden */}
                <input type="hidden" value="member" />

                {/* Project Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Project Access
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {/* Select All Option */}
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <button type="button" onClick={handleSelectAllProjects} className="text-left">
                        {selectAllProjects ? (
                          <CheckSquare className="h-5 w-5 text-[#094765]" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <span className="font-medium">All Projects</span>
                      <span className="text-sm text-gray-500 ml-auto">
                        Grant access to all current and future projects
                      </span>
                    </label>

                    {!selectAllProjects && (
                      <>
                        <div className="border-t my-2"></div>
                        {projects.map((project) => (
                          <label
                            key={project.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <button
                              type="button"
                              onClick={() => toggleProjectSelection(project.id)}
                              className="text-left"
                            >
                              {selectedProjectIds.includes(project.id) ? (
                                <CheckSquare className="h-5 w-5 text-[#094765]" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            <span>{project.name}</span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                  {!selectAllProjects && selectedProjectIds.length === 0 && (
                    <p className="text-sm text-red-600">
                      Please select at least one project or choose "All Projects"
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span> An invitation link will be generated
                    that you can share with the team member. Email notifications will be available
                    soon.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={sending || (!selectAllProjects && selectedProjectIds.length === 0)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </>
      )}

      {/* Manage Projects Modal */}
      {manageProjectsModalOpen && selectedMember && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setManageProjectsModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Manage Project Access</h3>
                <button
                  onClick={() => setManageProjectsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Managing project access for:</p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {selectedMember.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedMember.user.user_metadata?.full_name || selectedMember.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{selectedMember.user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Project Access
                  </Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {projects.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No projects available</p>
                    ) : (
                      projects.map((project) => (
                        <label
                          key={project.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setMemberProjectIds((prev) => {
                                if (prev.includes(project.id)) {
                                  return prev.filter((id) => id !== project.id);
                                } else {
                                  return [...prev, project.id];
                                }
                              });
                            }}
                            className="text-left"
                          >
                            {memberProjectIds.includes(project.id) ? (
                              <CheckSquare className="h-5 w-5 text-[#094765]" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <span>{project.name}</span>
                          {!project.is_active && (
                            <span className="text-xs text-gray-500 ml-auto">(Inactive)</span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  {memberProjectIds.length === 0 && (
                    <p className="text-sm text-amber-600">
                      This member will not have access to any projects
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleUpdateMemberProjects}
                    disabled={savingProjects}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {savingProjects ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        Update Access
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setManageProjectsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
