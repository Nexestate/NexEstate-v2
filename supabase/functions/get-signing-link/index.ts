import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const { token } = await req.json();

    if (!token) {
      return jsonResponse({ error: 'Token required' }, 400);
    }

    const supabase = createAdminClient();

    const { data: link, error } = await supabase
      .from('signing_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !link) {
      return jsonResponse({ error: 'Link not found' }, 404);
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return jsonResponse({ error: 'Link expired' }, 410);
    }

    const sanitized = { ...link };
    if (sanitized.status !== 'signed' && !sanitized.show_address_before_signing) {
      sanitized.exact_address = null;
    }
    if (sanitized.status !== 'signed') {
      sanitized.hidden_details = null;
    }

    return jsonResponse({ link: sanitized });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
