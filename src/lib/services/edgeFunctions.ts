import { isDemoMode, requireSupabase, throwIfError, ServiceError } from './serviceHelpers';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    ?.replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/$/, '') || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Invoke a Supabase Edge Function with the anon key. */
export async function invokeEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (isDemoMode()) {
    return { success: true, demo: true } as T;
  }

  const client = requireSupabase();
  const { data, error } = await client.functions.invoke(name, { body });
  if (error) {
    // Fallback to raw fetch if functions.invoke fails
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new ServiceError(error.message || `Edge function ${name} failed`, 'EDGE_FUNCTION');
    }
    return (await res.json()) as T;
  }
  return data as T;
}

export async function notifyShare(payload: {
  recipientEmail: string;
  recipientName?: string;
  sharedByUserId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  permissionLevel: string;
  isInvitation?: boolean;
}): Promise<void> {
  if (isDemoMode()) return;
  try {
    await invokeEdgeFunction('notify-share', payload);
  } catch (err) {
    console.warn('notify-share failed:', err);
  }
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
