import { DEMO_LEASES, DEMO_TENANTS } from '../../data/demoData';
import type { Lease, Tenant } from '../../types/domain';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

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

  return (data ?? []).map((row) => ({
    id: row.id,
    property_id: row.property_id,
    property_title: (row.properties as { title?: string } | null)?.title,
    unit_id: row.unit_id ?? undefined,
    unit_number: (row.property_units as { unit_number?: string } | null)?.unit_number,
    tenant_id: row.tenant_id,
    tenant_name: (row.tenants as { full_name?: string } | null)?.full_name ?? '',
    start_date: row.start_date,
    end_date: row.end_date,
    monthly_rent: row.monthly_rent,
    deposit: row.deposit ?? undefined,
    is_active: row.is_active,
  }));
}

export async function fetchTenants(managerId?: string): Promise<Tenant[]> {
  if (isDemoMode()) return DEMO_TENANTS;

  const client = requireSupabase();
  let query = client.from('tenants').select('*').order('full_name');
  if (managerId) query = query.eq('manager_id', managerId);

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    company_name: row.company_name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status,
  }));
}
