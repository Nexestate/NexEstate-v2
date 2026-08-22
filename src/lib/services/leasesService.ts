import { DEMO_LEASES, DEMO_MANAGED_PROPERTIES, DEMO_TENANTS } from '../../data/demoData';
import type { Lease, Tenant } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

type TenantRow = Record<string, unknown>;
type LeaseRow = Record<string, unknown> & {
  properties?: { title?: string } | null;
  property_units?: { unit_number?: string; unit_name?: string } | null;
  tenants?: { full_name?: string; company_name?: string } | null;
};

function mapTenant(row: TenantRow, extras?: Partial<Tenant>): Tenant {
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? row.company_name ?? 'שוכר'),
    first_name: (row.first_name as string | undefined) ?? undefined,
    last_name: (row.last_name as string | undefined) ?? undefined,
    tenant_type: (row.tenant_type as Tenant['tenant_type']) ?? 'sole_proprietor',
    company_name: (row.company_name as string | undefined) ?? undefined,
    company_number: (row.company_number as string | undefined) ?? undefined,
    contact_name: (row.contact_name as string | undefined) ?? undefined,
    id_number: (row.id_number as string | undefined) ?? undefined,
    email: (row.email as string | undefined) ?? undefined,
    phone: (row.phone as string | undefined) ?? undefined,
    mobile: (row.mobile as string | undefined) ?? undefined,
    city: (row.city as string | undefined) ?? undefined,
    address: (row.address as string | undefined) ?? undefined,
    notes: (row.notes as string | undefined) ?? undefined,
    status: (row.status as Tenant['status']) ?? 'active',
    rating: (row.rating as Tenant['rating']) ?? 'new',
    ...extras,
  };
}

function mapLease(row: LeaseRow): Lease {
  const tenant = row.tenants;
  return {
    id: String(row.id),
    property_id: String(row.property_id),
    property_title: row.properties?.title,
    unit_id: (row.unit_id as string | undefined) ?? undefined,
    unit_number: row.property_units?.unit_number,
    unit_name: row.property_units?.unit_name,
    tenant_id: String(row.tenant_id ?? ''),
    tenant_name: tenant?.full_name ?? tenant?.company_name ?? '',
    tenant_company: tenant?.company_name,
    start_date: String(row.start_date ?? ''),
    end_date: String(row.end_date ?? ''),
    monthly_rent: Number(row.monthly_rent ?? 0),
    deposit: row.deposit != null ? Number(row.deposit) : undefined,
    notes: (row.notes as string | undefined) ?? undefined,
    include_vat: Boolean(row.include_vat),
    payment_day: row.payment_day != null ? Number(row.payment_day) : undefined,
    payment_method: (row.payment_method as string | undefined) ?? undefined,
    is_active: Boolean(row.is_active),
  };
}

const LEASE_SELECT = '*, properties(title), property_units(unit_number, unit_name), tenants(full_name, company_name)';

export async function fetchLeases(managerId?: string): Promise<Lease[]> {
  if (isDemoMode()) return DEMO_LEASES;

  const client = requireSupabase();
  let query = client.from('leases').select(LEASE_SELECT).order('start_date', { ascending: false });
  if (managerId) query = query.eq('manager_id', managerId);

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []).map((row) => mapLease(row as LeaseRow));
}

export async function fetchLease(id: string): Promise<Lease | undefined> {
  if (isDemoMode()) return DEMO_LEASES.find((l) => l.id === id);

  const client = requireSupabase();
  const { data, error } = await client.from('leases').select(LEASE_SELECT).eq('id', id).maybeSingle();
  throwIfError(error);
  return data ? mapLease(data as LeaseRow) : undefined;
}

export async function fetchTenants(managerId?: string): Promise<Tenant[]> {
  if (isDemoMode()) return DEMO_TENANTS;

  const client = requireSupabase();
  let query = client.from('tenants').select('*').order('full_name');
  if (managerId) query = query.eq('manager_id', managerId);

  const { data, error } = await query;
  throwIfError(error);

  const tenants = (data ?? []).map((row) => mapTenant(row as TenantRow));
  if (!tenants.length) return tenants;

  const { data: leases } = await client
    .from('leases')
    .select('tenant_id, property_id, unit_id, is_active, properties(title), property_units(unit_number)')
    .in(
      'tenant_id',
      tenants.map((t) => t.id),
    )
    .order('is_active', { ascending: false });

  const byTenant = new Map<string, Partial<Tenant>>();
  for (const lease of leases ?? []) {
    const tid = lease.tenant_id as string | undefined;
    if (!tid || byTenant.has(tid)) continue;
    byTenant.set(tid, {
      property_id: (lease.property_id as string | undefined) ?? undefined,
      property_title: (lease.properties as { title?: string } | null)?.title,
      unit_id: (lease.unit_id as string | undefined) ?? undefined,
      unit_number: (lease.property_units as { unit_number?: string } | null)?.unit_number,
    });
  }

  return tenants.map((t) => ({ ...t, ...byTenant.get(t.id) }));
}

export async function fetchTenant(id: string): Promise<Tenant | undefined> {
  if (isDemoMode()) return DEMO_TENANTS.find((t) => t.id === id);

  const client = requireSupabase();
  const { data, error } = await client.from('tenants').select('*').eq('id', id).maybeSingle();
  throwIfError(error);
  if (!data) return undefined;

  const tenant = mapTenant(data as TenantRow);
  const { data: lease } = await client
    .from('leases')
    .select('property_id, unit_id, properties(title), property_units(unit_number)')
    .eq('tenant_id', id)
    .order('is_active', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    ...tenant,
    property_id: (lease?.property_id as string | undefined) ?? undefined,
    property_title: (lease?.properties as { title?: string } | null)?.title,
    unit_id: (lease?.unit_id as string | undefined) ?? undefined,
    unit_number: (lease?.property_units as { unit_number?: string } | null)?.unit_number,
  };
}

