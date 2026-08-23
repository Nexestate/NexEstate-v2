const ROLE_LABELS: Record<string, string> = {
  owner: 'בעל נכס',
  manager: 'חברת ניהול',
  partner: 'שותף',
  buyer: 'קונה / שוכר',
};

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);padding:28px 24px;text-align:right;">
              <div style="font-size:24px;font-weight:700;color:#ffffff;margin:0;">NexEstate</div>
              <div style="font-size:14px;color:rgba(255,255,255,0.9);margin-top:6px;">${title}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;color:#1e293b;line-height:1.8;text-align:right;direction:rtl;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px;direction:rtl;">
              © NexEstate — פלטפורמת נדל״ן דיגיטלית
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EMAIL_STYLES = '';

export function getSignedAgreementBrokerEmail(data: {
  brokerName: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  propertyDescription: string;
  dealType: string;
  signedAt: string;
  agreementLink: string;
}): string {
  return wrap(
    'הסכם נחתם',
    `<p style="margin:0 0 16px;text-align:right;">שלום ${data.brokerName},</p>
    <p style="margin:0 0 16px;text-align:right;">הלקוח <strong>${data.clientName}</strong> חתם על הסכם.</p>
    <table role="presentation" width="100%" style="background:#f0f9ff;border-right:4px solid #3b82f6;border-radius:12px;margin:16px 0;">
      <tr><td style="padding:16px;text-align:right;">
        <p style="margin:4px 0;"><strong>לקוח:</strong> ${data.clientName}</p>
        <p style="margin:4px 0;"><strong>טלפון:</strong> ${data.clientPhone}</p>
        ${data.clientEmail ? `<p style="margin:4px 0;"><strong>אימייל:</strong> ${data.clientEmail}</p>` : ''}
        <p style="margin:4px 0;"><strong>סוג עסקה:</strong> ${data.dealType}</p>
        <p style="margin:4px 0;"><strong>נכס:</strong> ${data.propertyDescription}</p>
        <p style="margin:4px 0;"><strong>נחתם ב:</strong> ${data.signedAt}</p>
      </td></tr>
    </table>
    <p style="text-align:center;margin:24px 0 0;"><a href="${data.agreementLink}" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">צפייה בהסכם</a></p>`,
  );
}

export function getSignedAgreementClientEmail(data: {
  clientName: string;
  brokerName: string;
  propertyDescription: string;
  dealType: string;
  signedAt: string;
  agreementLink: string;
}): string {
  return wrap(
    'אישור חתימה',
    `<p style="margin:0 0 16px;text-align:right;">שלום ${data.clientName},</p>
    <p style="margin:0 0 16px;text-align:right;">ההסכם שלך מול <strong>${data.brokerName}</strong> נחתם בהצלחה.</p>
    <table role="presentation" width="100%" style="background:#f0f9ff;border-right:4px solid #3b82f6;border-radius:12px;margin:16px 0;">
      <tr><td style="padding:16px;text-align:right;">
        <p style="margin:4px 0;"><strong>${data.dealType}</strong> — ${data.propertyDescription}</p>
        <p style="margin:4px 0;">תאריך חתימה: ${data.signedAt}</p>
      </td></tr>
    </table>
    <p style="text-align:center;margin:24px 0 0;"><a href="${data.agreementLink}" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">הורדת ההסכם</a></p>`,
  );
}

export function getShareAccessEmail(data: {
  recipientName: string;
  recipientEmail: string;
  sharedByName: string;
  entityType: string;
  entityName: string;
  entityAddress?: string;
  permissionLevel: string;
  intendedRole?: string;
  accessLink: string;
  expiresAt?: string;
  isInvitation?: boolean;
}): string {
  const greeting = data.recipientName?.trim() || data.recipientEmail;
  const roleLabel = data.intendedRole ? (ROLE_LABELS[data.intendedRole] ?? data.intendedRole) : null;

  return wrap(
    data.isInvitation ? 'הוזמנת לצפות בנכס' : 'שותף איתך נכס',
    `<p style="margin:0 0 12px;text-align:right;font-size:16px;">שלום ${greeting},</p>
    <p style="margin:0 0 20px;text-align:right;color:#475569;">
      <strong>${data.sharedByName}</strong> הזמין/ה אותך ל-NexEstate לצפייה וניהול משותף של נכס.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:14px;background:#fafafa;margin:0 0 20px;">
      <tr>
        <td style="padding:18px;text-align:right;">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">נכס משותף</div>
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:8px;">${data.entityName}</div>
          ${data.entityAddress ? `<div style="font-size:13px;color:#64748b;margin-bottom:12px;">${data.entityAddress}</div>` : ''}
          <table role="presentation" width="100%" style="border-top:1px solid #e2e8f0;margin-top:12px;padding-top:12px;">
            <tr>
              <td style="padding:6px 0;text-align:right;font-size:13px;color:#64748b;">הרשאה</td>
              <td style="padding:6px 0;text-align:left;font-size:13px;font-weight:700;color:#3b82f6;">${data.permissionLevel}</td>
            </tr>
            ${roleLabel ? `<tr>
              <td style="padding:6px 0;text-align:right;font-size:13px;color:#64748b;">תפקיד במערכת</td>
              <td style="padding:6px 0;text-align:left;font-size:13px;font-weight:700;color:#6366f1;">${roleLabel}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;text-align:right;font-size:14px;color:#64748b;">
      ${data.isInvitation
        ? 'עדיין אין לך חשבון? לחץ/י על הכפתור להרשמה — החשבון יקושר אוטומטית לנכס המשותף.'
        : 'היכנס/י למערכת כדי לצפות בנכס.'}
    </p>
    ${data.expiresAt ? `<p style="margin:0 0 16px;text-align:right;font-size:13px;color:#94a3b8;">תוקף ההזמנה: ${data.expiresAt}</p>` : ''}
    <p style="text-align:center;margin:8px 0 0;">
      <a href="${data.accessLink}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
        ${data.isInvitation ? 'אשר/י גישה והירשם' : 'כניסה למערכת'}
      </a>
    </p>`,
  );
}

export function getWelcomeEmail(data: { userName: string; loginLink: string }): string {
  return wrap(
    'ברוכים הבאים',
    `<p style="margin:0 0 16px;text-align:right;">שלום ${data.userName},</p>
    <p style="margin:0 0 16px;text-align:right;">חשבונך ב-NexEstate נוצר בהצלחה.</p>
    <p style="text-align:center;margin:24px 0 0;"><a href="${data.loginLink}" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">התחברות</a></p>`,
  );
}
