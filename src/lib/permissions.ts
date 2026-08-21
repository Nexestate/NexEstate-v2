export type PermissionLevel = 'view' | 'edit' | 'admin';

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  view: 'צפייה בלבד',
  edit: 'עריכה',
  admin: 'מנהל',
};

export const PERMISSION_DESCRIPTIONS: Record<PermissionLevel, string> = {
  view: 'צפייה בלבד, ללא אפשרות עריכה',
  edit: 'עריכה מלאה, ללא אפשרות למחוק או לשתף',
  admin: 'שליטה מלאה כולל שיתוף הלאה',
};

export function canEditWithPermission(level: PermissionLevel): boolean {
  return level === 'edit' || level === 'admin';
}

export function canAdminWithPermission(level: PermissionLevel): boolean {
  return level === 'admin';
}