export type TenantWrite = {
  full_name: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  city?: string;
  notes?: string;
  tenant_type?: Tenant['tenant_type'];
};

export async function createTenant(managerId: string, payload: TenantWrite & { property_id?: string }): Promise<string> {
  const propertyTitle = payload.property_id
    ? DEMO_MANAGED_PROPERTIES.find((p) => p.id === payload.property_id)?.title
    : undefined;

  if (isDemoMode()) {
    const id = `tenant-${Date.now()}`;
    DEMO_TENANTS.unshift({
      id,
      full_name: payload.full_name,
      company_name: payload.company_name ?? payload.full_name,
      contact_name: payload.contact_name,
      email: payload.email,
      phone: payload.phone,
      mobile: payload.mobile ?? payload.phone,
      status: 'active',
      rating: 'new',
      property_title: propertyTitle,
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('tenants')
    .insert({
      manager_id: managerId,
      broker_id: managerId,
      full_name: payload.full_name,
      first_name: payload.full_name,
      last_name: payload.contact_name ?? '',
      company_name: payload.company_name ?? payload.full_name,
      contact_name: payload.contact_name,
      email: payload.email,
      phone: payload.phone,
      mobile: payload.mobile ?? payload.phone,
      city: payload.city,
      notes: payload.notes,
      tenant_type: payload.tenant_type ?? 'sole_proprietor',
      status: 'active',
      rating: 'new',
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Tenant insert returned no data');
  return data.id as string;
}

export async function updateTenant(id: string, payload: TenantWrite): Promise<void> {
  if (isDemoMode()) {
    const t = DEMO_TENANTS.find((x) => x.id === id);
    if (t) Object.assign(t, payload);
    return;
  }
  const client = requireSupabase();
  const { error } = await client
    .from('tenants')
    .update({
      full_name: payload.full_name,
      first_name: payload.full_name,
      last_name: payload.contact_name ?? '',
      company_name: payload.company_name,
      contact_name: payload.contact_name,
      email: payload.email,
      phone: payload.phone,
      mobile: payload.mobile ?? payload.phone,
      city: payload.city,
      notes: payload.notes,
      tenant_type: payload.tenant_type,
    })
    .eq('id', id);
  throwIfError(error);
}

export async function deleteTenant(id: string): Promise<void> {
  if (isDemoMode()) {
    const idx = DEMO_TENANTS.findIndex((t) => t.id === id);
    if (idx >= 0) DEMO_TENANTS.splice(idx, 1);
    return;
  }
  const client = requireSupabase();
  const { error } = await client.from('tenants').delete().eq('id', id);
  throwIfError(error);
}

export type LeaseWrite = {
  property_id: string;
  tenant_id?: string;
  tenant_name?: string;
  unit_id?: string;
  monthly_rent: number;
  deposit?: number;
  start_date: string;
  end_date: string;
  notes?: string;
};

export async function createLease(managerId: string, payload: LeaseWrite): Promise<string> {
  const propertyTitle = DEMO_MANAGED_PROPERTIES.find((p) => p.id === payload.property_id)?.title;

  if (isDemoMode()) {
    const id = `lease-${Date.now()}`;
    DEMO_LEASES.unshift({
      id,
      property_id: payload.property_id,
      property_title: propertyTitle,
      tenant_id: payload.tenant_id ?? `tenant-${Date.now()}`,
      tenant_name: payload.tenant_name ?? '',
      start_date: payload.start_date,
      end_date: payload.end_date,
      monthly_rent: payload.monthly_rent,
      deposit: payload.deposit,
      is_active: true,
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('leases')
    .insert({
      manager_id: managerId,
      property_id: payload.property_id,
      tenant_id: payload.tenant_id || null,
      unit_id: payload.unit_id || null,
      monthly_rent: payload.monthly_rent,
      deposit: payload.deposit ?? null,
      start_date: payload.start_date,
      end_date: payload.end_date,
      notes: payload.notes ?? payload.tenant_name ?? null,
      is_active: true,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Lease insert returned no data');
  return data.id as string;
}

export async function updateLease(id: string, payload: Partial<LeaseWrite> & { is_active?: boolean }): Promise<void> {
  if (isDemoMode()) {
    const l = DEMO_LEASES.find((x) => x.id === id);
    if (l) Object.assign(l, payload);
    return;
  }
  const client = requireSupabase();
  const { error } = await client
    .from('leases')
    .update({
      monthly_rent: payload.monthly_rent,
      deposit: payload.deposit,
      start_date: payload.start_date,
      end_date: payload.end_date,
      notes: payload.notes,
      is_active: payload.is_active,
      tenant_id: payload.tenant_id,
      unit_id: payload.unit_id,
    })
    .eq('id', id);
  throwIfError(error);
}

export async function deleteLease(id: string): Promise<void> {
  if (isDemoMode()) {
    const idx = DEMO_LEASES.findIndex((l) => l.id === id);
    if (idx >= 0) DEMO_LEASES.splice(idx, 1);
    return;
  }
  const client = requireSupabase();
  const { error } = await client.from('leases').delete().eq('id', id);
  throwIfError(error);
}
