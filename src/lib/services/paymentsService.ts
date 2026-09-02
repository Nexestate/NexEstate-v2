import { invokeEdgeFunction } from './edgeFunctions';
import { DEMO_LEASES, DEMO_PAYMENTS } from '../../data/demoData';
import type {
  InvoiceResult,
  OutboundWebhook,
  Payment,
  PaymentIntegration,
  PaymentProviderType,
  PaymentProviderVendor,
  PaymentRequestType,
  PaymentSessionResult,
  PaymentStatus,
  PublicPaymentCheckout,
} from '../../types/domain';
import { createNotification } from './notificationsService';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

const demoCheckouts = new Map<string, PublicPaymentCheckout>();

function seedDemoCheckouts() {
  if (!isDemoMode()) return;
  for (const payment of DEMO_PAYMENTS) {
    if (!payment.checkout_slug) continue;
    const lease = DEMO_LEASES.find((l) => l.id === payment.lease_id);
    demoCheckouts.set(payment.checkout_slug, {
      id: payment.id,
      amount: payment.amount,
      due_date: payment.due_date,
      payment_type: payment.payment_type ?? 'rent',
      payment_status: payment.status,
      notes: payment.notes,
      tenant_name: payment.tenant_name,
      property_title: payment.property_title ?? lease?.property_title ?? '',
      unit_number: payment.unit_number,
      manager_name: 'חברת ניהול NexEstate',
      bank_name: 'בנק לאומי',
      bank_branch: '800',
      bank_account: '123456/78',
      bank_account_holder: 'NexEstate בע״מ',
    });
  }
}

seedDemoCheckouts();

