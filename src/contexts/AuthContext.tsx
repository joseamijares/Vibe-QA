import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      // Set up refresh timer if session exists
      if (session) {
        setupRefreshTimer(session);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Clear existing timer
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      // Set up new timer if session exists
      if (session && event !== 'SIGNED_OUT') {
        setupRefreshTimer(session);
      }
    });

    // Function to set up refresh timer
    function setupRefreshTimer(session: Session) {
      // Parse the JWT to get expiration time
      const jwt = session.access_token;
      const jwtPayload = JSON.parse(atob(jwt.split('.')[1]));
      const expires = new Date(jwtPayload.exp * 1000);
      const now = new Date();
      const timeUntilExpiry = expires.getTime() - now.getTime();

      // Refresh 60 seconds before expiry
      const refreshIn = Math.max(0, timeUntilExpiry - 60000);

      refreshTimer = setTimeout(async () => {
        const {
          data: { session: newSession },
          error,
        } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Failed to refresh session:', error);
        } else if (newSession) {
          setSession(newSession);
          setupRefreshTimer(newSession);
        }
      }, refreshIn);
    }

    return () => {
      subscription.unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    // Organization creation is now handled by database trigger
    // See migration 009_user_registration_trigger.sql
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const value = useMemo(
    () => ({
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithMagicLink,
      signOut,
      resetPassword,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
