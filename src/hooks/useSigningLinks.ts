import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AGREEMENT_TYPE_LABELS } from '../lib/constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureProfile } from '../lib/services/profilesService';
import { isDemoMode } from '../lib/services/serviceHelpers';
import { DEMO_SIGNING_LINKS } from '../data/demoData';
import type { SigningLink } from '../types/domain';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export type SigningLinkInsert = Partial<SigningLink> & {
  client_name: string;
  client_phone: string;
  client_email: string;
};

function resolveClientEmail(row: Record<string, unknown>): string | undefined {
  const recipient = row.recipient_email as string | null | undefined;
  const client = row.client_email as string | null | undefined;
  return (recipient ?? client) ?? undefined;
}

function generateToken(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function buildDocumentTitle(data: SigningLinkInsert): string {
  const agreementType = data.agreement_type || 'exclusive';
  const typeLabel = AGREEMENT_TYPE_LABELS[agreementType] ?? agreementType;
  let title = `הסכם ${typeLabel} — ${data.client_name.trim()}`;
  const propertyDescription = data.property_description?.trim();
  if (propertyDescription) {
    title += ` (${propertyDescription})`;
  }
  return title;
}

function mapRow(row: Record<string, unknown>): SigningLink {
  return {
    id: row.id as string,
    token: row.token as string,
    broker_id: row.broker_id as string | undefined,
    client_name: row.client_name as string,
    client_phone: (row.client_phone as string | null) ?? undefined,
    client_email: resolveClientEmail(row),
    deal_type: (row.deal_type as string | null) ?? undefined,
    agreement_type: (row.agreement_type as string) ?? 'exclusive',
    commission_type: (row.commission_type as string | null) ?? undefined,
    commission_percent: (row.commission_percent as number | null) ?? undefined,
    minimum_commission: (row.minimum_commission as number | null) ?? undefined,
    payment_days: (row.payment_days as number | null) ?? undefined,
    valid_days: (row.valid_days as number | null) ?? undefined,
    property_id: (row.property_id as string | null) ?? undefined,
    property_description: (row.property_description as string | null) ?? undefined,
    property_address: (row.property_address as string | null) ?? undefined,
    exact_address: (row.exact_address as string | null) ?? undefined,
    show_address_before_signing: (row.show_address_before_signing as boolean | null) ?? false,
    price: (row.price as number | null) ?? undefined,
    hidden_details: (row.hidden_details as string | null) ?? undefined,
    status: row.status as SigningLink['status'],
    signed_at: (row.signed_at as string | null) ?? undefined,
    expires_at: (row.expires_at as string | null) ?? undefined,
    pdf_url: (row.pdf_url as string | null) ?? undefined,
    broker_name: (row.broker_name as string | null) ?? undefined,
  };
}

export type CreateLinkResult = { link: SigningLink | null; error: string | null };

export function useSigningLinks() {
  const { user, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<SigningLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (isDemoMode()) {
      setLinks(DEMO_SIGNING_LINKS);
      setLoading(false);
      return;
    }
    if (!supabase || !user) {
      setLinks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('signing_links')
        .select('*')
        .eq('broker_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setLinks((data ?? []).map((row) => mapRow(row)));
    } catch (e) {
      setError((e as Error).message);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void fetchLinks();
  }, [authLoading, fetchLinks]);

  const createLink = async (data: SigningLinkInsert): Promise<CreateLinkResult> => {
    if (isDemoMode()) {
      const token = generateToken();
      const created: SigningLink = {
        id: `sign-${Date.now()}`,
        token,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email,
        agreement_type: data.agreement_type || 'exclusive',
        deal_type: data.deal_type || 'sale',
        commission_percent: data.commission_percent ?? 2,
        status: 'pending',
        expires_at: new Date(Date.now() + (data.valid_days ?? 30) * 86400000).toISOString(),
      };
      DEMO_SIGNING_LINKS.unshift(created);
      setLinks([...DEMO_SIGNING_LINKS]);
      return { link: created, error: null };
    }

    if (!supabase || !user) {
      return { link: null, error: 'לא מחובר למערכת' };
    }

    try {
      await ensureProfile(user.id, {
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      });
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      return { link: null, error: message };
    }

    const clientEmail = data.client_email.trim();
    if (!clientEmail) {
      const message = 'יש להזין כתובת אימייל';
      setError(message);
      return { link: null, error: message };
    }

    const token = generateToken();
    const validDays = data.valid_days ?? 30;
    const payload = {
      broker_id: user.id,
      client_name: data.client_name,
      client_phone: data.client_phone,
      recipient_email: clientEmail,
      client_email: clientEmail,
      agreement_type: data.agreement_type || 'exclusive',
      commission_percent: data.commission_percent ?? 2,
      valid_days: validDays,
      expires_at: new Date(Date.now() + validDays * 86400000).toISOString(),
      property_id: data.property_id || null,
      deal_type: data.deal_type || 'sale',
      property_description: data.property_description || null,
      show_address_before_signing: data.show_address_before_signing ?? false,
      exact_address: data.exact_address || null,
      price: data.price ?? null,
      hidden_details: data.hidden_details || null,
      commission_type: data.commission_type || 'percentage',
      minimum_commission: data.minimum_commission ?? null,
      payment_days: data.payment_days ?? 3,
      broker_name: data.broker_name || user.full_name || null,
      document_title: buildDocumentTitle(data),
      token,
      status: 'pending' as const,
    };

    const { data: created, error: err } = await supabase
      .from('signing_links')
      .insert(payload)
      .select()
      .single();

    if (err) {
      setError(err.message);
      return { link: null, error: err.message };
    }

    await fetchLinks();
    return { link: mapRow(created), error: null };
  };

  const updateLink = async (id: string, updates: Partial<SigningLink>): Promise<boolean> => {
    if (isDemoMode()) {
      const idx = DEMO_SIGNING_LINKS.findIndex((l) => l.id === id);
      if (idx >= 0) Object.assign(DEMO_SIGNING_LINKS[idx], updates);
      setLinks([...DEMO_SIGNING_LINKS]);
      return true;
    }
    if (!supabase) return false;

    const { error: err } = await supabase.from('signing_links').update(updates).eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    await fetchLinks();
    return true;
  };

  const deleteLink = async (id: string): Promise<boolean> => {
    if (isDemoMode()) {
      const idx = DEMO_SIGNING_LINKS.findIndex((l) => l.id === id);
      if (idx >= 0) DEMO_SIGNING_LINKS.splice(idx, 1);
      setLinks([...DEMO_SIGNING_LINKS]);
      return true;
    }
    if (!supabase) return false;
    const { error: err } = await supabase.from('signing_links').delete().eq('id', id);
    if (err) return false;
    await fetchLinks();
    return true;
  };

  const cancelLink = async (id: string): Promise<boolean> => {
    return updateLink(id, { status: 'expired' });
  };

  const getPublicLink = async (token: string): Promise<SigningLink | null> => {
    if (isDemoMode() || !isSupabaseConfigured) {
      return DEMO_SIGNING_LINKS.find((l) => l.token === token) ?? null;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-signing-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        // Fallback to RPC if edge function not deployed
        if (!supabase) return null;
        const { data } = await supabase.rpc('get_signing_link_by_token', { p_token: token });
        const row = Array.isArray(data) ? data[0] : data;
        return row ? mapRow(row) : null;
      }

      const data = await response.json();
      return data.link ? mapRow(data.link) : null;
    } catch {
      return null;
    }
  };

  const completeSignature = async (
    token: string,
    signatureData: {
      client_name: string;
      client_phone: string;
      client_email?: string;
      signature_data: string;
      signer_id_number?: string;
      signer_company_name?: string;
      signer_address?: string;
    },
  ): Promise<SigningLink | null> => {
    if (isDemoMode()) {
      const link = DEMO_SIGNING_LINKS.find((l) => l.token === token);
      if (link) {
        link.status = 'signed';
        link.signed_at = new Date().toISOString();
        link.client_name = signatureData.client_name;
        link.client_phone = signatureData.client_phone;
      }
      return link ?? null;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/complete-signing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token, ...signatureData }),
      });

      if (!response.ok) {
        if (!supabase) return null;
        const { data, error: err } = await supabase.rpc('complete_signing_by_token', {
          p_token: token,
          p_client_name: signatureData.client_name,
          p_client_phone: signatureData.client_phone,
          p_client_email: signatureData.client_email ?? null,
          p_signature_data: { image: signatureData.signature_data },
          p_signer_id_number: signatureData.signer_id_number ?? null,
          p_signer_company_name: signatureData.signer_company_name ?? null,
          p_signer_address: signatureData.signer_address ?? null,
        });
        if (err || !data) return null;
        return getPublicLink(token);
      }

      const data = await response.json();
      return data.data ? ({ ...data.data, token } as SigningLink) : null;
    } catch {
      return null;
    }
  };

  const getStats = () => {
    const pending = links.filter((l) => l.status === 'pending').length;
    const signed = links.filter((l) => l.status === 'signed').length;
    const expired = links.filter((l) => l.status === 'expired').length;
    const sent = links.filter((l) => l.status === 'sent').length;
    return { pending, signed, expired, sent, total: links.length };
  };

  return {
    links,
    loading,
    error,
    fetchLinks,
    createLink,
    updateLink,
    deleteLink,
    cancelLink,
    getPublicLink,
    completeSignature,
    getStats,
    generateToken,
  };
}
