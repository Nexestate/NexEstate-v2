import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/auth/AuthShell';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthErrorDisplay } from '../../lib/authErrors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function LoginPage() {
  const { signIn, getRedirectPath, isDemoMode, signInWithGoogle, resendConfirmationEmail } =
    useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setErrorDetail('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      if (isDemoMode) navigate(getRedirectPath());
    } catch (err) {
      const { message, detail } = getAuthErrorDisplay(err);
      setError(message || 'שגיאה בהתחברות עם Google');
      setErrorDetail(detail ?? '');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDetail('');
    setNeedsConfirm(false);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(getRedirectPath());
    } catch (err) {
      const { message, detail } = getAuthErrorDisplay(err);
      setError(message);
      setErrorDetail(detail ?? '');
      if (
        err instanceof Error &&
        (err.message === 'EMAIL_NOT_CONFIRMED' ||
          err.message.toLowerCase().includes('email not confirmed'))
      ) {
        setNeedsConfirm(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirm = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await resendConfirmationEmail(email);
      setError('נשלח מייל אימות חוזר. בדוק/י את תיבת הדואר (כולל ספאם).');
      setErrorDetail('');
    } catch (err) {
      const { message, detail } = getAuthErrorDisplay(err);
      setError(message);
      setErrorDetail(detail ?? '');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      showGoogle
      googleLabel="המשך עם גוגל"
      googleLoading={googleLoading}
      onGoogleClick={handleGoogle}
      demoHint={
        isDemoMode
          ? 'מצב Demo — התחבר עם כל אימייל וסיסמה. admin@… → אדמין, buyer@… → קונה'
          : undefined
      }
    >
      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="mb-6 text-center text-xl font-bold">התחברות</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label='דוא"ל'
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="h-4 w-4 text-primary/70" />}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              סיסמה <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 pe-10 ps-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
              <Lock className="pointer-events-none absolute inset-y-0 end-3 h-4 w-4 self-center text-primary/70" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 start-3 flex items-center text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              שכחת סיסמה?
            </Link>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-border"
              />
              זכור אותי
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {errorDetail && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive/90 break-all">
              {errorDetail}
            </p>
          )}

          {needsConfirm && email && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resendLoading}
              onClick={() => void handleResendConfirm()}
            >
              {resendLoading ? 'שולח...' : 'שלח שוב מייל אימות'}
            </Button>
          )}

          <Button type="submit" className="h-12 w-full rounded-full text-base" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          אין לך חשבון?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            הירשם בחינם
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
