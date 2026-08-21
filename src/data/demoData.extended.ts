import type {
  Client,
  Lead,
  Lease,
  PropertyWithUnits,
  SigningLink,
  Tenant,
} from '../types/domain';

export * from './demoData.stats';

// ─── Properties & Units ───────────────────────────────────────────

function generateUnits(propertyId: string): PropertyWithUnits['units'] {
  const units: PropertyWithUnits['units'] = [];
  const tenants = [
    'חברת הייטק בע"מ', 'סטארט-אפ XYZ', 'עו"ד כהן ושות', 'רפואה פלוס',
    'דיגיטל מedia', 'פיננסים 360', 'לוגיסטיקה בע"מ', 'אדריכלות גרין',
  ];

  for (let i = 1; i <= 30; i++) {
    const occupied = i <= 28;
    units.push({
      id: `unit-${propertyId}-${i}`,
      property_id: propertyId,
      unit_number: String(i),
      unit_name: i <= 8 ? `משרד ${i}` : `יחידה ${i}`,
      area_sqm: 45 + (i % 5) * 10,
      monthly_rent: 2800 + (i % 7) * 400,
      unit_status: occupied ? 'occupied' : i === 29 ? 'maintenance' : 'available',
      tenant_name: occupied ? tenants[i % tenants.length] : undefined,
    });
  }
  return units;
}

export const DEMO_PROPERTIES: PropertyWithUnits[] = [
  {
    id: 'prop-1',
    title: 'בניין שקטר 30',
    address: 'רחוב שקטר 30',
    city: 'תל אביב',
    kind: 'office',
    status: 'for_rent',
    area_sqm: 4500,
    broker_id: 'demo-user-1',
    created_at: '2025-01-15T10:00:00Z',
    units: generateUnits('prop-1'),
    totalUnits: 30,
    occupiedUnits: 28,
    monthlyIncome: 105_633,
  },
];

export function getDemoProperty(id: string): PropertyWithUnits | undefined {
  return DEMO_PROPERTIES.find((p) => p.id === id);
}

// ─── Leads ──────────────────────────────────────────────────────

export const DEMO_LEADS: Lead[] = [
  {
    id: 'lead-1',
    full_name: 'דני לוי',
    phone: '050-1234567',
    status: 'new',
    source: 'אתר',
    property_title: 'בניין שקטר 30',
    created_at: '2026-08-18T09:00:00Z',
  },
  {
    id: 'lead-2',
    full_name: 'שרה אברהם',
    phone: '052-9876543',
    status: 'contacted',
    source: 'המלצה',
    property_title: 'מתכת 34',
    created_at: '2026-08-17T14:30:00Z',
  },
  {
    id: 'lead-3',
    full_name: 'רון מזרחי',
    phone: '054-5551234',
    status: 'qualified',
    source: 'פייסבוק',
    property_title: 'בניין שקטר 30',
    created_at: '2026-08-16T11:00:00Z',
  },
  {
    id: 'lead-4',
    full_name: 'אורית גולan',
    phone: '053-7778899',
    status: 'won',
    source: 'יד2',
    property_title: 'דירת יוקרה — תל אביב',
    created_at: '2026-08-10T08:00:00Z',
  },
  {
    id: 'lead-5',
    full_name: 'עמית בר',
    phone: '050-3334444',
    status: 'lost',
    source: 'אתר',
    created_at: '2026-08-05T16:00:00Z',
  },
  {
    id: 'lead-6',
    full_name: 'נועה שפירא',
    phone: '058-1112233',
    status: 'new',
    source: 'גוגל',
    property_title: 'בניין שקטר 30',
    created_at: '2026-08-19T07:45:00Z',
  },
];

// ─── Clients ──────────────────────────────────────────────────────

export const DEMO_CLIENTS: Client[] = [
  {
    id: 'client-1',
    full_name: 'יוסי כהן',
    type: 'buyer',
    email: 'yossi@email.com',
    phone: '050-1112222',
    budget_min: 2_000_000,
    budget_max: 3_500_000,
    preferred_cities: ['תל אביב', 'רמת גן'],
    created_at: '2026-07-01T10:00:00Z',
  },
  {
    id: 'client-2',
    full_name: 'חברת אלפא נדל"ן',
    type: 'investor',
    email: 'info@alpha.co.il',
    phone: '03-5556666',
    budget_min: 10_000_000,
    budget_max: 50_000_000,
    preferred_cities: ['תל אביב', 'חיפה'],
    created_at: '2026-06-15T12:00:00Z',
  },
  {
    id: 'client-3',
    full_name: 'מירי לוי',
    type: 'renter',
    email: 'miriam@email.com',
    phone: '052-3334444',
    budget_min: 8_000,
    budget_max: 15_000,
    preferred_cities: ['תל אביב'],
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: 'client-4',
    full_name: 'אבי מזרחי',
    type: 'seller',
    email: 'avi@email.com',
    phone: '054-7778888',
    created_at: '2026-05-20T14:00:00Z',
  },
];

