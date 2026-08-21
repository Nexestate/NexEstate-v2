import { DEMO_FAVORITES } from '../../data/demoData.buyer';
import { DEMO_PROPERTIES } from '../../data/demoData';
import { DEMO_BROKER_LISTINGS } from '../../data/demoData.buyer';
import type { FavoriteProperty } from '../../types/domain';
import { PROPERTY_KIND_LABELS } from '../constants';
import type { PropertyKind } from '../../types';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

const demoFavoriteIds = new Set(DEMO_FAVORITES.map((f) => f.id));

function demoSeedForProperty(propertyId: string): Omit<FavoriteProperty, 'added_at'> | null {
  const fav = DEMO_FAVORITES.find((f) => f.id === propertyId);
  if (fav) return fav;

  const prop = DEMO_PROPERTIES.find((p) => p.id === propertyId);
  if (prop) {
    const kind = String(prop.kind ?? 'apartment');
    return {
      id: prop.id,
      title: prop.title,
      city: prop.city,
      address: prop.address,
      price: prop.price ?? prop.monthlyIncome,
      kind: PROPERTY_KIND_LABELS[kind as PropertyKind] ?? kind,
    };
  }

  const listing = DEMO_BROKER_LISTINGS.find((l) => l.id === propertyId);
  if (listing) {
    return {
      id: listing.id,
      title: listing.title,
      city: listing.city,
      address: listing.address,
      price: listing.price,
      kind: listing.kind,
    };
  }

  return null;
}

function mapRow(row: Record<string, unknown>): FavoriteProperty | null {
  const prop = row.property as Record<string, unknown> | null;
  if (!prop?.id) return null;
  const kind = String(prop.kind ?? 'apartment');
  return {
    id: String(prop.id),
    title: String(prop.title ?? ''),
    city: String(prop.city ?? ''),
    address: String(prop.address ?? ''),
    price: Number(prop.price ?? 0),
    kind: PROPERTY_KIND_LABELS[kind as PropertyKind] ?? kind,
    rooms: prop.rooms != null ? Number(prop.rooms) : undefined,
    added_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function fetchFavorites(userId: string): Promise<FavoriteProperty[]> {
  if (isDemoMode()) {
    return DEMO_FAVORITES.filter((f) => demoFavoriteIds.has(f.id)) as FavoriteProperty[];
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_favorites')
    .select(`
      created_at,
      property:properties(id, title, city, address, price, kind, rooms)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  throwIfError(error);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>)).filter(Boolean) as FavoriteProperty[];
}

export async function addFavorite(userId: string, propertyId: string): Promise<void> {
  if (isDemoMode()) {
    if (demoFavoriteIds.has(propertyId)) return;
    demoFavoriteIds.add(propertyId);
    const seed = demoSeedForProperty(propertyId);
    DEMO_FAVORITES.unshift({
      id: propertyId,
      title: seed?.title ?? 'נכס שמור',
      city: seed?.city ?? '',
      address: seed?.address ?? '',
      price: seed?.price ?? 0,
      kind: seed?.kind ?? 'נכס',
      rooms: seed?.rooms,
      added_at: new Date().toISOString(),
    });
    return;
  }

  const client = requireSupabase();
  const { error } = await client.from('property_favorites').insert({
    user_id: userId,
    property_id: propertyId,
  });
  if (error && !error.message.includes('duplicate')) throwIfError(error);
}

export async function removeFavorite(userId: string, propertyId: string): Promise<void> {
  if (isDemoMode()) {
    demoFavoriteIds.delete(propertyId);
    const idx = DEMO_FAVORITES.findIndex((f) => f.id === propertyId);
    if (idx >= 0) DEMO_FAVORITES.splice(idx, 1);
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('property_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', propertyId);
  throwIfError(error);
}
