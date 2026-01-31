import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, getUserRoles } from '@/lib/supabase-helpers';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isBendahara: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  
  // Flag to prevent double handling from signIn and onAuthStateChange
  const isSigningIn = useRef(false);

  const fetchRoles = async (userId: string) => {
    console.log('fetchRoles called with userId:', userId);
    setRolesLoading(true);
    try {
      const userRoles = await getUserRoles(userId);
      console.log('fetchRoles result:', userRoles);
      setRoles(userRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session first
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchRoles(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Skip if we're in the middle of signIn (it will handle state itself)
        if (isSigningIn.current) {
          console.log('Skipping onAuthStateChange - signIn in progress');
          return;
        }
        
        console.log('onAuthStateChange:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchRoles(session.user.id);
        } else {
          setRoles([]);
        }
        
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('signIn called');
    isSigningIn.current = true;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('signIn result:', { error, hasUser: !!data.user });
      
      if (!error && data.user) {
        console.log('Setting user and fetching roles...');
        setUser(data.user);
        setSession(data.session);
        await fetchRoles(data.user.id);
        setAuthLoading(false);
        console.log('Login complete');
      }
      
      return { error };
    } finally {
      isSigningIn.current = false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const hasRoleCheck = (role: AppRole) => roles.includes(role);

  // Combined loading: auth is loading OR (user exists AND roles are still loading)
  const loading = authLoading || (!!user && rolesLoading);

  const value = {
    user,
    session,
    roles,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole: hasRoleCheck,
    isAdmin: roles.includes('admin'),
    isBendahara: roles.includes('bendahara'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
