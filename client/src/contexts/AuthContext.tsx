import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  hasProfile: boolean;
  profileId: string | null;
  profileLoading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  setProfileDirectly: (id: string) => void;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearAscendiaLocalStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ascendia_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      // Try to find profile linked to this auth user
      // First try auth_user_id column, then fall back to user_id if column doesn't exist
      let data = null;
      let error = null;
      
      const result = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      data = result.data;
      error = result.error;
      
      // If auth_user_id column doesn't exist, try user_id column
      if (error?.code === '42703') {
        const fallbackResult = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        data = fallbackResult.data;
        error = fallbackResult.error;
        
        // If user_id also fails, just skip profile check
        if (error?.code === '42703') {
          console.log('No auth column found in user_profiles table, skipping profile check');
          setHasProfile(false);
          setProfileId(null);
          setProfileLoading(false);
          return;
        }
      }
      
      if (error && error.code !== '42703') {
        console.error('Error checking user profile:', error);
        setHasProfile(false);
        setProfileId(null);
      } else {
        setHasProfile(!!data);
        setProfileId(data?.id || null);
      }
    } catch (err) {
      console.error('Failed to check profile:', err);
      setHasProfile(false);
      setProfileId(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await checkUserProfile(user.id);
    }
  }, [user?.id, checkUserProfile]);

  // Direct setter for profile - used after onboarding when we have the profile ID from API response
  const setProfileDirectly = useCallback((id: string) => {
    setProfileId(id);
    setHasProfile(true);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase() || '';
        setIsAdmin(ADMIN_EMAILS.includes(userEmail));
        checkUserProfile(session.user.id);
      } else {
        setProfileLoading(false);
        setHasProfile(false);
        setIsAdmin(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase() || '';
        setIsAdmin(ADMIN_EMAILS.includes(userEmail));
        checkUserProfile(session.user.id);
      } else {
        setProfileLoading(false);
        setHasProfile(false);
        setProfileId(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUserProfile]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    clearAscendiaLocalStorage();
    setHasProfile(false);
    setProfileId(null);
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      hasProfile, 
      profileId,
      profileLoading, 
      isAdmin,
      refreshProfile,
      setProfileDirectly,
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
