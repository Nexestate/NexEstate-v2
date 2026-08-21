import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../lib/validation';

export function ForgotPasswordPage() {
  const { resetPassword, isDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateEmail(email, true);
    if (!check.isValid) {
      setError(check.error ?? 'אימייל לא תקין');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError('שגיאה בשליחת המייל. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell showGoogle={false} demoHint={isDemoMode ? 'מצב Demo — האיפוס מדומה בלבד' : undefined}>
      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="mb-2 text-center text-xl font-bold">שחזור סיסמה</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          נשלח אליך קישור לאיפוס הסיסמה
        </p>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
              אם קיים חשבון עם כתובת זו, נשלח מייל עם קישור לאיפוס.
            </p>
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">
              חזרה להתחברות
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label='דוא"ל'
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={error || undefined}
              icon={<Mail className="h-4 w-4" />}
            />
            <Button type="submit" className="h-12 w-full rounded-full" disabled={loading}>
              {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                חזרה להתחברות
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
