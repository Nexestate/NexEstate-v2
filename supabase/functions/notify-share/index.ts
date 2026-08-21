import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { appBaseUrl, sendResendEmail } from '../_shared/resend.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';
import { getShareAccessEmail } from '../_shared/email-templates.ts';

interface NotifyShareBody {
  recipientEmail: string;
  recipientName?: string;
  sharedByUserId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  permissionLevel: string;
  isInvitation?: boolean;
  expiresAt?: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  view: 'צפייה',
  edit: 'עריכה',
  admin: 'ניהול מלא',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const body: NotifyShareBody = await req.json();
    if (!body.recipientEmail || !body.sharedByUserId || !body.entityName) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const supabase = createAdminClient();
    const { data: sharer } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', body.sharedByUserId)
      .maybeSingle();

    const sharedByName = sharer?.full_name || sharer?.email || 'משתמש NexEstate';
    const accessLink = `${appBaseUrl()}/login`;
    const permissionLabel =
      PERMISSION_LABELS[body.permissionLevel] || body.permissionLevel;

    const html = getShareAccessEmail({
      recipientName: body.recipientName || '',
      recipientEmail: body.recipientEmail,
      sharedByName,
      entityType: body.entityType || 'נכס',
      entityName: body.entityName,
      permissionLevel: permissionLabel,
      accessLink,
      expiresAt: body.expiresAt,
    });

    const subject = body.isInvitation
      ? `הזמנה לשתף נכס: ${body.entityName}`
      : `שותף איתך נכס: ${body.entityName}`;

    const result = await sendResendEmail({
      to: body.recipientEmail,
      subject,
      html,
    });

    // Soft-fail: share/invite already created on client
    if (!result.ok) {
      return jsonResponse({
        success: false,
        warning: result.error || 'Email not sent',
      });
    }

    return jsonResponse({ success: true, emailId: result.id });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
