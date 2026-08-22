import { Mail, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '../../components/auth/AuthShell';
import { RoleSelector } from '../../components/auth/RoleSelector';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthErrorDisplay } from '../../lib/authErrors';
import { parseRegisterRoleParam } from '../../lib/publishAd';
import { validateEmail, validatePassword, validateRequired } from '../../lib/validation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types';

export function RegisterPage() {
  const { signUp, getRedirectPath, isDemoMode, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = useMemo(
    () => parseRegisterRoleParam(searchParams.get('role'), searchParams.get('intent')),
    [searchParams],
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendOk, setResendOk] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) {
      setError('יש לאשר את תנאי השימוש');
      return;
    }

    const nameCheck = validateRequired(fullName, 'שם מלא');
    if (!nameCheck.isValid) {
      setError(nameCheck.error ?? '');
      return;
    }
    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      setError(emailCheck.error ?? '');
      return;
    }
    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setError(passCheck.error ?? '');
      return;
    }

    setError('');
    setErrorDetail('');
    setLoading(true);
    try {
      const result = await signUp({ email, password, fullName, role });
      if (result.needsEmailConfirmation) {
        setEmailSent(true);
        return;
      }
      navigate(getRedirectPath());
    } catch (err) {
      const { message, detail } = getAuthErrorDisplay(err);
      setError(message);
      setErrorDetail(detail ?? '');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    const handleResend = async () => {
      setResendLoading(true);
      setResendOk(false);
      try {
        await resendConfirmationEmail(email);
        setResendOk(true);
      } catch (err) {
        const { message, detail } = getAuthErrorDisplay(err);
        setError(message);
        setErrorDetail(detail ?? '');
      } finally {
        setResendLoading(false);
      }
    };

    return (
      <AuthShell showGoogle={false}>
        <div className="rounded-2xl border border-border bg-card/80 p-6 text-center shadow-xl backdrop-blur-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-success/10">
            <Mail className="h-7 w-7 text-success" />
          </div>
          <h2 className="mb-2 text-xl font-bold">בדוק את תיבת הדואר</h2>
          <p className="text-sm text-muted-foreground">
            שלחנו קישור אימות ל-<strong className="text-foreground">{email}</strong>.
            <br />
            לאחר לחיצה על הקישור תוכל/י להתחבר.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            לא מצאת? בדוק/י גם בתיקיית ספאם.
            <br />
            מיילי אימות של Supabase לפעמים לא מגיעים — ראה פתרון מהיר למטה.
          </p>

          {resendOk && (
            <p className="mt-3 text-sm text-success">נשלח שוב. בדוק/י את תיבת הדואר.</p>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resendLoading}
              onClick={() => void handleResend()}
            >
              {resendLoading ? 'שולח...' : 'שלח שוב מייל אימות'}
            </Button>
            <Link
              to="/login"
              className="text-sm font-medium text-primary hover:underline"
            >
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      demoHint={
        isDemoMode
          ? 'מצב Demo — הרשמה מקומית ללא Supabase. בחר תפקיד ומלא פרטים.'
          : undefined
      }
    >
      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="mb-6 text-center text-xl font-bold">הרשמה</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <RoleSelector value={role} onChange={setRole} />

          <Input
            label="שם מלא"
            placeholder="ישראל ישראלי"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            icon={<User className="h-4 w-4 text-primary/70" />}
          />
          <Input
            label='דוא"ל'
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="h-4 w-4 text-primary/70" />}
          />
          <Input
            label="סיסמה"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 rounded border-border"
            />
            <span className="text-muted-foreground">
              אני מאשר/ת את{' '}
              <Link to="/terms" className="text-primary hover:underline">
                תנאי השימוש
              </Link>{' '}
              ומדיניות הפרטיות
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {errorDetail && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive/90 break-all">
              {errorDetail}
            </p>
          )}

          <Button type="submit" className="h-12 w-full rounded-full text-base" disabled={loading}>
            {loading ? 'נרשם...' : 'הירשם'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          כבר יש לך חשבון?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            התחבר
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
