import { DEMO_LEADS } from '../../data/demoData';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

export interface PropertyLandingPage {
  id: string;
  property_id: string;
  broker_id: string;
  slug: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
}

export interface PublicLandingPage {
  slug: string;
  property_id: string;
  title: string;
  address: string;
  city: string;
  kind: string;
  status: string;
  price: number;
  rooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  floor?: number;
  parking_spots?: number;
  description?: string;
  images: string[];
  documents: string[];
  broker_id: string;
  broker_name: string;
  broker_phone: string;
}

const demoLandingPages = new Map<string, PublicLandingPage>();

function generateSlug(length = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function fetchLandingPageForProperty(
  propertyId: string,
): Promise<PropertyLandingPage | null> {
  if (isDemoMode()) {
    for (const page of demoLandingPages.values()) {
      if (page.property_id === propertyId) {
        return {
          id: `lp-${page.slug}`,
          property_id: page.property_id,
          broker_id: page.broker_id,
          slug: page.slug,
          is_active: true,
          views_count: 0,
          created_at: new Date().toISOString(),
        };
      }
    }
    return null;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_landing_pages')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return data as PropertyLandingPage;
}

export async function createLandingPage(
  propertyId: string,
  brokerId: string,
  propertyData?: Partial<PublicLandingPage>,
): Promise<PropertyLandingPage> {
  const existing = await fetchLandingPageForProperty(propertyId);
  if (existing) return existing;

  const slug = generateSlug();

  if (isDemoMode()) {
    const page: PublicLandingPage = {
      slug,
      property_id: propertyId,
      title: propertyData?.title ?? 'נכס לדוגמה',
      address: propertyData?.address ?? '',
      city: propertyData?.city ?? '',
      kind: propertyData?.kind ?? 'apartment',
      status: propertyData?.status ?? 'for_sale',
      price: propertyData?.price ?? 0,
      rooms: propertyData?.rooms,
      area_sqm: propertyData?.area_sqm,
      description: propertyData?.description,
      images: propertyData?.images ?? [],
      documents: propertyData?.documents ?? [],
      broker_id: brokerId,
      broker_name: propertyData?.broker_name ?? 'מתווך',
      broker_phone: propertyData?.broker_phone ?? '050-0000000',
    };
    demoLandingPages.set(slug, page);
    return {
      id: `lp-${slug}`,
      property_id: propertyId,
      broker_id: brokerId,
      slug,
      is_active: true,
      views_count: 0,
      created_at: new Date().toISOString(),
    };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_landing_pages')
    .insert({ property_id: propertyId, broker_id: brokerId, slug })
    .select('*')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Landing page insert returned no data');
  return data as PropertyLandingPage;
}

export async function getPublicLandingPage(slug: string): Promise<PublicLandingPage | null> {
  if (isDemoMode()) {
    return demoLandingPages.get(slug) ?? null;
  }

  const client = requireSupabase();
  const { data, error } = await client.rpc('get_landing_page_by_slug', { p_slug: slug });
  throwIfError(error);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    slug: row.slug as string,
    property_id: row.property_id as string,
    title: row.title as string,
    address: (row.address as string) ?? '',
    city: (row.city as string) ?? '',
    kind: row.kind as string,
    status: row.status as string,
    price: Number(row.price ?? 0),
    rooms: (row.rooms as number | null) ?? undefined,
    bathrooms: (row.bathrooms as number | null) ?? undefined,
    area_sqm: (row.area_sqm as number | null) ?? undefined,
    floor: (row.floor as number | null) ?? undefined,
    parking_spots: (row.parking_spots as number | null) ?? undefined,
    description: (row.description as string | null) ?? undefined,
    images: (row.images as string[]) ?? [],
    documents: (row.documents as string[]) ?? [],
    broker_id: row.broker_id as string,
    broker_name: (row.broker_name as string) ?? '',
    broker_phone: (row.broker_phone as string) ?? '',
  };
}

export async function submitPublicLead(
  slug: string,
  payload: { full_name: string; phone: string; email?: string; interest?: string },
): Promise<string> {
  if (isDemoMode()) {
    const page = await getPublicLandingPage(slug);
    const id = `lead-${Date.now()}`;
    DEMO_LEADS.unshift({
      id,
      full_name: payload.full_name,
      phone: payload.phone,
      email: payload.email,
      property_id: page?.property_id,
      property_title: page?.title,
      source: page ? `דף נחיתה — ${page.title}` : 'דף נחיתה',
      interest: payload.interest,
      status: 'new',
      created_at: new Date().toISOString(),
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client.rpc('create_public_lead', {
    p_slug: slug,
    p_full_name: payload.full_name,
    p_phone: payload.phone,
    p_email: payload.email ?? null,
    p_interest: payload.interest ?? null,
  });
  throwIfError(error);
  return data as string;
}
