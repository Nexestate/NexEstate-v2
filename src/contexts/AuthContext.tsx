import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getDashboardPath } from '../lib/roles';
import { logAuthError, normalizeSignupMetadata } from '../lib/authErrors';
import type { Profile, UserRole } from '../types';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface SignUpResult {
  needsEmailConfirmation: boolean;
}

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_STORAGE_KEY = 'nexestate-demo-user';

const DEMO_USER: Profile = {
  id: 'demo-user-1',
  email: 'viner.michael@gmail.com',
  full_name: 'מיכאל וינר',
  phone: '050-1234567',
  role: 'broker',
  company: 'NexEstate',
  license_number: '123456',
};

function loadDemoUser(): Profile | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function saveDemoUser(user: Profile | null) {
  if (user) localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(DEMO_STORAGE_KEY);
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data as Profile;
}

/** Claim pending property invites → shares + optional role upgrade. */
async function claimPendingInvites(userId: string, userEmail: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: pendingInvites, error: fetchError } = await supabase
      .from('pending_invites')
      .select('*')
      .ilike('email', userEmail.trim())
      .eq('status', 'pending');

    if (fetchError || !pendingInvites?.length) return;

    const roleMap: Record<string, number> = { owner: 3, manager: 2, partner: 1, buyer: 0 };
    let bestRole: UserRole = 'buyer';
    let bestPriority = 0;

    for (const invite of pendingInvites) {
      if (!invite.property_id) continue;

      const { error: shareError } = await supabase.from('property_shares').insert({
        property_id: invite.property_id,
        shared_with: userId,
        shared_by: invite.invited_by,
        permission_level: invite.permission_level || 'view',
      });

      if (!shareError) {
        await supabase
          .from('pending_invites')
          .update({
            status: 'claimed',
            accepted_at: new Date().toISOString(),
            claimed_at: new Date().toISOString(),
          })
          .eq('id', invite.id);
      }

      const inviteRole = (invite.intended_role || 'buyer') as UserRole;
      const priority = roleMap[inviteRole] ?? 0;
      if (priority > bestPriority) {
        bestPriority = priority;
        bestRole = inviteRole;
      }
    }

    if (bestRole !== 'buyer') {
      await supabase.from('profiles').update({ role: bestRole }).eq('id', userId);
    }
  } catch (err) {
    console.error('Error claiming pending invites:', err);
  }
}

async function applySessionUser(
  userId: string,
  email: string | undefined,
  setUser: (p: Profile | null) => void,
) {
  if (email) await claimPendingInvites(userId, email);
  const profile = await fetchProfile(userId);
  setUser(profile);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isSupabaseConfigured;

  const refreshProfile = useCallback(async () => {
    if (!user || isDemoMode) return;
    const p = await fetchProfile(user.id);
    if (p) setUser(p);
  }, [user, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      setUser(loadDemoUser());
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Recovery / OAuth hash tokens on first load
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        void supabase.auth.setSession({ access_token, refresh_token }).then(() => {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        });
      }
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await applySessionUser(session.user.id, session.user.email, setUser);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session.user.email) {
            await claimPendingInvites(session.user.id, session.user.email);
          }
        }
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (isDemoMode) {
        const role = email.includes('admin')
          ? ('admin' as const)
          : email.includes('buyer')
            ? ('buyer' as const)
            : ('broker' as const);
        const demoUser: Profile = {
          ...DEMO_USER,
          email,
          role,
          full_name: email.split('@')[0] || DEMO_USER.full_name,
        };
        saveDemoUser(demoUser);
        setUser(demoUser);
        return;
      }
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logAuthError('signIn', error);
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('EMAIL_NOT_CONFIRMED');
        }
        throw error;
      }
      if (data.user) {
        await applySessionUser(data.user.id, data.user.email, setUser);
        const profile = await fetchProfile(data.user.id);
        if (!profile) throw new Error('PROFILE_MISSING');
        setUser(profile);
      }
    },
    [isDemoMode],
  );

  const signUp = useCallback(
    async ({ email, password, fullName, role }: SignUpData): Promise<SignUpResult> => {
      if (isDemoMode) {
        const demoUser: Profile = {
          id: `demo-${Date.now()}`,
          email,
          full_name: fullName,
          role,
        };
        saveDemoUser(demoUser);
        setUser(demoUser);
        return { needsEmailConfirmation: false };
      }
      if (!supabase) throw new Error('Supabase not configured');

      const metadata = normalizeSignupMetadata(fullName, role);
      console.info('[Auth:signUp] metadata', metadata);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logAuthError('signUp', error);
        throw error;
      }

      console.info('[Auth:signUp] response', {
        userId: data.user?.id,
        identities: data.user?.identities?.length,
        hasSession: Boolean(data.session),
      });

      // Supabase returns empty identities when email already exists (anti-enumeration)
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('ALREADY_REGISTERED');
      }

      if (data.session && data.user) {
        await applySessionUser(data.user.id, data.user.email, setUser);
        const profile = await fetchProfile(data.user.id);
        if (profile) setUser(profile);
        return { needsEmailConfirmation: false };
      }

      if (data.user?.email) {
        await claimPendingInvites(data.user.id, data.user.email);
      }

      return { needsEmailConfirmation: true };
    },
    [isDemoMode],
  );

  const signInWithGoogle = useCallback(async () => {
    if (isDemoMode) {
      const demoUser: Profile = { ...DEMO_USER, email: 'google-demo@nexestate.co' };
      saveDemoUser(demoUser);
      setUser(demoUser);
      return;
    }
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, [isDemoMode]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (isDemoMode) return;
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    [isDemoMode],
  );

  const resendConfirmationEmail = useCallback(
    async (email: string) => {
      if (isDemoMode) return;
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    },
    [isDemoMode],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      if (isDemoMode) return;
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    [isDemoMode],
  );

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      saveDemoUser(null);
      setUser(null);
      return;
    }
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, [isDemoMode]);

  const getRedirectPath = useCallback(() => {
    if (!user) return '/login';
    return getDashboardPath(user.role);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemoMode,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      resendConfirmationEmail,
      updatePassword,
      refreshProfile,
      getRedirectPath,
    }),
    [
      user,
      loading,
      isDemoMode,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      resendConfirmationEmail,
      updatePassword,
      refreshProfile,
      getRedirectPath,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
