import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/auth/AuthShell';
import { supabase } from '../../lib/supabase';
import { getDashboardPath } from '../../lib/roles';
import type { UserRole } from '../../types';

/**
 * Handles OAuth / magic-link / recovery redirects.
 * Supabase puts tokens in the URL hash or as ?code= for PKCE.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!supabase) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          window.history.replaceState(null, '', window.location.pathname);

          const { data: { session } } = await supabase.auth.getSession();
          // Recovery flows often land here after PKCE
          if (url.searchParams.get('type') === 'recovery' || session) {
            // If coming from password recovery email, prefer reset page when no next path
            const hashType = new URLSearchParams(window.location.hash.slice(1)).get('type');
            if (hashType === 'recovery' || url.searchParams.get('type') === 'recovery') {
              navigate('/reset-password', { replace: true });
              return;
            }
          }
        }

        const hash = window.location.hash;
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const type = params.get('type');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          window.history.replaceState(null, '', window.location.pathname);

          if (type === 'recovery') {
            navigate('/reset-password', { replace: true });
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!session?.user) {
          navigate('/login', { replace: true });
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const role = (profile?.role as UserRole) || 'buyer';
        navigate(getDashboardPath(role), { replace: true });
      } catch {
        if (!cancelled) {
          setError('שגיאה באימות. נסה להתחבר שוב.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <AuthShell showGoogle={false}>
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
