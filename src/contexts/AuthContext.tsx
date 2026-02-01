import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
  
  // Refs for preventing race conditions
  const isSigningIn = useRef(false);
  const currentFetchId = useRef(0); // Track which fetch is "current"
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized role fetcher with abort capability
  const fetchRoles = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    // Increment fetch ID to invalidate any previous in-flight requests
    const thisFetchId = ++currentFetchId.current;
    console.log('fetchRoles started - fetchId:', thisFetchId, 'userId:', userId, 'retry:', retryCount);
    
    // Cancel any previous fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setRolesLoading(true);
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Role fetch timeout')), 10000); // 10 second timeout
      });
      
      // Race between the actual query and timeout
      const userRoles = await Promise.race([
        getUserRoles(userId),
        timeoutPromise
      ]);
      
      // Only update state if this is still the current fetch
      if (thisFetchId === currentFetchId.current) {
        console.log('fetchRoles success - fetchId:', thisFetchId, 'roles:', userRoles);
        setRoles(userRoles);
        setRolesLoading(false);
      } else {
        console.log('fetchRoles stale - ignoring result for fetchId:', thisFetchId);
      }
    } catch (error) {
      console.error('fetchRoles error - fetchId:', thisFetchId, 'error:', error);
      
      // Only retry if this is still the current fetch
      if (thisFetchId !== currentFetchId.current) {
        console.log('fetchRoles stale on error - skipping retry for fetchId:', thisFetchId);
        return;
      }
      
      // Retry up to 2 times with increasing delay
      if (retryCount < 2) {
        const delay = (retryCount + 1) * 1500;
        console.log('fetchRoles retrying in', delay, 'ms...');
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check again after delay if we're still current
        if (thisFetchId === currentFetchId.current) {
          return fetchRoles(userId, retryCount + 1);
        }
      } else {
        console.error('fetchRoles all retries failed');
        setRoles([]);
        setRolesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('initializeAuth: Getting session...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('initializeAuth: Component unmounted, aborting');
          return;
        }
        
        console.log('initializeAuth: Session found:', !!currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchRoles(currentSession.user.id);
        }
      } catch (error) {
        console.error('initializeAuth error:', error);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        // Skip if we're in the middle of signIn (it will handle state itself)
        if (isSigningIn.current) {
          console.log('onAuthStateChange: Skipping - signIn in progress');
          return;
        }
        
        console.log('onAuthStateChange:', event, 'hasSession:', !!newSession);
        
        // Use functional updates to avoid stale closures
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Small delay to let state settle
          setTimeout(() => {
            if (mounted && !isSigningIn.current) {
              fetchRoles(newSession.user.id);
            }
          }, 100);
        } else {
          setRoles([]);
        }
        
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  const signIn = async (email: string, password: string) => {
    console.log('signIn: Starting...');
    isSigningIn.current = true;
    
    // Reset state before signing in
    setRoles([]);
    setRolesLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('signIn: Auth result - error:', !!error, 'hasUser:', !!data.user);
      
      if (!error && data.user && data.session) {
        console.log('signIn: Setting user and session...');
        setUser(data.user);
        setSession(data.session);
        
        // Fetch roles synchronously before returning
        console.log('signIn: Fetching roles...');
        await fetchRoles(data.user.id);
        console.log('signIn: Complete');
      }
      
      return { error };
    } catch (err) {
      console.error('signIn: Unexpected error:', err);
      return { error: err as Error };
    } finally {
      isSigningIn.current = false;
      setAuthLoading(false);
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
    console.log('signOut: Starting...');
    // Clear roles immediately
    setRoles([]);
    currentFetchId.current++; // Invalidate any in-flight fetches
    await supabase.auth.signOut();
    console.log('signOut: Complete');
  };

  const hasRoleCheck = useCallback((role: AppRole) => roles.includes(role), [roles]);

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
