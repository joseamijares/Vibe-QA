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

  // Simplified permissions for MVP - treat admin as member, viewer as limited member
  const isOwner = role === 'owner';
  const isMember = role === 'member' || role === 'admin'; // Treat admin as member for MVP

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

    // Owner and Member permissions
    canManageFeedback: isOwner || isMember,
    canCreateComments: isOwner || isMember,
    canExportData: isOwner || isMember,
    canDeleteFeedback: isOwner || isMember,

    // All authenticated users (including viewer)
    canViewFeedback: !!role,
    canViewAnalytics: !!role,
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

// Role hierarchy helper
export function isRoleHigherOrEqual(userRole: UserRole | null, targetRole: UserRole): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    superadmin: 5,
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[targetRole];
}
