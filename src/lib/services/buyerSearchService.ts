import { DEMO_BROKER_LISTINGS } from '../../data/demoData.buyer';
import { DEMO_PROPERTIES } from '../../data/demoData';
import type { PropertyListing, PropertySearchParams } from '../../types/domain';
import { PROPERTY_KIND_LABELS, PROPERTY_STATUS_LABELS } from '../constants';
import type { PropertyKind, PropertyStatus } from '../../types';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

function mapListing(row: Record<string, unknown>): PropertyListing {
  const kind = String(row.kind ?? 'apartment');
  const status = String(row.status ?? 'for_sale');
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    city: String(row.city ?? ''),
    address: String(row.address ?? ''),
    price: Number(row.price ?? 0),
    kind: PROPERTY_KIND_LABELS[kind as PropertyKind] ?? kind,
    kindKey: kind as PropertyKind,
    status,
    statusLabel: PROPERTY_STATUS_LABELS[status as PropertyStatus] ?? status,
    rooms: row.rooms != null ? Number(row.rooms) : null,
    area_sqm: row.area_sqm != null ? Number(row.area_sqm) : null,
  };
}

function demoListings(): PropertyListing[] {
  const fromManaged = DEMO_PROPERTIES.map((p) =>
    mapListing({
      id: p.id,
      title: p.title,
      city: p.city,
      address: p.address,
      price: p.price ?? p.monthlyIncome,
      kind: p.kind,
      status: p.status,
      area_sqm: p.area_sqm,
    }),
  );

  const fromListings = DEMO_BROKER_LISTINGS.map((l) =>
    mapListing({
      id: l.id,
      title: l.title,
      city: l.city,
      address: l.address,
      price: l.price,
      kind: l.kind === 'משרדים' ? 'office' : l.kind === 'מגורים' ? 'apartment' : 'land',
      status: l.status,
      area_sqm: l.area_sqm,
    }),
  );

  const byId = new Map<string, PropertyListing>();
  [...fromManaged, ...fromListings].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values());
}

function matchesQuery(item: PropertyListing, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    item.city.toLowerCase().includes(q) ||
    item.address.toLowerCase().includes(q)
  );
}

function matchesType(item: PropertyListing, listingType?: 'sale' | 'rent'): boolean {
  if (!listingType) return true;
  if (listingType === 'sale') return item.status === 'for_sale';
  if (listingType === 'rent') return item.status === 'for_rent';
  return true;
}

export async function searchPublicProperties(
  params: PropertySearchParams = {},
): Promise<PropertyListing[]> {
  if (isDemoMode()) {
    return demoListings().filter(
      (item) => matchesQuery(item, params.query ?? '') && matchesType(item, params.listingType),
    );
  }

  const client = requireSupabase();
  let query = client
    .from('properties')
    .select('id, title, city, address, price, kind, status, rooms, area_sqm')
    .in('visibility', ['public', 'auction'])
    .order('created_at', { ascending: false });

  if (params.listingType === 'sale') {
    query = query.eq('status', 'for_sale');
  } else if (params.listingType === 'rent') {
    query = query.eq('status', 'for_rent');
  }

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? [])
    .map((row) => mapListing(row as Record<string, unknown>))
    .filter((item) => matchesQuery(item, params.query ?? ''));
}
