import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';
import {
  completeCheckoutAndNotify,
  getPaymentById,
  getPaymentBySlug,
  issueInvoiceStub,
  logPaymentEvent,
} from '../_shared/payments.ts';

interface PaymentWebhookBody {
  provider?: string;
  event?: string;
  payment_id?: string;
  checkout_slug?: string;
  amount?: number;
  status?: string;
  raw?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const body: PaymentWebhookBody = await req.json();
    const slug = body.checkout_slug?.trim();
    const provider = body.provider ?? 'unknown';
    const supabase = createAdminClient();

    let payment = body.payment_id
      ? await getPaymentById(supabase, body.payment_id)
      : slug
        ? await getPaymentBySlug(supabase, slug)
        : null;

    if (!payment && !slug && !body.payment_id) {
      return jsonResponse({ error: 'Missing checkout_slug or payment_id' }, 400);
    }

    if (payment) {
      await logPaymentEvent(supabase, payment.id, body.event ?? 'webhook.received', {
        provider,
        ...(body.raw ?? body),
      });
    }

    if (body.status === 'paid') {
      const checkoutSlug = slug ?? payment?.checkout_slug;
      if (!checkoutSlug) {
        return jsonResponse({ error: 'Cannot resolve checkout slug' }, 400);
      }

      const paymentId = await completeCheckoutAndNotify(supabase, checkoutSlug, 'credit');
      if (paymentId) {
        await logPaymentEvent(supabase, paymentId, 'webhook.paid', { provider });
        const invoice = await issueInvoiceStub(supabase, paymentId);
        return jsonResponse({
          ok: true,
          completed: true,
          payment_id: paymentId,
          invoice_number: invoice?.invoice_number,
        });
      }
    }

    if (body.status === 'failed' && payment) {
      await supabase
        .from('lease_payments')
        .update({
          payment_status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: String(body.raw?.message ?? 'Provider reported failure'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
    }

    return jsonResponse({ ok: true, received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return jsonResponse({ error: message }, 500);
  }
});
