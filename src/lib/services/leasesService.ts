import { DEMO_LEASES, DEMO_MANAGED_PROPERTIES, DEMO_PROPERTIES, DEMO_TENANTS } from '../../data/demoData';
import type { Lease, PaymentMethod, Tenant, TenantStatus, TenantType } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';
import { extractDocsFromNotes, parseTenantDocumentFiles, stripDocsFromNotes } from './tenantDocumentsService';
import { updateUnit } from './unitsService';

type TenantLeaseContext = {
  property_id?: string;
  property_title?: string;
  unit_id?: string;
  unit_number?: string;
  lease_id?: string;
  monthly_rent?: number;
};

function mapTenantFromRow(row: Record<string, unknown>, lease?: TenantLeaseContext): Tenant {
  return {
    id: row.id as string,
    full_name: row.full_name as string,
    tenant_type: (row.tenant_type as Tenant['tenant_type'] | null) ?? undefined,
    company_name: (row.company_name as string | null) ?? undefined,
    company_number: (row.company_number as string | null) ?? undefined,
    contact_name: (row.contact_name as string | null) ?? undefined,
    id_number: (row.id_number as string | null) ?? undefined,
    email: (row.email as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    notes: stripDocsFromNotes(row.notes as string | null) || undefined,
    document_files:
      parseTenantDocumentFiles(row.document_files).length > 0
        ? parseTenantDocumentFiles(row.document_files)
        : extractDocsFromNotes(row.notes as string | null),
    status: row.status as Tenant['status'],
    property_id: lease?.property_id ?? (row.property_id as string | undefined),
    property_title: lease?.property_title,
    unit_number: lease?.unit_number,
    unit_id: lease?.unit_id,
    lease_id: lease?.lease_id,
    monthly_rent: lease?.monthly_rent,
  };
}

export type CreateTenantWithLeaseInput = {
  property_id: string;
  unit_id: string;
  tenant_type: TenantType;
  full_name: string;
  id_number?: string;
  company_name?: string;
  company_number?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  payment_method?: PaymentMethod;
  deposit?: number;
  pending_document_names?: string[];
};

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
    payment_method: (row.payment_method as PaymentMethod | null) ?? undefined,
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

    tenants.push(
      mapTenantFromRow(tenantRow, {
        property_id: row.property_id as string,
        property_title: (row.properties as { title?: string } | null)?.title,
        unit_number: (row.property_units as { unit_number?: string } | null)?.unit_number,
        unit_id: (row.unit_id as string | null) ?? undefined,
        lease_id: row.id as string,
      }),
    );
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
      broker_id: managerId,
      full_name: payload.full_name,
      company_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      status: 'active',
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Tenant insert returned no data');
  return data.id as string;
}

