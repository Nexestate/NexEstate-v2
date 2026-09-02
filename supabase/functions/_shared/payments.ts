import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface PaymentRow {
  id: string;
  amount: number;
  checkout_slug: string | null;
  manager_id: string | null;
  payment_status: string;
  tenant_id?: string | null;
  invoice_number?: string | null;
  pdf_invoice_url?: string | null;
}

export async function getPaymentBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PaymentRow | null> {
  const { data, error } = await supabase
    .from('lease_payments')
    .select('id, amount, checkout_slug, manager_id, payment_status, tenant_id, invoice_number, pdf_invoice_url')
    .eq('checkout_slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as PaymentRow | null;
}

export async function getPaymentById(
  supabase: SupabaseClient,
  paymentId: string,
): Promise<PaymentRow | null> {
  const { data, error } = await supabase
    .from('lease_payments')
    .select('id, amount, checkout_slug, manager_id, payment_status, tenant_id, invoice_number, pdf_invoice_url')
    .eq('id', paymentId)
    .maybeSingle();
  if (error) throw error;
  return data as PaymentRow | null;
}

export async function logPaymentEvent(
  supabase: SupabaseClient,
  paymentId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('payment_events').insert({
    payment_id: paymentId,
    event_type: eventType,
    payload,
  });
  if (error) throw error;
}

export async function getActiveIntegration(
  supabase: SupabaseClient,
  ownerId: string,
  providerType: 'acquiring' | 'invoicing',
  vendor?: string,
) {
  let query = supabase
    .from('payment_integrations')
    .select('id, vendor, is_active, is_sandbox, credentials, status')
    .eq('owner_id', ownerId)
    .eq('provider_type', providerType)
    .eq('is_active', true);

  if (vendor) query = query.eq('vendor', vendor);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as {
    id: string;
    vendor: string;
    is_active: boolean;
    is_sandbox: boolean;
    credentials: Record<string, string>;
    status: string;
  } | null;
}

export async function deliverOutboundWebhooks(
  supabase: SupabaseClient,
  ownerId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { data: hooks, error } = await supabase
    .from('outbound_webhooks')
    .select('id, url, secret, events')
    .eq('owner_id', ownerId)
    .eq('is_active', true);
  if (error) throw error;

  for (const hook of hooks ?? []) {
    const events = (hook.events as string[] | null) ?? ['payment.success'];
    if (!events.includes(eventType)) continue;

    try {
      const res = await fetch(hook.url as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(hook.secret ? { 'X-Webhook-Secret': hook.secret as string } : {}),
        },
        body: JSON.stringify({ event: eventType, ...payload, timestamp: new Date().toISOString() }),
      });
      if (!res.ok) {
        console.warn(`Webhook ${hook.id} failed: ${res.status}`);
      }
    } catch (err) {
      console.warn(`Webhook ${hook.id} error:`, err);
    }
  }
}

export async function completeCheckoutAndNotify(
  supabase: SupabaseClient,
  slug: string,
  method: string,
): Promise<string | null> {
  const { data: paymentId, error } = await supabase.rpc('complete_payment_checkout', {
    p_slug: slug,
    p_method: method,
  });
  if (error) throw error;
  if (!paymentId) return null;

  const payment = await getPaymentById(supabase, paymentId as string);
  if (payment?.manager_id) {
    await deliverOutboundWebhooks(supabase, payment.manager_id, 'payment.success', {
      payment_id: payment.id,
      checkout_slug: slug,
      amount: payment.amount,
      method,
    });
  }

  return paymentId as string;
}

export async function issueInvoiceStub(
  supabase: SupabaseClient,
  paymentId: string,
): Promise<{ invoice_number: string; pdf_invoice_url: string } | null> {
  const payment = await getPaymentById(supabase, paymentId);
  if (!payment || payment.invoice_number) return null;

  const integration = payment.manager_id
    ? await getActiveIntegration(supabase, payment.manager_id, 'invoicing')
    : null;

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const pdfUrl = integration?.is_sandbox
    ? `#sandbox-invoice-${paymentId}`
    : `#invoice-${paymentId}`;

  const { error } = await supabase
    .from('lease_payments')
    .update({
      invoice_number: invoiceNumber,
      pdf_invoice_url: pdfUrl,
      provider_invoice_id: integration ? `${integration.vendor}-${invoiceNumber}` : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);
  if (error) throw error;

  await logPaymentEvent(supabase, paymentId, 'invoice.issued', {
    invoice_number: invoiceNumber,
    vendor: integration?.vendor ?? 'stub',
  });

  return { invoice_number: invoiceNumber, pdf_invoice_url: pdfUrl };
}
