// Approved JUMP PROPTECH role vocabulary.
//
// The API returns canonical staff roles. Legacy values are still accepted
// while older sessions and migrated accounts exist, but nothing new should
// rely on them.

export const STAFF_ROLES = [
  'super_administrator',
  'administrator',
  'property_manager',
  'finance_accountant',
  'maintenance_manager',
  'maintenance_technician',
  'reception_support',
  'auditor',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type LegacyRole = 'superadmin' | 'landlord' | 'agent' | 'maintenance';

export type UserRole = StaffRole | 'tenant' | LegacyRole;

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  super_administrator: 'Super Administrator',
  administrator: 'Administrator',
  property_manager: 'Property Manager',
  finance_accountant: 'Finance / Accountant',
  maintenance_manager: 'Maintenance Manager',
  maintenance_technician: 'Maintenance Technician',
  reception_support: 'Reception / Support',
  auditor: 'Auditor',
};

export const isStaffRole = (role?: string | null): role is StaffRole =>
  !!role && (STAFF_ROLES as readonly string[]).includes(role);

export const isTenantUser = (
  user?: { role?: string | null; account_type?: string | null } | null,
): boolean => user?.account_type === 'tenant' || user?.role === 'tenant';

export const roleLabel = (role?: string | null): string => {
  if (!role) return 'Account';
  if (isStaffRole(role)) return STAFF_ROLE_LABELS[role];
  if (role === 'tenant') return 'Tenant';
  // Legacy labels, only for accounts that have not been migrated yet.
  if (role === 'superadmin') return 'Super Administrator';
  if (role === 'landlord') return 'Property Manager';
  if (role === 'agent') return 'Property Manager';
  if (role === 'maintenance') return 'Maintenance Technician';
  return role;
};

type PermissionUser = {
  role?: string | null;
  staff_role?: string | null;
  permissions?: string[];
};

export const hasPermission = (user: PermissionUser | null, permission: string): boolean => {
  if (!user) return false;
  if (user.permissions?.includes('*')) return true;
  if (user.permissions?.includes(permission)) return true;

  // Fallbacks for sessions stored before permissions were returned.
  return user.staff_role === 'super_administrator' ||
    user.role === 'super_administrator' ||
    user.role === 'superadmin';
};

export const isSuperAdminUser = (user: PermissionUser | null): boolean =>
  !!user && (
    user.staff_role === 'super_administrator' ||
    user.role === 'super_administrator' ||
    user.role === 'superadmin'
  );

export const isAdministratorUser = (user: PermissionUser | null): boolean =>
  !!user && (user.staff_role === 'administrator' || user.role === 'administrator' || user.role === 'admin');
