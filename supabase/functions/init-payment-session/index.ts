import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';
import {
  getActiveIntegration,
  getPaymentBySlug,
  logPaymentEvent,
} from '../_shared/payments.ts';

interface InitSessionBody {
  checkout_slug: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const body: InitSessionBody = await req.json();
    const slug = body.checkout_slug?.trim();
    if (!slug) return jsonResponse({ error: 'Missing checkout_slug' }, 400);

    const supabase = createAdminClient();
    const payment = await getPaymentBySlug(supabase, slug);
    if (!payment) return jsonResponse({ error: 'Checkout not found' }, 404);
    if (['paid', 'cancelled'].includes(payment.payment_status)) {
      return jsonResponse({ error: 'Checkout already closed' }, 409);
    }

    await logPaymentEvent(supabase, payment.id, 'session.init', { checkout_slug: slug });

    const integration = payment.manager_id
      ? await getActiveIntegration(supabase, payment.manager_id, 'acquiring')
      : null;

    const apiKey = integration?.credentials?.api_key;
    const useSandbox = !integration || integration.is_sandbox || !apiKey;

    if (useSandbox) {
      return jsonResponse({
        mode: 'simulate',
        checkout_slug: slug,
        session_id: `sim-${payment.id}`,
        vendor: integration?.vendor ?? null,
      });
    }

    // Production stub — replace with real Meshulam/Grow API call
    const redirectUrl =
      `https://sandbox.meshulam.co.il/pay?ref=${encodeURIComponent(slug)}` +
      `&amount=${payment.amount}&vendor=${integration!.vendor}`;

    await logPaymentEvent(supabase, payment.id, 'session.redirect', {
      checkout_slug: slug,
      vendor: integration!.vendor,
      redirect_url: redirectUrl,
    });

    return jsonResponse({
      mode: 'redirect',
      checkout_slug: slug,
      session_id: `${integration!.vendor}-${payment.id}`,
      redirect_url: redirectUrl,
      vendor: integration!.vendor,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Init session error';
    return jsonResponse({ error: message }, 500);
  }
});