export async function createTenantWithLease(
  userId: string,
  input: CreateTenantWithLeaseInput,
): Promise<{ tenantId: string; leaseId: string }> {
  const docNote =
    input.pending_document_names?.length ?
      `\nמסמכים שנבחרו (העלאה לכספת בקרוב): ${input.pending_document_names.join(', ')}`
    : '';
  const notes = [input.notes?.trim(), docNote.trim()].filter(Boolean).join('\n') || undefined;

  const displayName =
    input.tenant_type === 'company' ?
      (input.company_name?.trim() || input.full_name.trim())
    : input.full_name.trim();

  if (isDemoMode()) {
    const tenantId = `tenant-${Date.now()}`;
    const leaseId = `lease-${Date.now()}`;
    const propertyTitle = DEMO_MANAGED_PROPERTIES.find((p) => p.id === input.property_id)?.title;

    DEMO_TENANTS.unshift({
      id: tenantId,
      full_name: displayName,
      tenant_type: input.tenant_type,
      company_name: input.company_name ?? displayName,
      email: input.email,
      phone: input.phone,
      status: 'active',
      property_title: propertyTitle,
      property_id: input.property_id,
      unit_id: input.unit_id,
      lease_id: leaseId,
      monthly_rent: input.monthly_rent,
    });

    DEMO_LEASES.unshift({
      id: leaseId,
      property_id: input.property_id,
      property_title: propertyTitle,
      unit_id: input.unit_id,
      tenant_id: tenantId,
      tenant_name: displayName,
      start_date: input.start_date,
      end_date: input.end_date,
      monthly_rent: input.monthly_rent,
      deposit: input.deposit,
      is_active: true,
      payment_method: input.payment_method,
    });

    for (const property of DEMO_PROPERTIES) {
      const unit = property.units.find((u) => u.id === input.unit_id);
      if (unit) {
        unit.unit_status = 'occupied';
        unit.tenant_id = tenantId;
        unit.tenant_name = displayName;
        unit.lease_id = leaseId;
        unit.monthly_rent = input.monthly_rent;
        property.occupiedUnits = property.units.filter((u) => u.unit_status === 'occupied').length;
        break;
      }
    }

    return { tenantId, leaseId };
  }

  const client = requireSupabase();

  const tenantRow: Record<string, unknown> = {
    manager_id: userId,
    broker_id: userId,
    full_name: displayName,
    tenant_type: input.tenant_type,
    id_number: input.id_number?.trim() || null,
    company_name: input.tenant_type === 'company' ? input.company_name?.trim() || displayName : displayName,
    company_number: input.company_number?.trim() || null,
    contact_name: input.contact_name?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    notes: notes ?? null,
    status: 'active',
  };

  const { data: tenantData, error: tenantError } = await client
    .from('tenants')
    .insert(tenantRow)
    .select('id')
    .single();
  throwIfError(tenantError);
  if (!tenantData) throw new ServiceError('Tenant insert returned no data');
  const tenantId = tenantData.id as string;

  const { data: leaseData, error: leaseError } = await client
    .from('leases')
    .insert({
      manager_id: userId,
      property_id: input.property_id,
      unit_id: input.unit_id,
      tenant_id: tenantId,
      start_date: input.start_date,
      end_date: input.end_date,
      monthly_rent: input.monthly_rent,
      deposit: input.deposit ?? null,
      payment_method: input.payment_method ?? null,
      is_active: true,
    })
    .select('id')
    .single();
  throwIfError(leaseError);
  if (!leaseData) throw new ServiceError('Lease insert returned no data');

  await updateUnit(input.unit_id, {
    unit_status: 'occupied',
    tenant_id: tenantId,
    monthly_rent: input.monthly_rent,
  });

  return { tenantId, leaseId: leaseData.id as string };
}

export type AttachTenantToUnitInput = {
  property_id: string;
  unit_id: string;
  tenant_id: string;
  tenant_name: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit?: number;
  payment_method?: PaymentMethod;
};

