/** Supabase Auth error shape (@supabase/auth-js AuthError). */
export interface AuthErrorLike {
  message: string;
  status?: number;
  code?: string;
  name?: string;
}

export function isAuthErrorLike(err: unknown): err is AuthErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as AuthErrorLike).message === 'string'
  );
}

/** Log full auth error details to the browser console. */
export function logAuthError(context: string, err: unknown): void {
  if (isAuthErrorLike(err)) {
    console.error(`[Auth:${context}]`, {
      message: err.message,
      status: err.status,
      code: err.code,
      name: err.name,
      raw: err,
    });
    return;
  }
  console.error(`[Auth:${context}]`, err);
}

function formatAuthErrorDetail(err: unknown): string | undefined {
  if (isAuthErrorLike(err)) {
    const parts = [
      err.status != null ? `HTTP ${err.status}` : null,
      err.code ? `code: ${err.code}` : null,
      err.message,
    ].filter(Boolean);
    return parts.join(' · ');
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return undefined;
}

export interface AuthErrorDisplay {
  /** User-facing Hebrew message */
  message: string;
  /** Technical detail (shown under the message + always logged) */
  detail?: string;
}

export function getAuthErrorDisplay(err: unknown): AuthErrorDisplay {
  logAuthError('getAuthErrorDisplay', err);

  const detail = formatAuthErrorDetail(err);

  if (isAuthErrorLike(err)) {
    const msg = err.message.toLowerCase();

    if (msg.includes('rate limit') || err.status === 429) {
      return {
        message:
          'מגבלת שליחת מיילים ב-Supabase. המתן כשעה, או הגדר SMTP מותאם (Resend) ב-Project Settings → Authentication → SMTP.',
        detail,
      };
    }

    if (
      msg.includes('error sending confirmation email') ||
      msg.includes('failed to send') ||
      (err.status === 500 && msg.includes('email'))
    ) {
      return {
        message:
          'ההרשמה נכשלה בשליחת מייל האימות. הגדר SMTP ב-Supabase (Resend) או כבה זמנית "Confirm email" ב-Authentication → Providers → Email.',
        detail,
      };
    }

    if (msg.includes('database error') || msg.includes('unexpected_failure')) {
      return {
        message:
          'שגיאת מסד נתונים בעת יצירת המשתמש — כנראה ה-trigger של profiles. הרץ fix_signup_trigger.sql ב-SQL Editor.',
        detail,
      };
    }

    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return {
        message: 'כתובת האימייל כבר רשומה. נסה להתחבר או לאפס סיסמה.',
        detail,
      };
    }

    if (msg.includes('password') && msg.includes('least')) {
      return {
        message: 'הסיסמה קצרה מדי — נדרשות לפחות 6 תווים.',
        detail,
      };
    }

    if (msg.includes('invalid email')) {
      return { message: 'כתובת אימייל לא תקינה.', detail };
    }

    if (msg.includes('signup') && msg.includes('disabled')) {
      return { message: 'ההרשמה כבויה בפרויקט Supabase.', detail };
    }

    // Show Supabase message when we don't have a specific Hebrew mapping
    return {
      message: err.message || 'שגיאת Auth מ-Supabase',
      detail: detail !== err.message ? detail : undefined,
    };
  }

  if (err instanceof Error) {
    switch (err.message) {
      case 'ALREADY_REGISTERED':
        return {
          message: 'כתובת האימייל כבר רשומה במערכת. נסה להתחבר או לאפס סיסמה.',
          detail,
        };
      case 'PROFILE_MISSING':
        return {
          message:
            'ההתחברות הצליחה אך פרופיל המשתמש לא נמצא. הרץ fix_schema.sql / fix_signup_trigger.sql.',
          detail,
        };
      case 'EMAIL_NOT_CONFIRMED':
        return {
          message: 'יש לאשר את כתובת האימייל לפני ההתחברות. בדוק את תיבת הדואר (כולל ספאם).',
          detail,
        };
    }

    const msg = err.message.toLowerCase();
    if (msg.includes('email not confirmed')) {
      return {
        message: 'יש לאשר את כתובת האימייל לפני ההתחברות.',
        detail,
      };
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return {
        message: 'אימייל או סיסמה שגויים.',
        detail,
      };
    }

    return { message: err.message, detail };
  }

  return { message: 'שגיאה לא ידועה. נסה שוב.', detail };
}

/** @deprecated Use getAuthErrorDisplay for richer errors */
export function getAuthErrorMessage(err: unknown): string {
  return getAuthErrorDisplay(err).message;
}

/** Roles allowed in signup metadata — must match DB enum user_role */
export const SIGNUP_ROLES = [
  'broker',
  'developer',
  'owner',
  'buyer',
  'investor',
  'manager',
  'receiver',
] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number];

export function normalizeSignupMetadata(fullName: string, role: string) {
  const safeRole = SIGNUP_ROLES.includes(role as SignupRole) ? role : 'buyer';
  return {
    full_name: fullName.trim(),
    role: safeRole,
  };
}