function generateCheckoutSlug(length = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function mapPaymentRow(
  row: Record<string, unknown>,
  lease: {
    id?: string;
    property_id?: string;
    unit_id?: string;
    tenant_id?: string;
    tenants?: { full_name?: string } | null;
    properties?: { title?: string } | null;
    property_units?: { unit_number?: string } | null;
  } | null,
): Payment {
  return {
    id: row.id as string,
    tenant_name: lease?.tenants?.full_name ?? '',
    property_title: lease?.properties?.title ?? '',
    property_id: (row.property_id as string | null) ?? lease?.property_id,
    unit_number: lease?.property_units?.unit_number ?? '',
    unit_id: lease?.unit_id,
    tenant_id: (row.tenant_id as string | null) ?? lease?.tenant_id,
    lease_id: lease?.id,
    amount: row.amount as number,
    due_date: (row.due_date as string) ?? (row.payment_date as string),
    payment_date: (row.payment_date as string | null) ?? undefined,
    status: (row.payment_status as Payment['status']) ?? 'pending',
    payment_method: (row.payment_method as string | null) ?? undefined,
    payment_type: (row.payment_type as string | null) ?? undefined,
    checkout_slug: (row.checkout_slug as string | null) ?? undefined,
    pdf_invoice_url: (row.pdf_invoice_url as string | null) ?? undefined,
    invoice_number: (row.invoice_number as string | null) ?? undefined,
    transfer_proof_url: (row.transfer_proof_url as string | null) ?? undefined,
    receipt_number: (row.receipt_number as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    paid_at: (row.paid_at as string | null) ?? undefined,
  };
}

export async function fetchPayments(propertyIds?: string[]): Promise<Payment[]> {
  if (isDemoMode()) {
    let rows = DEMO_PAYMENTS.map((payment) => {
      const lease = DEMO_LEASES.find((l) => l.tenant_name === payment.tenant_name && l.is_active);
      return {
        ...payment,
        property_id: lease?.property_id,
        unit_id: lease?.unit_id,
        tenant_id: lease?.tenant_id,
        lease_id: lease?.id,
      };
    });
    if (propertyIds?.length) {
      rows = rows.filter((p) => p.property_id && propertyIds.includes(p.property_id));
    }
    return rows;
  }

  const client = requireSupabase();
  let query = client
    .from('lease_payments')
    .select(
      '*, leases(id, property_id, unit_id, tenant_id, tenants(full_name), properties(title), property_units(unit_number))',
    )
    .order('due_date', { ascending: false });
  if (propertyIds?.length) {
    query = query.in('property_id', propertyIds);
  }
  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => {
    const lease = row.leases as Parameters<typeof mapPaymentRow>[1];
    return mapPaymentRow(row as Record<string, unknown>, lease);
  });
}

export async function fetchPaymentById(id: string): Promise<Payment | undefined> {
  const payments = await fetchPayments();
  return payments.find((p) => p.id === id);
}

export type PaymentInsert = {
  lease_id: string;
  amount: number;
  due_date?: string;
  payment_date?: string;
  payment_method?: string;
  payment_status?: PaymentStatus;
  payment_type?: PaymentRequestType;
  receipt_number?: string;
  notes?: string;
  created_by: string;
  with_checkout_link?: boolean;
};

export async function createPayment(payload: PaymentInsert): Promise<{ id: string; checkout_slug?: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const paymentDate = payload.payment_date ?? payload.due_date ?? today;
  const checkoutSlug = payload.with_checkout_link ? generateCheckoutSlug() : undefined;

  if (isDemoMode()) {
    const id = `pay-${Date.now()}`;
    const lease = DEMO_LEASES.find((l) => l.id === payload.lease_id);
    DEMO_PAYMENTS.unshift({
      id,
      tenant_name: lease?.tenant_name ?? '',
      property_title: lease?.property_title ?? '',
      unit_number: lease?.unit_number ?? '',
      amount: payload.amount,
      due_date: payload.due_date ?? paymentDate,
      payment_date: paymentDate,
      status: payload.payment_status ?? 'pending',
      payment_method: payload.payment_method,
      payment_type: payload.payment_type,
      checkout_slug: checkoutSlug,
      receipt_number: payload.receipt_number,
      notes: payload.notes,
      lease_id: payload.lease_id,
      property_id: lease?.property_id,
      tenant_id: lease?.tenant_id,
    });
    if (checkoutSlug && lease) {
      demoCheckouts.set(checkoutSlug, {
        id,
        amount: payload.amount,
        due_date: payload.due_date,
        payment_type: payload.payment_type ?? 'rent',
        payment_status: payload.payment_status ?? 'pending',
        notes: payload.notes,
        tenant_name: lease.tenant_name,
        property_title: lease.property_title ?? '',
        manager_name: 'חברת ניהול NexEstate',
        bank_name: 'בנק לאומי',
        bank_branch: '800',
        bank_account: '123456/78',
        bank_account_holder: 'NexEstate בע״מ',
      });
    }
    return { id, checkout_slug: checkoutSlug };
  }

  const client = requireSupabase();
  const { data: lease, error: leaseErr } = await client
    .from('leases')
    .select('property_id, tenant_id, manager_id')
    .eq('id', payload.lease_id)
    .maybeSingle();
  throwIfError(leaseErr);

  const { data, error } = await client
    .from('lease_payments')
    .insert({
      lease_id: payload.lease_id,
      amount: payload.amount,
      due_date: payload.due_date ?? paymentDate,
      payment_date: paymentDate,
      payment_method: payload.payment_method ?? null,
      payment_status: payload.payment_status ?? 'pending',
      payment_type: payload.payment_type ?? 'rent',
      receipt_number: payload.receipt_number ?? null,
      notes: payload.notes ?? null,
      created_by: payload.created_by,
      checkout_slug: checkoutSlug ?? null,
      property_id: lease?.property_id ?? null,
      tenant_id: lease?.tenant_id ?? null,
      manager_id: lease?.manager_id ?? null,
    })
    .select('id, checkout_slug')
    .single();

  throwIfError(error);
  if (!data) throw new ServiceError('Payment insert returned no data');
  return { id: data.id as string, checkout_slug: (data.checkout_slug as string | null) ?? undefined };
}

export async function createPaymentRequest(
  managerId: string,
  payload: {
    lease_id: string;
    amount: number;
    due_date: string;
    payment_type: PaymentRequestType;
    notes?: string;
  },
): Promise<{ id: string; checkout_slug: string }> {
  const result = await createPayment({
    ...payload,
    created_by: managerId,
    payment_status: 'pending',
    with_checkout_link: true,
  });
  if (!result.checkout_slug) throw new ServiceError('Failed to generate checkout slug');
  return { id: result.id, checkout_slug: result.checkout_slug };
}

export async function updatePayment(
  id: string,
  payload: {
    amount?: number;
    due_date?: string;
    payment_date?: string;
    status?: PaymentStatus;
    payment_method?: string;
    receipt_number?: string;
    notes?: string;
  },
): Promise<void> {
  if (isDemoMode()) {
    const payment = DEMO_PAYMENTS.find((p) => p.id === id);
    if (payment) Object.assign(payment, payload);
    return;
  }

  const client = requireSupabase();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.amount !== undefined) update.amount = payload.amount;
  if (payload.due_date !== undefined) update.due_date = payload.due_date;
  if (payload.payment_date !== undefined) update.payment_date = payload.payment_date;
  if (payload.status !== undefined) update.payment_status = payload.status;
  if (payload.payment_method !== undefined) update.payment_method = payload.payment_method;
  if (payload.receipt_number !== undefined) update.receipt_number = payload.receipt_number;
  if (payload.notes !== undefined) update.notes = payload.notes;

  const { error } = await client.from('lease_payments').update(update).eq('id', id);
  throwIfError(error);
}

