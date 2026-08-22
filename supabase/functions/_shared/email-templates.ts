export const EMAIL_STYLES = `
  <style>
    body { font-family: 'Segoe UI', sans-serif; direction: rtl; text-align: right; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; color: #333; line-height: 1.8; }
    .highlight-box { background: #f0f9ff; border-right: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .button { display: inline-block; background: #3b82f6; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
  </style>
`;

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8">${EMAIL_STYLES}</head>
  <body><div class="container">
    <div class="header"><h1 style="margin:0">NexEstate</h1><p style="margin:8px 0 0;opacity:.9">${title}</p></div>
    <div class="content">${body}</div>
    <div class="footer">© NexEstate — פלטפורמת נדל״ן דיגיטלית</div>
  </div></body></html>`;
}

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
    `<p>שלום ${data.brokerName},</p>
    <p>הלקוח <strong>${data.clientName}</strong> חתם על הסכם.</p>
    <div class="highlight-box">
      <table class="details-table">
        <tr><td>לקוח</td><td>${data.clientName}</td></tr>
        <tr><td>טלפון</td><td>${data.clientPhone}</td></tr>
        ${data.clientEmail ? `<tr><td>אימייל</td><td>${data.clientEmail}</td></tr>` : ''}
        <tr><td>סוג עסקה</td><td>${data.dealType}</td></tr>
        <tr><td>נכס</td><td>${data.propertyDescription}</td></tr>
        <tr><td>נחתם ב</td><td>${data.signedAt}</td></tr>
      </table>
    </div>
    <p style="text-align:center"><a class="button" href="${data.agreementLink}">צפייה בהסכם</a></p>`,
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
    `<p>שלום ${data.clientName},</p>
    <p>ההסכם שלך מול <strong>${data.brokerName}</strong> נחתם בהצלחה.</p>
    <div class="highlight-box">
      <p><strong>${data.dealType}</strong> — ${data.propertyDescription}</p>
      <p>תאריך חתימה: ${data.signedAt}</p>
    </div>
    <p style="text-align:center"><a class="button" href="${data.agreementLink}">הורדת ההסכם</a></p>`,
  );
}

export function getShareAccessEmail(data: {
  recipientName: string;
  recipientEmail: string;
  sharedByName: string;
  entityType: string;
  entityName: string;
  permissionLevel: string;
  accessLink: string;
  expiresAt?: string;
  intendedRole?: string;
  isInvitation?: boolean;
}): string {
  const title = data.isInvitation ? 'הוזמנת ל-NexEstate' : 'שותף איתך נכס';
  const action = data.isInvitation ? 'להרשמה והצטרפות' : 'לכניסה למערכת';
  return wrap(
    title,
    `<p>שלום ${data.recipientName || data.recipientEmail},</p>
    <p><strong>${data.sharedByName}</strong> שיתף איתך ${data.entityType}: <strong>${data.entityName}</strong>.</p>
    <div class="highlight-box">
      <p>רמת הרשאה: <strong>${data.permissionLevel}</strong></p>
      ${data.intendedRole ? `<p>תפקיד מיועד: <strong>${data.intendedRole}</strong></p>` : ''}
      ${data.expiresAt ? `<p>תוקף עד: ${data.expiresAt}</p>` : ''}
    </div>
    ${
      data.isInvitation
        ? '<p>עדיין אין לך חשבון? ההרשמה חינמית. אחרי ההרשמה הגישה לנכס תתווסף אוטומטית.</p>'
        : '<p>אפשר להיכנס עם אותו אימייל ולראות את הנכס תחת הנכסים ששותפו איתך.</p>'
    }
    <p style="text-align:center"><a class="button" href="${data.accessLink}">${action}</a></p>`,
  );
}

export function getWelcomeEmail(data: { userName: string; loginLink: string }): string {
  return wrap(
    'ברוכים הבאים',
    `<p>שלום ${data.userName},</p>
    <p>חשבונך ב-NexEstate נוצר בהצלחה.</p>
    <p style="text-align:center"><a class="button" href="${data.loginLink}">התחברות</a></p>`,
  );
}
