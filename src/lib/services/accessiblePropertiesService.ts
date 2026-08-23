import type { UserRole } from '../../types';
import type { PropertyWithUnits } from '../../types/domain';
import { fetchProperties, fetchProperty } from './propertiesService';
import { fetchSharedWithUser } from './sharedPropertiesService';

export function isSharedOnlyRole(role?: UserRole): boolean {
  return role === 'partner' || role === 'manager';
}

/** Properties the user owns and/or has been shared (with full unit data). */
export async function fetchAccessibleProperties(
  userId: string,
  role?: UserRole,
): Promise<PropertyWithUnits[]> {
  if (isSharedOnlyRole(role)) {
    const shared = await fetchSharedWithUser(userId);
    const details = await Promise.all(
      shared.map(async (s) => {
        try {
          return await fetchProperty(s.id);
        } catch (err) {
          console.warn('[fetchAccessibleProperties] property load failed', s.id, err);
          return undefined;
        }
      }),
    );
    return details.filter((p): p is PropertyWithUnits => Boolean(p));
  }

  const owned = await fetchProperties(userId);
  const shared = await fetchSharedWithUser(userId);
  const ownedIds = new Set(owned.map((p) => p.id));
  const extra = await Promise.all(
    shared
      .filter((s) => !ownedIds.has(s.id))
      .map(async (s) => {
        try {
          return await fetchProperty(s.id);
        } catch {
          return undefined;
        }
      }),
  );
  return [...owned, ...extra.filter((p): p is PropertyWithUnits => Boolean(p))];
}

export async function fetchAccessiblePropertyIds(
  userId: string,
  role?: UserRole,
): Promise<string[]> {
  const properties = await fetchAccessibleProperties(userId, role);
  return properties.map((p) => p.id);
}
