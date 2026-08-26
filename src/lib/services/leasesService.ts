import { DEMO_LEASES, DEMO_MANAGED_PROPERTIES, DEMO_TENANTS } from '../../data/demoData';
import type { Lease, Tenant } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

function mapLeaseRow(row: Record<string, unknown>): Lease {
  return {
    id: row.id as string,
    property_id: row.property_id as string,
    property_title: (row.properties as { title?: string } | null)?.title,
    unit_id: (row.unit_id as string | null) ?? undefined,
    unit_number: (row.property_units as { unit_number?: string } | null)?.unit_number,
    tenant_id: row.tenant_id as string,
    tenant_name: (row.tenants as { full_name?: string } | null)?.full_name ?? '',
    start_date: row.start_date as string,
    end_date: row.end_date as string,
    monthly_rent: row.monthly_rent as number,
    deposit: (row.deposit as number | null) ?? undefined,
    is_active: row.is_active as boolean,
  };
}

export async function fetchLeasesForProperties(propertyIds: string[]): Promise<Lease[]> {
  if (!propertyIds.length) return [];
  if (isDemoMode()) {
    return DEMO_LEASES.filter((l) => propertyIds.includes(l.property_id));
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('leases')
    .select('*, properties(title), property_units(unit_number), tenants(full_name)')
    .in('property_id', propertyIds)
    .neq('is_active', false)
    .order('start_date', { ascending: false });

  if (error) {
    console.warn('[fetchLeasesForProperties]', error.message);
    return [];
  }

  return (data ?? []).map((row) => mapLeaseRow(row as Record<string, unknown>));
}

export async function fetchTenantsForProperties(propertyIds: string[]): Promise<Tenant[]> {
  if (!propertyIds.length) return [];
  if (isDemoMode()) {
    return DEMO_TENANTS.map((tenant) => {
      const lease = DEMO_LEASES.find((l) => l.tenant_id === tenant.id && l.is_active);
      return {
        ...tenant,
        property_id: lease?.property_id,
        unit_id: lease?.unit_id,
        lease_id: lease?.id,
      };
    }).filter((t) => t.property_id && propertyIds.includes(t.property_id));
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('leases')
    .select('id, property_id, unit_id, tenant_id, tenants(*), properties(title), property_units(unit_number)')
    .in('property_id', propertyIds)
    .neq('is_active', false);

  if (error) {
    console.warn('[fetchTenantsForProperties]', error.message);
    return [];
  }

  const seen = new Set<string>();
  const tenants: Tenant[] = [];

  for (const row of data ?? []) {
    const tenantId = row.tenant_id as string | null;
    if (!tenantId || seen.has(tenantId)) continue;
    seen.add(tenantId);

    const rawTenant = row.tenants as Record<string, unknown> | Record<string, unknown>[] | null;
    const tenantRow = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant;
    if (!tenantRow) continue;

    tenants.push({
      id: tenantId,
      full_name: tenantRow.full_name as string,
      company_name: (tenantRow.company_name as string | null) ?? undefined,
      email: (tenantRow.email as string | null) ?? undefined,
      phone: (tenantRow.phone as string | null) ?? undefined,
      status: tenantRow.status as Tenant['status'],
      property_id: row.property_id as string,
      property_title: (row.properties as { title?: string } | null)?.title,
      unit_number: (row.property_units as { unit_number?: string } | null)?.unit_number,
      unit_id: (row.unit_id as string | null) ?? undefined,
      lease_id: row.id as string,
    });
  }

  return tenants.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
}

export async function fetchLeases(managerId?: string): Promise<Lease[]> {
  if (isDemoMode()) return DEMO_LEASES;

  const client = requireSupabase();
  let query = client
    .from('leases')
    .select('*, properties(title), property_units(unit_number), tenants(full_name)')
    .order('start_date', { ascending: false });

  if (managerId) query = query.eq('manager_id', managerId);

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => mapLeaseRow(row as Record<string, unknown>));
}

export async function createTenant(
  managerId: string,
  payload: { full_name: string; phone?: string; email?: string; property_id?: string },
): Promise<string> {
  const propertyTitle = payload.property_id
    ? DEMO_MANAGED_PROPERTIES.find((p) => p.id === payload.property_id)?.title
    : undefined;

  if (isDemoMode()) {
    const id = `tenant-${Date.now()}`;
    DEMO_TENANTS.unshift({
      id,
      full_name: payload.full_name,
      company_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      status: 'active',
      property_title: propertyTitle,
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('tenants')
    .insert({
      manager_id: managerId,
      full_name: payload.full_name,
      company_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      status: 'active',
      property_id: payload.property_id,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Tenant insert returned no data');
  return data.id as string;
}

export async function createLease(
  managerId: string,
  payload: {
    property_id: string;
    tenant_name: string;
    monthly_rent: number;
    start_date: string;
    end_date: string;
  },
): Promise<string> {
  const propertyTitle = DEMO_MANAGED_PROPERTIES.find((p) => p.id === payload.property_id)?.title;

  if (isDemoMode()) {
    const id = `lease-${Date.now()}`;
    DEMO_LEASES.unshift({
      id,
      property_id: payload.property_id,
      property_title: propertyTitle,
      tenant_id: `tenant-${Date.now()}`,
      tenant_name: payload.tenant_name,
      start_date: payload.start_date,
      end_date: payload.end_date,
      monthly_rent: payload.monthly_rent,
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
      tenant_name: payload.tenant_name,
      monthly_rent: payload.monthly_rent,
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_active: true,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Lease insert returned no data');
  return data.id as string;
}

export async function fetchTenants(managerId?: string): Promise<Tenant[]> {
  if (isDemoMode()) {
    return DEMO_TENANTS.map((tenant) => {
      const lease = DEMO_LEASES.find((l) => l.tenant_id === tenant.id && l.is_active);
      return {
        ...tenant,
        property_id: lease?.property_id,
        unit_id: lease?.unit_id,
        lease_id: lease?.id,
      };
    });
  }

  const client = requireSupabase();
  let query = client.from('tenants').select('*').order('full_name');
  if (managerId) query = query.eq('manager_id', managerId);

  const { data, error } = await query;
  throwIfError(error);

  let leaseByTenant = new Map<
    string,
    { property_id: string; unit_id?: string; lease_id: string; unit_number?: string; property_title?: string }
  >();

  if (managerId && data?.length) {
    const { data: leases, error: leasesError } = await client
      .from('leases')
      .select('id, tenant_id, property_id, unit_id, property_units(unit_number), properties(title)')
      .eq('manager_id', managerId)
      .eq('is_active', true);
    throwIfError(leasesError);
    for (const lease of leases ?? []) {
      if (!lease.tenant_id) continue;
      leaseByTenant.set(lease.tenant_id as string, {
        property_id: lease.property_id as string,
        unit_id: (lease.unit_id as string | null) ?? undefined,
        lease_id: lease.id as string,
        unit_number: (lease.property_units as { unit_number?: string } | null)?.unit_number,
        property_title: (lease.properties as { title?: string } | null)?.title,
      });
    }
  }

  return (data ?? []).map((row) => {
    const lease = leaseByTenant.get(row.id as string);
    return {
      id: row.id,
      full_name: row.full_name,
      company_name: row.company_name ?? undefined,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      status: row.status,
      property_id: lease?.property_id ?? (row.property_id as string | undefined),
      property_title: lease?.property_title,
      unit_number: lease?.unit_number,
      unit_id: lease?.unit_id,
      lease_id: lease?.lease_id,
    };
  });
}