/** Link an existing tenant to a newly created unit via active lease. */
export async function attachTenantToUnit(userId: string, input: AttachTenantToUnitInput): Promise<string> {
  const propertyTitle = DEMO_MANAGED_PROPERTIES.find((p) => p.id === input.property_id)?.title;

  if (isDemoMode()) {
    const leaseId = `lease-${Date.now()}`;
    DEMO_LEASES.unshift({
      id: leaseId,
      property_id: input.property_id,
      property_title: propertyTitle,
      unit_id: input.unit_id,
      tenant_id: input.tenant_id,
      tenant_name: input.tenant_name,
      start_date: input.start_date,
      end_date: input.end_date,
      monthly_rent: input.monthly_rent,
      deposit: input.deposit,
      is_active: true,
    });
    await updateUnit(input.unit_id, {
      unit_status: 'occupied',
      tenant_id: input.tenant_id,
      monthly_rent: input.monthly_rent,
    });
    return leaseId;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('leases')
    .insert({
      manager_id: userId,
      property_id: input.property_id,
      unit_id: input.unit_id,
      tenant_id: input.tenant_id,
      start_date: input.start_date,
      end_date: input.end_date,
      monthly_rent: input.monthly_rent,
      deposit: input.deposit ?? null,
      payment_method: input.payment_method ?? null,
      is_active: true,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Lease insert returned no data');

  await updateUnit(input.unit_id, {
    unit_status: 'occupied',
    tenant_id: input.tenant_id,
    monthly_rent: input.monthly_rent,
  });

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
    return mapTenantFromRow(row as Record<string, unknown>, lease);
  });
}

export async function fetchLeaseById(id: string): Promise<Lease | undefined> {
  const leases = await fetchLeases();
  return leases.find((l) => l.id === id);
}
export async function fetchTenantById(id: string, managerId?: string): Promise<Tenant | undefined> {
  if (isDemoMode()) {
    const tenants = await fetchTenants(managerId);
    return tenants.find((t) => t.id === id);
  }

  const client = requireSupabase();
  const { data, error } = await client.from('tenants').select('*').eq('id', id).maybeSingle();
  throwIfError(error);
  if (!data) return undefined;

  let leaseCtx: TenantLeaseContext | undefined;
  if (managerId) {
    const { data: lease } = await client
      .from('leases')
      .select('id, property_id, unit_id, monthly_rent, property_units(unit_number), properties(title)')
      .eq('tenant_id', id)
      .eq('manager_id', managerId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (lease) {
      leaseCtx = {
        property_id: lease.property_id as string,
        unit_id: (lease.unit_id as string | null) ?? undefined,
        lease_id: lease.id as string,
        monthly_rent: lease.monthly_rent as number,
        unit_number: (lease.property_units as { unit_number?: string } | null)?.unit_number,
        property_title: (lease.properties as { title?: string } | null)?.title,
      };
    }
  }

  return mapTenantFromRow(data as Record<string, unknown>, leaseCtx);
}
export type TenantUpdatePayload = {
  full_name?: string;
  phone?: string;
  email?: string;
  status?: TenantStatus;
  tenant_type?: TenantType;
  id_number?: string;
  company_name?: string;
  company_number?: string;
  contact_name?: string;
  notes?: string;
};

export async function updateTenant(id: string, payload: TenantUpdatePayload): Promise<void> {
  if (isDemoMode()) {
    const tenant = DEMO_TENANTS.find((t) => t.id === id);
    if (tenant) {
      if (payload.full_name !== undefined) tenant.full_name = payload.full_name;
      if (payload.company_name !== undefined) tenant.company_name = payload.company_name;
      if (payload.phone !== undefined) tenant.phone = payload.phone;
      if (payload.email !== undefined) tenant.email = payload.email;
      if (payload.status !== undefined) tenant.status = payload.status;
      if (payload.tenant_type !== undefined) tenant.tenant_type = payload.tenant_type;
    }
    return;
  }
  const client = requireSupabase();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.full_name !== undefined) update.full_name = payload.full_name;
  if (payload.company_name !== undefined) update.company_name = payload.company_name;
  if (payload.phone !== undefined) update.phone = payload.phone;
  if (payload.email !== undefined) update.email = payload.email;
  if (payload.status !== undefined) update.status = payload.status;
  if (payload.tenant_type !== undefined) update.tenant_type = payload.tenant_type;
  if (payload.id_number !== undefined) update.id_number = payload.id_number;
  if (payload.company_number !== undefined) update.company_number = payload.company_number;
  if (payload.contact_name !== undefined) update.contact_name = payload.contact_name;
  if (payload.notes !== undefined) update.notes = payload.notes;
  const { error } = await client.from('tenants').update(update).eq('id', id);
  throwIfError(error);
}

export type LeaseUpdatePayload = {
  monthly_rent?: number;
  start_date?: string;
  end_date?: string;
  deposit?: number;
  is_active?: boolean;
  unit_id?: string;
  payment_method?: PaymentMethod;
};

export async function updateLease(id: string, payload: LeaseUpdatePayload): Promise<void> {
  if (isDemoMode()) {
    const lease = DEMO_LEASES.find((l) => l.id === id);
    if (lease) Object.assign(lease, payload);
    return;
  }
  const client = requireSupabase();
  const { error } = await client.from('leases').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  throwIfError(error);
}

/** Move an active lease to another unit within the same property. */
export async function reassignLeaseUnit(leaseId: string, newUnitId: string): Promise<void> {
  const lease = await fetchLeaseById(leaseId);
  if (!lease) throw new ServiceError('Lease not found');
  const oldUnitId = lease.unit_id;
  if (oldUnitId === newUnitId) return;

  await updateLease(leaseId, { unit_id: newUnitId });

  if (oldUnitId) {
    await updateUnit(oldUnitId, {
      unit_status: 'available',
      tenant_id: null,
      monthly_rent: undefined,
    });
  }

  await updateUnit(newUnitId, {
    unit_status: 'occupied',
    tenant_id: lease.tenant_id,
    monthly_rent: lease.monthly_rent,
  });
}
