import { isDemoMode, requireSupabase, throwIfError, ServiceError } from './serviceHelpers';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    ?.replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/$/, '') || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Invoke a Supabase Edge Function with the user's session JWT when available. */
export async function invokeEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (isDemoMode()) {
    return { success: true, demo: true } as T;
  }

  const client = requireSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();
  const authToken = session?.access_token ?? SUPABASE_ANON_KEY;

  const { data, error } = await client.functions.invoke(name, { body });
  if (!error && data !== null && data !== undefined) {
    return data as T;
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new ServiceError(
      (payload as { error?: string }).error || error?.message || `Edge function ${name} failed`,
      'EDGE_FUNCTION',
    );
  }

  return payload as T;
}

export type NotifyShareResult = {
  sent: boolean;
  error?: string;
  emailId?: string;
};

export async function notifyShare(payload: {
  recipientEmail: string;
  recipientName?: string;
  sharedByUserId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  permissionLevel: string;
  isInvitation?: boolean;
  intendedRole?: string;
}): Promise<NotifyShareResult> {
  if (isDemoMode()) {
    return { sent: true };
  }

  const data = await invokeEdgeFunction<{
    success?: boolean;
    warning?: string;
    error?: string;
    emailId?: string;
  }>('notify-share', payload);

  if (data.success === false || data.warning) {
    return { sent: false, error: data.warning || data.error || 'שליחת המייל נכשלה' };
  }

  if (data.error) {
    return { sent: false, error: data.error };
  }

  return { sent: true, emailId: data.emailId };
}

export async function generateAgreementPdf(signingLinkId: string): Promise<string | null> {
  if (isDemoMode()) return null;
  try {
    const data = await invokeEdgeFunction<{ success?: boolean; pdfUrl?: string }>(
      'generate-agreement-pdf',
      { signingLinkId },
    );
    return data.pdfUrl ?? null;
  } catch (err) {
    console.warn('generate-agreement-pdf failed:', err);
    return null;
  }
}

// silence unused import if tree-shaken oddly
void throwIfError;
