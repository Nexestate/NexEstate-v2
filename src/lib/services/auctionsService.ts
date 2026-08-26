import { DEMO_AUCTIONS, DEMO_LEASES, DEMO_PAYMENTS } from '../../data/demoData';
import type { Auction, Payment, PaymentStatus } from '../../types/domain';
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

export async function fetchPayments(propertyIds?: string[]): Promise<Payment[]> {
  if (isDemoMode()) {
    return DEMO_PAYMENTS.map((payment) => {
      const lease = DEMO_LEASES.find((l) => l.tenant_name === payment.tenant_name && l.is_active);
      return {
        ...payment,
        property_id: lease?.property_id,
        unit_id: lease?.unit_id,
        tenant_id: lease?.tenant_id,
        lease_id: lease?.id,
      };
    });
  }

  const client = requireSupabase();

  let leaseIds: string[] | undefined;
  if (propertyIds?.length) {
    const { data: leases, error: leasesError } = await client
      .from('leases')
      .select('id')
      .in('property_id', propertyIds);
    if (leasesError) {
      console.warn('[fetchPayments] leases lookup failed', leasesError.message);
      return [];
    }
    leaseIds = (leases ?? []).map((l) => l.id as string);
    if (!leaseIds.length) return [];
  }

  let query = client
    .from('lease_payments')
    .select(
      '*, leases(id, property_id, unit_id, tenant_id, tenants(full_name), properties(title), property_units(unit_number))',
    )
    .order('due_date', { ascending: false });

  if (leaseIds) query = query.in('lease_id', leaseIds);

  const { data, error } = await query;
  if (error) {
    console.warn('[fetchPayments]', error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const lease = row.leases as {
      id?: string;
      property_id?: string;
      unit_id?: string;
      tenant_id?: string;
      tenants?: { full_name?: string } | null;
      properties?: { title?: string } | null;
      property_units?: { unit_number?: string } | null;
    } | null;

    return {
      id: row.id,
      tenant_name: lease?.tenants?.full_name ?? '',
      property_title: lease?.properties?.title ?? '',
      property_id: lease?.property_id,
      unit_number: lease?.property_units?.unit_number ?? '',
      unit_id: lease?.unit_id,
      tenant_id: lease?.tenant_id,
      lease_id: lease?.id,
      amount: row.amount,
      due_date: row.due_date ?? row.payment_date,
      status: (row.payment_status as Payment['status']) ?? 'pending',
    };
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

export async function fetchPaymentById(id: string): Promise<Payment | undefined> {
  const payments = await fetchPayments();
  return payments.find((p) => p.id === id);
}
export async function updatePayment(id: string, payload: { amount?: number; due_date?: string; status?: PaymentStatus }): Promise<void> {
  if (isDemoMode()) {
    const payment = DEMO_PAYMENTS.find((p) => p.id === id);
    if (payment) Object.assign(payment, payload);
    return;
  }
  const client = requireSupabase();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.amount !== undefined) update.amount = payload.amount;
  if (payload.due_date !== undefined) update.due_date = payload.due_date;
  if (payload.status !== undefined) update.payment_status = payload.status;
  const { error } = await client.from('lease_payments').update(update).eq('id', id);
  throwIfError(error);
}