export async function confirmTransferPayment(paymentId: string): Promise<void> {
  if (isDemoMode()) {
    const payment = DEMO_PAYMENTS.find((p) => p.id === paymentId);
    if (payment) {
      payment.status = 'paid';
      payment.paid_at = new Date().toISOString();
    }
    return;
  }

  const client = requireSupabase();
  const { data: row, error: fetchErr } = await client
    .from('lease_payments')
    .select('checkout_slug, manager_id, amount, tenant_id, tenants(full_name)')
    .eq('id', paymentId)
    .maybeSingle();
  throwIfError(fetchErr);

  const slug = row?.checkout_slug as string | undefined;
  if (slug) {
    const { error } = await client.rpc('complete_payment_checkout', {
      p_slug: slug,
      p_method: 'transfer',
    });
    throwIfError(error);
    void issueInvoice(paymentId).catch(() => undefined);
    return;
  }

  await updatePayment(paymentId, { status: 'paid' });
  if (row?.manager_id) {
    const tenantName =
      (row.tenants as { full_name?: string } | null)?.full_name ?? 'שוכר';
    await createNotification({
      userId: row.manager_id as string,
      type: 'payment',
      title: 'תשלום אומת',
      message: `${tenantName} — ${row.amount} ₪`,
      link: '/broker/payments',
    });
  }
  void issueInvoice(paymentId).catch(() => undefined);
}

export async function getPublicPaymentCheckout(slug: string): Promise<PublicPaymentCheckout | null> {
  if (isDemoMode()) {
    return demoCheckouts.get(slug) ?? null;
  }

  const client = requireSupabase();
  const { data, error } = await client.rpc('get_payment_checkout_by_slug', { p_slug: slug });
  throwIfError(error);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    amount: Number(row.amount),
    due_date: (row.due_date as string | null) ?? undefined,
    payment_type: (row.payment_type as string) ?? 'rent',
    payment_status: (row.payment_status as string) ?? 'pending',
    notes: (row.notes as string | null) ?? undefined,
    tenant_name: (row.tenant_name as string) ?? '',
    property_title: (row.property_title as string) ?? '',
    property_address: (row.property_address as string | null) ?? undefined,
    unit_number: (row.unit_number as string | null) ?? undefined,
    manager_name: (row.manager_name as string) ?? '',
    bank_name: (row.bank_name as string | null) ?? undefined,
    bank_branch: (row.bank_branch as string | null) ?? undefined,
    bank_account: (row.bank_account as string | null) ?? undefined,
    bank_account_holder: (row.bank_account_holder as string | null) ?? undefined,
  };
}

export async function submitPaymentTransferProof(slug: string, proofUrl: string): Promise<boolean> {
  if (isDemoMode()) {
    const checkout = demoCheckouts.get(slug);
    if (checkout) checkout.payment_status = 'pending_verification';
    return true;
  }

  const client = requireSupabase();
  const { data, error } = await client.rpc('submit_payment_transfer_proof', {
    p_slug: slug,
    p_proof_url: proofUrl,
  });
  throwIfError(error);
  return Boolean(data);
}

export async function initPaymentSession(slug: string): Promise<PaymentSessionResult> {
  if (isDemoMode()) {
    return { mode: 'simulate', checkout_slug: slug, session_id: `demo-${slug}` };
  }

  const data = await invokeEdgeFunction<PaymentSessionResult>('init-payment-session', {
    checkout_slug: slug,
  });
  return data;
}

