export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/** Send email via Resend API. Requires RESEND_API_KEY secret. */
export async function sendResendEmail(
  params: SendEmailParams,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const from =
    params.from ||
    Deno.env.get('RESEND_FROM_EMAIL') ||
    'NexEstate <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Resend error:', data);
    return { ok: false, error: (data as { message?: string }).message || 'Resend failed' };
  }

  return { ok: true, id: (data as { id?: string }).id };
}

export function appBaseUrl(): string {
  return (Deno.env.get('APP_URL') || 'http://localhost:5173').replace(/\/$/, '');
}
