import type { PropertyKind } from '../types';

export type MatchLevel = 'perfect' | 'high' | 'none';

export interface MatchProperty {
  id: string;
  title: string;
  city: string;
  kind: string;
  price?: number;
  rooms?: number;
  area_sqm?: number;
  address?: string;
  status?: string;
}

export interface ClientDemand {
  budget_max?: number;
  preferred_cities?: string[];
  preferred_kinds?: PropertyKind[] | string[];
  min_rooms?: number;
  min_area?: number;
}

export interface MatchClient {
  id: string;
  full_name: string;
  type: string;
  phone?: string;
  email?: string;
  budget_max?: number;
  preferred_cities?: string[];
  preferred_kinds?: PropertyKind[] | string[];
  min_rooms?: number;
  min_area?: number;
}

export interface ScoredMatch<T> {
  item: T;
  level: MatchLevel;
  score: number;
}

const PRICE_FLEX = 0.1;

function cityMatches(propertyCity: string, preferred: string[]): boolean {
  const normalized = propertyCity.trim().toLowerCase();
  return preferred.some((c) => {
    const city = c.trim().toLowerCase();
    return normalized.includes(city) || city.includes(normalized);
  });
}

function scorePrice(price: number, budgetMax?: number): { level: MatchLevel; score: number } | null {
  if (!budgetMax || budgetMax <= 0) return { level: 'perfect', score: 85 };
  if (price <= budgetMax) return { level: 'perfect', score: 100 };
  const overRatio = (price - budgetMax) / budgetMax;
  if (overRatio <= PRICE_FLEX) {
    return { level: 'high', score: Math.round(100 - overRatio * 200) };
  }
  return null;
}

export function demandFromSourceProperty(property: MatchProperty): ClientDemand {
  return {
    budget_max: property.price,
    preferred_cities: property.city ? [property.city] : undefined,
    preferred_kinds: property.kind ? [property.kind] : undefined,
    min_rooms: property.rooms,
    min_area: property.area_sqm,
  };
}

export function scorePropertyForDemand(
  property: MatchProperty,
  demand: ClientDemand,
): ScoredMatch<MatchProperty> | null {
  if (demand.preferred_kinds?.length && !(demand.preferred_kinds as string[]).includes(property.kind)) {
    return null;
  }
  if (demand.preferred_cities?.length && property.city && !cityMatches(property.city, demand.preferred_cities)) {
    return null;
  }
  if (demand.min_rooms && property.rooms != null && property.rooms < demand.min_rooms) {
    return null;
  }
  if (demand.min_area && property.area_sqm != null && property.area_sqm < demand.min_area) {
    return null;
  }
  if (property.price != null) {
    const priceScore = scorePrice(property.price, demand.budget_max);
    if (!priceScore) return null;
    return { item: property, ...priceScore };
  }
  return { item: property, level: 'perfect', score: 80 };
}

export function scoreClientForProperty(
  client: MatchClient,
  property: MatchProperty,
): ScoredMatch<MatchClient> | null {
  const demand: ClientDemand = {
    budget_max: client.budget_max,
    preferred_cities: client.preferred_cities,
    preferred_kinds: client.preferred_kinds,
    min_rooms: client.min_rooms,
    min_area: client.min_area,
  };
  const result = scorePropertyForDemand(property, demand);
  if (!result) return null;
  return { item: client, level: result.level, score: result.score };
}

export function matchPropertiesForClient(
  properties: MatchProperty[],
  demand: ClientDemand,
): ScoredMatch<MatchProperty>[] {
  return properties
    .map((p) => scorePropertyForDemand(p, demand))
    .filter((m): m is ScoredMatch<MatchProperty> => m !== null)
    .sort((a, b) => b.score - a.score);
}

export function matchClientsForProperty(
  clients: MatchClient[],
  property: MatchProperty,
): ScoredMatch<MatchClient>[] {
  const demandTypes = new Set(['buyer', 'renter', 'investor']);
  return clients
    .filter((c) => demandTypes.has(c.type))
    .map((c) => scoreClientForProperty(c, property))
    .filter((m): m is ScoredMatch<MatchClient> => m !== null)
    .sort((a, b) => b.score - a.score);
}

export const MATCH_LEVEL_LABELS: Record<MatchLevel, string> = {
  perfect: 'התאמה מושלמת',
  high: 'התאמה גבוהה',
  none: 'ללא התאמה',
};

export const MATCH_LEVEL_VARIANT: Record<MatchLevel, 'success' | 'warning' | 'outline'> = {
  perfect: 'success',
  high: 'warning',
  none: 'outline',
};
