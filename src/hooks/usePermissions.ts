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

  // Define permissions based on role
  const permissions: Permissions = {
    // Owner permissions
    canDeleteOrganization: role === 'owner',
    canUpdateMemberRoles: role === 'owner',
    canManageBilling: role === 'owner',

    // Owner and Admin permissions
    canManageTeam: role === 'owner' || role === 'admin',
    canManageProjects: role === 'owner' || role === 'admin',
    canManageOrganization: role === 'owner' || role === 'admin',
    canInviteMembers: role === 'owner' || role === 'admin',
    canRemoveMembers: role === 'owner' || role === 'admin',
    canDeleteFeedback: role === 'owner' || role === 'admin',
    canManageIntegrations: role === 'owner' || role === 'admin',

    // Member permissions (owner, admin, member)
    canManageFeedback: role === 'owner' || role === 'admin' || role === 'member',
    canCreateComments: role === 'owner' || role === 'admin' || role === 'member',
    canExportData: role === 'owner' || role === 'admin' || role === 'member',

    // All roles including viewer
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
