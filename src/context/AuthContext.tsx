import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '../lib/supabase';

export type SignUpResult = {
  error: Error | null;
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) {
        setSession(s);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const trimmed = displayName.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...(trimmed ? { display_name: trimmed } : {}),
          },
        },
      });

      if (error) return { error: new Error(error.message) };
      if (data.user && !data.session) {
        return { error: null, needsEmailConfirmation: true };
      }
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      updateDisplayName,
      updatePassword,
    }),
    [session, loading, signIn, signUp, signOut, updateDisplayName, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth yalnızca AuthProvider içinde kullanılabilir.');
  }
  return ctx;
}
