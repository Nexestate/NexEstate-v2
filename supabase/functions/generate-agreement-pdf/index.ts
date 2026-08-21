import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { generateAndStoreAgreementPdf } from '../_shared/agreement-pdf.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

interface PdfBody {
  signingLinkId?: string;
  token?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const body: PdfBody = await req.json();
    if (!body.signingLinkId && !body.token) {
      return jsonResponse({ error: 'signingLinkId or token required' }, 400);
    }

    const supabase = createAdminClient();
    let query = supabase.from('signing_links').select('*');
    if (body.signingLinkId) query = query.eq('id', body.signingLinkId);
    else query = query.eq('token', body.token!);

    const { data: link, error } = await query.maybeSingle();
    if (error || !link) {
      return jsonResponse({ error: 'Signing link not found' }, 404);
    }

    if (link.status !== 'signed') {
      return jsonResponse({ error: 'Agreement is not signed yet' }, 400);
    }

    const pdfUrl = await generateAndStoreAgreementPdf(
      supabase,
      link as Record<string, unknown>,
    );

    if (!pdfUrl) {
      return jsonResponse({ error: 'Failed to generate or upload PDF' }, 500);
    }

    return jsonResponse({ success: true, pdfUrl });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