export async function completePublicPayment(
  slug: string,
  method = 'credit',
): Promise<{ success: boolean; invoice_number?: string; pdf_invoice_url?: string }> {
  if (isDemoMode()) {
    const checkout = demoCheckouts.get(slug);
    if (checkout) {
      checkout.payment_status = 'paid';
      const payment = DEMO_PAYMENTS.find((p) => p.checkout_slug === slug);
      if (payment) {
        payment.status = 'paid';
        payment.invoice_number = `INV-DEMO-${Date.now().toString(36).toUpperCase()}`;
        payment.pdf_invoice_url = '#';
      }
    }
    return { success: true, invoice_number: 'INV-DEMO', pdf_invoice_url: '#' };
  }

  const data = await invokeEdgeFunction<{
    success: boolean;
    invoice_number?: string;
    pdf_invoice_url?: string;
  }>('complete-payment-checkout', {
    checkout_slug: slug,
    method,
    issue_invoice: true,
  });
  return data;
}

export async function simulateCardPayment(slug: string): Promise<boolean> {
  const result = await completePublicPayment(slug, 'credit');
  return result.success;
}

export async function issueInvoice(paymentId: string): Promise<InvoiceResult> {
  if (isDemoMode()) {
    const payment = DEMO_PAYMENTS.find((p) => p.id === paymentId);
    if (payment && !payment.invoice_number) {
      payment.invoice_number = `INV-DEMO-${Date.now().toString(36).toUpperCase()}`;
      payment.pdf_invoice_url = '#';
    }
    return {
      success: true,
      invoice_number: payment?.invoice_number,
      pdf_invoice_url: payment?.pdf_invoice_url,
    };
  }

  return invokeEdgeFunction<InvoiceResult>('issue-invoice', { payment_id: paymentId });
}

export async function fetchPaymentIntegrations(ownerId: string): Promise<PaymentIntegration[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('payment_integrations')
    .select('id, owner_id, provider_type, vendor, display_name, is_active, is_sandbox, status, last_error, connected_at')
    .eq('owner_id', ownerId);
  throwIfError(error);
  return (data ?? []) as PaymentIntegration[];
}

export async function upsertPaymentIntegration(
  ownerId: string,
  payload: {
    provider_type: PaymentProviderType;
    vendor: PaymentProviderVendor;
    display_name?: string;
    is_active?: boolean;
    is_sandbox?: boolean;
    credentials?: Record<string, string>;
  },
): Promise<void> {
  if (isDemoMode()) return;

  const client = requireSupabase();
  const { error } = await client.from('payment_integrations').upsert(
    {
      owner_id: ownerId,
      provider_type: payload.provider_type,
      vendor: payload.vendor,
      display_name: payload.display_name ?? null,
      is_active: payload.is_active ?? false,
      is_sandbox: payload.is_sandbox ?? true,
      credentials: payload.credentials ?? {},
      status: payload.credentials?.api_key ? 'connected' : 'disconnected',
      connected_at: payload.credentials?.api_key ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id,provider_type,vendor' },
  );
  throwIfError(error);
}

export async function fetchOutboundWebhooks(ownerId: string): Promise<OutboundWebhook[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('outbound_webhooks')
    .select('id, owner_id, url, events, is_active, created_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as OutboundWebhook[];
}

export async function upsertOutboundWebhook(
  ownerId: string,
  payload: { id?: string; url: string; is_active?: boolean; events?: string[] },
): Promise<void> {
  if (isDemoMode()) return;

  const client = requireSupabase();
  const row = {
    owner_id: ownerId,
    url: payload.url.trim(),
    is_active: payload.is_active ?? true,
    events: payload.events ?? ['payment.success'],
  };

  if (payload.id) {
    const { error } = await client.from('outbound_webhooks').update(row).eq('id', payload.id);
    throwIfError(error);
    return;
  }

  const { error } = await client.from('outbound_webhooks').insert(row);
  throwIfError(error);
}

export async function deleteOutboundWebhook(id: string): Promise<void> {
  if (isDemoMode()) return;
  const client = requireSupabase();
  const { error } = await client.from('outbound_webhooks').delete().eq('id', id);
  throwIfError(error);
}

export function getPaymentCheckoutUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/pay/${slug}`;
  }
  return `/pay/${slug}`;
}
