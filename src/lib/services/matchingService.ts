import { DEMO_CLIENTS, DEMO_PROPERTIES } from '../../data/demoData';
import type { Client, Lead } from '../../types/domain';
import {
  demandFromSourceProperty,
  matchClientsForProperty,
  matchPropertiesForClient,
  type MatchClient,
  type MatchProperty,
  type ScoredMatch,
} from '../matching';
import { createNotification } from './notificationsService';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export type LeadMatchResult = {
  sourceProperty: ScoredMatch<MatchProperty> | null;
  additionalMatches: ScoredMatch<MatchProperty>[];
};

const DEMAND_TYPES = new Set(['buyer', 'renter', 'investor']);

async function fetchBrokerProperties(brokerId: string): Promise<MatchProperty[]> {
  if (isDemoMode()) {
    return DEMO_PROPERTIES.map((p) => ({
      id: p.id,
      title: p.title,
      city: p.city,
      kind: p.kind,
      price: p.price,
      rooms: p.rooms,
      area_sqm: p.area_sqm,
      address: p.address,
      status: p.status,
    }));
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, city, kind, price, rooms, area_sqm, address, status')
    .or(`broker_id.eq.${brokerId},owner_id.eq.${brokerId}`)
    .in('status', ['for_sale', 'for_rent']);
  throwIfError(error);
  return (data ?? []).map((row) => mapPropertyRow(row as Record<string, unknown>));
}

async function fetchPropertyById(propertyId: string): Promise<MatchProperty | null> {
  if (isDemoMode()) {
    const p = DEMO_PROPERTIES.find((x) => x.id === propertyId);
    if (!p) return null;
    return {
      id: p.id,
      title: p.title,
      city: p.city,
      kind: p.kind,
      price: p.price,
      rooms: p.rooms,
      area_sqm: p.area_sqm,
      address: p.address,
      status: p.status,
    };
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, city, kind, price, rooms, area_sqm, address, status')
    .eq('id', propertyId)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return mapPropertyRow(data as Record<string, unknown>);
}

function mapPropertyRow(row: Record<string, unknown>): MatchProperty {
  return {
    id: row.id as string,
    title: row.title as string,
    city: (row.city as string) ?? '',
    kind: row.kind as string,
    price: (row.price as number | null) ?? undefined,
    rooms: (row.rooms as number | null) ?? undefined,
    area_sqm: (row.area_sqm as number | null) ?? undefined,
    address: (row.address as string | null) ?? undefined,
    status: (row.status as string | null) ?? undefined,
  };
}

function mapClientRow(row: Record<string, unknown>): MatchClient {
  return {
    id: row.id as string,
    full_name: row.full_name as string,
    type: row.type as string,
    phone: (row.phone as string | null) ?? undefined,
    email: (row.email as string | null) ?? undefined,
    budget_max: (row.budget_max as number | null) ?? undefined,
    preferred_cities: (row.preferred_cities as string[] | null) ?? undefined,
    preferred_kinds: (row.preferred_kinds as string[] | null) ?? undefined,
    min_rooms: (row.min_rooms as number | null) ?? undefined,
    min_area: (row.min_area as number | null) ?? undefined,
  };
}

export async function findMatchesForClient(
  client: Client,
  brokerId: string,
): Promise<ScoredMatch<MatchProperty>[]> {
  if (!DEMAND_TYPES.has(client.type)) return [];

  const demand = {
    budget_max: client.budget_max,
    preferred_cities: client.preferred_cities,
    preferred_kinds: client.preferred_kinds,
    min_rooms: client.min_rooms,
    min_area: client.min_area,
  };

  const properties = await fetchBrokerProperties(brokerId);
  return matchPropertiesForClient(properties, demand);
}

export async function findMatchesForLead(lead: Lead, brokerId: string): Promise<LeadMatchResult> {
  if (!lead.property_id) {
    return { sourceProperty: null, additionalMatches: [] };
  }

  const source = await fetchPropertyById(lead.property_id);
  if (!source) {
    return { sourceProperty: null, additionalMatches: [] };
  }

  const demand = demandFromSourceProperty(source);
  const allProperties = await fetchBrokerProperties(brokerId);
  const scored = matchPropertiesForClient(allProperties, demand);
  const additionalMatches = scored.filter((m) => m.item.id !== lead.property_id);

  return {
    sourceProperty: { item: source, level: 'perfect', score: 100 },
    additionalMatches,
  };
}

export async function notifyLeadPropertyMatches(
  lead: Lead,
  brokerId: string,
  matchCount: number,
): Promise<void> {
  if (isDemoMode()) return;

  const extra =
    matchCount > 0
      ? ` · נמצאו ${matchCount} נכסים נוספים מתאימים`
      : '';

  await createNotification({
    userId: brokerId,
    type: 'match',
    title: 'ליד חדש עם התאמות',
    message: `${lead.full_name} השאיר/ה פרטים${lead.property_title ? ` לגבי ${lead.property_title}` : ''}${extra}`,
    severity: 'info',
    link: '/broker/leads',
  });
}

export async function findMatchingClientsForProperty(
  property: MatchProperty,
  brokerId: string,
): Promise<ScoredMatch<MatchClient>[]> {
  if (isDemoMode()) {
    const clients = DEMO_CLIENTS.filter((c) => DEMAND_TYPES.has(c.type)).map((c) => ({
      id: c.id,
      full_name: c.full_name,
      type: c.type,
      phone: c.phone,
      email: c.email,
      budget_max: c.budget_max,
      preferred_cities: c.preferred_cities,
      preferred_kinds: c.preferred_kinds,
      min_rooms: c.min_rooms,
      min_area: c.min_area,
    }));
    return matchClientsForProperty(clients, property);
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('broker_id', brokerId)
    .in('type', ['buyer', 'renter', 'investor']);
  throwIfError(error);

  const clients = (data ?? []).map((row) => mapClientRow(row as Record<string, unknown>));
  return matchClientsForProperty(clients, property);
}

export async function notifyReverseMatches(
  propertyId: string,
  brokerId: string,
  propertyTitle: string,
): Promise<number> {
  if (isDemoMode()) return 0;

  const supabase = requireSupabase();
  const { data: prop, error } = await supabase
    .from('properties')
    .select('id, title, city, kind, price, rooms, area_sqm, address, status')
    .eq('id', propertyId)
    .maybeSingle();
  throwIfError(error);
  if (!prop) return 0;

  const property = mapPropertyRow(prop as Record<string, unknown>);
  const matches = await findMatchingClientsForProperty(property, brokerId);
  if (!matches.length) return 0;

  await createNotification({
    userId: brokerId,
    type: 'match',
    title: 'קונים מתאימים לנכס',
    message: `נמצאו ${matches.length} לקוחות מתאימים ל"${propertyTitle || property.title}"`,
    severity: 'info',
    link: `/broker/properties/${propertyId}`,
  });

  return matches.length;
}
