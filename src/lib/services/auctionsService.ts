import { DEMO_AUCTIONS, DEMO_PAYMENTS } from '../../data/demoData';
import type { Auction, Payment } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

export async function fetchAuctions(): Promise<Auction[]> {
  if (isDemoMode()) return DEMO_AUCTIONS;

  const client = requireSupabase();
  const { data, error } = await client
    .from('auctions')
    .select('*, properties(title)')
    .order('starts_at', { ascending: false });

  throwIfError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    property_title: (row.properties as { title?: string } | null)?.title ?? '',
    start_price: row.start_price,
    current_bid: row.current_price ?? row.current_bid ?? undefined,
    status: row.status,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  }));
}

export async function fetchPayments(): Promise<Payment[]> {
  if (isDemoMode()) return DEMO_PAYMENTS;

  const client = requireSupabase();
  const { data, error } = await client
    .from('lease_payments')
    .select('*, leases(id, property_id, tenant_id, monthly_rent, tenants(full_name, company_name), properties(title), property_units(unit_number))')
    .order('due_date', { ascending: false });

  if (!error && data?.length) {
    return data.map((row) => {
      const lease = row.leases as {
        id?: string;
        property_id?: string;
        tenant_id?: string;
        tenants?: { full_name?: string; company_name?: string } | null;
        properties?: { title?: string } | null;
        property_units?: { unit_number?: string } | null;
      } | null;

      return {
        id: row.id,
        tenant_name: lease?.tenants?.company_name || lease?.tenants?.full_name || '',
        property_title: lease?.properties?.title ?? '',
        unit_number: lease?.property_units?.unit_number ?? '',
        amount: row.amount,
        due_date: row.due_date ?? row.payment_date,
        status: (row.payment_status as Payment['status']) ?? 'pending',
        lease_id: lease?.id,
        tenant_id: lease?.tenant_id,
        property_id: lease?.property_id,
      };
    });
  }

  const { data: leases, error: leaseError } = await client
    .from('leases')
    .select('id, property_id, tenant_id, monthly_rent, payment_day, is_active, tenants(full_name, company_name), properties(title), property_units(unit_number)')
    .eq('is_active', true);
  throwIfError(leaseError);

  const today = new Date();
  return (leases ?? []).map((row) => {
    const tenant = row.tenants as { full_name?: string; company_name?: string } | null;
    const due = new Date(today.getFullYear(), today.getMonth(), Number(row.payment_day ?? 1));
    return {
      id: `lease-pay-${row.id}`,
      tenant_name: tenant?.company_name || tenant?.full_name || '',
      property_title: (row.properties as { title?: string } | null)?.title ?? '',
      unit_number: (row.property_units as { unit_number?: string } | null)?.unit_number ?? '',
      amount: Number(row.monthly_rent ?? 0),
      due_date: due.toISOString(),
      status: due < today ? 'overdue' : 'pending',
      lease_id: row.id as string,
      tenant_id: (row.tenant_id as string | undefined) ?? undefined,
      property_id: (row.property_id as string | undefined) ?? undefined,
    } satisfies Payment;
  });
}

export type AuctionInsert = {
  title: string;
  description?: string | null;
  start_price: number;
  reserve_price?: number | null;
  min_increment?: number | null;
  starts_at: string;
  ends_at: string;
  property_id?: string | null;
  creator_id: string;
  status?: string;
};

export async function createAuction(payload: AuctionInsert): Promise<string> {
  if (isDemoMode()) {
    const id = `auc-${Date.now()}`;
    DEMO_AUCTIONS.unshift({
      id,
      title: payload.title,
      property_title: '',
      start_price: payload.start_price,
      status: (payload.status as Auction['status']) ?? 'scheduled',
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('auctions')
    .insert({
      ...payload,
      status: payload.status ?? 'scheduled',
      current_price: payload.start_price,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Auction insert returned no data');
  return data.id as string;
}
