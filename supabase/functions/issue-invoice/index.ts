import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';
import {
  getPaymentById,
  getPaymentBySlug,
  issueInvoiceStub,
  logPaymentEvent,
} from '../_shared/payments.ts';

interface IssueInvoiceBody {
  payment_id?: string;
  checkout_slug?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const body: IssueInvoiceBody = await req.json();
    const supabase = createAdminClient();

    let payment = body.payment_id
      ? await getPaymentById(supabase, body.payment_id)
      : body.checkout_slug
        ? await getPaymentBySlug(supabase, body.checkout_slug)
        : null;

    if (!payment) return jsonResponse({ error: 'Payment not found' }, 404);
    if (payment.payment_status !== 'paid') {
      return jsonResponse({ error: 'Payment must be paid before issuing invoice' }, 409);
    }
    if (payment.invoice_number) {
      return jsonResponse({
        success: true,
        invoice_number: payment.invoice_number,
        pdf_invoice_url: payment.pdf_invoice_url,
        already_issued: true,
      });
    }

    const invoice = await issueInvoiceStub(supabase, payment.id);
    if (!invoice) return jsonResponse({ error: 'Failed to issue invoice' }, 500);

    return jsonResponse({ success: true, ...invoice });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Issue invoice error';
    return jsonResponse({ error: message }, 500);
  }
});