// ─── Tenants & Leases ─────────────────────────────────────────────

export const DEMO_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    full_name: 'חברת הייטק בע"מ',
    company_name: 'חברת הייטק בע"מ',
    email: 'office@hitech.co.il',
    phone: '03-1234567',
    status: 'active',
    unit_number: '1',
    property_title: 'בניין שקטר 30',
  },
  {
    id: 'tenant-2',
    full_name: 'סטארט-אפ XYZ',
    company_name: 'סטארט-אפ XYZ',
    email: 'hello@xyz.io',
    phone: '050-9876543',
    status: 'active',
    unit_number: '2',
    property_title: 'בניין שקטר 30',
  },
  {
    id: 'tenant-3',
    full_name: 'עו"ד כהן ושות',
    company_name: 'עו"ד כהן ושות',
    phone: '03-5551234',
    status: 'ending',
    unit_number: '5',
    property_title: 'בניין שקטר 30',
  },
  {
    id: 'tenant-4',
    full_name: 'רפואה פלוס',
    company_name: 'רפואה פלוס',
    email: 'info@refua.co.il',
    phone: '03-7778899',
    status: 'active',
    unit_number: '8',
    property_title: 'בניין שקטר 30',
  },
];

export const DEMO_LEASES: Lease[] = [
  {
    id: 'lease-1',
    property_id: 'prop-1',
    property_title: 'בניין שקטר 30',
    unit_id: 'unit-prop-1-1',
    unit_number: '1',
    tenant_id: 'tenant-1',
    tenant_name: 'חברת הייטק בע"מ',
    start_date: '2024-01-01',
    end_date: '2026-12-31',
    monthly_rent: 12_500,
    deposit: 37_500,
    is_active: true,
  },
  {
    id: 'lease-2',
    property_id: 'prop-1',
    property_title: 'בניין שקטר 30',
    unit_id: 'unit-prop-1-2',
    unit_number: '2',
    tenant_id: 'tenant-2',
    tenant_name: 'סטארט-אפ XYZ',
    start_date: '2024-06-01',
    end_date: '2027-05-31',
    monthly_rent: 9_800,
    deposit: 29_400,
    is_active: true,
  },
  {
    id: 'lease-3',
    property_id: 'prop-1',
    property_title: 'בניין שקטר 30',
    unit_id: 'unit-prop-1-5',
    unit_number: '5',
    tenant_id: 'tenant-3',
    tenant_name: 'עו"ד כהן ושות',
    start_date: '2023-03-01',
    end_date: '2026-02-28',
    monthly_rent: 8_200,
    deposit: 24_600,
    is_active: true,
  },
  {
    id: 'lease-4',
    property_id: 'prop-1',
    property_title: 'בניין שקטר 30',
    unit_id: 'unit-prop-1-8',
    unit_number: '8',
    tenant_id: 'tenant-4',
    tenant_name: 'רפואה פלוס',
    start_date: '2025-01-01',
    end_date: '2027-12-31',
    monthly_rent: 11_000,
    deposit: 33_000,
    is_active: true,
  },
];

// ─── Signing Links ────────────────────────────────────────────────

export const DEMO_SIGNING_LINKS: SigningLink[] = [
  {
    id: 'sign-1',
    token: 'demo-token',
    client_name: 'יוסי כהן',
    client_phone: '050-1112222',
    agreement_type: 'exclusive',
    commission_percent: 2,
    property_title: 'בניין שקטר 30',
    property_address: 'רחוב שקטר 30, תל אביב',
    status: 'sent',
    expires_at: '2026-09-19T00:00:00Z',
  },
];

export function getDemoSigningLink(token: string): SigningLink | undefined {
  return DEMO_SIGNING_LINKS.find((s) => s.token === token);
}
