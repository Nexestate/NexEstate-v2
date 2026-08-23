import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { AuthShell } from '../../components/auth/AuthShell';
import { claimPendingInvites } from '../../lib/claimPendingInvites';
import { supabase } from '../../lib/supabase';
import { getDashboardPath } from '../../lib/roles';
import type { UserRole } from '../../types';

async function waitForSession(maxAttempts = 25): Promise<Session | null> {
  if (!supabase) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  return null;
}

/**
 * Handles OAuth / magic-link / recovery redirects.
 * Supabase auto-exchanges PKCE ?code= via detectSessionInUrl — do not exchange twice.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function finishWithSession(session: Session) {
      if (cancelled || !supabase) return;

      window.history.replaceState(null, '', window.location.pathname);

      if (session.user.email) {
        await claimPendingInvites(session.user.id, session.user.email);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      const role = (profile?.role as UserRole) || 'buyer';
      navigate(getDashboardPath(role), { replace: true });
    }

    async function run() {
      if (!supabase) {
        navigate('/login', { replace: true });
        return;
      }

      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash,
      );
      const isRecovery =
        url.searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';

      try {
        const session = await waitForSession();
        if (cancelled) return;

        if (!session?.user) {
          navigate('/login', { replace: true });
          return;
        }

        if (isRecovery) {
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/reset-password', { replace: true });
          return;
        }

        await finishWithSession(session);
      } catch {
        if (cancelled) return;

        const session = await waitForSession(5);
        if (session?.user) {
          if (isRecovery) {
            window.history.replaceState(null, '', window.location.pathname);
            navigate('/reset-password', { replace: true });
            return;
          }
          await finishWithSession(session);
          return;
        }

        setError('שגיאה באימות. נסה להתחבר שוב.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <AuthShell showGoogle={false} hideInstallBanner>
      <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-xl">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">מאמת... מעביר אותך</p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
