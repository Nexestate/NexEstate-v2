import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';
import {
  completeCheckoutAndNotify,
  getPaymentBySlug,
  issueInvoiceStub,
  logPaymentEvent,
} from '../_shared/payments.ts';

interface CompleteCheckoutBody {
  checkout_slug: string;
  method?: string;
  issue_invoice?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const body: CompleteCheckoutBody = await req.json();
    const slug = body.checkout_slug?.trim();
    const method = body.method ?? 'credit';
    if (!slug) return jsonResponse({ error: 'Missing checkout_slug' }, 400);

    const supabase = createAdminClient();
    const payment = await getPaymentBySlug(supabase, slug);
    if (!payment) return jsonResponse({ error: 'Checkout not found' }, 404);
    if (payment.payment_status === 'paid') {
      return jsonResponse({ success: true, payment_id: payment.id, already_paid: true });
    }

    const paymentId = await completeCheckoutAndNotify(supabase, slug, method);
    if (!paymentId) return jsonResponse({ error: 'Could not complete payment' }, 409);

    await logPaymentEvent(supabase, paymentId, 'checkout.completed', { method, checkout_slug: slug });

    let invoice = null;
    if (body.issue_invoice !== false) {
      invoice = await issueInvoiceStub(supabase, paymentId);
    }

    return jsonResponse({
      success: true,
      payment_id: paymentId,
      invoice_number: invoice?.invoice_number,
      pdf_invoice_url: invoice?.pdf_invoice_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Complete checkout error';
    return jsonResponse({ error: message }, 500);
  }
});
