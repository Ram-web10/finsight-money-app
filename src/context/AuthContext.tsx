import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserSettings } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userSettings: UserSettings | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateUserPassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  refreshUserSettings: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserSettings = async (userId: string) => {
    const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    if (error) { console.error('Error fetching user settings:', error); return null; }
    return data;
  };

  const refreshUserSettings = async () => {
    if (!user) return;
    const settings = await fetchUserSettings(user.id);
    setUserSettings(settings);
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          const settings = await fetchUserSettings(initialSession.user.id);
          if (!isMounted) return;
          setUserSettings(settings);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth initialization timed out, proceeding without session');
        setLoading(false);
      }
    }, 10000);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const settings = await fetchUserSettings(newSession.user.id);
        setUserSettings(settings);
      } else {
        setUserSettings(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserSettings(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    return { error };
  };

  const updateUserPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;
    const { data, error } = await supabase.from('user_settings').upsert({ user_id: user.id, ...settings, updated_at: new Date().toISOString() }).select().single();
    if (!error && data) { setUserSettings(data); }
  };

  return (
    <AuthContext.Provider value={{ user, session, userSettings, loading, signIn, signUp, signOut, resetPassword, updateUserPassword, updateUserSettings, refreshUserSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
}
