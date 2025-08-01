import { useOrganization } from './useOrganization';
import { UserRole } from '@/types/database.types';

interface Permissions {
  canManageTeam: boolean;
  canManageProjects: boolean;
  canManageFeedback: boolean;
  canViewFeedback: boolean;
  canManageOrganization: boolean;
  canDeleteOrganization: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canUpdateMemberRoles: boolean;
  canCreateComments: boolean;
  canDeleteFeedback: boolean;
  canExportData: boolean;
  canManageIntegrations: boolean;
  canViewAnalytics: boolean;
  canManageBilling: boolean;
}

export function usePermissions(): Permissions & { role: UserRole | null; loading: boolean } {
  const { membership, loading } = useOrganization();
  const role = membership?.role || null;

  // Superadmin has all permissions
  if (role === 'superadmin') {
    const allPermissions: Permissions = {
      canManageTeam: true,
      canManageProjects: true,
      canManageFeedback: true,
      canViewFeedback: true,
      canManageOrganization: true,
      canDeleteOrganization: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canUpdateMemberRoles: true,
      canCreateComments: true,
      canDeleteFeedback: true,
      canExportData: true,
      canManageIntegrations: true,
      canViewAnalytics: true,
      canManageBilling: true,
    };

    return {
      ...allPermissions,
      role,
      loading,
    };
  }

  // MVP Permission System: Owner has full control, everyone else is a member
  const isOwner = role === 'owner';
  // Treat admin/member/viewer all as regular members for MVP simplicity
  const isMember = role === 'member' || role === 'admin' || role === 'viewer';
  const isAuthenticated = !!role; // Any valid role means authenticated

  // Define permissions based on simplified roles
  const permissions: Permissions = {
    // Owner-only permissions
    canDeleteOrganization: isOwner,
    canUpdateMemberRoles: isOwner,
    canManageBilling: isOwner,
    canManageTeam: isOwner,
    canManageProjects: isOwner,
    canManageOrganization: isOwner,
    canInviteMembers: isOwner,
    canRemoveMembers: isOwner,
    canManageIntegrations: isOwner,

    // Owner and Member permissions (all non-owners can do these)
    canManageFeedback: isOwner || isMember,
    canCreateComments: isOwner || isMember,
    canExportData: isOwner || isMember,
    canDeleteFeedback: isOwner || isMember,

    // All authenticated users can view
    canViewFeedback: isAuthenticated,
    canViewAnalytics: isAuthenticated,
  };

  return {
    ...permissions,
    role,
    loading,
  };
}

// Helper function to check if user has specific role
export function hasRole(userRole: UserRole | null, allowedRoles: UserRole[]): boolean {
  return userRole !== null && allowedRoles.includes(userRole);
}

// Simplified role check for MVP - only distinguish owner from members
export function isOwnerRole(userRole: UserRole | null): boolean {
  return userRole === 'owner';
}

// Check if user is a member (anyone who isn't owner or superadmin)
export function isMemberRole(userRole: UserRole | null): boolean {
  return userRole !== null && userRole !== 'owner' && userRole !== 'superadmin';
}
