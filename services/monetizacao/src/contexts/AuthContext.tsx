import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type NormalizedRole = 'admin' | 'lider' | 'sdr' | 'closer';

function normalizeRole(role: AppRole): NormalizedRole {
  switch (role) {
    case 'manager': return 'lider';
    case 'user': return 'closer';
    case 'viewer': return 'closer';
    default: return role as NormalizedRole;
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: NormalizedRole | null;
  rawRole: AppRole | null;
  permissions: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLider: boolean;
  isSDR: boolean;
  isCloser: boolean;
  isAdminOrLider: boolean;
  // Legacy compat
  isManager: boolean;
  isUser: boolean;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleData) {
        setRole(roleData.role);
      }

      // Fetch module permissions
      const { data: permData } = await supabase
        .from('module_permissions')
        .select('module')
        .eq('user_id', userId);
      
      if (permData) {
        setPermissions(permData.map(p => p.module));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setPermissions([]);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setPermissions([]);
  };

  const normalizedRole = role ? normalizeRole(role) : null;

  const isAdmin = normalizedRole === 'admin';
  const isLider = normalizedRole === 'lider';
  const isSDR = normalizedRole === 'sdr';
  const isCloser = normalizedRole === 'closer';
  const isAdminOrLider = isAdmin || isLider;
  const isManager = isLider;
  const isUser = isCloser;

  const hasPermission = (module: string): boolean => {
    if (isAdmin) return true;
    if (isLider) return true;
    return permissions.includes(module);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role: normalizedRole,
        rawRole: role,
        permissions,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isLider,
        isSDR,
        isCloser,
        isAdminOrLider,
        isManager,
        isUser,
        hasPermission,
      }}
    >
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
