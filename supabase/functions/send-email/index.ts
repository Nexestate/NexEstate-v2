import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { sendResendEmail } from '../_shared/resend.ts';

interface EmailBody {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const body: EmailBody = await req.json();
    if (!body.to || !body.subject || !body.html) {
      return jsonResponse({ error: 'to, subject, and html are required' }, 400);
    }

    const result = await sendResendEmail(body);
    if (!result.ok) {
      return jsonResponse({ error: result.error || 'Failed to send email' }, 502);
    }

    return jsonResponse({ success: true, id: result.id });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
