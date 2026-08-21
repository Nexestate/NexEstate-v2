import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { validatePassword, validatePasswordMatch } from '../../lib/validation';

export function ResetPasswordPage() {
  const { updatePassword, isDemoMode, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = validatePassword(password);
    if (!p1.isValid) {
      setError(p1.error ?? '');
      return;
    }
    const p2 = validatePasswordMatch(password, confirm);
    if (!p2.isValid) {
      setError(p2.error ?? '');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await updatePassword(password);
      navigate(getRedirectPath());
    } catch {
      setError('שגיאה בעדכון הסיסמה. ייתכן שפג תוקף הקישור.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell showGoogle={false} demoHint={isDemoMode ? 'מצב Demo — עדכון סיסמה מדומה' : undefined}>
      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="mb-6 text-center text-xl font-bold">איפוס סיסמה</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="סיסמה חדשה"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<Lock className="h-4 w-4" />}
          />
          <Input
            label="אימות סיסמה"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            icon={<Lock className="h-4 w-4" />}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-12 w-full rounded-full" disabled={loading}>
            {loading ? 'שומר...' : 'עדכן סיסמה'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              חזרה להתחברות
            </Link>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
