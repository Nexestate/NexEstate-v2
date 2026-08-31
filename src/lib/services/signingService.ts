import { DEMO_SIGNING_LINKS, getDemoSigningLink } from '../../data/demoData';
import type { SigningLink } from '../../types/domain';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';
import { generateAgreementPdf, invokeEdgeFunction } from './edgeFunctions';

function mapSigningRow(row: Record<string, unknown>): SigningLink {
  const prop = row.properties as { title?: string; address?: string } | null;
  return {
    id: row.id as string,
    token: row.token as string,
    client_name: row.client_name as string,
    client_phone: (row.client_phone as string | null) ?? undefined,
    client_email:
      ((row.recipient_email as string | null) ?? (row.client_email as string | null))?.trim() ||
      undefined,
    agreement_type: row.agreement_type as string,
    commission_percent: (row.commission_percent as number | null) ?? undefined,
    property_title: prop?.title,
    property_address: (row.property_address as string | null) ?? prop?.address,
    property_description: (row.property_description as string | null) ?? undefined,
    status: row.status as SigningLink['status'],
    signed_at: (row.signed_at as string | null) ?? undefined,
    expires_at: (row.expires_at as string | null) ?? undefined,
    pdf_url: (row.pdf_url as string | null) ?? undefined,
  };
}

export async function fetchSigningLink(token: string): Promise<SigningLink | null> {
  if (isDemoMode()) return getDemoSigningLink(token) ?? null;

  try {
    const data = await invokeEdgeFunction<{ link?: Record<string, unknown>; error?: string }>(
      'get-signing-link',
      { token },
    );
    if (data.link) return mapSigningRow(data.link);
  } catch {
    // fallback to RPC
  }

  const client = requireSupabase();
  const { data, error } = await client.rpc('get_signing_link_by_token', { p_token: token });
  throwIfError(error);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  if (row.property_id) {
    const { data: prop } = await client
      .from('properties')
      .select('title, address')
      .eq('id', row.property_id)
      .maybeSingle();
    return mapSigningRow({ ...row, properties: prop });
  }

  return mapSigningRow(row);
}

export async function completeSigning(
  token: string,
  payload: {
    client_name: string;
    client_phone: string;
    client_email?: string;
    signature_data: string;
    signer_id_number?: string;
    signer_company_name?: string;
    signer_address?: string;
  },
): Promise<{ ok: boolean; pdfUrl?: string | null }> {
  if (isDemoMode()) {
    const link = getDemoSigningLink(token);
    if (link) {
      link.status = 'signed';
      link.signed_at = new Date().toISOString();
    }
    return { ok: Boolean(link) };
  }

  try {
    const data = await invokeEdgeFunction<{
      success?: boolean;
      data?: { pdf_url?: string };
      error?: string;
    }>('complete-signing', { token, ...payload });

    if (data.success) {
      return { ok: true, pdfUrl: data.data?.pdf_url ?? null };
    }
  } catch {
    // fallback to RPC + optional PDF
  }

  const client = requireSupabase();
  const { data, error } = await client.rpc('complete_signing_by_token', {
    p_token: token,
    p_client_name: payload.client_name,
    p_client_phone: payload.client_phone,
    p_client_email: payload.client_email ?? null,
    p_signature_data: { image: payload.signature_data },
    p_signer_id_number: payload.signer_id_number ?? null,
    p_signer_company_name: payload.signer_company_name ?? null,
    p_signer_address: payload.signer_address ?? null,
  });
  throwIfError(error);

  if (!data) return { ok: false };

  // Try to generate PDF after RPC fallback
  const { data: row } = await client
    .from('signing_links')
    .select('id')
    .eq('token', token)
    .maybeSingle();
  let pdfUrl: string | null = null;
  if (row?.id) {
    pdfUrl = await generateAgreementPdf(row.id);
  }

  return { ok: true, pdfUrl };
}

export async function fetchSigningLinks(brokerId?: string): Promise<SigningLink[]> {
  if (isDemoMode()) return DEMO_SIGNING_LINKS;

  const client = requireSupabase();
  let query = client
    .from('signing_links')
    .select('*, properties(title, address)')
    .order('created_at', { ascending: false });

  if (brokerId) query = query.eq('broker_id', brokerId);

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => mapSigningRow(row));
}
