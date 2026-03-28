export const PRIMARY_ROLES = ['ceo', 'manager', 'employee'];

export const ROLE_ALIASES = {
  admin: 'ceo',
  hr: 'manager',
  it: 'manager',
};

export const normalizeRole = (role) => {
  if (!role) return 'employee';
  if (PRIMARY_ROLES.includes(role)) return role;
  if (ROLE_ALIASES[role]) return ROLE_ALIASES[role];
  return 'employee';
};

export const isPrivilegedRole = (role) => ['ceo', 'manager'].includes(normalizeRole(role));

export const canApproveForRole = (actorRole, targetRole) => {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);

  if (actor === 'ceo') return true;
  if (actor === 'manager') return target === 'employee';
  return false;
};
